import { useEffect, useMemo, useState } from "react";

export default function Dashboard({ patients = [], onOpenPatient }) {
  const [service, setService] = useState("Tous");
  const [status, setStatus] = useState("Tous");
  const [barrier, setBarrier] = useState("Tous");
  const [search, setSearch] = useState("");
  const [localPatients, setLocalPatients] = useState(patients);

  useEffect(() => {
    setLocalPatients(patients);
  }, [patients]);

  const services = useMemo(
    () => ["Tous", ...new Set(localPatients.map((p) => p.service))],
    [localPatients]
  );

  const barriers = useMemo(
    () => ["Tous", ...new Set(localPatients.map((p) => p.blocage))],
    [localPatients]
  );

  function toggleMedicalReady(patientId) {
    setLocalPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? { ...p, sortantMedicalement: !p.sortantMedicalement }
          : p
      )
    );
  }

  const filtered = useMemo(() => {
    return localPatients
      .filter((p) => {
        if (service !== "Tous" && p.service !== service) return false;

        if (status === "Sortant médical" && !p.sortantMedicalement) return false;
        if (status === "Bloqué" && p.score < 8) return false;
        if (status === "Risque" && (p.score < 6 || p.score >= 8)) return false;
        if (status === "Suivi" && p.score >= 6) return false;

        if (barrier !== "Tous" && p.blocage !== barrier) return false;

        const q = search.trim().toLowerCase();
        if (!q) return true;

        return (
          p.nom.toLowerCase().includes(q) ||
          p.prenom.toLowerCase().includes(q) ||
          p.ins.toLowerCase().includes(q) ||
          p.iep.toLowerCase().includes(q) ||
          p.service.toLowerCase().includes(q) ||
          p.blocage.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if ((b.sortantMedicalement ? 1 : 0) !== (a.sortantMedicalement ? 1 : 0)) {
          return (b.sortantMedicalement ? 1 : 0) - (a.sortantMedicalement ? 1 : 0);
        }
        if (b.score !== a.score) return b.score - a.score;
        return (b.joursEvitables || 0) - (a.joursEvitables || 0);
      });
  }, [localPatients, service, status, barrier, search]);

  const medicalReadyPatients = useMemo(
    () => filtered.filter((p) => p.sortantMedicalement),
    [filtered]
  );

  const stats = useMemo(() => {
    const medicalReady = medicalReadyPatients.length;
    const blocked = medicalReadyPatients.filter((p) => p.score >= 8).length;
    const risk = medicalReadyPatients.filter((p) => p.score >= 6 && p.score < 8).length;
    const avoidableDays = medicalReadyPatients.reduce(
      (sum, p) => sum + (p.joursEvitables || 0),
      0
    );
    const recoverableBeds = Math.max(0, Math.round(avoidableDays / 7));

    return {
      medicalReady,
      blocked,
      risk,
      avoidableDays,
      recoverableBeds,
      tension:
        blocked >= 2 ? "Élevée" : blocked === 1 ? "Sous tension" : "Modérée",
    };
  }, [medicalReadyPatients]);

  const blockingReasons = useMemo(() => {
    const map = {};
    medicalReadyPatients.forEach((p) => {
      if (!map[p.blocage]) {
        map[p.blocage] = { label: p.blocage, count: 0, days: 0 };
      }
      map[p.blocage].count += 1;
      map[p.blocage].days += p.joursEvitables || 0;
    });

    return Object.values(map)
      .sort((a, b) => b.days - a.days || b.count - a.count)
      .slice(0, 4);
  }, [medicalReadyPatients]);

  const servicesInTension = useMemo(() => {
    const map = {};

    medicalReadyPatients.forEach((p) => {
      if (!map[p.service]) {
        map[p.service] = {
          name: p.service,
          medicalReady: 0,
          blocked: 0,
          days: 0,
        };
      }
      map[p.service].medicalReady += 1;
      map[p.service].days += p.joursEvitables || 0;
      if (p.score >= 8) map[p.service].blocked += 1;
    });

    return Object.values(map)
      .map((s) => ({
        ...s,
        level:
          s.blocked >= 2
            ? "critical"
            : s.blocked >= 1
              ? "high"
              : s.medicalReady >= 2
                ? "medium"
                : "low",
      }))
      .sort((a, b) => {
        const rank = { critical: 4, high: 3, medium: 2, low: 1 };
        return rank[b.level] - rank[a.level] || b.days - a.days;
      })
      .slice(0, 4);
  }, [medicalReadyPatients]);

  const priorityAction = useMemo(() => {
    const topService = servicesInTension[0];
    const topBarrier = blockingReasons[0];

    if (!topService && !topBarrier) {
      return {
        title: "Surveillance courante",
        text: "Aucun blocage capacitaire majeur détecté. Maintenir l’anticipation des sorties.",
      };
    }

    if (topService && topBarrier) {
      return {
        title: `Priorité : ${topService.name}`,
        text: `Concentrer les relances sur ${topService.name} : ${topService.medicalReady} sortant(s) médical(aux), ${topService.days} jours évitables. Frein dominant : ${topBarrier.label}.`,
      };
    }

    return {
      title: "Priorité parcours",
      text: "Relancer les solutions d’aval en attente et sécuriser les sorties médicalement prêtes.",
    };
  }, [servicesInTension, blockingReasons]);

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div style={headerLeftStyle}>
          <button style={burgerButtonStyle} aria-label="Menu">
            <span style={burgerLineStyle} />
            <span style={burgerLineStyle} />
            <span style={burgerLineStyle} />
          </button>

          <div>
            <div style={appTitleStyle}>CARABBAS</div>
            <div style={appSubtitleStyle}>Sorties hospitalières complexes</div>
          </div>
        </div>

        <button style={crisisButtonStyle}>Cellule de crise</button>
      </header>

      <section style={kpiStripStyle}>
        <KpiTile label="Sortants médicaux" value={stats.medicalReady} tone="blue" />
        <KpiTile label="Bloqués" value={stats.blocked} tone="red" />
        <KpiTile label="Risque" value={stats.risk} tone="amber" />
        <KpiTile label="Jours évitables" value={stats.avoidableDays} tone="blue" />
        <KpiTile label="Lits récupérables" value={stats.recoverableBeds} tone="blue" />
      </section>

      <section style={filtersPanelStyle}>
        <div style={filtersGridStyle}>
          <FilterField label="Service">
            <select value={service} onChange={(e) => setService(e.target.value)} style={fieldInputStyle}>
              {services.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Statut">
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={fieldInputStyle}>
              <option>Tous</option>
              <option>Sortant médical</option>
              <option>Bloqué</option>
              <option>Risque</option>
              <option>Suivi</option>
            </select>
          </FilterField>

          <FilterField label="Frein">
            <select value={barrier} onChange={(e) => setBarrier(e.target.value)} style={fieldInputStyle}>
              {barriers.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Recherche">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, INS, service"
              style={fieldInputStyle}
            />
          </FilterField>
        </div>
      </section>

      <section style={desktopGridStyle}>
        <div style={mainColumnStyle}>
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div style={panelTitleStyle}>Patients prioritaires</div>
              <div style={panelSubtitleStyle}>Coordination de sortie et gestion capacitaire</div>
            </div>

            <div style={desktopTableWrapStyle}>
              <div style={tableHeaderStyle}>
                <div>Patient</div>
                <div>Service</div>
                <div>Frein</div>
                <div>Impact</div>
                <div>Sortant médical</div>
                <div>Action</div>
              </div>

              {filtered.map((p) => (
                <div key={p.id} style={tableRowStyle}>
                  <div style={patientIdentityCellStyle}>
                    <div style={patientNameStyle}>
                      {p.nom} {p.prenom}
                    </div>
                    <div style={metaLineStyle}>
                      {p.birthDate} • {p.age} ans
                    </div>
                    <div style={metaLineStyle}>
                      INS {p.ins} • IEP {p.iep}
                    </div>
                  </div>

                  <div style={tableCellStyle}>
                    {p.service} • ch {p.chambre} • lit {p.lit}
                  </div>

                  <div style={tableCellStyle}>{p.blocage}</div>

                  <div style={tableCellStyle}>
                    {p.sortantMedicalement ? `${p.joursEvitables} j` : "—"}
                  </div>

                  <div style={tableCellStyle}>
                    <label style={checkboxWrapStyle}>
                      <input
                        type="checkbox"
                        checked={p.sortantMedicalement}
                        onChange={() => toggleMedicalReady(p.id)}
                      />
                      <span>Oui</span>
                    </label>
                    <div style={{ marginTop: 6 }}>
                      <StatusBadge score={p.score} />
                    </div>
                  </div>

                  <div style={tableActionCellStyle}>
                    <button style={openButtonStyle} onClick={() => onOpenPatient(p)}>
                      Ouvrir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div style={sideColumnStyle}>
          <Panel title="Lecture opérationnelle">
            <div style={summaryBoxStyle}>
              <div style={summaryTitleStyle}>Situation actuelle</div>
              <div style={summaryTextStyle}>
                {stats.medicalReady} patient(s) médicalement sortant(s), {stats.blocked} bloqué(s),{" "}
                {stats.avoidableDays} jours évitables, soit environ {stats.recoverableBeds} lit(s) récupérable(s).
              </div>
            </div>

            <MetricGrid
              items={[
                { label: "Sortants médicaux", value: stats.medicalReady },
                { label: "Patients bloqués", value: stats.blocked },
                { label: "Patients à risque", value: stats.risk },
                { label: "Tension capacitaire", value: stats.tension },
              ]}
            />
          </Panel>

          <Panel title="Freins dominants">
            {blockingReasons.length === 0 ? (
              <div style={emptyTextStyle}>Aucun frein dominant.</div>
            ) : (
              <div style={stackStyle}>
                {blockingReasons.map((b) => (
                  <div key={b.label} style={insightCardStyle}>
                    <div style={insightTopStyle}>
                      <div style={insightTitleStyle}>{b.label}</div>
                      <div style={insightCountStyle}>{b.count}</div>
                    </div>
                    <div style={insightMetaStyle}>{b.days} jours évitables associés</div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Services en tension">
            {servicesInTension.length === 0 ? (
              <div style={emptyTextStyle}>Aucun service en tension.</div>
            ) : (
              <div style={stackStyle}>
                {servicesInTension.map((s) => (
                  <div key={s.name} style={serviceInsightStyle}>
                    <div style={insightTopStyle}>
                      <div style={serviceNameStyle}>{s.name}</div>
                      <ServiceBadge level={s.level} />
                    </div>
                    <div style={serviceMetaStyle}>
                      {s.medicalReady} sortant(s) médical(aux) • {s.days} jours évitables
                    </div>
                    <div style={serviceMetaStyle}>
                      {s.blocked} patient(s) bloqué(s)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Action prioritaire">
            <div style={actionHeaderStyle}>{priorityAction.title}</div>
            <div style={actionBoxStyle}>{priorityAction.text}</div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function KpiTile({ label, value, tone = "blue" }) {
  const tones = {
    blue: "#2563EB",
    red: "#DC2626",
    amber: "#D97706",
  };

  return (
    <div style={kpiTileStyle}>
      <div style={kpiLabelStyle}>{label}</div>
      <div style={{ ...kpiValueStyle, color: tones[tone] }}>{value}</div>
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <div style={filterFieldStyle}>
      <div style={filterLabelStyle}>{label}</div>
      {children}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={panelStyle}>
      <div style={sidePanelTitleStyle}>{title}</div>
      {children}
    </div>
  );
}

function MetricGrid({ items }) {
  return (
    <div style={metricGridStyle}>
      {items.map((item) => (
        <div key={item.label} style={metricCardStyle}>
          <div style={metricCardLabelStyle}>{item.label}</div>
          <div style={metricCardValueStyle}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ score }) {
  if (score >= 8) return <span style={badgeRedStyle}>Bloqué</span>;
  if (score >= 6) return <span style={badgeAmberStyle}>Risque</span>;
  return <span style={badgeGreenStyle}>Suivi</span>;
}

function ServiceBadge({ level }) {
  const map = {
    critical: { bg: "#FEE2E2", color: "#DC2626", label: "Critique" },
    high: { bg: "#FEF3C7", color: "#D97706", label: "Élevé" },
    medium: { bg: "#DBEAFE", color: "#2563EB", label: "Modéré" },
    low: { bg: "#D1FAE5", color: "#059669", label: "Stable" },
  };

  const tone = map[level];

  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 8px",
        borderRadius: 999,
        background: tone.bg,
        color: tone.color,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {tone.label}
    </span>
  );
}

const pageStyle = {
  maxWidth: 1280,
  margin: "0 auto",
  padding: 16,
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  background: "#1E3A8A",
  color: "#FFFFFF",
  padding: "10px 14px",
  borderRadius: 10,
  marginBottom: 12,
  flexWrap: "wrap",
};

const headerLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const burgerButtonStyle = {
  width: 30,
  height: 30,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 4,
  background: "transparent",
  border: "none",
  padding: 0,
};

const burgerLineStyle = {
  height: 2,
  background: "#FFFFFF",
  borderRadius: 999,
};

const appTitleStyle = {
  fontWeight: 800,
  fontSize: 16,
};

const appSubtitleStyle = {
  fontSize: 12,
  opacity: 0.85,
};

const crisisButtonStyle = {
  background: "#FEE2E2",
  color: "#B91C1C",
  border: "none",
  padding: "7px 12px",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 12,
};

const kpiStripStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
  gap: 10,
  marginBottom: 12,
};

const kpiTileStyle = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  padding: 10,
};

const kpiLabelStyle = {
  fontSize: 12,
  color: "#6B7280",
};

const kpiValueStyle = {
  fontSize: 22,
  fontWeight: 800,
  marginTop: 4,
};

const filtersPanelStyle = {
  marginBottom: 12,
};

const filtersGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
  gap: 8,
};

const filterFieldStyle = {
  display: "grid",
  gap: 4,
};

const filterLabelStyle = {
  fontSize: 11,
  color: "#6B7280",
  fontWeight: 700,
};

const fieldInputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  fontSize: 13,
  boxSizing: "border-box",
};

const desktopGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1.9fr) minmax(300px,0.95fr)",
  gap: 12,
  alignItems: "start",
};

const mainColumnStyle = {
  minWidth: 0,
};

const sideColumnStyle = {
  display: "grid",
  gap: 12,
};

const panelStyle = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 14,
};

const panelHeaderStyle = {
  marginBottom: 12,
};

const panelTitleStyle = {
  fontSize: 16,
  fontWeight: 800,
  color: "#111827",
};

const panelSubtitleStyle = {
  marginTop: 2,
  fontSize: 12,
  color: "#6B7280",
};

const sidePanelTitleStyle = {
  fontSize: 16,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 10,
};

const desktopTableWrapStyle = {
  display: "block",
};

const tableHeaderStyle = {
  display: "grid",
  gridTemplateColumns: "2.1fr 1.8fr 1.6fr 0.8fr 1.2fr 0.9fr",
  gap: 10,
  paddingBottom: 8,
  borderBottom: "1px solid #E5E7EB",
  fontSize: 12,
  fontWeight: 700,
  color: "#374151",
};

const tableRowStyle = {
  display: "grid",
  gridTemplateColumns: "2.1fr 1.8fr 1.6fr 0.8fr 1.2fr 0.9fr",
  gap: 10,
  alignItems: "center",
  padding: "12px 0",
  borderBottom: "1px solid #F1F5F9",
};

const patientIdentityCellStyle = {
  minWidth: 0,
};

const patientNameStyle = {
  fontSize: 15,
  fontWeight: 800,
  color: "#111827",
};

const metaLineStyle = {
  fontSize: 12,
  color: "#6B7280",
  lineHeight: 1.4,
  marginTop: 2,
};

const tableCellStyle = {
  fontSize: 13,
  color: "#111827",
  lineHeight: 1.4,
};

const tableActionCellStyle = {
  display: "flex",
  justifyContent: "flex-start",
};

const checkboxWrapStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  color: "#111827",
};

const openButtonStyle = {
  background: "#EFF6FF",
  color: "#1D4ED8",
  border: "1px solid #DBEAFE",
  padding: "7px 10px",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700,
};

const summaryBoxStyle = {
  border: "1px solid #E5E7EB",
  background: "#F8FAFC",
  borderRadius: 10,
  padding: 10,
  marginBottom: 10,
};

const summaryTitleStyle = {
  fontSize: 12,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 6,
};

const summaryTextStyle = {
  fontSize: 13,
  lineHeight: 1.5,
  color: "#111827",
};

const metricGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const metricCardStyle = {
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  padding: 10,
  background: "#FFFFFF",
};

const metricCardLabelStyle = {
  fontSize: 11,
  color: "#6B7280",
  marginBottom: 4,
};

const metricCardValueStyle = {
  fontSize: 15,
  fontWeight: 800,
  color: "#111827",
};

const stackStyle = {
  display: "grid",
  gap: 8,
};

const insightCardStyle = {
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  padding: 10,
  background: "#FFFFFF",
};

const insightTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
};

const insightTitleStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: "#111827",
};

const insightCountStyle = {
  fontSize: 16,
  fontWeight: 800,
  color: "#1D4ED8",
};

const insightMetaStyle = {
  marginTop: 4,
  fontSize: 12,
  color: "#6B7280",
};

const serviceInsightStyle = {
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  padding: 10,
  background: "#FFFFFF",
};

const serviceNameStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: "#111827",
};

const serviceMetaStyle = {
  fontSize: 12,
  color: "#6B7280",
  marginTop: 4,
};

const actionHeaderStyle = {
  fontSize: 13,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 8,
};

const actionBoxStyle = {
  fontSize: 13,
  lineHeight: 1.5,
  color: "#111827",
  background: "#F8FAFC",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  padding: 10,
};

const emptyTextStyle = {
  fontSize: 13,
  color: "#6B7280",
};

const badgeRedStyle = {
  display: "inline-block",
  background: "#FEE2E2",
  color: "#DC2626",
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
};

const badgeAmberStyle = {
  display: "inline-block",
  background: "#FEF3C7",
  color: "#D97706",
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
};

const badgeGreenStyle = {
  display: "inline-block",
  background: "#D1FAE5",
  color: "#059669",
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
};

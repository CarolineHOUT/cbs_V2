import { useMemo, useState } from "react";

export default function Dashboard({ patients, onOpenPatient }) {
  const [selectedService, setSelectedService] = useState("Tous");
  const [selectedStatus, setSelectedStatus] = useState("Tous");
  const [selectedBarrier, setSelectedBarrier] = useState("Tous");
  const [search, setSearch] = useState("");

  const services = useMemo(() => {
    return ["Tous", ...new Set(patients.map((p) => p.service))];
  }, [patients]);

  const barriers = useMemo(() => {
    return ["Tous", ...new Set(patients.map((p) => p.blocage))];
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) => {
        if (selectedService !== "Tous" && p.service !== selectedService) return false;

        if (selectedStatus !== "Tous") {
          if (selectedStatus === "Bloqué" && p.score < 8) return false;
          if (selectedStatus === "Risque" && (p.score < 6 || p.score >= 8)) return false;
          if (selectedStatus === "Suivi" && p.score >= 6) return false;
        }

        if (selectedBarrier !== "Tous" && p.blocage !== selectedBarrier) return false;

        const q = search.trim().toLowerCase();
        if (!q) return true;

        const haystack = [
          p.nom,
          p.prenom,
          p.service,
          p.chambre,
          p.lit,
          p.ins,
          p.iep,
          p.blocage,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.joursEvitables - a.joursEvitables;
      });
  }, [patients, selectedService, selectedStatus, selectedBarrier, search]);

  const medicalReady = filteredPatients.filter((p) => p.sortantMedicalement).length;
  const blocked = filteredPatients.filter((p) => p.score >= 8).length;
  const risk = filteredPatients.filter((p) => p.score >= 6 && p.score < 8).length;
  const monitored = filteredPatients.filter((p) => p.score < 6).length;
  const avoidableDays = filteredPatients.reduce((sum, p) => sum + p.joursEvitables, 0);
  const recoverableBeds = Math.max(0, Math.round(avoidableDays / 7));

  const blockingReasons = useMemo(() => {
    const counts = {};
    filteredPatients.forEach((p) => {
      counts[p.blocage] = (counts[p.blocage] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [filteredPatients]);

  const serviceStats = useMemo(() => {
    const grouped = {};

    filteredPatients.forEach((p) => {
      if (!grouped[p.service]) {
        grouped[p.service] = {
          name: p.service,
          blocked: 0,
          risk: 0,
          avoidableDays: 0,
        };
      }

      if (p.score >= 8) grouped[p.service].blocked += 1;
      else if (p.score >= 6) grouped[p.service].risk += 1;

      grouped[p.service].avoidableDays += p.joursEvitables;
    });

    return Object.values(grouped)
      .map((service) => ({
        ...service,
        level:
          service.blocked >= 2
            ? "critical"
            : service.blocked >= 1
              ? "high"
              : service.risk >= 1
                ? "medium"
                : "low",
      }))
      .sort((a, b) => {
        const rank = { critical: 4, high: 3, medium: 2, low: 1 };
        return rank[b.level] - rank[a.level];
      });
  }, [filteredPatients]);

  return (
    <div style={pageStyle}>
      <header style={topBarStyle}>
        <div style={topLeftStyle}>
          <button style={burgerStyle} aria-label="Menu">
            <span style={burgerLineStyle} />
            <span style={burgerLineStyle} />
            <span style={burgerLineStyle} />
          </button>

          <div>
            <div style={appNameStyle}>CARABBAS</div>
            <div style={appSubtitleStyle}>Sorties hospitalières complexes</div>
          </div>
        </div>

        <div style={topRightStyle}>
          <span style={headerContextStyle}>Pilotage</span>
          <button style={crisisButtonStyle}>Cellule de crise</button>
        </div>
      </header>

      <section style={kpiRowStyle}>
        <KpiTile label="Sortants médicaux" value={medicalReady} tone="blue" />
        <KpiTile label="Bloqués" value={blocked} tone="red" />
        <KpiTile label="À risque" value={risk} tone="amber" />
        <KpiTile label="Suivi" value={monitored} tone="green" />
        <KpiTile label="Jours évitables" value={avoidableDays} tone="blue" />
        <KpiTile label="Lits récupérables" value={recoverableBeds} tone="blue" />
      </section>

      <section style={filtersPanelStyle}>
        <div style={filtersGridStyle}>
          <FilterField label="Service">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              style={fieldInputStyle}
            >
              {services.map((service) => (
                <option key={service}>{service}</option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Statut">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={fieldInputStyle}
            >
              <option>Tous</option>
              <option>Bloqué</option>
              <option>Risque</option>
              <option>Suivi</option>
            </select>
          </FilterField>

          <FilterField label="Frein">
            <select
              value={selectedBarrier}
              onChange={(e) => setSelectedBarrier(e.target.value)}
              style={fieldInputStyle}
            >
              {barriers.map((barrier) => (
                <option key={barrier}>{barrier}</option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Recherche">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, INS, service..."
              style={fieldInputStyle}
            />
          </FilterField>
        </div>
      </section>

      <section style={dashboardGridStyle}>
        <div style={mainAreaStyle}>
          <SectionPanel
            title="Patients prioritaires"
            subtitle="Coordination de sortie et gestion capacitaire"
          >
            <div style={patientTableStyle}>
              {filteredPatients.length === 0 ? (
                <div style={emptyStateStyle}>Aucun patient ne correspond aux filtres.</div>
              ) : (
                filteredPatients.map((patient, index) => (
                  <div
                    key={patient.id}
                    style={{
                      ...patientRowStyle,
                      borderBottom:
                        index === filteredPatients.length - 1
                          ? "none"
                          : "1px solid #EEF2F7",
                    }}
                  >
                    <div style={patientIdentityCellStyle}>
                      <div style={patientNameStyle}>
                        {patient.nom} {patient.prenom}
                      </div>
                      <div style={patientSubMetaStyle}>
                        {patient.birthDate} • {patient.age} ans
                      </div>
                      <div style={patientSubMetaStyle}>
                        INS {patient.ins} • IEP {patient.iep}
                      </div>
                    </div>

                    <div style={patientInfoCellStyle}>
                      <div style={patientMainMetaStyle}>
                        {patient.service} • chambre {patient.chambre} • lit {patient.lit}
                      </div>
                      <div style={patientFreinStyle}>
                        <strong>Frein :</strong> {patient.blocage}
                      </div>
                      <div style={patientImpactStyle}>
                        {patient.joursEvitables} j évitables
                      </div>
                    </div>

                    <div style={patientStatusCellStyle}>
                      <div style={badgeLineStyle}>
                        <PriorityBadge score={patient.score} />
                        <ScoreBadge score={patient.score} />
                      </div>
                    </div>

                    <div style={patientActionCellStyle}>
                      <button
                        onClick={() => onOpenPatient(patient)}
                        style={openButtonStyle}
                      >
                        Ouvrir
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionPanel>
        </div>

        <div style={sideAreaStyle}>
          <SectionPanel
            title="Lecture rapide"
            subtitle="Vue direction / coordination"
          >
            <InfoLine label="Sortants médicaux présents" value={String(medicalReady)} />
            <InfoLine label="Patients bloqués" value={String(blocked)} />
            <InfoLine label="Patients à risque" value={String(risk)} />
            <InfoLine label="Patients en suivi" value={String(monitored)} />
            <InfoLine label="Jours évitables" value={String(avoidableDays)} />
            <InfoLine
              label="Tension capacitaire"
              value={blocked >= 2 ? "Élevée" : blocked >= 1 ? "Sous tension" : "Modérée"}
            />
          </SectionPanel>

          <SectionPanel
            title="Blocages principaux"
            subtitle="Freins dominants"
          >
            <div style={{ display: "grid", gap: 8 }}>
              {blockingReasons.length === 0 ? (
                <div style={smallEmptyStyle}>Aucun blocage identifié.</div>
              ) : (
                blockingReasons.map((item) => (
                  <div key={item.label} style={metricRowStyle}>
                    <span style={metricLabelStyle}>{item.label}</span>
                    <span style={metricValueStyle}>{item.count}</span>
                  </div>
                ))
              )}
            </div>
          </SectionPanel>

          <SectionPanel
            title="Services en tension"
            subtitle="Lecture capacitaire"
          >
            <div style={{ display: "grid", gap: 8 }}>
              {serviceStats.length === 0 ? (
                <div style={smallEmptyStyle}>Aucune donnée de service.</div>
              ) : (
                serviceStats.map((service) => (
                  <div key={service.name} style={serviceRowStyle}>
                    <div>
                      <div style={serviceTitleStyle}>{service.name}</div>
                      <div style={serviceSubStyle}>
                        {service.blocked} bloqué(s) • {service.risk} à risque •{" "}
                        {service.avoidableDays} j évitables
                      </div>
                    </div>
                    <ServiceBadge level={service.level} />
                  </div>
                ))
              )}
            </div>
          </SectionPanel>

          <SectionPanel
            title="Action du jour"
            subtitle="Priorité opérationnelle"
          >
            <div style={focusBoxStyle}>
              {blocked > 0
                ? "Prioriser les patients bloqués, relancer les solutions d’aval en attente et sécuriser les situations à fort impact sur les lits."
                : "Consolider les situations à risque et anticiper les sorties dès l’entrée dans le parcours."}
            </div>
          </SectionPanel>
        </div>
      </section>
    </div>
  );
}

function KpiTile({ label, value, tone }) {
  const tones = {
    blue: { bg: "#DBEAFE", color: "#1D4ED8" },
    red: { bg: "#FEE2E2", color: "#DC2626" },
    amber: { bg: "#FEF3C7", color: "#D97706" },
    green: { bg: "#D1FAE5", color: "#059669" },
  };

  return (
    <div style={kpiTileStyle}>
      <div style={kpiLabelStyle}>{label}</div>
      <div
        style={{
          ...kpiValueStyle,
          background: tones[tone].bg,
          color: tones[tone].color,
        }}
      >
        {value}
      </div>
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

function SectionPanel({ title, subtitle, children }) {
  return (
    <div style={panelStyle}>
      <div style={panelHeaderStyle}>
        <div style={panelTitleStyle}>{title}</div>
        <div style={panelSubtitleStyle}>{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div style={infoLineStyle}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value}</div>
    </div>
  );
}

function PriorityBadge({ score }) {
  let label = "Suivi";
  let bg = "#D1FAE5";
  let color = "#059669";

  if (score >= 8) {
    label = "Bloqué";
    bg = "#FEE2E2";
    color = "#DC2626";
  } else if (score >= 6) {
    label = "Risque";
    bg = "#FEF3C7";
    color = "#D97706";
  }

  return <span style={badgeStyle(bg, color)}>{label}</span>;
}

function ScoreBadge({ score }) {
  return <span style={badgeStyle("#DBEAFE", "#1D4ED8")}>Score {score}</span>;
}

function ServiceBadge({ level }) {
  const config = {
    critical: { label: "Critique", bg: "#FEE2E2", color: "#DC2626" },
    high: { label: "Élevé", bg: "#FEF3C7", color: "#D97706" },
    medium: { label: "Modéré", bg: "#DBEAFE", color: "#1D4ED8" },
    low: { label: "Stable", bg: "#D1FAE5", color: "#059669" },
  };

  const tone = config[level];

  return <span style={badgeStyle(tone.bg, tone.color)}>{tone.label}</span>;
}

function badgeStyle(bg, color) {
  return {
    display: "inline-block",
    background: bg,
    color,
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
  };
}

const pageStyle = {
  maxWidth: 1320,
  margin: "0 auto",
  padding: 12,
};

const topBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  background: "#1E40AF",
  color: "#FFFFFF",
  borderRadius: 12,
  padding: "10px 12px",
  marginBottom: 10,
};

const topLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const burgerStyle = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.08)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  gap: 4,
  padding: 0,
};

const burgerLineStyle = {
  width: 14,
  height: 2,
  background: "#FFFFFF",
  borderRadius: 999,
};

const appNameStyle = {
  fontSize: 15,
  fontWeight: 800,
  lineHeight: 1.1,
};

const appSubtitleStyle = {
  marginTop: 2,
  fontSize: 11,
  opacity: 0.9,
};

const topRightStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const headerContextStyle = {
  display: "inline-block",
  padding: "5px 8px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.14)",
  color: "#FFFFFF",
  fontSize: 11,
  fontWeight: 700,
};

const crisisButtonStyle = {
  border: "1px solid rgba(255,255,255,0.22)",
  background: "#FFF7F7",
  color: "#DC2626",
  padding: "7px 10px",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 12,
  whiteSpace: "nowrap",
};

const kpiRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
  gap: 8,
  marginBottom: 10,
};

const kpiTileStyle = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 10,
  boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
};

const kpiLabelStyle = {
  fontSize: 11,
  color: "#6B7280",
  marginBottom: 6,
};

const kpiValueStyle = {
  display: "inline-block",
  borderRadius: 10,
  padding: "6px 10px",
  fontSize: 19,
  fontWeight: 800,
  minWidth: 42,
};

const filtersPanelStyle = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 10,
  marginBottom: 10,
  boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
};

const filtersGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
  borderRadius: 10,
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  fontSize: 13,
  boxSizing: "border-box",
};

const dashboardGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.9fr) minmax(280px, 0.9fr)",
  gap: 10,
  alignItems: "start",
};

const mainAreaStyle = {
  minWidth: 0,
};

const sideAreaStyle = {
  display: "grid",
  gap: 10,
};

const panelStyle = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 14,
  padding: 12,
  boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
};

const panelHeaderStyle = {
  marginBottom: 10,
};

const panelTitleStyle = {
  fontSize: 15,
  fontWeight: 800,
  color: "#111827",
};

const panelSubtitleStyle = {
  marginTop: 2,
  fontSize: 11,
  color: "#6B7280",
};

const patientTableStyle = {
  display: "grid",
};

const patientRowStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(180px, 1.1fr) minmax(180px, 1.2fr) auto auto",
  gap: 10,
  alignItems: "center",
  padding: "10px 2px",
};

const patientIdentityCellStyle = {
  minWidth: 0,
};

const patientInfoCellStyle = {
  minWidth: 0,
};

const patientStatusCellStyle = {
  display: "flex",
  justifyContent: "flex-start",
};

const patientActionCellStyle = {
  display: "flex",
  justifyContent: "flex-end",
};

const patientHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 10,
  flexWrap: "wrap",
};

const patientNameStyle = {
  fontSize: 14,
  fontWeight: 800,
  color: "#111827",
};

const patientSubMetaStyle = {
  marginTop: 2,
  fontSize: 11,
  color: "#6B7280",
  lineHeight: 1.35,
};

const patientMainMetaStyle = {
  fontSize: 12,
  color: "#111827",
  lineHeight: 1.4,
};

const patientFreinStyle = {
  marginTop: 4,
  fontSize: 12,
  color: "#111827",
  lineHeight: 1.4,
};

const patientImpactStyle = {
  marginTop: 4,
  fontSize: 11,
  color: "#6B7280",
};

const badgeLineStyle = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const openButtonStyle = {
  border: "1px solid #DBEAFE",
  background: "#EFF6FF",
  color: "#1D4ED8",
  padding: "8px 10px",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 12,
  whiteSpace: "nowrap",
};

const infoLineStyle = {
  padding: "8px 0",
  borderBottom: "1px solid #F1F5F9",
};

const infoLabelStyle = {
  fontSize: 11,
  color: "#6B7280",
};

const infoValueStyle = {
  marginTop: 2,
  fontWeight: 700,
  color: "#111827",
  fontSize: 13,
};

const metricRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  padding: "8px 10px",
  background: "#FFFFFF",
};

const metricLabelStyle = {
  fontSize: 12,
  color: "#111827",
};

const metricValueStyle = {
  fontSize: 13,
  fontWeight: 800,
  color: "#1D4ED8",
};

const serviceRowStyle = {
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  padding: 10,
  background: "#FFFFFF",
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
};

const serviceTitleStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: "#111827",
};

const serviceSubStyle = {
  marginTop: 3,
  fontSize: 11,
  color: "#6B7280",
  lineHeight: 1.35,
};

const focusBoxStyle = {
  background: "#F8FAFC",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  padding: 10,
  color: "#111827",
  lineHeight: 1.5,
  fontSize: 12,
};

const emptyStateStyle = {
  padding: 12,
  border: "1px dashed #CBD5E1",
  borderRadius: 12,
  color: "#64748B",
  fontSize: 13,
};

const smallEmptyStyle = {
  color: "#64748B",
  fontSize: 12,
};

import { useEffect, useMemo, useState } from "react";

export default function Dashboard({ patients = [], onOpenPatient }) {
  const [service, setService] = useState("Tous");
  const [status, setStatus] = useState("Tous");
  const [barrier, setBarrier] = useState("Tous");
  const [search, setSearch] = useState("");
  const [activeBarrier, setActiveBarrier] = useState(null);
  const [localPatients, setLocalPatients] = useState(patients);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 980 : false
  );

  useEffect(() => {
    setLocalPatients(patients);
  }, [patients]);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 980);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  function parseFrenchDate(dateString) {
    if (!dateString || typeof dateString !== "string") return null;
    const [day, month, year] = dateString.split("/");
    if (!day || !month || !year) return null;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function daysSince(dateString) {
    const date = parseFrenchDate(dateString);
    if (!date) return null;

    const today = new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffMs = end - start;
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  const enrichedPatients = useMemo(() => {
    return localPatients.map((p) => ({
      ...p,
      presenceDays: daysSince(p.entryDate),
    }));
  }, [localPatients]);

  const filtered = useMemo(() => {
    return enrichedPatients
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
  }, [enrichedPatients, service, status, barrier, search]);

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
    const averagePresence =
      medicalReadyPatients.length > 0
        ? Math.round(
            medicalReadyPatients.reduce((sum, p) => sum + (p.presenceDays || 0), 0) /
              medicalReadyPatients.length
          )
        : 0;

    return {
      medicalReady,
      blocked,
      risk,
      avoidableDays,
      recoverableBeds,
      averagePresence,
      tension:
        blocked >= 2 ? "Élevée" : blocked === 1 ? "Sous tension" : "Modérée",
    };
  }, [medicalReadyPatients]);

  const dominantBarriers = useMemo(() => {
    const grouped = {};

    medicalReadyPatients.forEach((p) => {
      if (!grouped[p.blocage]) {
        grouped[p.blocage] = {
          label: p.blocage,
          count: 0,
          days: 0,
          patients: [],
        };
      }

      grouped[p.blocage].count += 1;
      grouped[p.blocage].days += p.joursEvitables || 0;
      grouped[p.blocage].patients.push(p);
    });

    return Object.values(grouped)
      .sort((a, b) => b.days - a.days || b.count - a.count)
      .slice(0, 5);
  }, [medicalReadyPatients]);

  const servicesInTension = useMemo(() => {
    const grouped = {};

    medicalReadyPatients.forEach((p) => {
      if (!grouped[p.service]) {
        grouped[p.service] = {
          name: p.service,
          medicalReady: 0,
          blocked: 0,
          days: 0,
        };
      }

      grouped[p.service].medicalReady += 1;
      grouped[p.service].days += p.joursEvitables || 0;
      if (p.score >= 8) grouped[p.service].blocked += 1;
    });

    return Object.values(grouped)
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
      .slice(0, 5);
  }, [medicalReadyPatients]);

  const selectedBarrierDetails = useMemo(() => {
    return dominantBarriers.find((b) => b.label === activeBarrier) || null;
  }, [dominantBarriers, activeBarrier]);

  useEffect(() => {
    if (!dominantBarriers.length) {
      setActiveBarrier(null);
      return;
    }
    if (!activeBarrier || !dominantBarriers.some((b) => b.label === activeBarrier)) {
      setActiveBarrier(dominantBarriers[0].label);
    }
  }, [dominantBarriers, activeBarrier]);

  const topService = servicesInTension[0] || null;
  const topBarrier = dominantBarriers[0] || null;

  const actionText = topService
    ? `Service prioritaire : ${topService.name}. ${topService.medicalReady} patient(s) médicalement sortant(s), ${topService.days} jours évitables. Frein principal : ${topBarrier ? topBarrier.label.toLowerCase() : "à préciser"}.`
    : "Aucune tension majeure détectée. Maintenir l’anticipation des sorties et sécuriser les situations à risque.";

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

      <section
        style={{
          ...desktopGridStyle,
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1.9fr) minmax(320px,0.95fr)",
        }}
      >
        <div style={mainColumnStyle}>
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div style={panelTitleStyle}>Patients prioritaires</div>
              <div style={panelSubtitleStyle}>Coordination de sortie et gestion capacitaire</div>
            </div>

            {filtered.length === 0 ? (
              <div style={emptyTextStyle}>Aucun patient ne correspond aux filtres.</div>
            ) : (
              <div style={patientListStyle}>
                {filtered.map((p) => (
                  <div key={p.id} style={patientCardStyle}>
                    <div style={patientTopRowStyle}>
                      <div>
                        <div style={patientNameStyle}>
                          {p.nom} {p.prenom}
                        </div>
                        <div style={metaLineStyle}>
                          {p.birthDate} • {p.age} ans • INS {p.ins} • IEP {p.iep}
                        </div>
                      </div>

                      <div style={patientTopActionsStyle}>
                        <StatusBadge score={p.score} />
                        <button style={openButtonStyle} onClick={() => onOpenPatient(p)}>
                          Ouvrir
                        </button>
                      </div>
                    </div>

                    <div style={patientInfoGridStyle}>
                      <div>
                        <div style={patientLabelStyle}>Service</div>
                        <div style={patientValueStyle}>
                          {p.service} • ch {p.chambre} • lit {p.lit}
                        </div>
                      </div>

                      <div>
                        <div style={patientLabelStyle}>Frein</div>
                        <div style={patientValueStyle}>{p.blocage}</div>
                      </div>

                      <div>
                        <div style={patientLabelStyle}>Admission</div>
                        <div style={patientValueStyle}>
                          {p.entryDate || "Non renseignée"}
                        </div>
                      </div>

                      <div>
                        <div style={patientLabelStyle}>Présence</div>
                        <div style={patientValueStyle}>
                          {p.presenceDays != null ? `${p.presenceDays} j` : "—"}
                        </div>
                      </div>

                      <div>
                        <div style={patientLabelStyle}>Jours évitables</div>
                        <div style={patientValueStyle}>
                          {p.sortantMedicalement ? `${p.joursEvitables} j` : "—"}
                        </div>
                      </div>

                      <div>
                        <div style={patientLabelStyle}>Sortant médical</div>
                        <label style={checkboxWrapStyle}>
                          <input
                            type="checkbox"
                            checked={p.sortantMedicalement}
                            onChange={() => toggleMedicalReady(p.id)}
                          />
                          <span>{p.sortantMedicalement ? "Oui" : "Non"}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

            <div style={operationGridStyle}>
              <OperationTile label="Sortants médicaux" value={stats.medicalReady} />
              <OperationTile label="Patients bloqués" value={stats.blocked} />
              <OperationTile label="Patients à risque" value={stats.risk} />
              <OperationTile label="Présence moyenne" value={`${stats.averagePresence} j`} />
              <OperationTile label="Tension" value={stats.tension} full />
            </div>
          </Panel>

          <Panel title="Freins dominants">
            {dominantBarriers.length === 0 ? (
              <div style={emptyTextStyle}>Aucun frein dominant.</div>
            ) : (
              <>
                <div style={barrierButtonStackStyle}>
                  {dominantBarriers.map((b) => (
                    <button
                      key={b.label}
                      onClick={() => setActiveBarrier(b.label)}
                      style={{
                        ...barrierButtonStyle,
                        ...(activeBarrier === b.label ? barrierButtonActiveStyle : {}),
                      }}
                    >
                      <div style={barrierButtonTopStyle}>
                        <span style={barrierButtonTitleStyle}>{b.label}</span>
                        <span style={barrierButtonCountStyle}>{b.count}</span>
                      </div>
                      <div style={barrierButtonMetaStyle}>{b.days} jours évitables</div>
                    </button>
                  ))}
                </div>

                {selectedBarrierDetails ? (
                  <div style={detailPanelStyle}>
                    <div style={detailPanelTitleStyle}>
                      Patients concernés : {selectedBarrierDetails.label}
                    </div>

                    <div style={detailListStyle}>
                      {selectedBarrierDetails.patients.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => onOpenPatient(p)}
                          style={detailPatientButtonStyle}
                        >
                          <div style={detailPatientNameStyle}>
                            {p.nom} {p.prenom}
                          </div>
                          <div style={detailPatientMetaStyle}>
                            {p.service} • ch {p.chambre} • lit {p.lit}
                          </div>
                          <div style={detailPatientMetaStyle}>
                            {p.sortantMedicalement ? `${p.joursEvitables} jours évitables` : "non décompté"}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
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
                      {s.medicalReady} sortant(s) médicaux • {s.days} jours évitables
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
            <div style={actionHeaderStyle}>{topService ? `Priorité : ${topService.name}` : "Surveillance"}</div>
            <div style={actionBoxStyle}>{actionText}</div>
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
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}

function OperationTile({ label, value, full = false }) {
  return (
    <div
      style={{
        ...operationTileStyle,
        gridColumn: full ? "1 / -1" : "auto",
      }}
    >
      <div style={operationTileLabelStyle}>{label}</div>
      <div style={operationTileValueStyle}>{value}</div>
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
  border: "

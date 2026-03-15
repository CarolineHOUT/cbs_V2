import { useEffect, useMemo, useState } from "react";

export default function Dashboard({ patients = [], onOpenPatient }) {
  const [service, setService] = useState("Tous");
  const [status, setStatus] = useState("Tous");
  const [barrier, setBarrier] = useState("Tous");
  const [search, setSearch] = useState("");
  const [localPatients, setLocalPatients] = useState(patients);
  const [selectedBarrier, setSelectedBarrier] = useState(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 980 : false
  );

  useEffect(() => {
    setLocalPatients(patients);
  }, [patients]);

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < 980);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function parseFrenchDate(value) {
    if (!value || typeof value !== "string") return null;
    const parts = value.split("/");
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function computeStayDays(dateString) {
    const date = parseFrenchDate(dateString);
    if (!date) return 0;
    const today = new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.max(0, Math.floor((end - start) / 86400000));
  }

  function toggleMedicalReady(patientId) {
    setLocalPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? { ...p, sortantMedicalement: !p.sortantMedicalement }
          : p
      )
    );
  }

  const enrichedPatients = useMemo(() => {
    return localPatients.map((p) => ({
      ...p,
      stayDays: computeStayDays(p.entryDate),
    }));
  }, [localPatients]);

  const services = useMemo(
    () => ["Tous", ...new Set(enrichedPatients.map((p) => p.service))],
    [enrichedPatients]
  );

  const barriers = useMemo(
    () => ["Tous", ...new Set(enrichedPatients.map((p) => p.blocage))],
    [enrichedPatients]
  );

  const filtered = useMemo(() => {
    return enrichedPatients
      .filter((p) => {
        if (service !== "Tous" && p.service !== service) return false;
        if (barrier !== "Tous" && p.blocage !== barrier) return false;

        if (status === "Sortant médical" && !p.sortantMedicalement) return false;
        if (status === "Bloqué" && p.score < 8) return false;
        if (status === "Risque" && (p.score < 6 || p.score >= 8)) return false;
        if (status === "Suivi" && p.score >= 6) return false;

        const q = search.trim().toLowerCase();
        if (!q) return true;

        return (
          p.nom.toLowerCase().includes(q) ||
          p.prenom.toLowerCase().includes(q) ||
          String(p.ins).toLowerCase().includes(q) ||
          String(p.iep).toLowerCase().includes(q) ||
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
    const totalPresence = medicalReadyPatients.reduce(
      (sum, p) => sum + (p.stayDays || 0),
      0
    );

    return {
      medicalReady,
      blocked,
      risk,
      avoidableDays,
      recoverableBeds,
      totalPresence,
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
          count: 0,
          blocked: 0,
          days: 0,
        };
      }
      grouped[p.service].count += 1;
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
              : s.count >= 2
                ? "medium"
                : "low",
      }))
      .sort((a, b) => {
        const rank = { critical: 4, high: 3, medium: 2, low: 1 };
        return rank[b.level] - rank[a.level] || b.days - a.days;
      })
      .slice(0, 5);
  }, [medicalReadyPatients]);

  useEffect(() => {
    if (!dominantBarriers.length) {
      setSelectedBarrier(null);
      return;
    }
    if (!selectedBarrier || !dominantBarriers.some((b) => b.label === selectedBarrier)) {
      setSelectedBarrier(dominantBarriers[0].label);
    }
  }, [dominantBarriers, selectedBarrier]);

  const selectedBarrierPatients = useMemo(() => {
    const found = dominantBarriers.find((b) => b.label === selectedBarrier);
    return found ? found.patients : [];
  }, [dominantBarriers, selectedBarrier]);

  const priorityService = servicesInTension[0] || null;
  const mainBarrier = dominantBarriers[0] || null;

  const actionTitle = priorityService
    ? `Priorité : ${priorityService.name}`
    : "Surveillance courante";

  const actionText = priorityService
    ? `${priorityService.count} sortant(s) médical(aux), ${priorityService.days} jours évitables. Frein principal : ${
        mainBarrier ? mainBarrier.label : "à préciser"
      }.`
    : "Aucune tension majeure détectée. Maintenir l’anticipation des sorties et la surveillance des situations fragiles.";

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.burgerButton} aria-label="Menu">
            <span style={styles.burgerLine} />
            <span style={styles.burgerLine} />
            <span style={styles.burgerLine} />
          </button>

          <div>
            <div style={styles.appTitle}>CARABBAS</div>
            <div style={styles.appSubtitle}>Sorties hospitalières complexes</div>
          </div>
        </div>

        <button style={styles.crisisButton}>Cellule de crise</button>
      </header>

      <section style={styles.kpiStrip}>
        <KpiTile label="Sortants médicaux" value={stats.medicalReady} tone="blue" />
        <KpiTile label="Bloqués" value={stats.blocked} tone="red" />
        <KpiTile label="Risque" value={stats.risk} tone="amber" />
        <KpiTile label="Jours évitables" value={stats.avoidableDays} tone="blue" />
        <KpiTile label="Lits récupérables" value={stats.recoverableBeds} tone="blue" />
      </section>

      <section style={styles.filtersPanel}>
        <div style={styles.filtersGrid}>
          <FilterField label="Service">
            <select value={service} onChange={(e) => setService(e.target.value)} style={styles.fieldInput}>
              {services.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Statut">
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={styles.fieldInput}>
              <option>Tous</option>
              <option>Sortant médical</option>
              <option>Bloqué</option>
              <option>Risque</option>
              <option>Suivi</option>
            </select>
          </FilterField>

          <FilterField label="Frein">
            <select value={barrier} onChange={(e) => setBarrier(e.target.value)} style={styles.fieldInput}>
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
              style={styles.fieldInput}
            />
          </FilterField>
        </div>
      </section>

      <section
        style={{
          ...styles.grid,
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1.9fr) minmax(320px,1fr)",
        }}
      >
        <div>
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div style={styles.panelTitle}>Patients prioritaires</div>
              <div style={styles.panelSubtitle}>Coordination de sortie et gestion capacitaire</div>
            </div>

            {filtered.length === 0 ? (
              <div style={styles.empty}>Aucun patient ne correspond aux filtres.</div>
            ) : (
              <div style={styles.patientList}>
                {filtered.map((p) => (
                  <div key={p.id} style={styles.patientCard}>
                    <div style={styles.patientTop}>
                      <div>
                        <div style={styles.patientName}>
                          {p.nom} {p.prenom}
                        </div>
                        <div style={styles.meta}>
                          {p.birthDate} • {p.age} ans • INS {p.ins} • IEP {p.iep}
                        </div>
                      </div>

                      <div style={styles.patientActions}>
                        <StatusBadge score={p.score} />
                        <button style={styles.openButton} onClick={() => onOpenPatient(p)}>
                          Ouvrir
                        </button>
                      </div>
                    </div>

                    <div style={styles.infoGrid}>
                      <InfoBlock label="Service" value={`${p.service} • ch ${p.chambre} • lit ${p.lit}`} />
                      <InfoBlock label="Frein" value={p.blocage} />
                      <InfoBlock label="Admission" value={p.entryDate || "Non renseignée"} />
                      <InfoBlock label="Présence" value={`${p.stayDays} j`} />
                      <InfoBlock
                        label="Jours évitables"
                        value={p.sortantMedicalement ? `${p.joursEvitables} j` : "—"}
                      />
                      <div>
                        <div style={styles.infoLabel}>Sortant médical</div>
                        <label style={styles.checkboxWrap}>
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

        <div style={styles.sideColumn}>
          <Panel title="Lecture opérationnelle" subtitle="Synthèse immédiate">
            <div style={styles.heroSummary}>
              <div style={styles.heroTitle}>Situation actuelle</div>
              <div style={styles.heroText}>
                {stats.medicalReady === 0
                  ? "Aucun patient médicalement sortant n’est détecté dans le périmètre affiché."
                  : `${stats.medicalReady} patient(s) médicalement sortant(s), ${stats.blocked} bloqué(s), ${stats.avoidableDays} jours évitables, soit environ ${stats.recoverableBeds} lit(s) récupérable(s).`}
              </div>
              <div style={styles.heroMeta}>
                Présence cumulée des patients médicalement sortants : {stats.totalPresence} jours
              </div>
            </div>

            <MetricGrid
              items={[
                { label: "Sortants médicaux", value: stats.medicalReady },
                { label: "Patients bloqués", value: stats.blocked },
                { label: "Patients à risque", value: stats.risk },
                { label: "Tension", value: stats.tension },
              ]}
            />
          </Panel>

          <Panel title="Freins dominants" subtitle="Cliquer pour voir les patients concernés">
            {dominantBarriers.length === 0 ? (
              <div style={styles.empty}>Aucun frein dominant.</div>
            ) : (
              <>
                <div style={styles.stack}>
                  {dominantBarriers.map((b) => (
                    <button
                      key={b.label}
                      type="button"
                      onClick={() => setSelectedBarrier((prev) => (prev === b.label ? null : b.label))}
                      style={{
                        ...styles.insightButton,
                        ...(selectedBarrier === b.label ? styles.insightButtonActive : {}),
                      }}
                    >
                      <div style={styles.insightTop}>
                        <div style={styles.insightTitle}>{b.label}</div>
                        <div style={styles.insightCount}>{b.count}</div>
                      </div>
                      <div style={styles.insightMeta}>{b.days} jours évitables associés</div>
                    </button>
                  ))}
                </div>

                {selectedBarrier && (
                  <div style={styles.detailBox}>
                    <div style={styles.detailTitle}>{selectedBarrier}</div>
                    <div style={styles.detailSubtitle}>Patients concernés</div>

                    <div style={styles.detailList}>
                      {selectedBarrierPatients.map((p) => (
                        <button
                          key={p.id}
                          style={styles.detailPatient}
                          onClick={() => onOpenPatient(p)}
                        >
                          <div style={styles.detailPatientName}>
                            {p.nom} {p.prenom}
                          </div>
                          <div style={styles.detailPatientMeta}>
                            {p.service} • ch {p.chambre} • lit {p.lit}
                          </div>
                          <div style={styles.detailPatientMeta}>
                            Entrée : {p.entryDate} • Présence : {p.stayDays} j • {p.joursEvitables} j évitables
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </Panel>

          <Panel title="Services en tension" subtitle="Lecture capacitaire par service">
            {servicesInTension.length === 0 ? (
              <div style={styles.empty}>Aucun service en tension.</div>
            ) : (
              <div style={styles.stack}>
                {servicesInTension.map((s) => (
                  <div key={s.name} style={styles.serviceCard}>
                    <div style={styles.insightTop}>
                      <div style={styles.serviceName}>{s.name}</div>
                      <ServiceBadge level={s.level} />
                    </div>
                    <div style={styles.serviceMeta}>
                      {s.count} sortant(s) médicaux • {s.days} jours évitables
                    </div>
                    <div style={styles.serviceMeta}>{s.blocked} patient(s) bloqué(s)</div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Action prioritaire" subtitle="Décision du jour">
            <div style={styles.actionTitle}>{actionTitle}</div>
            <div style={styles.actionBox}>{actionText}</div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

function KpiTile({ label, value, tone = "blue" }) {
  const colorMap = {
    blue: "#2563EB",
    red: "#DC2626",
    amber: "#D97706",
  };

  return (
    <div style={styles.kpiTile}>
      <div style={styles.kpiLabel}>{label}</div>
      <div style={{ ...styles.kpiValue, color: colorMap[tone] }}>{value}</div>
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <div style={styles.filterField}>
      <div style={styles.filterLabel}>{label}</div>
      {children}
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <div style={styles.panel}>
      <div style={styles.sideTitle}>{title}</div>
      {subtitle ? <div style={styles.sideSubtitle}>{subtitle}</div> : null}
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}

function MetricGrid({ items }) {
  return (
    <div style={styles.metricGrid}>
      {items.map((item) => (
        <div key={item.label} style={styles.metricCard}>
          <div style={styles.metricLabel}>{item.label}</div>
          <div style={styles.metricValue}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ score }) {
  if (score >= 8) return <span style={styles.badgeRed}>Bloqué</span>;
  if (score >= 6) return <span style={styles.badgeAmber}>Risque</span>;
  return <span style={styles.badgeGreen}>Suivi</span>;
}

function ServiceBadge({ level }) {
  const tones = {
    critical: { label: "Critique", bg: "#FEE2E2", color: "#DC2626" },
    high: { label: "Élevé", bg: "#FEF3C7", color: "#D97706" },
    medium: { label: "Modéré", bg: "#DBEAFE", color: "#2563EB" },
    low: { label: "Stable", bg: "#D1FAE5", color: "#059669" },
  };
  const tone = tones[level];

  return (
    <span
      style={{
        ...styles.serviceBadge,
        background: tone.bg,
        color: tone.color,
      }}
    >
      {tone.label}
    </span>
  );
}

const styles = {
  page: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: 16,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    background: "linear-gradient(90deg, #1E3A8A 0%, #2563EB 100%)",
    color: "#FFFFFF",
    padding: "12px 16px",
    borderRadius: 14,
    marginBottom: 14,
    boxShadow: "0 10px 24px rgba(37,99,235,0.16)",
    flexWrap: "wrap",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  burgerButton: {
    width: 34,
    height: 34,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 4,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 10,
    padding: "0 7px",
  },

  burgerLine: {
    height: 2,
    background: "#FFFFFF",
    borderRadius: 999,
  },

  appTitle: {
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: 0.2,
  },

  appSubtitle: {
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },

  crisisButton: {
    background: "#FFF1F2",
    color: "#B91C1C",
    border: "1px solid #FECACA",
    padding: "8px 12px",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 12,
  },

  kpiStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 12,
    marginBottom: 14,
  },

  kpiTile: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    padding: 14,
    boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
  },

  kpiLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: 700,
  },

  kpiValue: {
    fontSize: 30,
    fontWeight: 800,
    marginTop: 6,
    lineHeight: 1,
  },

  filtersPanel: {
    marginBottom: 14,
  },

  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 10,
  },

  filterField: {
    display: "grid",
    gap: 4,
  },

  filterLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: 700,
  },

  fieldInput: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #D1D5DB",
    background: "#FFFFFF",
    fontSize: 13,
    boxSizing: "border-box",
  },

  grid: {
    display: "grid",
    gap: 14,
    alignItems: "start",
  },

  sideColumn: {
    display: "grid",
    gap: 14,
  },

  panel: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },

  panelHeader: {
    marginBottom: 12,
  },

  panelTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#111827",
  },

  panelSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#6B7280",
  },

  sideTitle: {
    fontSize: 17,
    fontWeight: 800,
    color: "#111827",
  },

  sideSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
  },

  patientList: {
    display: "grid",
    gap: 12,
  },

  patientCard: {
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    padding: 16,
    background: "#FFFFFF",
    boxShadow: "0 3px 10px rgba(15,23,42,0.03)",
  },

  patientTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 14,
  },

  patientActions: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },

  patientName: {
    fontSize: 18,
    fontWeight: 800,
    color: "#111827",
  },

  meta: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 1.45,
    marginTop: 3,
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },

  infoLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: 700,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },

  infoValue: {
    fontSize: 13,
    color: "#111827",
    lineHeight: 1.45,
  },

  checkboxWrap: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "#111827",
  },

  openButton: {
    background: "#EFF6FF",
    color: "#1D4ED8",
    border: "1px solid #BFDBFE",
    padding: "8px 12px",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 700,
  },

  heroSummary: {
    border: "1px solid #DBEAFE",
    background: "linear-gradient(180deg, #F8FBFF 0%, #EFF6FF 100%)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  heroTitle: {
    fontSize: 12,
    fontWeight: 800,
    color: "#1E3A8A",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  heroText: {
    fontSize: 14,
    lineHeight: 1.55,
    color: "#111827",
    fontWeight: 600,
  },

  heroMeta: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748B",
  },

  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },

  metricCard: {
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 12,
    background: "#FFFFFF",
  },

  metricLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 5,
    fontWeight: 700,
  },

  metricValue: {
    fontSize: 18,
    fontWeight: 800,
    color: "#111827",
  },

  stack: {
    display: "grid",
    gap: 10,
  },

  insightButton: {
    width: "100%",
    textAlign: "left",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 12,
    background: "#FFFFFF",
    cursor: "pointer",
  },

  insightButtonActive: {
    borderColor: "#93C5FD",
    background: "#EFF6FF",
  },

  insightTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },

  insightTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
  },

  insightCount: {
    fontSize: 18,
    fontWeight: 800,
    color: "#1D4ED8",
  },

  insightMeta: {
    marginTop: 5,
    fontSize: 12,
    color: "#64748B",
  },

  detailBox: {
    marginTop: 10,
    border: "1px solid #DBEAFE",
    background: "#F8FBFF",
    borderRadius: 14,
    padding: 12,
  },

  detailTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#111827",
  },

  detailSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
  },

  detailList: {
    display: "grid",
    gap: 8,
    marginTop: 10,
  },

  detailPatient: {
    textAlign: "left",
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    cursor: "pointer",
  },

  detailPatientName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#111827",
  },

  detailPatientMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
    lineHeight: 1.4,
  },

  serviceCard: {
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 12,
    background: "#FFFFFF",
  },

  serviceName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
  },

  serviceMeta: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
  },

  serviceBadge: {
    display: "inline-block",
    padding: "5px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  actionTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#111827",
    marginBottom: 8,
  },

  actionBox: {
    fontSize: 13,
    lineHeight: 1.55,
    color: "#111827",
    background: "#F8FAFC",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 12,
  },

  empty: {
    fontSize: 13,
    color: "#6B7280",
  },

  badgeRed: {
    display: "inline-block",
    background: "#FEE2E2",
    color: "#DC2626",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
  },

  badgeAmber: {
    display: "inline-block",
    background: "#FEF3C7",
    color: "#D97706",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
  },

  badgeGreen: {
    display: "inline-block",
    background: "#D1FAE5",
    color: "#059669",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
  },
};

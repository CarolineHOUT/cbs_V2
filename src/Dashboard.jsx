import { useEffect, useMemo, useState } from "react";

const SERVICE_CAPACITIES = {
  Pneumologie: 24,
  Médecine: 30,
  Oncologie: 18,
  Chirurgie: 28,
  "Médecine polyvalente": 26,
  Neurologie: 20,
  Cardiologie: 22,
};


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

  const allServices = useMemo(
    () => ["Tous", ...new Set(enrichedPatients.map((p) => p.service))],
    [enrichedPatients]
  );

  const visibleServicePills = useMemo(() => allServices.slice(0, 7), [allServices]);
  const hiddenServices = useMemo(() => allServices.slice(7), [allServices]);

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

  const occupiedBeds = filtered.length;

  const capacity = useMemo(() => {
    if (service !== "Tous") {
      return SERVICE_CAPACITIES[service] || occupiedBeds;
    }

    const visibleServices = new Set(filtered.map((p) => p.service));
    let total = 0;
    visibleServices.forEach((svc) => {
      total += SERVICE_CAPACITIES[svc] || 0;
    });
    return total || occupiedBeds;
  }, [service, filtered, occupiedBeds]);

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
      occupancyLabel: `${occupiedBeds} / ${capacity}`,
      occupancyRate: capacity > 0 ? Math.round((occupiedBeds / capacity) * 100) : 0,
      tension:
        blocked >= 3 ? "Critique" : blocked >= 2 ? "Élevée" : blocked === 1 ? "Sous tension" : "Modérée",
    };
  }, [medicalReadyPatients, occupiedBeds, capacity]);

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
      .slice(0, 6);
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
  }, [selectedBarrier, dominantBarriers]);

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
            <div style={styles.appSubtitle}>Pilotage des sorties hospitalières complexes</div>
          </div>
        </div>

        <button style={styles.crisisButton}>Cellule de crise</button>
      </header>

      <section style={styles.heroRow}>
        <div style={styles.mainHeroKpi}>
          <div style={styles.heroKpiLabel}>Lits occupés / capacitaire</div>
          <div style={styles.heroKpiValue}>{stats.occupancyLabel}</div>
          <div style={styles.heroKpiSub}>{stats.occupancyRate}% d’occupation sur le périmètre affiché</div>
        </div>

        <div style={styles.secondaryKpis}>
          <KpiTile label="Sortants médicaux" value={stats.medicalReady} tone="blue" />
          <KpiTile label="Bloqués" value={stats.blocked} tone="red" />
          <KpiTile label="Jours évitables" value={stats.avoidableDays} tone="amber" />
          <KpiTile label="Lits récupérables" value={stats.recoverableBeds} tone="blue" />
        </div>
      </section>

      <section style={styles.filtersPanel}>
        <div style={styles.filterCard}>
          <div style={styles.quickServiceLabel}>Services</div>

          <div style={styles.servicePillsWrap}>
            {visibleServicePills.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setService(s)}
                style={{
                  ...styles.servicePill,
                  ...(service === s ? styles.servicePillActive : {}),
                }}
              >
                {s}
              </button>
            ))}

            {hiddenServices.length > 0 && (
              <select
                value={hiddenServices.includes(service) ? service : ""}
                onChange={(e) => setService(e.target.value || "Tous")}
                style={styles.otherServiceSelect}
              >
                <option value="">Autres services</option>
                {hiddenServices.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            )}
          </div>

          <div style={styles.filtersGrid}>
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
        </div>
      </section>

      <section
        style={{
          ...styles.grid,
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1.95fr) minmax(370px,1fr)",
        }}
      >
        <div>
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <div style={styles.panelTitle}>Patients prioritaires</div>
                <div style={styles.panelSubtitle}>Coordination de sortie et gestion capacitaire</div>
              </div>

              <div style={styles.listCount}>{filtered.length} patient(s)</div>
            </div>

            {filtered.length === 0 ? (
              <div style={styles.empty}>Aucun patient ne correspond aux filtres.</div>
            ) : (
              <div style={styles.patientList}>
                {filtered.map((p) => (
                  <div key={p.id} style={styles.patientCard}>
                    <div style={styles.patientTop}>
                      <div style={styles.patientIdentity}>
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

                    <div style={styles.patientCoreRow}>
                      <div style={styles.focusBlock}>
                        <div style={styles.focusLabel}>Service</div>
                        <div style={styles.focusValue}>{p.service}</div>
                        <div style={styles.focusSub}>ch {p.chambre} • lit {p.lit}</div>
                      </div>

                      <div style={styles.focusBlock}>
                        <div style={styles.focusLabel}>Frein principal</div>
                        <div style={styles.focusValue}>{p.blocage}</div>
                      </div>

                      <div style={styles.timelineBlock}>
                        <MiniStat label="Admission" value={p.entryDate || "—"} />
                        <MiniStat label="Présence" value={`${p.stayDays} j`} />
                        <MiniStat
                          label="Jours évitables"
                          value={p.sortantMedicalement ? `${p.joursEvitables} j` : "—"}
                        />
                        <div style={styles.sortantBox}>
                          <div style={styles.miniLabel}>Sortant médical</div>
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
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div style={styles.sideColumn}>
          <Panel title="Services en tension" subtitle="Lecture capacitaire par service">
            {servicesInTension.length === 0 ? (
              <div style={styles.empty}>Aucun service en tension.</div>
            ) : (
              <div style={styles.stack}>
                {servicesInTension.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => setService(s.name)}
                    style={{
                      ...styles.serviceCardButton,
                      ...(s.level === "critical"
                        ? styles.serviceCardCritical
                        : s.level === "high"
                          ? styles.serviceCardHigh
                          : {}),
                    }}
                  >
                    <div style={styles.insightTop}>
                      <div style={styles.serviceName}>{s.name}</div>
                      <ServiceBadge level={s.level} />
                    </div>
                    <div style={styles.serviceMetaStrong}>
                      {s.count} sortant(s) médicaux • {s.days} jours évitables
                    </div>
                    <div style={styles.serviceMeta}>{s.blocked} patient(s) bloqué(s)</div>
                  </button>
                ))}
              </div>
            )}
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

          <Panel title="Action prioritaire" subtitle="Décision du jour">
            <div style={styles.actionTitle}>{actionTitle}</div>
            <div style={styles.actionBox}>{actionText}</div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function KpiTile({ label, value, tone = "blue" }) {
  const colorMap = {
    blue: "#2563EB",
    red: "#DC2626",
    amber: "#D97706",
  };

  const tintMap = {
    blue: "#EFF6FF",
    red: "#FEF2F2",
    amber: "#FFFBEB",
  };

  return (
    <div style={{ ...styles.kpiTile, background: tintMap[tone] }}>
      <div style={{ ...styles.kpiValueHero, color: colorMap[tone] }}>{value}</div>
      <div style={styles.kpiLabelHero}>{label}</div>
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

function MiniStat({ label, value }) {
  return (
    <div style={styles.miniStat}>
      <div style={styles.miniLabel}>{label}</div>
      <div style={styles.miniValue}>{value}</div>
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
    <span style={{ ...styles.serviceBadge, background: tone.bg, color: tone.color }}>
      {tone.label}
    </span>
  );
}

const styles = {
  page: {
    maxWidth: 1360,
    margin: "0 auto",
    padding: 18,
    background: "#F8FAFC",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    background: "linear-gradient(90deg, #1E3A8A 0%, #2563EB 100%)",
    color: "#FFFFFF",
    padding: "14px 18px",
    borderRadius: 18,
    marginBottom: 18,
    boxShadow: "0 18px 40px rgba(37,99,235,0.18)",
    flexWrap: "wrap",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  burgerButton: {
    width: 38,
    height: 38,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 4,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 12,
    padding: "0 8px",
  },

  burgerLine: {
    height: 2,
    background: "#FFFFFF",
    borderRadius: 999,
  },

  appTitle: {
    fontWeight: 800,
    fontSize: 22,
    letterSpacing: 0.2,
  },

  appSubtitle: {
    fontSize: 12,
    opacity: 0.92,
    marginTop: 3,
  },

  crisisButton: {
    background: "#FFF1F2",
    color: "#B91C1C",
    border: "1px solid #FECACA",
    padding: "9px 14px",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 12,
    boxShadow: "0 8px 18px rgba(185,28,28,0.10)",
  },

  heroRow: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 1.15fr) minmax(0, 2fr)",
    gap: 14,
    marginBottom: 16,
  },

  mainHeroKpi: {
    background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)",
    color: "#FFFFFF",
    borderRadius: 22,
    padding: 22,
    minHeight: 162,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "0 20px 44px rgba(37,99,235,0.22)",
  },

  heroKpiLabel: {
    fontSize: 13,
    fontWeight: 700,
    opacity: 0.92,
  },

  heroKpiValue: {
    fontSize: 58,
    fontWeight: 900,
    lineHeight: 1,
  },

  heroKpiSub: {
    fontSize: 12,
    opacity: 0.88,
  },

  secondaryKpis: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
  },

  kpiTile: {
    border: "1px solid #E5E7EB",
    borderRadius: 18,
    padding: 18,
    minHeight: 162,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
  },

  kpiValueHero: {
    fontSize: 42,
    fontWeight: 900,
    lineHeight: 1,
  },

  kpiLabelHero: {
    fontSize: 13,
    fontWeight: 700,
    color: "#475569",
  },

  filtersPanel: {
    marginBottom: 16,
  },

  filterCard: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },

  quickServiceLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 8,
  },

  servicePillsWrap: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 12,
  },

  servicePill: {
    padding: "9px 12px",
    borderRadius: 999,
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    color: "#334155",
    fontSize: 12,
    fontWeight: 700,
  },

  servicePillActive: {
    background: "#EFF6FF",
    borderColor: "#93C5FD",
    color: "#1D4ED8",
    boxShadow: "0 8px 18px rgba(37,99,235,0.10)",
  },

  otherServiceSelect: {
    padding: "9px 12px",
    borderRadius: 999,
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    fontSize: 12,
    color: "#334155",
  },

  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
  },

  filterField: {
    display: "grid",
    gap: 5,
  },

  filterLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: 700,
  },

  fieldInput: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #D1D5DB",
    background: "#FFFFFF",
    fontSize: 13,
    boxSizing: "border-box",
  },

  grid: {
    display: "grid",
    gap: 16,
    alignItems: "start",
  },

  sideColumn: {
    display: "grid",
    gap: 16,
  },

  panel: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },

  panelHeader: {
    marginBottom: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },

  panelTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#0F172A",
  },

  panelSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748B",
  },

  sideTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#0F172A",
    marginBottom: 2,
  },

  sideSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },

  listCount: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    fontSize: 12,
    fontWeight: 700,
    color: "#334155",
  },

  patientList: {
    display: "grid",
    gap: 12,
  },

  patientCard: {
    border: "1px solid #E5E7EB",
    borderRadius: 18,
    padding: 16,
    background: "linear-gradient(180deg, #FFFFFF 0%, #FCFDFF 100%)",
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  },

  patientTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },

  patientIdentity: {
    minWidth: 0,
  },

  patientActions: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },

  patientName: {
    fontSize: 22,
    fontWeight: 800,
    color: "#0F172A",
  },

  meta: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 1.5,
    marginTop: 5,
  },

  patientCoreRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1.1fr 1.35fr",
    gap: 12,
    paddingTop: 12,
    borderTop: "1px solid #EDF2F7",
    alignItems: "start",
  },

  focusBlock: {
    minWidth: 0,
  },

  focusLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.25,
    marginBottom: 4,
  },

  focusValue: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: 800,
    lineHeight: 1.35,
  },

  focusSub: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },

  timelineBlock: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
  },

  miniStat: {
    minWidth: 0,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#F8FAFC",
    border: "1px solid #E5E7EB",
  },

  miniLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: 700,
    marginBottom: 4,
  },

  miniValue: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0F172A",
    lineHeight: 1.2,
  },

  sortantBox: {
    minWidth: 0,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#F8FAFC",
    border: "1px solid #E5E7EB",
  },

  checkboxWrap: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "#0F172A",
  },

  openButton: {
    background: "#EFF6FF",
    color: "#1D4ED8",
    border: "1px solid #BFDBFE",
    padding: "8px 13px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 700,
    boxShadow: "0 8px 16px rgba(37,99,235,0.08)",
  },

  stack: {
    display: "grid",
    gap: 10,
  },

  serviceCardButton: {
    textAlign: "left",
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    padding: 14,
    background: "#FFFFFF",
    cursor: "pointer",
  },

  serviceCardCritical: {
    background: "linear-gradient(180deg, #FFF7F7 0%, #FFFFFF 100%)",
    borderColor: "#FECACA",
    boxShadow: "0 10px 20px rgba(220,38,38,0.08)",
  },

  serviceCardHigh: {
    background: "linear-gradient(180deg, #FFFDF5 0%, #FFFFFF 100%)",
    borderColor: "#FDE68A",
  },

  serviceName: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0F172A",
  },

  serviceMetaStrong: {
    fontSize: 13,
    color: "#0F172A",
    marginTop: 6,
    fontWeight: 700,
  },

  serviceMeta: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },

  serviceBadge: {
    display: "inline-block",
    padding: "5px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  insightButton: {
    width: "100%",
    textAlign: "left",
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    padding: 12,
    background: "#FFFFFF",
    cursor: "pointer",
  },

  insightButtonActive: {
    borderColor: "#93C5FD",
    background: "#EFF6FF",
    boxShadow: "0 10px 18px rgba(37,99,235,0.08)",
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
    color: "#0F172A",
  },

  insightCount: {
    fontSize: 20,
    fontWeight: 900,
    color: "#1D4ED8",
  },

  insightMeta: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748B",
  },

  detailBox: {
    marginTop: 10,
    border: "1px solid #DBEAFE",
    background: "#F8FBFF",
    borderRadius: 16,
    padding: 12,
  },

  detailTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#0F172A",
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
    borderRadius: 14,
    padding: 10,
    cursor: "pointer",
  },

  detailPatientName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0F172A",
  },

  detailPatientMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
    lineHeight: 1.4,
  },

  actionTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#0F172A",
    marginBottom: 8,
  },

  actionBox: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "#0F172A",
    background: "#F8FAFC",
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    padding: 12,
  },

  empty: {
    fontSize: 13,
    color: "#64748B",
  },

  badgeRed: {
    display: "inline-block",
    background: "#FEE2E2",
    color: "#DC2626",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
  },

  badgeAmber: {
    display: "inline-block",
    background: "#FEF3C7",
    color: "#D97706",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
  },

  badgeGreen: {
    display: "inline-block",
    background: "#D1FAE5",
    color: "#059669",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
  },
};

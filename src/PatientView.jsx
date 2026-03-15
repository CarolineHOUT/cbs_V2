import { useMemo } from "react";

export default function PatientView({ patient, onBack }) {
  const status = useMemo(() => {
    if (!patient) return { label: "", tone: "neutral" };
    if (patient.score >= 8) return { label: "Bloqué", tone: "red" };
    if (patient.score >= 6) return { label: "Risque", tone: "amber" };
    return { label: "Suivi", tone: "green" };
  }, [patient]);

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

  if (!patient) return null;

  const stayDays = computeStayDays(patient.entryDate);

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button onClick={onBack} style={styles.backButton}>
          ← Retour au cockpit
        </button>

        <div style={styles.topBarTitle}>Fiche patient</div>
      </div>

      <section style={styles.identityHero}>
        <div style={styles.identityLeft}>
          <div style={styles.patientName}>
            {patient.nom} {patient.prenom}
          </div>

          <div style={styles.identityMeta}>
            {patient.birthDate} • {patient.age} ans
          </div>

          <div style={styles.identityMeta}>
            INS {patient.ins} • IEP {patient.iep}
          </div>

          <div style={styles.identityMeta}>
            {patient.service} • chambre {patient.chambre} • lit {patient.lit}
          </div>
        </div>

        <div style={styles.identityRight}>
          <StatusBadge label={status.label} tone={status.tone} />
        </div>
      </section>

      <section style={styles.mainGrid}>
        <div style={styles.leftColumn}>
          <Panel title="Pilotage sortie" subtitle="Lecture clinique et capacitaire">
            <div style={styles.kpiGrid}>
              <MiniKpi label="Admission" value={patient.entryDate || "—"} />
              <MiniKpi label="Présence" value={`${stayDays} j`} />
              <MiniKpi
                label="Sortant médical"
                value={patient.sortantMedicalement ? "Oui" : "Non"}
                tone={patient.sortantMedicalement ? "blue" : "neutral"}
              />
              <MiniKpi
                label="Jours évitables"
                value={patient.sortantMedicalement ? `${patient.joursEvitables} j` : "—"}
                tone="amber"
              />
            </div>

            <div style={styles.focusCard}>
              <div style={styles.focusLabel}>Frein principal</div>
              <div style={styles.focusValue}>{patient.blocage}</div>
            </div>

            <div style={styles.kpiGrid}>
              <MiniKpi label="Score" value={patient.score} tone="blue" />
              <MiniKpi label="Niveau" value={status.label} tone={status.tone} />
              <MiniKpi label="Service" value={patient.service} />
              <MiniKpi label="Lit" value={`${patient.chambre} / ${patient.lit}`} />
            </div>
          </Panel>

          <Panel title="Parcours et aval" subtitle="Organisation de la sortie">
            <InfoGrid
              items={[
                ["Destination prévue", patient.destinationPrevue || "Non renseignée"],
                ["Besoin d’aval", patient.besoinAval || "Non renseigné"],
                ["Transport", patient.transport || "Non renseigné"],
                ["Documents de sortie", patient.documentsSortie || "Non renseignés"],
              ]}
            />
          </Panel>

          <Panel title="Entourage et protection" subtitle="Sécurisation administrative et familiale">
            <InfoGrid
              items={[
                ["Personne de confiance", patient.personneConfiance || "Non renseignée"],
                ["Personne à prévenir", patient.personneAPrevenir || "Non renseignée"],
                ["Tutelle / curatelle", patient.protectionJuridique || "Non renseignée"],
              ]}
            />
          </Panel>
        </div>

        <div style={styles.rightColumn}>
          <Panel title="Coordination" subtitle="Acteurs et prochaines actions">
            <InfoGrid
              items={[
                ["Référent médical", patient.referentMedical || "Non renseigné"],
                ["Cadre", patient.cadre || "Non renseigné"],
                ["Assistante sociale", patient.assistanteSociale || "Non renseignée"],
                ["Prochaine action", patient.nextStep || "Non renseignée"],
              ]}
            />
          </Panel>

          <Panel title="Actions rapides" subtitle="Coordination immédiate">
            <div style={styles.actionsGrid}>
              <button style={styles.actionButton}>
                Contacter assistante sociale
              </button>

              <button style={styles.actionButton}>
                Programmer sortie
              </button>

              <button style={styles.actionButton}>
                Ajouter note
              </button>

              <button style={styles.actionButton}>
                Réunion coordination
              </button>
            </div>
          </Panel>

          <Panel title="Historique opérationnel" subtitle="Traçabilité des actions">
            <div style={styles.timeline}>
              {(patient.notes || []).map((note, index) => (
                <div key={index} style={styles.timelineItem}>
                  <div style={styles.timelineDot} />
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineDate}>15/03 • 10:45</div>
                    <div style={styles.timelineText}>{note}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <section style={styles.panel}>
      <div style={styles.panelTitle}>{title}</div>
      {subtitle ? <div style={styles.panelSubtitle}>{subtitle}</div> : null}
      <div style={{ marginTop: 14 }}>{children}</div>
    </section>
  );
}

function MiniKpi({ label, value, tone = "neutral" }) {
  const toneStyles = {
    neutral: { bg: "#FFFFFF", color: "#0F172A", border: "#E5E7EB" },
    blue: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
    amber: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
    red: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
    green: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  };

  const t = toneStyles[tone] || toneStyles.neutral;

  return (
    <div style={{ ...styles.miniKpi, background: t.bg, borderColor: t.border }}>
      <div style={styles.miniKpiLabel}>{label}</div>
      <div style={{ ...styles.miniKpiValue, color: t.color }}>{value}</div>
    </div>
  );
}

function InfoGrid({ items }) {
  return (
    <div style={styles.infoGrid}>
      {items.map(([label, value]) => (
        <div key={label} style={styles.infoCard}>
          <div style={styles.infoLabel}>{label}</div>
          <div style={styles.infoValue}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ label, tone = "neutral" }) {
  const tones = {
    neutral: { bg: "#E2E8F0", color: "#334155" },
    red: { bg: "#FEE2E2", color: "#DC2626" },
    amber: { bg: "#FEF3C7", color: "#D97706" },
    green: { bg: "#D1FAE5", color: "#059669" },
  };

  const t = tones[tone] || tones.neutral;

  return (
    <span style={{ ...styles.badge, background: t.bg, color: t.color }}>
      {label}
    </span>
  );
}

const styles = {
  page: {
    maxWidth: 1360,
    margin: "0 auto",
    padding: 18,
    background: "#F8FAFC",
    minHeight: "100vh",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    flexWrap: "wrap",
  },

  backButton: {
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 700,
    color: "#334155",
  },

  topBarTitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: 700,
  },

  identityHero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    background: "linear-gradient(90deg, #1E3A8A 0%, #2563EB 100%)",
    color: "#FFFFFF",
    borderRadius: 22,
    padding: 22,
    boxShadow: "0 20px 44px rgba(37,99,235,0.18)",
    marginBottom: 18,
    flexWrap: "wrap",
  },

  identityLeft: {
    minWidth: 0,
  },

  patientName: {
    fontSize: 34,
    fontWeight: 900,
    lineHeight: 1.05,
  },

  identityMeta: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.95,
    lineHeight: 1.5,
  },

  identityRight: {
    display: "flex",
    alignItems: "flex-start",
  },

  badge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1.8fr) minmax(320px,1fr)",
    gap: 16,
    alignItems: "start",
  },

  leftColumn: {
    display: "grid",
    gap: 16,
  },

  rightColumn: {
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

  panelTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#0F172A",
  },

  panelSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748B",
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
  },

  miniKpi: {
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    padding: 14,
  },

  miniKpiLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.25,
    marginBottom: 6,
  },

  miniKpiValue: {
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1.1,
  },

  focusCard: {
    marginTop: 12,
    marginBottom: 12,
    border: "1px solid #DBEAFE",
    background: "linear-gradient(180deg, #F8FBFF 0%, #EEF5FF 100%)",
    borderRadius: 18,
    padding: 16,
  },

  focusLabel: {
    fontSize: 11,
    color: "#1E40AF",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.25,
    marginBottom: 6,
  },

  focusValue: {
    fontSize: 22,
    fontWeight: 800,
    color: "#0F172A",
    lineHeight: 1.25,
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },

  infoCard: {
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    padding: 14,
    background: "#FFFFFF",
  },

  infoLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.2,
    color: "#64748B",
    fontWeight: 800,
    marginBottom: 6,
  },

  infoValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: 600,
    lineHeight: 1.45,
  },

  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },

  actionButton: {
    padding: 12,
    borderRadius: 12,
    border: "1px solid #CBD5E1",
    background: "#EFF6FF",
    color: "#1D4ED8",
    fontWeight: 700,
    cursor: "pointer",
  },

  timeline: {
    display: "grid",
    gap: 12,
  },

  timelineItem: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },

  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "#2563EB",
    marginTop: 6,
    flexShrink: 0,
  },

  timelineContent: {
    flex: 1,
  },

  timelineDate: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: 700,
  },

  timelineText: {
    fontSize: 14,
    color: "#0F172A",
    lineHeight: 1.45,
    marginTop: 2,
  },
};

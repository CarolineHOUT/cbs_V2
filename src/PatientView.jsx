import { useMemo, useState } from "react";

export default function PatientView({ patient, onBack }) {
  const [editablePatient, setEditablePatient] = useState({
    ...patient,
    notes: patient.notes || [],
  });
  const [newNote, setNewNote] = useState("");

  const status = useMemo(() => {
    if (editablePatient.score >= 8) return { label: "Bloqué", tone: "red" };
    if (editablePatient.score >= 6) return { label: "Risque", tone: "amber" };
    return { label: "Suivi", tone: "green" };
  }, [editablePatient]);

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

  function updateField(field, value) {
    setEditablePatient((prev) => ({ ...prev, [field]: value }));
  }

  function addNote() {
    const value = newNote.trim();
    if (!value) return;

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");

    const stampedNote = `${dd}/${mm} • ${hh}:${mi} — ${value}`;

    setEditablePatient((prev) => ({
      ...prev,
      notes: [stampedNote, ...(prev.notes || [])],
    }));
    setNewNote("");
  }

  function quickAction(text) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");

    const stampedNote = `${dd}/${mm} • ${hh}:${mi} — ${text}`;

    setEditablePatient((prev) => ({
      ...prev,
      notes: [stampedNote, ...(prev.notes || [])],
    }));
  }

  const stayDays = computeStayDays(editablePatient.entryDate);

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
            {editablePatient.nom} {editablePatient.prenom}
          </div>

          <div style={styles.identityMeta}>
            {editablePatient.birthDate} • {editablePatient.age} ans
          </div>

          <div style={styles.identityMeta}>
            INS {editablePatient.ins} • IEP {editablePatient.iep}
          </div>

          <div style={styles.identityMeta}>
            {editablePatient.service} • chambre {editablePatient.chambre} • lit {editablePatient.lit}
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
              <MiniKpi label="Admission" value={editablePatient.entryDate || "—"} />
              <MiniKpi label="Présence" value={`${stayDays} j`} />
              <MiniKpi
                label="Sortant médical"
                value={editablePatient.sortantMedicalement ? "Oui" : "Non"}
                tone={editablePatient.sortantMedicalement ? "blue" : "neutral"}
              />
              <MiniKpi
                label="Jours évitables"
                value={editablePatient.sortantMedicalement ? `${editablePatient.joursEvitables} j` : "—"}
                tone="amber"
              />
            </div>

            <div style={styles.formGrid}>
              <EditableField
                label="Frein principal"
                value={editablePatient.blocage || ""}
                onChange={(value) => updateField("blocage", value)}
              />
              <EditableField
                label="Destination prévue"
                value={editablePatient.destinationPrevue || ""}
                onChange={(value) => updateField("destinationPrevue", value)}
              />
              <EditableField
                label="Transport"
                value={editablePatient.transport || ""}
                onChange={(value) => updateField("transport", value)}
              />
              <EditableField
                label="Documents sortie"
                value={editablePatient.documentsSortie || ""}
                onChange={(value) => updateField("documentsSortie", value)}
              />
            </div>

            <div style={styles.toggleRow}>
              <div style={styles.toggleCard}>
                <div style={styles.fieldLabel}>Sortant médical</div>
                <label style={styles.checkboxWrap}>
                  <input
                    type="checkbox"
                    checked={editablePatient.sortantMedicalement}
                    onChange={(e) => updateField("sortantMedicalement", e.target.checked)}
                  />
                  <span>{editablePatient.sortantMedicalement ? "Oui" : "Non"}</span>
                </label>
              </div>

              <div style={styles.toggleCard}>
                <div style={styles.fieldLabel}>Prochaine action</div>
                <div style={styles.fieldValue}>{editablePatient.nextStep || "Non renseignée"}</div>
              </div>
            </div>
          </Panel>

          <Panel title="Parcours et aval" subtitle="Organisation de la sortie">
            <InfoGrid
              items={[
                ["Besoin d’aval", editablePatient.besoinAval || "Non renseigné"],
                ["Référent médical", editablePatient.referentMedical || "Non renseigné"],
                ["Cadre", editablePatient.cadre || "Non renseigné"],
                ["Assistante sociale", editablePatient.assistanteSociale || "Non renseignée"],
              ]}
            />
          </Panel>

          <Panel title="Entourage et protection" subtitle="Sécurisation administrative et familiale">
            <div style={styles.formGrid}>
              <EditableField
                label="Personne de confiance"
                value={editablePatient.personneConfiance || ""}
                onChange={(value) => updateField("personneConfiance", value)}
              />
              <EditableField
                label="Personne à prévenir"
                value={editablePatient.personneAPrevenir || ""}
                onChange={(value) => updateField("personneAPrevenir", value)}
              />
              <EditableField
                label="Tutelle / curatelle"
                value={editablePatient.protectionJuridique || ""}
                onChange={(value) => updateField("protectionJuridique", value)}
              />
            </div>
          </Panel>
        </div>

        <div style={styles.rightColumn}>
          <Panel title="Actions rapides" subtitle="Coordination immédiate">
            <div style={styles.actionsGrid}>
              <button
                style={styles.actionButton}
                onClick={() => quickAction("Assistante sociale contactée")}
              >
                Contacter assistante sociale
              </button>

              <button
                style={styles.actionButton}
                onClick={() => quickAction("Sortie à programmer")}
              >
                Programmer sortie
              </button>

              <button
                style={styles.actionButton}
                onClick={() => quickAction("Réunion de coordination demandée")}
              >
                Réunion coordination
              </button>

              <button
                style={styles.actionButton}
                onClick={() => quickAction("Famille relancée")}
              >
                Relancer famille
              </button>
            </div>
          </Panel>

          <Panel title="Ajouter une note" subtitle="Traçabilité opérationnelle">
            <div style={styles.noteComposer}>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Saisir une note opérationnelle..."
                style={styles.textarea}
              />
              <button style={styles.primaryButton} onClick={addNote}>
                Ajouter la note
              </button>
            </div>
          </Panel>

          <Panel title="Historique opérationnel" subtitle="Chronologie des actions">
            <div style={styles.timeline}>
              {(editablePatient.notes || []).map((note, index) => (
                <div key={index} style={styles.timelineItem}>
                  <div style={styles.timelineDot} />
                  <div style={styles.timelineContent}>
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

function EditableField({ label, value, onChange }) {
  return (
    <div style={styles.editableCard}>
      <div style={styles.fieldLabel}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
      />
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

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginTop: 12,
  },

  editableCard: {
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    padding: 14,
    background: "#FFFFFF",
  },

  fieldLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.2,
    color: "#64748B",
    fontWeight: 800,
    marginBottom: 6,
  },

  fieldValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: 600,
    lineHeight: 1.45,
  },

  input: {
    width: "100%",
    border: "1px solid #CBD5E1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    boxSizing: "border-box",
  },

  toggleRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginTop: 12,
  },

  toggleCard: {
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    padding: 14,
    background: "#FFFFFF",
  },

  checkboxWrap: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "#0F172A",
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

  noteComposer: {
    display: "grid",
    gap: 10,
  },

  textarea: {
    minHeight: 110,
    resize: "vertical",
    border: "1px solid #CBD5E1",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: "inherit",
    boxSizing: "border-box",
  },

  primaryButton: {
    border: "1px solid #2563EB",
    background: "#2563EB",
    color: "#FFFFFF",
    borderRadius: 12,
    padding: "10px 14px",
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

  timelineText: {
    fontSize: 14,
    color: "#0F172A",
    lineHeight: 1.45,
  },
};

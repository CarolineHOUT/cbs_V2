import { useMemo, useState } from "react";

export default function PatientView({ patient, onBack }) {
  const [editablePatient, setEditablePatient] = useState({
    ...patient,
    notes: normalizeNotes(patient.notes || []),
  });
  const [newNote, setNewNote] = useState("");
  const [newNoteType, setNewNoteType] = useState("info");
  const [copiedPhone, setCopiedPhone] = useState("");

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

    const note = {
      id: cryptoRandom(),
      text: value,
      type: newNoteType,
      unread: true,
      timestamp: buildTimestamp(),
    };

    setEditablePatient((prev) => ({
      ...prev,
      notes: [note, ...(prev.notes || [])],
    }));

    setNewNote("");
    setNewNoteType("info");
  }

  function quickAction(text, type = "action") {
    const note = {
      id: cryptoRandom(),
      text,
      type,
      unread: true,
      timestamp: buildTimestamp(),
    };

    setEditablePatient((prev) => ({
      ...prev,
      notes: [note, ...(prev.notes || [])],
    }));
  }

  function markAsRead(noteId) {
    setEditablePatient((prev) => ({
      ...prev,
      notes: (prev.notes || []).map((note) =>
        note.id === noteId ? { ...note, unread: false } : note
      ),
    }));
  }

  async function copyPhone(label, phone) {
    if (!phone || phone === "Non renseigné" || phone === "Non concerné") return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(label);
      setTimeout(() => setCopiedPhone(""), 1500);
    } catch {
      // no-op
    }
  }

  if (!patient) return null;

  const stayDays = computeStayDays(editablePatient.entryDate);
  const unreadCount = (editablePatient.notes || []).filter((n) => n.unread).length;
  const urgentCount = (editablePatient.notes || []).filter((n) => n.type === "urgent").length;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button onClick={onBack} style={styles.backButton}>
          ← Retour au cockpit
        </button>

        <div style={styles.topRight}>
          <div style={styles.topBarTitle}>Fiche patient</div>
          {urgentCount > 0 ? (
            <div style={styles.urgentPill}>{urgentCount} note(s) urgente(s)</div>
          ) : null}
          {unreadCount > 0 ? (
            <div style={styles.unreadPill}>{unreadCount} non lue(s)</div>
          ) : null}
        </div>
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

      {editablePatient.sortantMedicalement && editablePatient.joursEvitables >= 5 ? (
        <div style={styles.alertBanner}>
          <div style={styles.alertTitle}>Sortie prioritaire à sécuriser</div>
          <div style={styles.alertText}>
            {editablePatient.joursEvitables} jours évitables cumulés, frein principal : {editablePatient.blocage}.
          </div>
        </div>
      ) : null}

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

          <Panel title="Entourage et protection" subtitle="Coordonnées immédiatement exploitables">
            <div style={styles.contactGrid}>
              <ContactCard
                title="Personne de confiance"
                name={editablePatient.personneConfiance || "Non renseignée"}
                phone={editablePatient.personneConfiancePhone || "Non renseigné"}
                copied={copiedPhone === "confiance"}
                onCopy={() =>
                  copyPhone("confiance", editablePatient.personneConfiancePhone || "")
                }
              />
              <ContactCard
                title="Personne à prévenir"
                name={editablePatient.personneAPrevenir || "Non renseignée"}
                phone={editablePatient.personneAPrevenirPhone || "Non renseigné"}
                copied={copiedPhone === "prevenir"}
                onCopy={() =>
                  copyPhone("prevenir", editablePatient.personneAPrevenirPhone || "")
                }
              />
              <ContactCard
                title="Tutelle / curatelle"
                name={editablePatient.protectionJuridique || "Non renseignée"}
                phone={editablePatient.protectionJuridiquePhone || "Non renseigné"}
                copied={copiedPhone === "protection"}
                onCopy={() =>
                  copyPhone("protection", editablePatient.protectionJuridiquePhone || "")
                }
              />
            </div>
          </Panel>
        </div>

        <div style={styles.rightColumn}>
          <Panel title="Actions rapides" subtitle="Coordination immédiate">
            <div style={styles.actionsGrid}>
              <button
                style={styles.actionButton}
                onClick={() => quickAction("Assistante sociale contactée", "action")}
              >
                Contacter assistante sociale
              </button>

              <button
                style={styles.actionButton}
                onClick={() => quickAction("Sortie à programmer", "action")}
              >
                Programmer sortie
              </button>

              <button
                style={styles.actionButton}
                onClick={() => quickAction("Réunion de coordination demandée", "action")}
              >
                Réunion coordination
              </button>

              <button
                style={styles.actionButton}
                onClick={() => quickAction("Famille relancée", "famille")}
              >
                Relancer famille
              </button>
            </div>
          </Panel>

          <Panel title="Ajouter une note" subtitle="Type, priorité et suivi non lu">
            <div style={styles.noteComposer}>
              <div style={styles.noteTypeRow}>
                <select
                  value={newNoteType}
                  onChange={(e) => setNewNoteType(e.target.value)}
                  style={styles.select}
                >
                  <option value="info">Info</option>
                  <option value="action">Action</option>
                  <option value="famille">Famille</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

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

          <Panel title="Historique opérationnel" subtitle="Cliquer sur une note pour la marquer comme lue">
            <div style={styles.timeline}>
              {(editablePatient.notes || []).map((note) => (
                <button
                  key={note.id}
                  onClick={() => markAsRead(note.id)}
                  style={{
                    ...styles.timelineItem,
                    ...(note.unread ? styles.timelineUnread : {}),
                  }}
                >
                  <div
                    style={{
                      ...styles.timelineDot,
                      background: noteTypeColor(note.type),
                    }}
                  />
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineTop}>
                      <div style={styles.timelineDate}>{note.timestamp}</div>
                      <div style={styles.timelineBadges}>
                        <NoteTypeBadge type={note.type} />
                        {note.unread ? <span style={styles.unreadBadge}>Non lu</span> : null}
                      </div>
                    </div>
                    <div style={styles.timelineText}>{note.text}</div>
                  </div>
                </button>
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

function ContactCard({ title, name, phone, onCopy, copied }) {
  const canCall = phone && phone !== "Non renseigné" && phone !== "Non concerné";
  const telHref = canCall ? `tel:${phone.replace(/\s+/g, "")}` : undefined;

  return (
    <div style={styles.contactCard}>
      <div style={styles.infoLabel}>{title}</div>
      <div style={styles.contactName}>{name}</div>
      <div style={styles.contactPhoneRow}>
        {canCall ? (
          <a href={telHref} style={styles.contactPhoneLink}>
            {phone}
          </a>
        ) : (
          <div style={styles.contactPhoneMuted}>{phone}</div>
        )}

        <button
          type="button"
          onClick={onCopy}
          style={styles.copyButton}
          disabled={!canCall}
        >
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
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

function NoteTypeBadge({ type }) {
  const config = {
    info: { label: "Info", bg: "#EFF6FF", color: "#1D4ED8" },
    action: { label: "Action", bg: "#ECFDF5", color: "#059669" },
    famille: { label: "Famille", bg: "#FFF7ED", color: "#EA580C" },
    urgent: { label: "Urgent", bg: "#FEF2F2", color: "#DC2626" },
  };

  const item = config[type] || config.info;

  return (
    <span style={{ ...styles.noteTypeBadge, background: item.bg, color: item.color }}>
      {item.label}
    </span>
  );
}

function normalizeNotes(notes) {
  return notes.map((note) =>
    typeof note === "string"
      ? {
          id: cryptoRandom(),
          text: note,
          type: "info",
          unread: true,
          timestamp: buildTimestamp(),
        }
      : note
  );
}

function cryptoRandom() {
  return Math.random().toString(36).slice(2, 11);
}

function buildTimestamp() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} • ${hh}:${mi}`;
}

function noteTypeColor(type) {
  const colors = {
    info: "#2563EB",
    action: "#059669",
    famille: "#EA580C",
    urgent: "#DC2626",
  };
  return colors[type] || "#2563EB";
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

  topRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  unreadPill: {
    borderRadius: 999,
    padding: "7px 10px",
    background: "#FEF2F2",
    color: "#DC2626",
    fontSize: 12,
    fontWeight: 800,
    border: "1px solid #FECACA",
  },

  urgentPill: {
    borderRadius: 999,
    padding: "7px 10px",
    background: "#FFF7ED",
    color: "#EA580C",
    fontSize: 12,
    fontWeight: 800,
    border: "1px solid #FED7AA",
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
    marginBottom: 14,
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

  alertBanner: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 14,
    background: "linear-gradient(180deg, #FFF7ED 0%, #FFFFFF 100%)",
    border: "1px solid #FED7AA",
  },

  alertTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#C2410C",
    marginBottom: 4,
  },

  alertText: {
    fontSize: 14,
    color: "#7C2D12",
    lineHeight: 1.45,
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1.8fr) minmax(340px,1fr)",
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

  contactGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },

  contactCard: {
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    padding: 14,
    background: "#FFFFFF",
  },

  contactName: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0F172A",
    lineHeight: 1.35,
  },

  contactPhoneRow: {
    marginTop: 8,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  contactPhoneLink: {
    fontSize: 14,
    color: "#1D4ED8",
    fontWeight: 700,
    textDecoration: "none",
  },

  contactPhoneMuted: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: 600,
  },

  copyButton: {
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    color: "#334155",
    borderRadius: 10,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
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

  noteTypeRow: {
    display: "flex",
    gap: 10,
  },

  select: {
    width: "100%",
    border: "1px solid #CBD5E1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    background: "#FFFFFF",
    boxSizing: "border-box",
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
    gap: 10,
  },

  timelineItem: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    background: "#FFFFFF",
    padding: 12,
    textAlign: "left",
    cursor: "pointer",
  },

  timelineUnread: {
    borderColor: "#93C5FD",
    background: "#F8FBFF",
  },

  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 6,
    flexShrink: 0,
  },

  timelineContent: {
    flex: 1,
  },

  timelineTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 6,
  },

  timelineDate: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: 700,
  },

  timelineBadges: {
    display: "flex",
    gap: 6,
    alignItems: "center",
    flexWrap: "wrap",
  },

  noteTypeBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
  },

  unreadBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    background: "#FEF2F2",
    color: "#DC2626",
  },

  timelineText: {
    fontSize: 14,
    color: "#0F172A",
    lineHeight: 1.45,
  },
};

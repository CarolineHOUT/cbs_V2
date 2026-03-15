import { useMemo, useState } from "react";

export default function PatientView({
  patient,
  onBack,
  onOpenDuo,
  onTriggerCrisis,
}) {
  const [editablePatient, setEditablePatient] = useState({
    ...patient,
    notes: normalizeNotes(patient.notes || []),
  });
  const [newNote, setNewNote] = useState("");
  const [newNoteType, setNewNoteType] = useState("info");
  const [copiedPhone, setCopiedPhone] = useState("");

  const status = useMemo(() => {
    if (!editablePatient) return { label: "", tone: "neutral" };
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
      setTimeout(() => setCopiedPhone(""), 1400);
    } catch {
      // no-op
    }
  }

  if (!editablePatient) return null;

  const stayDays = computeStayDays(editablePatient.entryDate);
  const unreadCount = (editablePatient.notes || []).filter((n) => n.unread).length;
  const urgentCount = (editablePatient.notes || []).filter((n) => n.type === "urgent").length;

  const canEscalate =
    editablePatient.sortantMedicalement &&
    (editablePatient.score >= 8 || editablePatient.joursEvitables >= 5);

  return (
    <div style={styles.page}>
      <header style={styles.appHeader}>
        <div style={styles.appHeaderLeft}>
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

        <button onClick={onBack} style={styles.headerBackButton}>
          Retour cockpit
        </button>
      </header>

      <section style={styles.identityStrip}>
        <div style={styles.identityMain}>
          <div style={styles.patientNameCompact}>
            {editablePatient.nom} {editablePatient.prenom}
          </div>

          <div style={styles.identityLine}>
            {editablePatient.birthDate} • {editablePatient.age} ans • INS {editablePatient.ins} • IEP {editablePatient.iep}
          </div>

          <div style={styles.identityLine}>
            {editablePatient.service} • chambre {editablePatient.chambre} • lit {editablePatient.lit}
          </div>
        </div>

        <div style={styles.identityActions}>
          <StatusBadge label={status.label} tone={status.tone} />

          {urgentCount > 0 ? (
            <div style={styles.urgentPill}>{urgentCount} urgent(es)</div>
          ) : null}

          {unreadCount > 0 ? (
            <div style={styles.unreadPill}>{unreadCount} non lue(s)</div>
          ) : null}

          <button
            type="button"
            style={styles.heroSecondaryButton}
            onClick={() =>
              onOpenDuo
                ? onOpenDuo(editablePatient)
                : quickAction("Ouverture vue DUO demandée", "action")
            }
          >
            Vue DUO
          </button>

          <button
            type="button"
            style={{
              ...styles.heroDangerButton,
              ...(canEscalate ? {} : styles.heroDangerButtonMuted),
            }}
            onClick={() =>
              onTriggerCrisis
                ? onTriggerCrisis(editablePatient)
                : quickAction("Déclenchement cellule de crise demandé", "urgent")
            }
          >
            Cellule de crise
          </button>
        </div>
      </section>

      {canEscalate ? (
        <div style={styles.alertBanner}>
          <div style={styles.alertTitle}>Situation à escalade rapide</div>
          <div style={styles.alertText}>
            {editablePatient.joursEvitables} jours évitables • frein principal :{" "}
            {editablePatient.blocage} • patient médicalement sortant.
          </div>
        </div>
      ) : null}

      <section style={styles.mainGrid}>
        <div style={styles.leftColumn}>
          <Panel title="Pilotage sortie" subtitle="Lecture décisionnelle">
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

            <div style={styles.pilotageGrid}>
              <div style={styles.primaryFocusCard}>
                <div style={styles.primaryFocusLabel}>Frein principal</div>
                <div style={styles.primaryFocusValue}>
                  {editablePatient.blocage || "Non renseigné"}
                </div>
                <div style={styles.primaryFocusSub}>
                  Élément prioritaire à lever pour sécuriser la sortie.
                </div>
              </div>

              <div style={styles.planCard}>
                <div style={styles.planHeader}>Plan de sortie</div>

                <div style={styles.planRow}>
                  <span style={styles.planKey}>Destination</span>
                  <input
                    value={editablePatient.destinationPrevue || ""}
                    onChange={(e) => updateField("destinationPrevue", e.target.value)}
                    style={styles.inlineInput}
                  />
                </div>

                <div style={styles.planRow}>
                  <span style={styles.planKey}>Transport</span>
                  <input
                    value={editablePatient.transport || ""}
                    onChange={(e) => updateField("transport", e.target.value)}
                    style={styles.inlineInput}
                  />
                </div>

                <div style={styles.planRow}>
                  <span style={styles.planKey}>Documents</span>
                  <input
                    value={editablePatient.documentsSortie || ""}
                    onChange={(e) => updateField("documentsSortie", e.target.value)}
                    style={styles.inlineInput}
                  />
                </div>

                <div style={styles.planRow}>
                  <span style={styles.planKey}>Prochaine action</span>
                  <input
                    value={editablePatient.nextStep || ""}
                    onChange={(e) => updateField("nextStep", e.target.value)}
                    style={styles.inlineInput}
                  />
                </div>
              </div>
            </div>

            <div style={styles.toggleRow}>
              <div style={styles.toggleCardStrong}>
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
                <div style={styles.fieldLabel}>Destination opérationnelle</div>
                <div style={styles.fieldValue}>
                  {editablePatient.destinationPrevue || "Non renseignée"}
                </div>
              </div>

              <div style={styles.toggleCard}>
                <div style={styles.fieldLabel}>Transport</div>
                <div style={styles.fieldValue}>
                  {editablePatient.transport || "Non renseigné"}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Parcours et aval" subtitle="Organisation concrète">
            <div style={styles.dualInfoSection}>
              <div style={styles.infoZone}>
                <div style={styles.zoneTitle}>Organisation aval</div>
                <InfoGrid
                  items={[
                    ["Besoin d’aval", editablePatient.besoinAval || "Non renseigné"],
                    ["Documents de sortie", editablePatient.documentsSortie || "Non renseignés"],
                  ]}
                />
              </div>

              <div style={styles.infoZone}>
                <div style={styles.zoneTitle}>Réseau de coordination</div>
                <InfoGrid
                  items={[
                    ["Référent médical", editablePatient.referentMedical || "Non renseigné"],
                    ["Cadre", editablePatient.cadre || "Non renseigné"],
                    ["Assistante sociale", editablePatient.assistanteSociale || "Non renseignée"],
                  ]}
                />
              </div>
            </div>
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

          <Panel title="Ajouter une note" subtitle="Sans liste déroulante">
            <div style={styles.noteComposer}>
              <div style={styles.noteTypePills}>
                {["info", "action", "famille", "urgent"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewNoteType(type)}
                    style={{
                      ...styles.noteTypePill,
                      ...(newNoteType === type ? activeNotePillStyle(type) : {}),
                    }}
                  >
                    {labelForType(type)}
                  </button>
                ))}
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
  };

  const t = toneStyles[tone] || toneStyles.neutral;

  return (
    <div style={{ ...styles.miniKpi, background: t.bg, borderColor: t.border }}>
      <div style={styles.miniKpiLabel}>{label}</div>
      <div style={{ ...styles.miniKpiValue, color: t.color }}>{value}</div>
    </div>
  );
}

function ContactCard({ title, name, phone, onCopy, copied }) {
  const canCall = phone && phone !== "Non renseigné" && phone !== "Non concerné";
  const telHref = canCall ? `tel:${phone}` : undefined;

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

function labelForType(type) {
  const labels = {
    info: "Info",
    action: "Action",
    famille: "Famille",
    urgent: "Urgent",
  };
  return labels[type] || type;
}

function activeNotePillStyle(type) {
  const stylesByType = {
    info: { background: "#EFF6FF", color: "#1D4ED8", borderColor: "#BFDBFE" },
    action: { background: "#ECFDF5", color: "#059669", borderColor: "#A7F3D0" },
    famille: { background: "#FFF7ED", color: "#EA580C", borderColor: "#FED7AA" },
    urgent: { background: "#FEF2F2", color: "#DC2626", borderColor: "#FECACA" },
  };
  return stylesByType[type] || {};
}

const styles = {
  page: {
    maxWidth: 1360,
    margin: "0 auto",
    padding: 18,
    background: "#F8FAFC",
    minHeight: "100vh",
  },

  appHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    background: "linear-gradient(90deg, #1E3A8A 0%, #2563EB 100%)",
    color: "#FFFFFF",
    padding: "12px 16px",
    borderRadius: 18,
    marginBottom: 14,
    boxShadow: "0 14px 30px rgba(37,99,235,0.14)",
    flexWrap: "wrap",
  },

  appHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  burgerButton: {
    width: 36,
    height: 36,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 4,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 10,
    padding: "0 8px",
  },

  burgerLine: {
    height: 2,
    background: "#FFFFFF",
    borderRadius: 999,
  },

  appTitle: {
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: 0.2,
  },

  appSubtitle: {
    fontSize: 12,
    opacity: 0.92,
    marginTop: 2,
  },

  headerBackButton: {
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.12)",
    color: "#FFFFFF",
    borderRadius: 12,
    padding: "9px 12px",
    fontWeight: 700,
    fontSize: 12,
  },

  identityStrip: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 18,
    padding: "14px 16px",
    marginBottom: 14,
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
    flexWrap: "wrap",
  },

  identityMain: {
    minWidth: 0,
  },

  patientNameCompact: {
    fontSize: 24,
    fontWeight: 900,
    color: "#0F172A",
    lineHeight: 1.1,
  },

  identityLine: {
    marginTop: 5,
    fontSize: 13,
    color: "#475569",
    lineHeight: 1.4,
  },

  identityActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  topBarRight: {
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

  heroSecondaryButton: {
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    color: "#1D4ED8",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 700,
    fontSize: 12,
  },

  heroDangerButton: {
    border: "1px solid #FECACA",
    background: "#FFF1F2",
    color: "#B91C1C",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 800,
    fontSize: 12,
  },

  heroDangerButtonMuted: {
    opacity: 0.95,
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

  pilotageGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr",
    gap: 12,
    marginTop: 12,
  },

  primaryFocusCard: {
    borderRadius: 18,
    padding: 16,
    background: "linear-gradient(180deg, #F8FBFF 0%, #EEF5FF 100%)",
    border: "1px solid #BFDBFE",
  },

  primaryFocusLabel: {
    fontSize: 11,
    color: "#1E40AF",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.2,
    marginBottom: 8,
  },

  primaryFocusValue: {
    fontSize: 24,
    lineHeight: 1.2,
    fontWeight: 900,
    color: "#0F172A",
  },

  primaryFocusSub: {
    marginTop: 8,
    fontSize: 13,
    color: "#475569",
    lineHeight: 1.4,
  },

  planCard: {
    borderRadius: 18,
    padding: 16,
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
  },

  planHeader: {
    fontSize: 13,
    fontWeight: 800,
    color: "#0F172A",
    marginBottom: 10,
  },

  planRow: {
    display: "grid",
    gridTemplateColumns: "130px 1fr",
    gap: 10,
    alignItems: "center",
    marginBottom: 10,
  },

  planKey: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: 700,
  },

  inlineInput: {
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

  toggleCardStrong: {
    border: "1px solid #BFDBFE",
    borderRadius: 16,
    padding: 14,
    background: "#F8FBFF",
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

  checkboxWrap: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "#0F172A",
  },

  dualInfoSection: {
    display: "grid",
    gap: 14,
  },

  infoZone: {
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    padding: 14,
    background: "#FFFFFF",
  },

  zoneTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#0F172A",
    marginBottom: 10,
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

  noteTypePills: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  noteTypePill: {
    padding: "8px 11px",
    borderRadius: 999,
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    color: "#334155",
    fontSize: 12,
    fontWeight: 700,
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

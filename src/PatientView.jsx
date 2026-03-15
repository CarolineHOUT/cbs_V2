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
    freins: patient.freins || buildFreinsFromPatient(patient),
    actions:
      patient.actions || [
        {
          id: "a1",
          echeance: "15 mai",
          action: "Évaluation sociale",
          responsable: patient.assistanteSociale || "Assistante sociale",
          statut: "En cours",
        },
        {
          id: "a2",
          echeance: "16 mai",
          action: "Validation sortie",
          responsable: "IDE parcours",
          statut: "À faire",
        },
      ],
    acteurs:
      patient.acteurs || [
        {
          id: "ac1",
          role: "Médecin référent",
          nom: patient.referentMedical || "Non renseigné",
        },
        {
          id: "ac2",
          role: "Assistante sociale",
          nom: patient.assistanteSociale || "Non renseignée",
        },
        {
          id: "ac3",
          role: "Cadre",
          nom: patient.cadre || "Non renseigné",
        },
        {
          id: "ac4",
          role: "IDE parcours",
          nom: "À désigner",
        },
      ],
  });

  const [newNote, setNewNote] = useState("");
  const [newNoteType, setNewNoteType] = useState("info");
  const [newFrein, setNewFrein] = useState("");
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
      notes: prev.notes.map((note) =>
        note.id === noteId ? { ...note, unread: false } : note
      ),
    }));
  }

  function addFrein() {
    const value = newFrein.trim();
    if (!value) return;

    setEditablePatient((prev) => ({
      ...prev,
      freins: [...prev.freins, value],
    }));
    setNewFrein("");
    quickAction(`Frein ajouté : ${value}`, "action");
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

  const stayDays = computeStayDays(editablePatient.entryDate);
  const unreadCount = editablePatient.notes.filter((n) => n.unread).length;
  const urgentCount = editablePatient.notes.filter((n) => n.type === "urgent").length;
  const actionsOpen = editablePatient.actions.length;
  const canEscalate =
    editablePatient.sortantMedicalement &&
    (editablePatient.score >= 8 || editablePatient.joursEvitables >= 5);

  const scoreParcours = useMemo(() => {
    const base = editablePatient.score * 18;
    const days = editablePatient.joursEvitables * 6;
    const freins = editablePatient.freins.length * 8;
    return base + days + freins;
  }, [editablePatient]);

  const riskLabel =
    editablePatient.score >= 8
      ? "Élevé"
      : editablePatient.score >= 6
        ? "Modéré"
        : "Faible";

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

        <div style={styles.headerActions}>
          <button onClick={onBack} style={styles.headerGhostButton}>
            Retour cockpit
          </button>
          <button
            style={styles.headerCrisisButton}
            onClick={() =>
              onTriggerCrisis
                ? onTriggerCrisis(editablePatient)
                : quickAction("Déclenchement cellule de crise demandé", "urgent")
            }
          >
            Cellule de crise
          </button>
        </div>
      </header>

      <section style={styles.patientStrip}>
        <div style={styles.patientMainBlock}>
          <div style={styles.patientName}>{editablePatient.nom} {editablePatient.prenom}</div>
          <div style={styles.patientMeta}>
            {editablePatient.birthDate} • {editablePatient.age} ans • INS {editablePatient.ins} • IEP {editablePatient.iep}
          </div>
          <div style={styles.patientMeta}>
            {editablePatient.service} — Chambre {editablePatient.chambre} — Lit {editablePatient.lit} • Entrée : {editablePatient.entryDate} • {stayDays} jours
          </div>
        </div>

        <div style={styles.patientStatusBlock}>
          <StatusBadge label={status.label} tone={status.tone} />

          <div style={styles.inlineMetric}>
            <span style={styles.inlineMetricLabel}>Sortant médical</span>
            <span style={styles.inlineMetricValue}>
              {editablePatient.sortantMedicalement ? "Oui" : "Non"}
            </span>
          </div>

          <div style={styles.inlineMetric}>
            <span style={styles.inlineMetricLabel}>Jours évitables</span>
            <span style={styles.inlineMetricValueAlert}>
              {editablePatient.joursEvitables}
            </span>
          </div>

          <div style={styles.inlineMetric}>
            <span style={styles.inlineMetricLabel}>Score parcours</span>
            <span style={styles.inlineMetricValue}>{scoreParcours}</span>
          </div>

          {unreadCount > 0 ? (
            <span style={styles.unreadPill}>{unreadCount} non lue(s)</span>
          ) : null}

          {urgentCount > 0 ? (
            <span style={styles.urgentPill}>{urgentCount} urgente(s)</span>
          ) : null}

          <button
            type="button"
            style={styles.duoButton}
            onClick={() =>
              onOpenDuo
                ? onOpenDuo(editablePatient)
                : quickAction("Ouverture vue DUO demandée", "action")
            }
          >
            Vue DUO
          </button>
        </div>
      </section>

      {canEscalate ? (
        <section style={styles.alertBanner}>
          <div style={styles.alertTitle}>Situation à escalade rapide</div>
          <div style={styles.alertText}>
            {editablePatient.joursEvitables} jours évitables • frein principal : {editablePatient.blocage} • patient médicalement sortant.
          </div>
        </section>
      ) : null}

      <section style={styles.gridTop}>
        <Card title="Plan de sortie">
          <div style={styles.compactList}>
            <InlineField
              label="Orientation prévue"
              value={editablePatient.destinationPrevue || ""}
              onChange={(value) => updateField("destinationPrevue", value)}
            />
            <InlineField
              label="Date cible"
              value={editablePatient.dateCible || "20/02/2026"}
              onChange={(value) => updateField("dateCible", value)}
            />
            <InlineField
              label="Plan de sortie"
              value={editablePatient.sortantMedicalement ? "En préparation" : "En attente"}
              readOnly
            />
          </div>

          <div style={styles.cardFooterAction}>
            <button
              style={styles.smallActionButton}
              onClick={() => quickAction("Sortie intégrée au plan", "action")}
            >
              Intégrer sortie →
            </button>
          </div>
        </Card>

        <Card title="Freins à la sortie">
          <div style={styles.tagsList}>
            {editablePatient.freins.map((frein, index) => (
              <div key={`${frein}-${index}`} style={styles.freinTag}>
                <span style={styles.freinDot} />
                <span>{frein}</span>
              </div>
            ))}
          </div>

          <div style={styles.addRow}>
            <input
              value={newFrein}
              onChange={(e) => setNewFrein(e.target.value)}
              placeholder="Ajouter un frein"
              style={styles.addInput}
            />
            <button style={styles.addMiniButton} onClick={addFrein}>
              +
            </button>
          </div>
        </Card>

        <Card title="Acteurs du parcours">
          <div style={styles.actorList}>
            {editablePatient.acteurs.map((acteur) => (
              <div key={acteur.id} style={styles.actorRow}>
                <span style={styles.actorRole}>{acteur.role}</span>
                <span style={styles.actorName}>{acteur.nom}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section style={styles.gridBottom}>
        <Card title="Actions">
          <div style={styles.actionTable}>
            <div style={styles.actionTableHeader}>
              <span>Échéance</span>
              <span>Action</span>
              <span>Responsable</span>
            </div>

            {editablePatient.actions.map((action) => (
              <div key={action.id} style={styles.actionTableRow}>
                <span>{action.echeance}</span>
                <span>{action.action}</span>
                <span>{action.responsable}</span>
              </div>
            ))}
          </div>

          <div style={styles.cardFooterAction}>
            <button
              style={styles.smallActionButton}
              onClick={() => quickAction("Nouvelle action ajoutée au parcours", "action")}
            >
              + Ajouter une action
            </button>
          </div>
        </Card>

        <Card title="Coordination">
          <div style={styles.coordCard}>
            <div style={styles.coordTypeBadge}>POST-IT ({labelForType(newNoteType)})</div>
            <div style={styles.coordText}>
              {editablePatient.notes[0]?.text || "Aucune note récente."}
            </div>
            <div style={styles.coordMeta}>
              {editablePatient.referentMedical || "Non renseigné"} • il y a 3 h
            </div>
          </div>

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
              placeholder="Ajouter une note de coordination..."
              style={styles.textarea}
            />

            <div style={styles.noteActions}>
              <button style={styles.primaryButton} onClick={addNote}>
                Ajouter la note
              </button>
              <button
                style={styles.secondaryButton}
                onClick={() => quickAction("Note marquée traitée", "action")}
              >
                Marquer traité
              </button>
            </div>
          </div>
        </Card>

        <Card title="Synthèse CARABBAS">
          <div style={styles.summaryBlock}>
            <div style={styles.summaryRow}>
              <span>Derrière activité</span>
              <strong>il y a 48h</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Actions ouvertes</span>
              <strong>{actionsOpen}</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Risque de blocage</span>
              <strong style={riskLabel === "Élevé" ? styles.riskHigh : undefined}>
                {riskLabel}
              </strong>
            </div>
            <div style={styles.summaryNext}>
              <span>Prochaine étape</span>
              <strong>{editablePatient.nextStep || "Validation sortie médicale"}</strong>
            </div>

            <button
              style={styles.suggestionButton}
              onClick={() => quickAction("Suggestion CARABBAS générée", "info")}
            >
              Suggestion CARABBAS →
            </button>
          </div>
        </Card>
      </section>

      <section style={styles.bottomRow}>
        <Card title="Entourage et protection">
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
        </Card>

        <Card title="Historique opérationnel">
          <div style={styles.timeline}>
            {editablePatient.notes.map((note) => (
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
        </Card>
      </section>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={{ marginTop: 12 }}>{children}</div>
    </section>
  );
}

function InlineField({ label, value, onChange, readOnly = false }) {
  return (
    <div style={styles.inlineField}>
      <div style={styles.inlineFieldLabel}>{label}</div>
      {readOnly ? (
        <div style={styles.inlineFieldReadOnly}>{value}</div>
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} style={styles.inlineFieldInput} />
      )}
    </div>
  );
}

function ContactCard({ title, name, phone, onCopy, copied }) {
  const canCall = phone && phone !== "Non renseigné" && phone !== "Non concerné";
  const telHref = canCall ? `tel:${phone}` : undefined;

  return (
    <div style={styles.contactCard}>
      <div style={styles.contactTitle}>{title}</div>
      <div style={styles.contactName}>{name}</div>
      <div style={styles.contactRow}>
        {canCall ? (
          <a href={telHref} style={styles.contactPhoneLink}>
            {phone}
          </a>
        ) : (
          <span style={styles.contactPhoneMuted}>{phone}</span>
        )}

        <button type="button" onClick={onCopy} style={styles.copyButton} disabled={!canCall}>
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
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
    <span style={{ ...styles.statusBadge, background: t.bg, color: t.color }}>
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

function buildFreinsFromPatient(patient) {
  const base = patient.blocage ? [patient.blocage] : [];
  const defaults = {
    "Recherche EHPAD": ["Isolement social", "Logement inadapté", "Aidant épuisé"],
    "Recherche SSIAD": ["Retour domicile non sécurisé", "Aides non organisées"],
    "Logement insalubre": ["Logement inadapté", "Coordination sociale"],
  };
  return [...new Set([...base, ...(defaults[patient.blocage] || [])])];
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

  headerActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  headerGhostButton: {
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.12)",
    color: "#FFFFFF",
    borderRadius: 12,
    padding: "9px 12px",
    fontWeight: 700,
    fontSize: 12,
  },

  headerCrisisButton: {
    border: "1px solid #FECACA",
    background: "#FFF1F2",
    color: "#B91C1C",
    borderRadius: 12,
    padding: "9px 12px",
    fontWeight: 800,
    fontSize: 12,
  },

  patientStrip: {
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

  patientMainBlock: {
    minWidth: 0,
  },

  patientName: {
    fontSize: 24,
    fontWeight: 900,
    color: "#0F172A",
    lineHeight: 1.1,
  },

  patientMeta: {
    marginTop: 5,
    fontSize: 13,
    color: "#475569",
    lineHeight: 1.4,
  },

  patientStatusBlock: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  statusBadge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
  },

  inlineMetric: {
    display: "grid",
    gap: 2,
    padding: "7px 10px",
    borderRadius: 12,
    background: "#F8FAFC",
    border: "1px solid #E5E7EB",
  },

  inlineMetricLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: 700,
  },

  inlineMetricValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: 800,
  },

  inlineMetricValueAlert: {
    fontSize: 14,
    color: "#D97706",
    fontWeight: 800,
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

  duoButton: {
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    color: "#1D4ED8",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 700,
    fontSize: 12,
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

  gridTop: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
    marginBottom: 16,
    alignItems: "start",
  },

  gridBottom: {
    display: "grid",
    gridTemplateColumns: "1.15fr 1fr 0.9fr",
    gap: 16,
    marginBottom: 16,
    alignItems: "start",
  },

  bottomRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: 16,
    alignItems: "start",
  },

  card: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#0F172A",
  },

  compactList: {
    display: "grid",
    gap: 10,
  },

  inlineField: {
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    padding: 12,
    background: "#FFFFFF",
  },

  inlineFieldLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: 800,
    textTransform: "uppercase",
    marginBottom: 6,
  },

  inlineFieldInput: {
    width: "100%",
    border: "1px solid #CBD5E1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    boxSizing: "border-box",
  },

  inlineFieldReadOnly: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0F172A",
  },

  cardFooterAction: {
    marginTop: 12,
  },

  smallActionButton: {
    border: "1px solid #CBD5E1",
    background: "#F8FAFC",
    color: "#1D4ED8",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 700,
    fontSize: 13,
  },

  tagsList: {
    display: "grid",
    gap: 10,
  },

  freinTag: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#FFF7F7",
    border: "1px solid #FEE2E2",
    color: "#0F172A",
    fontWeight: 600,
  },

  freinDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "#FB7185",
    flexShrink: 0,
  },

  addRow: {
    display: "grid",
    gridTemplateColumns: "1fr 44px",
    gap: 8,
    marginTop: 12,
  },

  addInput: {
    width: "100%",
    border: "1px solid #CBD5E1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    boxSizing: "border-box",
  },

  addMiniButton: {
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    color: "#1D4ED8",
    borderRadius: 10,
    fontSize: 22,
    fontWeight: 700,
  },

  actorList: {
    display: "grid",
    gap: 10,
  },

  actorRow: {
    display: "grid",
    gap: 2,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#F8FAFC",
    border: "1px solid #E5E7EB",
  },

  actorRole: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: 700,
  },

  actorName: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: 700,
  },

  actionTable: {
    display: "grid",
    gap: 8,
  },

  actionTableHeader: {
    display: "grid",
    gridTemplateColumns: "90px 1fr 140px",
    gap: 10,
    fontSize: 12,
    color: "#64748B",
    fontWeight: 800,
    paddingBottom: 4,
  },

  actionTableRow: {
    display: "grid",
    gridTemplateColumns: "90px 1fr 140px",
    gap: 10,
    padding: "10px 0",
    borderTop: "1px solid #EEF2F7",
    fontSize: 14,
    color: "#0F172A",
  },

  coordCard: {
    borderRadius: 16,
    padding: 14,
    background: "#FFF8EA",
    border: "1px solid #FDE68A",
    marginBottom: 12,
  },

  coordTypeBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    background: "#F59E0B",
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: 800,
    marginBottom: 8,
  },

  coordText: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: 700,
    lineHeight: 1.45,
  },

  coordMeta: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748B",
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

  noteActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
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

  secondaryButton: {
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    color: "#334155",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },

  summaryBlock: {
    display: "grid",
    gap: 12,
  },

  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 14,
    color: "#0F172A",
  },

  summaryNext: {
    display: "grid",
    gap: 4,
    padding: 12,
    borderRadius: 14,
    background: "#F8FAFC",
    border: "1px solid #E5E7EB",
    fontSize: 14,
    color: "#0F172A",
  },

  riskHigh: {
    color: "#DC2626",
  },

  suggestionButton: {
    border: "1px solid #BFDBFE",
    background: "#EFF6FF",
    color: "#1D4ED8",
    borderRadius: 12,
    padding: "12px 14px",
    fontWeight: 800,
    textAlign: "left",
  },

  contactGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  },

  contactCard: {
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    padding: 14,
    background: "#FFFFFF",
  },

  contactTitle: {
    fontSize: 11,
    color: "#64748B",
    textTransform: "uppercase",
    fontWeight: 800,
    marginBottom: 6,
  },

  contactName: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0F172A",
  },

  contactRow: {
    marginTop: 8,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
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

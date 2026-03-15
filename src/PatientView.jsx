import { useMemo, useState } from "react";

export default function PatientView({
  patient,
  onBack,
  onOpenDuo,
  onTriggerCrisis,
}) {
  const [editablePatient, setEditablePatient] = useState({
    ...patient,
    notes: normalizeNotes(patient?.notes || []),
    freins: patient?.freins || buildFreinsFromPatient(patient || {}),
    actions:
      patient?.actions || [
        {
          id: "a1",
          echeance: "15 mai",
          action: "Évaluation sociale",
          responsable: patient?.assistanteSociale || "Assistante sociale",
        },
        {
          id: "a2",
          echeance: "16 mai",
          action: "Validation sortie",
          responsable: "IDE parcours",
        },
      ],
    acteurs:
      patient?.acteurs || [
        {
          id: "ac1",
          role: "Médecin référent",
          nom: patient?.referentMedical || "Non renseigné",
        },
        {
          id: "ac2",
          role: "Assistante sociale",
          nom: patient?.assistanteSociale || "Non renseignée",
        },
        {
          id: "ac3",
          role: "Cadre",
          nom: patient?.cadre || "Non renseigné",
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
  }, [editablePatient.score]);

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

  if (!editablePatient) return null;

  const stayDays = computeStayDays(editablePatient.entryDate);
  const unreadCount = editablePatient.notes.filter((n) => n.unread).length;
  const urgentCount = editablePatient.notes.filter((n) => n.type === "urgent").length;
  const actionsOpen = editablePatient.actions.length;

  const scoreParcours = useMemo(() => {
    const base = (editablePatient.score || 0) * 18;
    const days = (editablePatient.joursEvitables || 0) * 6;
    const freins = (editablePatient.freins || []).length * 8;
    return base + days + freins;
  }, [editablePatient.score, editablePatient.joursEvitables, editablePatient.freins]);

  const canEscalate =
    editablePatient.sortantMedicalement &&
    ((editablePatient.score || 0) >= 8 || (editablePatient.joursEvitables || 0) >= 5);

  const riskLabel =
    (editablePatient.score || 0) >= 8
      ? "Élevé"
      : (editablePatient.score || 0) >= 6
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
            onClick={() =>
              onOpenDuo
                ? onOpenDuo(editablePatient)
                : quickAction("Ouverture vue DUO demandée", "action")
            }
            style={styles.headerDuoButton}
          >
            Vue DUO
          </button>

          <button
            onClick={() =>
              onTriggerCrisis
                ? onTriggerCrisis(editablePatient)
                : quickAction("Déclenchement cellule de crise demandé", "urgent")
            }
            style={styles.headerCrisisButton}
          >
            Cellule de crise
          </button>
        </div>
      </header>

      <section style={styles.patientRibbon}>
        <div style={styles.patientIdentity}>
          <div style={styles.patientName}>
            {editablePatient.nom} {editablePatient.prenom}
          </div>

          <div style={styles.patientMetaLine}>
            <span>{editablePatient.birthDate}</span>
            <span>•</span>
            <span>{editablePatient.age} ans</span>
            <span>•</span>
            <span>INS {editablePatient.ins}</span>
            <span>•</span>
            <span>IEP {editablePatient.iep}</span>
          </div>

          <div style={styles.patientMetaLine}>
            <span>{editablePatient.service}</span>
            <span>•</span>
            <span>Chambre {editablePatient.chambre}</span>
            <span>•</span>
            <span>Lit {editablePatient.lit}</span>
            <span>•</span>
            <span>Entrée : {editablePatient.entryDate}</span>
            <span>•</span>
            <span>{stayDays} jours de présence</span>
          </div>
        </div>

        <div style={styles.patientMetrics}>
          <StatusPill label={status.label} tone={status.tone} />
          <MetricCell label="Sortant médical" value={editablePatient.sortantMedicalement ? "Oui" : "Non"} />
          <MetricCell label="Jours évitables" value={editablePatient.joursEvitables || 0} accent="amber" />
          <MetricCell label="Score parcours" value={scoreParcours} />
          <MetricCell label="Notes non lues" value={unreadCount} accent={unreadCount > 0 ? "red" : "neutral"} />
          {urgentCount > 0 ? (
            <MetricCell label="Urgentes" value={urgentCount} accent="red" />
          ) : null}
        </div>
      </section>

      {canEscalate ? (
        <section style={styles.alertBanner}>
          <div style={styles.alertTitle}>Situation à escalade rapide</div>
          <div style={styles.alertText}>
            {editablePatient.joursEvitables} jours évitables • frein principal : {editablePatient.blocage} • patient médicalement sortant
          </div>
        </section>
      ) : null}

      <section style={styles.topRow}>
        <Card title="Situation de sortie" subtitle="Décision et préparation">
          <div style={styles.situationLayout}>
            <div style={styles.primaryBlock}>
              <div style={styles.primaryBlockLabel}>Frein principal</div>
              <div style={styles.primaryBlockValue}>
                {editablePatient.blocage || "Non renseigné"}
              </div>
              <div style={styles.primaryBlockHint}>
                Point prioritaire à lever pour débloquer la sortie et récupérer de la capacité.
              </div>
            </div>

            <div style={styles.planBoard}>
              <PlanRow
                label="Orientation prévue"
                value={editablePatient.destinationPrevue || ""}
                onChange={(value) => updateField("destinationPrevue", value)}
              />
              <PlanRow
                label="Date cible"
                value={editablePatient.dateCible || "20/02/2026"}
                onChange={(value) => updateField("dateCible", value)}
              />
              <PlanRow
                label="Transport"
                value={editablePatient.transport || ""}
                onChange={(value) => updateField("transport", value)}
              />
              <PlanRow
                label="Documents"
                value={editablePatient.documentsSortie || ""}
                onChange={(value) => updateField("documentsSortie", value)}
              />
              <PlanRow
                label="Prochaine action"
                value={editablePatient.nextStep || ""}
                onChange={(value) => updateField("nextStep", value)}
                wide
              />
            </div>
          </div>

          <div style={styles.situationFooter}>
            <div style={styles.toggleInline}>
              <div style={styles.toggleInlineLabel}>Sortant médical</div>
              <label style={styles.checkboxWrap}>
                <input
                  type="checkbox"
                  checked={editablePatient.sortantMedicalement}
                  onChange={(e) => updateField("sortantMedicalement", e.target.checked)}
                />
                <span>{editablePatient.sortantMedicalement ? "Oui" : "Non"}</span>
              </label>
            </div>

            <button
              style={styles.integrateButton}
              onClick={() => quickAction("Sortie intégrée au plan", "action")}
            >
              Intégrer sortie
            </button>
          </div>
        </Card>

        <Card title="Coordination" subtitle="Centre opérationnel">
          <div style={styles.activeNoteCard}>
            <div style={styles.activeNoteTop}>
              <span style={styles.postItBadge}>POST-IT</span>
              <span style={styles.activeNoteType}>{labelForType(newNoteType)}</span>
            </div>

            <div style={styles.activeNoteText}>
              {editablePatient.notes[0]?.text || "Aucune note récente."}
            </div>

            <div style={styles.activeNoteMeta}>
              {editablePatient.referentMedical || "Non renseigné"} • il y a 3 h
            </div>
          </div>

          <div style={styles.quickActions}>
            <button style={styles.actionButton} onClick={() => quickAction("Assistante sociale contactée", "action")}>
              Contacter assistante sociale
            </button>
            <button style={styles.actionButton} onClick={() => quickAction("Sortie à programmer", "action")}>
              Programmer sortie
            </button>
            <button style={styles.actionButton} onClick={() => quickAction("Réunion de coordination demandée", "action")}>
              Réunion coordination
            </button>
            <button style={styles.actionButton} onClick={() => quickAction("Famille relancée", "famille")}>
              Relancer famille
            </button>
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
      </section>

      <section style={styles.middleRow}>
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

        <Card title="Synthèse CARABBAS">
          <div style={styles.summaryBlock}>
            <div style={styles.summaryRow}>
              <span>Dernière activité</span>
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
            <div style={styles.summaryHighlight}>
              <span>Prochaine étape</span>
              <strong>{editablePatient.nextStep || "Validation sortie médicale"}</strong>
            </div>

            <button
              style={styles.suggestionButton}
              onClick={() => quickAction("Suggestion CARABBAS générée", "info")}
            >
              Suggestion CARABBAS
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

function Card({ title, subtitle, children }) {
  return (
    <section style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      {subtitle ? <div style={styles.cardSubtitle}>{subtitle}</div> : null}
      <div style={{ marginTop: 12 }}>{children}</div>
    </section>
  );
}

function PlanRow({ label, value, onChange, wide = false }) {
  return (
    <div style={{ ...styles.planRow, ...(wide ? styles.planRowWide : {}) }}>
      <div style={styles.planRowLabel}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.planRowInput}
      />
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

function StatusPill({ label, tone = "neutral" }) {
  const tones = {
    neutral: { bg: "#E2E8F0", color: "#334155" },
    red: { bg: "#FEF2F2", color: "#DC2626" },
    amber: { bg: "#FEF3C7", color: "#D97706" },
    green: { bg: "#D1FAE5", color: "#059669" },
  };
  const t = tones[tone] || tones.neutral;

  return (
    <div style={{ ...styles.statusPill, background: t.bg, color: t.color }}>
      {label}
    </div>
  );
}

function MetricCell({ label, value, accent = "neutral" }) {
  const colors = {
    neutral: "#0F172A",
    amber: "#D97706",
    red: "#DC2626",
  };

  return (
    <div style={styles.metricCell}>
      <div style={styles.metricCellLabel}>{label}</div>
      <div style={{ ...styles.metricCellValue, color: colors[accent] || colors.neutral }}>
        {value}
      </div>
    </div>
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
    info:

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
  const [activeFrein, setActiveFrein] = useState(
    patient?.blocage || buildFreinsFromPatient(patient || {})[0] || ""
  );

  const status = useMemo(() => {
    if ((editablePatient.score || 0) >= 8) return { label: "Bloqué", tone: "red" };
    if ((editablePatient.score || 0) >= 6) return { label: "Risque", tone: "amber" };
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
      priority: notePriorityFromType(newNoteType),
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
      priority: notePriorityFromType(type),
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
    setActiveFrein(value);
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

  const scoreVisual = getScoreVisual(scoreParcours);

  const canEscalate =
    editablePatient.sortantMedicalement &&
    ((editablePatient.score || 0) >= 8 || (editablePatient.joursEvitables || 0) >= 5);

  const riskLabel =
    (editablePatient.score || 0) >= 8
      ? "Élevé"
      : (editablePatient.score || 0) >= 6
        ? "Modéré"
        : "Faible";

  const freinInsight = getFreinInsight(activeFrein, editablePatient);

  const sortedNotes = useMemo(() => {
    return [...editablePatient.notes].sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      if (a.unread !== b.unread) return a.unread ? -1 : 1;
      return 0;
    });
  }, [editablePatient.notes]);

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
          <MetricCell label="Notes non lues" value={unreadCount} accent={unreadCount > 0 ? "red" : "neutral"} />

          <div style={styles.scoreCard}>
            <div style={styles.scoreTop}>
              <span style={styles.scoreLabel}>Score parcours</span>
              <span style={styles.scoreValue}>{scoreParcours}</span>
            </div>
            <div style={styles.scoreBarTrack}>
              <div
                style={{
                  ...styles.scoreBarFill,
                  width: `${scoreVisual.percent}%`,
                  background: scoreVisual.color,
                }}
              />
            </div>
            <div style={styles.scoreBottom}>
              <span style={{ ...styles.scoreBadge, color: scoreVisual.color, borderColor: scoreVisual.softBorder, background: scoreVisual.softBg }}>
                {scoreVisual.label}
              </span>
            </div>
          </div>

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
              <div style={styles.primaryBlockLabel}>Frein actif</div>
              <div style={styles.primaryBlockValue}>
                {activeFrein || editablePatient.blocage || "Non renseigné"}
              </div>
              <div style={styles.primaryBlockHint}>
                {freinInsight.impact}
              </div>

              <div style={styles.freinsInsightBox}>
                <div style={styles.freinsInsightRow}>
                  <span style={styles.freinsInsightKey}>Action associée</span>
                  <span style={styles.freinsInsightValue}>{freinInsight.action}</span>
                </div>
                <div style={styles.freinsInsightRow}>
                  <span style={styles.freinsInsightKey}>Acteur concerné</span>
                  <span style={styles.freinsInsightValue}>{freinInsight.actor}</span>
                </div>
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
              {sortedNotes[0]?.text || "Aucune note récente."}
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
              <button
                key={`${frein}-${index}`}
                onClick={() => setActiveFrein(frein)}
                style={{
                  ...styles.freinTag,
                  ...(activeFrein === frein ? styles.freinTagActive : {}),
                }}
              >
                <span style={styles.freinDot} />
                <span>{frein}</span>
              </button>
            ))}
          </div>

          <div style={styles.activeFreinFooter}>
            <div style={styles.activeFreinFooterTitle}>Frein sélectionné</div>
            <div style={styles.activeFreinFooterText}>
              {activeFrein || "Aucun frein sélectionné"}
            </div>
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
            {sortedNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => markAsRead(note.id)}
                style={{
                  ...styles.timelineItem,
                  ...(note.unread ? styles.timelineUnread : {}),
                  ...(note.priority >= 4 ? styles.timelineUrgent : {}),
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
                      {note.priority >= 4 ? <span style={styles.priorityBadge}>Prioritaire</span> : null}
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

  return <div style={{ ...styles.statusPill, background: t.bg, color: t.color }}>{label}</div>;
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
          priority: 1,
        }
      : {
          ...note,
          priority: note.priority ?? notePriorityFromType(note.type || "info"),
        }
  );
}

function buildFreinsFromPatient(patient) {
  const base = patient?.blocage ? [patient.blocage] : [];
  const defaults = {
    "Recherche EHPAD": ["Isolement social", "Logement inadapté", "Aidant épuisé"],
    "Recherche SSIAD": ["Retour domicile non sécurisé", "Aides non organisées"],
    "Logement insalubre": ["Logement inadapté", "Coordination sociale"],
  };
  return [...new Set([...base, ...(defaults[patient?.blocage] || [])])];
}

function getFreinInsight(frein, patient) {
  const map = {
    "Recherche EHPAD": {
      action: "Relancer admissions EHPAD",
      actor: patient.assistanteSociale || "Assistante sociale",
      impact: "Frein d’aval majeur retardant la sortie et la récupération de lit.",
    },
    "Recherche SSIAD": {
      action: "Contacter SSIAD et sécuriser le retour",
      actor: patient.assistanteSociale || "Assistante sociale",
      impact: "Retour domicile non sécurisé sans coordination de prise en charge.",
    },
    "Logement insalubre": {
      action: "Relancer solution logement",
      actor: patient.assistanteSociale || "Assistante sociale",
      impact: "Impossibilité de retour dans les conditions actuelles de logement.",
    },
    "Isolement social": {
      action: "Mobiliser entourage et réseau de ville",
      actor: patient.referentMedical || "Médecin référent",
      impact: "Manque d’appui extérieur pour sécuriser la sortie.",
    },
    "Logement inadapté": {
      action: "Évaluer adaptation du domicile",
      actor: patient.cadre || "Cadre",
      impact: "Risque de retour non sécurisé au domicile actuel.",
    },
    "Aidant épuisé": {
      action: "Revoir l’organisation familiale",
      actor: patient.assistanteSociale || "Assistante sociale",
      impact: "L’entourage ne peut plus soutenir le retour dans les conditions actuelles.",
    },
    "Coordination sociale": {
      action: "Planifier une réunion de coordination",
      actor: patient.assistanteSociale || "Assistante sociale",
      impact: "Dépendance à une action de coordination externe encore non finalisée.",
    },
  };

  return (
    map[frein] || {
      action: patient.nextStep || "À préciser",
      actor: patient.assistanteSociale || patient.referentMedical || "À préciser",
      impact: "Frein actif à suivre dans le parcours de sortie.",
    }
  );
}

function getScoreVisual(score) {
  if (score >= 240) {
    return {
      label: "Critique",
      color: "#DC2626",
      softBg: "#FEF2F2",
      softBorder: "#FECACA",
      percent: 100,
    };
  }
  if (score >= 180) {
    return {
      label: "Élevé",
      color: "#EA580C",
      softBg: "#FFF7ED",
      softBorder: "#FED7AA",
      percent: 78,
    };
  }
  if (score >= 120) {
    return {
      label: "Modéré",
      color: "#D97706",
      softBg: "#FFFBEB",
      softBorder: "#FDE68A",
      percent: 54,
    };
  }
  return {
    label: "Faible",
    color: "#059669",
    softBg: "#ECFDF5",
    softBorder: "#A7F3D0",
    percent: 28,
  };
}

function notePriorityFromType(type) {
  const map = {
    urgent: 4,
    action: 3,
    famille: 2,
    info: 1,
  };
  return map[type] || 1;
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
    info: {
      background: "#EFF6FF",
      color: "#1D4ED8",
      border: "1px solid #BFDBFE",
    },
    action: {
      background: "#ECFDF5",
      color: "#059669",
      border: "1px solid #A7F3D0",
    },
    famille: {
      background: "#FFF7ED",
      color: "#EA580C",
      border: "1px solid #FED7AA",
    },
    urgent: {
      background: "#FEF2F2",
      color: "#DC2626",
      border: "1px solid #FECACA",
    },
  };

  return stylesByType[type] || stylesByType.info;
}

const styles = {
  page: {
    padding: 20,
    background: "#F1F5F9",
    minHeight: "100vh",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
  },

  appHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#1E3A8A",
    color: "white",
    padding: "12px 16px",
    borderRadius: 10,
    marginBottom: 16,
  },

  appHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  appTitle: {
    fontSize: 20,
    fontWeight: 700,
  },

  appSubtitle: {
    fontSize: 12,
    opacity: 0.85,
  },

  headerActions: {
    display: "flex",
    gap: 8,
  },

  headerGhostButton: {
    background: "white",
    border: "none",
    borderRadius: 6,
    padding: "6px 10px",
    cursor: "pointer",
  },

  headerDuoButton: {
    background: "#2563EB",
    color: "white",
    border: "none",
    borderRadius: 6,
    padding: "6px 12px",
    cursor: "pointer",
  },

  headerCrisisButton: {
    background: "#DC2626",
    color: "white",
    border: "none",
    borderRadius: 6,
    padding: "6px 12px",
    cursor: "pointer",
  },

  burgerButton: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },

  burgerLine: {
    width: 18,
    height: 2,
    background: "white",
  },

  patientRibbon: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    background: "white",
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
    alignItems: "flex-start",
  },

  patientIdentity: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flex: 1,
  },

  patientName: {
    fontSize: 24,
    fontWeight: 800,
  },

  patientMetaLine: {
    fontSize: 13,
    color: "#475569",
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },

  patientMetrics: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(100px, auto))",
    gap: 10,
    alignItems: "stretch",
  },

  statusPill: {
    padding: "8px 10px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center",
    minWidth: 96,
  },

  metricCell: {
    textAlign: "center",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    padding: "8px 10px",
    minWidth: 96,
  },

  metricCellLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 4,
  },

  metricCellValue: {
    fontSize: 20,
    fontWeight: 800,
  },

  scoreCard: {
    gridColumn: "span 2",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    padding: 10,
    minWidth: 220,
  },

  scoreTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  scoreLabel: {
    fontSize: 11,
    color: "#64748B",
    textTransform: "uppercase",
    fontWeight: 700,
  },

  scoreValue: {
    fontSize: 22,
    fontWeight: 800,
    color: "#0F172A",
  },

  scoreBarTrack: {
    width: "100%",
    height: 8,
    background: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
  },

  scoreBarFill: {
    height: "100%",
    borderRadius: 999,
  },

  scoreBottom: {
    marginTop: 8,
    display: "flex",
    justifyContent: "flex-end",
  },

  scoreBadge: {
    fontSize: 11,
    fontWeight: 800,
    border: "1px solid",
    borderRadius: 999,
    padding: "4px 8px",
  },

  alertBanner: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },

  alertTitle: {
    fontWeight: 700,
    color: "#DC2626",
  },

  alertText: {
    fontSize: 13,
  },

  topRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 14,
    marginBottom: 14,
  },

  middleRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 14,
    marginBottom: 14,
  },

  bottomRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },

  card: {
    background: "white",
    borderRadius: 10,
    padding: 14,
  },

  cardTitle: {
    fontWeight: 700,
    fontSize: 22,
  },

  cardSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },

  situationLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr",
    gap: 12,
  },

  primaryBlock: {
    background: "#F8FAFC",
    padding: 14,
    borderRadius: 10,
    border: "1px solid #E2E8F0",
  },

  primaryBlockLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 6,
    textTransform: "uppercase",
    fontWeight: 700,
  },

  primaryBlockValue: {
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1.15,
    marginBottom: 8,
  },

  primaryBlockHint: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 1.4,
  },

  freinsInsightBox: {
    marginTop: 12,
    background: "white",
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    padding: 10,
  },

  freinsInsightRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },

  freinsInsightKey: {
    fontSize: 12,
    color: "#64748B",
  },

  freinsInsightValue: {
    fontSize: 12,
    color: "#0F172A",
    fontWeight: 700,
    textAlign: "right",
  },

  planBoard: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },

  planRow: {
    display: "flex",
    flexDirection: "column",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    padding: 8,
  },

  planRowWide: {
    gridColumn: "1 / 3",
  },

  planRowLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 4,
    textTransform: "uppercase",
    fontWeight: 700,
  },

  planRowInput: {
    border: "1px solid #CBD5F5",
    borderRadius: 6,
    padding: "6px 8px",
    background: "white",
  },

  situationFooter: {
    marginTop: 10,
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },

  integrateButton: {
    background: "#2563EB",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    fontWeight: 700,
  },

  toggleInline: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    padding: "8px 10px",
  },

  toggleInlineLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: 700,
  },

  checkboxWrap: {
    display: "flex",
    gap: 4,
    alignItems: "center",
  },

  activeNoteCard: {
    background: "#FFF7ED",
    border: "1px solid #FED7AA",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

  activeNoteTop: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginBottom: 8,
  },

  postItBadge: {
    fontSize: 11,
    fontWeight: 800,
    background: "#F59E0B",
    color: "white",
    borderRadius: 999,
    padding: "4px 8px",
  },

  activeNoteType: {
    fontSize: 12,
    fontWeight: 700,
    color: "#92400E",
  },

  activeNoteText: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0F172A",
  },

  activeNoteMeta: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748B",
  },

  quickActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 12,
  },

  actionButton: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #CBD5F5",
    background: "#EFF6FF",
    color: "#1D4ED8",
    fontWeight: 700,
    fontSize: 12,
  },

  noteComposer: {
    marginTop: 12,
  },

  noteTypePills: {
    display: "flex",
    gap: 6,
    marginBottom: 6,
    flexWrap: "wrap",
  },

  noteTypePill: {
    border: "1px solid #CBD5F5",
    background: "white",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 12,
    cursor: "pointer",
  },

  textarea: {
    width: "100%",
    minHeight: 60,
    borderRadius: 6,
    border: "1px solid #CBD5F5",
    padding: 6,
    boxSizing: "border-box",
  },

  noteActions: {
    display: "flex",
    gap: 8,
    marginTop: 6,
  },

  primaryButton: {
    background: "#2563EB",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
  },

  secondaryButton: {
    border: "1px solid #CBD5F5",
    background: "white",
    padding: "6px 10px",
    borderRadius: 6,
  },

  tagsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },

  freinTag: {
    display: "flex",
    gap: 6,
    alignItems: "center",
    background: "#F1F5F9",
    padding: "6px 8px",
    borderRadius: 8,
    border: "1px solid #E2E8F0",
    cursor: "pointer",
  },

  freinTagActive: {
    background: "#EFF6FF",
    border: "1px solid #93C5FD",
    color: "#1D4ED8",
  },

  freinDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#DC2626",
  },

  activeFreinFooter: {
    marginTop: 10,
    padding: 10,
    background: "#F8FAFC",
    borderRadius: 8,
    border: "1px solid #E2E8F0",
  },

  activeFreinFooterTitle: {
    fontSize: 11,
    color: "#64748B",
    textTransform: "uppercase",
    fontWeight: 700,
    marginBottom: 4,
  },

  activeFreinFooterText: {
    fontSize: 13,
    fontWeight: 700,
  },

  addRow: {
    display: "flex",
    gap: 6,
    marginTop: 8,
  },

  addInput: {
    flex: 1,
    border: "1px solid #CBD5F5",
    borderRadius: 6,
    padding: 6,
  },

  addMiniButton: {
    border: "none",
    background: "#2563EB",
    color: "white",
    padding: "4px 10px",
    borderRadius: 6,
  },

  actorList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  actorRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "8px 0",
    borderBottom: "1px solid #F1F5F9",
  },

  actorRole: {
    color: "#64748B",
    fontSize: 13,
  },

  actorName: {
    fontWeight: 700,
    fontSize: 13,
    textAlign: "right",
  },

  summaryBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 13,
  },

  summaryHighlight: {
    background: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #E2E8F0",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  riskHigh: {
    color: "#DC2626",
  },

  suggestionButton: {
    marginTop: 6,
    border: "none",
    background: "#1E3A8A",
    color: "white",
    borderRadius: 6,
    padding: "8px 10px",
    fontWeight: 700,
  },

  contactGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
  },

  contactCard: {
    background: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #E2E8F0",
  },

  contactTitle: {
    fontSize: 12,
    color: "#64748B",
  },

  contactName: {
    fontWeight: 700,
    fontSize: 13,
  },

  contactRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 4,
    gap: 8,
  },

  contactPhoneLink: {
    color: "#2563EB",
    fontSize: 13,
  },

  contactPhoneMuted: {
    color: "#94A3B8",
    fontSize: 13,
  },

  copyButton: {
    fontSize: 11,
    border: "none",
    background: "#E2E8F0",
    borderRadius: 4,
    padding: "2px 6px",
  },

  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  timelineItem: {
    display: "flex",
    gap: 8,
    border: "none",
    background: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    textAlign: "left",
    borderLeft: "4px solid transparent",
  },

  timelineUnread: {
    borderLeft: "4px solid #2563EB",
  },

  timelineUrgent: {
    background: "#FEF2F2",
  },

  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    marginTop: 6,
    flexShrink: 0,
  },

  timelineContent: {
    flex: 1,
  },

  timelineTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },

  timelineDate: {
    fontSize: 11,
    color: "#64748B",
  },

  timelineBadges: {
    display: "flex",
    gap: 4,
    flexWrap: "wrap",
  },

  noteTypeBadge: {
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 11,
  },

  unreadBadge: {
    fontSize: 10,
    background: "#DC2626",
    color: "white",
    padding: "2px 4px",
    borderRadius: 4,
  },

  priorityBadge: {
    fontSize: 10,
    background: "#7C3AED",
    color: "white",
    padding: "2px 4px",
    borderRadius: 4,
  },

  timelineText: {
    fontSize: 13,
    marginTop: 4,
  },
};

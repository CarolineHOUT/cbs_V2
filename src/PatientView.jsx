import { useMemo, useState } from "react";

export default function PatientCockpitV51({
  patient,
  onBack,
  onOpenDuo,
  onTriggerCrisis,
}) {
  const [editablePatient, setEditablePatient] = useState({
    ...patient,
    notes: normalizeNotes(patient?.notes || []),
    destinationPrevue: patient?.destinationPrevue || "EHPAD",
    dateCible: normalizeDateForInput(patient?.dateCible) || todayIso(),
    transport: patient?.transport || "À organiser",
    nextStep: patient?.nextStep || "Relancer admissions EHPAD",
  });

  const [newNote, setNewNote] = useState("");
  const [newNoteType, setNewNoteType] = useState("info");

  const stayDays = computeStayDays(editablePatient.entryDate);

  const criticity = useMemo(() => {
    if (
      editablePatient.sortantMedicalement &&
      ((editablePatient.score || 0) >= 8 ||
        (editablePatient.joursEvitables || 0) >= 5)
    ) {
      return "critique";
    }
    if ((editablePatient.score || 0) >= 6) return "risque";
    return "suivi";
  }, [
    editablePatient.sortantMedicalement,
    editablePatient.score,
    editablePatient.joursEvitables,
  ]);

  const canTriggerCrisis =
    editablePatient.sortantMedicalement &&
    ((editablePatient.score || 0) >= 8 ||
      (editablePatient.joursEvitables || 0) >= 5);

  const activeFrein = editablePatient.blocage || "Non renseigné";

  const unreadCount = editablePatient.notes.filter((n) => n.unread).length;
  const urgentCount = editablePatient.notes.filter((n) => n.type === "urgent").length;

  const sortedNotes = useMemo(() => {
    return [...editablePatient.notes].sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      if (a.unread !== b.unread) return a.unread ? -1 : 1;
      return 0;
    });
  }, [editablePatient.notes]);

  const activeNote = sortedNotes[0];

  const primaryAction = useMemo(() => {
    if (canTriggerCrisis) {
      return {
        title: "Escalader la situation en cellule de crise",
        owner: editablePatient.cadre || "Cadre",
        due: "Immédiat",
        tone: "critical",
      };
    }

    if (activeFrein === "Recherche EHPAD") {
      return {
        title: "Relancer admissions EHPAD",
        owner: editablePatient.assistanteSociale || "Assistante sociale",
        due: formatIsoToFr(editablePatient.dateCible) || "Aujourd’hui",
        tone: "high",
      };
    }

    if (activeFrein === "Recherche SSIAD") {
      return {
        title: "Confirmer la mise en place SSIAD",
        owner: editablePatient.assistanteSociale || "Assistante sociale",
        due: formatIsoToFr(editablePatient.dateCible) || "Aujourd’hui",
        tone: "high",
      };
    }

    return {
      title: editablePatient.nextStep || "Valider le plan de sortie",
      owner:
        editablePatient.assistanteSociale ||
        editablePatient.referentMedical ||
        "À préciser",
      due: formatIsoToFr(editablePatient.dateCible) || "À planifier",
      tone: "medium",
    };
  }, [
    canTriggerCrisis,
    activeFrein,
    editablePatient.assistanteSociale,
    editablePatient.cadre,
    editablePatient.referentMedical,
    editablePatient.dateCible,
    editablePatient.nextStep,
  ]);

  const urgencyLine = useMemo(() => {
    const levelLabel =
      criticity === "critique"
        ? "Critique"
        : criticity === "risque"
          ? "Risque"
          : "Suivi";

    const sortant = editablePatient.sortantMedicalement
      ? "Sortant médical"
      : "Non sortant";

    return `${levelLabel} • ${sortant} • ${activeFrein} • ${
      editablePatient.joursEvitables || 0
    } j évitables • ${primaryAction.title}`;
  }, [
    criticity,
    editablePatient.sortantMedicalement,
    editablePatient.joursEvitables,
    activeFrein,
    primaryAction.title,
  ]);

  function updateField(field, value) {
    setEditablePatient((prev) => ({ ...prev, [field]: value }));
  }

  function addNote() {
    const value = newNote.trim();
    if (!value) return;

    const note = {
      id: safeId(),
      text: value,
      type: newNoteType,
      unread: true,
      timestamp: buildTimestamp(),
      priority: notePriorityFromType(newNoteType),
    };

    setEditablePatient((prev) => ({
      ...prev,
      notes: [note, ...prev.notes],
    }));

    setNewNote("");
    setNewNoteType("info");
  }

  function quickAction(text, type = "action") {
    const note = {
      id: safeId(),
      text,
      type,
      unread: true,
      timestamp: buildTimestamp(),
      priority: notePriorityFromType(type),
    };

    setEditablePatient((prev) => ({
      ...prev,
      notes: [note, ...prev.notes],
    }));
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.appTitle}>CARABBAS</div>
          <div style={styles.appSubtitle}>Patient 360 — pilotage sortie complexe</div>
        </div>

        <div style={styles.headerActions}>
          {onBack ? (
            <button style={styles.headerGhostButton} onClick={onBack}>
              Retour
            </button>
          ) : null}

          <button
            style={styles.headerDuoButton}
            onClick={() =>
              onOpenDuo
                ? onOpenDuo(editablePatient)
                : quickAction("Ouverture vue DUO demandée", "action")
            }
          >
            Vue DUO
          </button>
        </div>
      </header>

      <section style={styles.identityBar}>
        <div style={styles.identityTop}>
          <div style={styles.patientName}>
            {editablePatient.nom} {editablePatient.prenom}
          </div>

          <div style={styles.identityRight}>
            <StatusBadge level={criticity} />
            {canTriggerCrisis ? (
              <button
                style={styles.crisisInlineButton}
                onClick={() =>
                  onTriggerCrisis
                    ? onTriggerCrisis(editablePatient)
                    : quickAction("Déclenchement cellule de crise demandé", "urgent")
                }
              >
                ⚡ Cellule de crise
              </button>
            ) : null}
          </div>
        </div>

        <div style={styles.identityMeta}>
          {editablePatient.age} ans • {editablePatient.service} • Chambre{" "}
          {editablePatient.chambre} • Entrée {editablePatient.entryDate} • {stayDays} jours
        </div>

        <div style={styles.kpiRow}>
          <KpiPill
            label="Sortant méd."
            value={editablePatient.sortantMedicalement ? "Oui" : "Non"}
          />
          <KpiPill
            label="J évitables"
            value={editablePatient.joursEvitables || 0}
            accent="amber"
          />
          <KpiPill
            label="Notes"
            value={unreadCount}
            accent={unreadCount ? "red" : "neutral"}
          />
          <KpiPill
            label="Urgentes"
            value={urgentCount}
            accent={urgentCount ? "red" : "neutral"}
          />
        </div>
      </section>

      <section
        style={{
          ...styles.urgencyLine,
          ...(criticity === "critique"
            ? styles.urgencyCritical
            : criticity === "risque"
              ? styles.urgencyWarning
              : styles.urgencyNormal),
        }}
      >
        <span style={styles.urgencyIcon}>
          {criticity === "critique" ? "🔴" : criticity === "risque" ? "🟠" : "🟢"}
        </span>
        <span style={styles.urgencyText}>{urgencyLine}</span>
      </section>

      <section style={styles.centerGrid}>
        <section style={styles.card}>
          <div style={styles.cardLabel}>Frein principal</div>
          <div style={styles.mainAlertBlock}>
            <div style={styles.mainAlertTitle}>{activeFrein}</div>
            <div style={styles.mainAlertText}>{buildFreinImpact(activeFrein)}</div>
          </div>

          <div style={styles.metaBox}>
            <span style={styles.metaBoxLabel}>Action associée</span>
            <strong>{primaryAction.title}</strong>
          </div>
        </section>

        <section
          style={{
            ...styles.card,
            ...(primaryAction.tone === "critical"
              ? styles.priorityCritical
              : primaryAction.tone === "high"
                ? styles.priorityHigh
                : styles.priorityMedium),
          }}
        >
          <div style={styles.cardLabel}>Action prioritaire</div>
          <div style={styles.cardTitle}>{primaryAction.title}</div>

          <div style={styles.metaBox}>
            <div>
              Responsable : <strong>{primaryAction.owner}</strong>
            </div>
            <div>
              Échéance : <strong>{primaryAction.due}</strong>
            </div>
          </div>

          <div style={styles.actionButtons}>
            <button
              style={styles.primaryButton}
              onClick={() => quickAction(`Action validée : ${primaryAction.title}`, "action")}
            >
              Valider
            </button>
            <button
              style={styles.secondaryButton}
              onClick={() => quickAction(`Assignation confirmée : ${primaryAction.owner}`, "action")}
            >
              Assigner
            </button>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.cardLabel}>Coordination</div>

          <div style={styles.postIt}>
            <div style={styles.postItTop}>
              <span style={styles.postItBadge}>POST-IT</span>
              <span style={styles.postItType}>{labelForType(activeNote?.type || "info")}</span>
            </div>

            <div style={styles.postItText}>
              {activeNote?.text || "Aucune note récente"}
            </div>

            <div style={styles.postItMeta}>
              {editablePatient.referentMedical || "Non renseigné"} • activité récente
            </div>
          </div>

          <div style={styles.quickActions}>
            <button
              style={styles.quickButton}
              onClick={() => quickAction("Assistante sociale contactée", "action")}
            >
              AS
            </button>
            <button
              style={styles.quickButton}
              onClick={() => quickAction("Sortie à programmer", "action")}
            >
              Sortie
            </button>
            <button
              style={styles.quickButton}
              onClick={() => quickAction("Réunion de coordination demandée", "action")}
            >
              Réunion
            </button>
            <button
              style={styles.quickButton}
              onClick={() => quickAction("Famille relancée", "famille")}
            >
              Famille
            </button>
          </div>

          <div style={styles.noteComposer}>
            <div style={styles.noteTypeRow}>
              {["info", "action", "famille", "urgent"].map((type) => (
                <button
                  key={type}
                  style={{
                    ...styles.noteTypePill,
                    ...(newNoteType === type ? activeNotePillStyle(type) : {}),
                  }}
                  onClick={() => setNewNoteType(type)}
                >
                  {labelForType(type)}
                </button>
              ))}
            </div>

            <div style={styles.noteInputRow}>
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Ajouter note..."
                style={styles.noteInput}
              />
              <button style={styles.noteAddButton} onClick={addNote}>
                +
              </button>
            </div>
          </div>
        </section>
      </section>

      <section style={styles.timelineSection}>
        <div style={styles.timelineTitle}>🧭 Parcours de sortie</div>

        <div style={styles.timelineGrid}>
          <TimelineStep
            state={editablePatient.destinationPrevue ? "done" : "todo"}
            title="Orientation"
            value={editablePatient.destinationPrevue || "À définir"}
          />

          <TimelineStep
            state={editablePatient.dateCible ? "done" : "todo"}
            title="Date cible"
            value={formatIsoToFr(editablePatient.dateCible) || "À définir"}
          />

          <TimelineStep
            state={
              editablePatient.transport &&
              editablePatient.transport !== "Aucun" &&
              editablePatient.transport !== "À organiser"
                ? "done"
                : "progress"
            }
            title="Transport"
            value={editablePatient.transport || "À organiser"}
          />

          <TimelineStep
            state="next"
            title="Prochaine étape"
            value={editablePatient.nextStep || "Validation sortie médicale"}
          />
        </div>
      </section>
    </div>
  );
}

function TimelineStep({ state, title, value }) {
  const icon =
    state === "done" ? "✓" : state === "progress" ? "●" : state === "next" ? "→" : "○";

  return (
    <div style={styles.timelineStep}>
      <div
        style={{
          ...styles.timelineIcon,
          ...(state === "done"
            ? styles.timelineDone
            : state === "progress"
              ? styles.timelineProgress
              : state === "next"
                ? styles.timelineNext
                : styles.timelineTodo),
        }}
      >
        {icon}
      </div>

      <div style={styles.timelineTextBlock}>
        <div style={styles.timelineStepTitle}>{title}</div>
        <div style={styles.timelineStepValue}>{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({ level }) {
  const config = {
    critique: {
      label: "Bloqué",
      bg: "#FEF2F2",
      color: "#DC2626",
    },
    risque: {
      label: "Risque",
      bg: "#FEF3C7",
      color: "#D97706",
    },
    suivi: {
      label: "Suivi",
      bg: "#D1FAE5",
      color: "#059669",
    },
  };

  const item = config[level] || config.suivi;

  return (
    <div
      style={{
        ...styles.statusBadge,
        background: item.bg,
        color: item.color,
      }}
    >
      {item.label}
    </div>
  );
}

function KpiPill({ label, value, accent = "neutral" }) {
  const colors = {
    neutral: "#0F172A",
    amber: "#D97706",
    red: "#DC2626",
  };

  return (
    <div style={styles.kpiPill}>
      <span style={styles.kpiLabel}>{label}</span>
      <strong style={{ color: colors[accent] || colors.neutral }}>{value}</strong>
    </div>
  );
}

function normalizeNotes(notes) {
  return notes.map((note) =>
    typeof note === "string"
      ? {
          id: safeId(),
          text: note,
          type: "info",
          unread: true,
          timestamp: buildTimestamp(),
          priority: 1,
        }
      : {
          ...note,
          unread: note.unread ?? true,
          priority: note.priority ?? notePriorityFromType(note.type || "info"),
          timestamp: note.timestamp || buildTimestamp(),
        }
  );
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

function safeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
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

function normalizeDateForInput(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parsed = parseFrenchDate(value);
  if (!parsed) return "";

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(
    parsed.getDate()
  ).padStart(2, "0")}`;
}

function formatIsoToFr(value) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function parseFrenchDate(value) {
  if (!value || typeof value !== "string") return null;
  const parts = value.split("/");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

function computeStayDays(dateString) {
  if (!dateString) return 0;

  const fr = parseFrenchDate(dateString);
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? new Date(`${dateString}T00:00:00`)
    : null;

  const date = fr || iso;
  if (!date || Number.isNaN(date.getTime())) return 0;

  const today = new Date();
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.floor((end - start) / 86400000));
}

function buildFreinImpact(frein) {
  const map = {
    "Recherche EHPAD": "Frein d’aval majeur retardant la sortie.",
    "Recherche SSIAD": "Retour domicile non sécurisé sans organisation de prise en charge.",
    "Recherche HAD": "La sortie dépend d’une coordination à domicile.",
    "Logement insalubre": "Le retour au domicile est impossible dans les conditions actuelles.",
  };

  return map[frein] || "Frein actif à suivre dans le parcours de sortie.";
}

const styles = {
  page: {
    height: "100vh",
    overflow: "hidden",
    background: "#F1F5F9",
    padding: 10,
    display: "grid",
    gridTemplateRows: "54px 108px 40px 1fr 118px",
    gap: 8,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
    color: "#0F172A",
  },

  header: {
    background: "#1E3A8A",
    borderRadius: 10,
    color: "white",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  appTitle: {
    fontSize: 17,
    fontWeight: 800,
    lineHeight: 1,
  },

  appSubtitle: {
    fontSize: 11,
    opacity: 0.85,
    marginTop: 4,
  },

  headerActions: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },

  headerGhostButton: {
    background: "white",
    border: "none",
    borderRadius: 8,
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 12,
  },

  headerDuoButton: {
    background: "#2563EB",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 12,
  },

  identityBar: {
    background: "white",
    borderRadius: 10,
    padding: "10px 12px",
    display: "grid",
    gap: 8,
    overflow: "hidden",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
  },

  identityTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  patientName: {
    fontSize: 24,
    fontWeight: 800,
    lineHeight: 1.05,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  identityRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },

  statusBadge: {
    padding: "7px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  crisisInlineButton: {
    background: "#FFF7ED",
    border: "1px solid #FED7AA",
    color: "#C2410C",
    borderRadius: 999,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  identityMeta: {
    fontSize: 12,
    color: "#64748B",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  kpiRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },

  kpiPill: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: 999,
    padding: "6px 10px",
    whiteSpace: "nowrap",
    fontSize: 12,
  },

  kpiLabel: {
    color: "#64748B",
    fontWeight: 700,
  },

  urgencyLine: {
    borderRadius: 10,
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
    border: "1px solid",
  },

  urgencyCritical: {
    background: "#FEF2F2",
    borderColor: "#FECACA",
    color: "#991B1B",
  },

  urgencyWarning: {
    background: "#FFFBEB",
    borderColor: "#FDE68A",
    color: "#92400E",
  },

  urgencyNormal: {
    background: "#ECFDF5",
    borderColor: "#A7F3D0",
    color: "#065F46",
  },

  urgencyIcon: {
    flexShrink: 0,
    fontSize: 14,
  },

  urgencyText: {
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  centerGrid: {
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1.05fr",
    gap: 8,
    overflow: "hidden",
  },

  card: {
    background: "white",
    borderRadius: 10,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 0,
    overflow: "hidden",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
  },

  cardLabel: {
    fontSize: 11,
    color: "#64748B",
    textTransform: "uppercase",
    fontWeight: 800,
    letterSpacing: 0.2,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1.1,
  },

  mainAlertBlock: {
    background: "linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%)",
    border: "1px solid #DBEAFE",
    borderRadius: 10,
    padding: 12,
    display: "grid",
    gap: 6,
  },

  mainAlertTitle: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1.05,
    color: "#0F172A",
  },

  mainAlertText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 1.35,
  },

  metaBox: {
    display: "grid",
    gap: 6,
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: "#334155",
  },

  metaBoxLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#64748B",
    fontWeight: 700,
  },

  priorityCritical: {
    borderTop: "4px solid #DC2626",
  },

  priorityHigh: {
    borderTop: "4px solid #EA580C",
  },

  priorityMedium: {
    borderTop: "4px solid #2563EB",
  },

  actionButtons: {
    display: "flex",
    gap: 8,
    marginTop: "auto",
  },

  primaryButton: {
    flex: 1,
    background: "#2563EB",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "10px 12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  secondaryButton: {
    flex: 1,
    background: "white",
    color: "#0F172A",
    border: "1px solid #CBD5E1",
    borderRadius: 8,
    padding: "10px 12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  postIt: {
    background: "#FFFDF5",
    border: "1px solid #FDE7A8",
    borderRadius: 10,
    padding: 10,
    display: "grid",
    gap: 6,
  },

  postItTop: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  postItBadge: {
    fontSize: 10,
    fontWeight: 800,
    color: "#92400E",
    background: "#FEF3C7",
    borderRadius: 999,
    padding: "4px 8px",
  },

  postItType: {
    fontSize: 11,
    fontWeight: 700,
    color: "#A16207",
  },

  postItText: {
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.35,
    color: "#7C2D12",
  },

  postItMeta: {
    fontSize: 11,
    color: "#92400E",
    opacity: 0.8,
  },

  quickActions: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 6,
  },

  quickButton: {
    border: "1px solid #CBD5E1",
    background: "#EFF6FF",
    color: "#1D4ED8",
    borderRadius: 8,
    padding: "8px 6px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },

  noteComposer: {
    marginTop: "auto",
    display: "grid",
    gap: 8,
  },

  noteTypeRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },

  noteTypePill: {
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 11,
    cursor: "pointer",
  },

  noteInputRow: {
    display: "flex",
    gap: 8,
  },

  noteInput: {
    flex: 1,
    border: "1px solid #CBD5E1",
    borderRadius: 8,
    padding: "9px 10px",
    fontSize: 13,
    minWidth: 0,
  },

  noteAddButton: {
    width: 40,
    border: "none",
    background: "#2563EB",
    color: "white",
    borderRadius: 8,
    fontWeight: 800,
    fontSize: 18,
    cursor: "pointer",
  },

  timelineSection: {
    background: "white",
    borderRadius: 10,
    padding: "10px 12px",
    display: "grid",
    gap: 10,
    overflow: "hidden",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
  },

  timelineTitle: {
    fontSize: 12,
    fontWeight: 800,
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },

  timelineGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
    alignItems: "center",
  },

  timelineStep: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    minWidth: 0,
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: 10,
    padding: "8px 10px",
  },

  timelineIcon: {
    width: 24,
    height: 24,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    fontSize: 12,
    fontWeight: 800,
    flexShrink: 0,
  },

  timelineDone: {
    background: "#ECFDF5",
    color: "#059669",
    border: "1px solid #A7F3D0",
  },

  timelineProgress: {
    background: "#FFFBEB",
    color: "#D97706",
    border: "1px solid #FDE68A",
  },

  timelineNext: {
    background: "#EFF6FF",
    color: "#1D4ED8",
    border: "1px solid #BFDBFE",
  },

  timelineTodo: {
    background: "#F1F5F9",
    color: "#64748B",
    border: "1px solid #CBD5E1",
  },

  timelineTextBlock: {
    minWidth: 0,
  },

  timelineStepTitle: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 2,
  },

  timelineStepValue: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0F172A",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};

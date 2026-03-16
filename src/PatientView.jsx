import { useEffect, useMemo, useRef, useState } from "react";

const RAIL_PANELS = {
contacts: "contacts",
acteurs: "acteurs",
synthese: "synthese",
historique: "historique",
};

const ORIENTATION_OPTIONS = [
"Domicile",
"EHPAD",
"SSIAD",
"HAD",
"SSR",
"USLD",
"Autre",
];

const TRANSPORT_OPTIONS = [
"Aucun",
"VSL",
"Ambulance",
"Taxi",
"Famille",
"Transport sanitaire à organiser",
];

const DOC_STATUS_OPTIONS = ["pret", "en_cours", "a_faire", "non_concerne"];

export default function PatientViewCockpitV4({
patient,
onBack,
onOpenDuo,
onTriggerCrisis,
}) {
const [editablePatient, setEditablePatient] = useState({
...patient,
notes: normalizeNotes(patient?.notes || []),
documentsSortie: normalizeDocuments(patient?.documentsSortie),
freins: patient?.freins || buildFreinsFromPatient(patient || {}),
destinationPrevue: normalizeOrientation(patient?.destinationPrevue),
transport: normalizeTransport(patient?.transport),
dateCible: normalizeDateForInput(patient?.dateCible) || todayIso(),
actions:
patient?.actions || [
{
id: "a1",
echeance: "2026-03-16",
action: "Évaluation sociale",
responsable: patient?.assistanteSociale || "Assistante sociale",
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
const [copiedPhone, setCopiedPhone] = useState("");
const [activeFrein, setActiveFrein] = useState(
patient?.blocage || buildFreinsFromPatient(patient || {})[0] || ""
);

const [hoveredPanel, setHoveredPanel] = useState(null);
const [pinnedPanel, setPinnedPanel] = useState(null);

const hoverOpenTimer = useRef(null);
const hoverCloseTimer = useRef(null);

const visiblePanel = pinnedPanel || hoveredPanel;
const railExpanded = Boolean(visiblePanel);

useEffect(() => {
return () => {
clearTimeout(hoverOpenTimer.current);
clearTimeout(hoverCloseTimer.current);
};
}, []);

const stayDays = computeStayDays(editablePatient.entryDate);

const status = useMemo(() => {
if ((editablePatient.score || 0) >= 8) return { label: "Bloqué", tone: "red" };
if ((editablePatient.score || 0) >= 6) return { label: "Risque", tone: "amber" };
return { label: "Suivi", tone: "green" };
}, [editablePatient.score]);

const scoreParcours = useMemo(() => {
const base = (editablePatient.score || 0) * 18;
const days = (editablePatient.joursEvitables || 0) * 6;
const freins = (editablePatient.freins || []).length * 8;
const docsPenalty = countPendingDocuments(editablePatient.documentsSortie) * 5;
return base + days + freins + docsPenalty;
}, [
editablePatient.score,
editablePatient.joursEvitables,
editablePatient.freins,
editablePatient.documentsSortie,
]);

const scoreVisual = getScoreVisual(scoreParcours);

const unreadCount = editablePatient.notes.filter((n) => n.unread).length;
const urgentCount = editablePatient.notes.filter((n) => n.type === "urgent").length;
const pendingDocsCount = countPendingDocuments(editablePatient.documentsSortie);

const sortedNotes = useMemo(() => {
return [...editablePatient.notes].sort((a, b) => {
const priorityDiff = (b.priority || 0) - (a.priority || 0);
if (priorityDiff !== 0) return priorityDiff;
if (a.unread !== b.unread) return a.unread ? -1 : 1;
return 0;
});
}, [editablePatient.notes]);

const miniHistory = useMemo(() => buildMiniHistory(editablePatient.notes), [
editablePatient.notes,
]);

const activeNote = sortedNotes[0];
const postItTheme = getPostItTheme(activeNote?.type || "info");
const freinInsight = getFreinInsight(activeFrein, editablePatient);

const primaryAction = useMemo(() => {
const docs = editablePatient.documentsSortie || {};
const pendingDocs = Object.entries(docs)
.filter(([, status]) => status === "a_faire" || status === "en_cours")
.map(([key]) => documentKeyLabel(key));

const hasCriticalBlockage =
editablePatient.sortantMedicalement &&
((editablePatient.score || 0) >= 8 || (editablePatient.joursEvitables || 0) >= 5);

if (hasCriticalBlockage) {
return {
title: "Escalader la situation en cellule de crise",
owner: editablePatient.cadre || "Cadre",
due: "Immédiat",
level: "critical",
};
}

if ((editablePatient.blocage || activeFrein) === "Recherche EHPAD") {
return {
title: "Relancer admissions EHPAD",
owner: editablePatient.assistanteSociale || "Assistante sociale",
due: formatIsoToFr(editablePatient.dateCible) || "Aujourd’hui",
level: "high",
};
}

if ((editablePatient.blocage || activeFrein) === "Recherche SSIAD") {
return {
title: "Confirmer la mise en place SSIAD",
owner: editablePatient.assistanteSociale || "Assistante sociale",
due: formatIsoToFr(editablePatient.dateCible) || "Aujourd’hui",
level: "high",
};
}

if (pendingDocs.length > 0) {
return {
title: `Finaliser : ${pendingDocs.join(", ")}`,
owner: editablePatient.referentMedical || "Médecin référent",
due: "Avant sortie",
level: "medium",
};
}

return {
title: editablePatient.nextStep || "Valider le plan de sortie",
owner:
editablePatient.assistanteSociale ||
editablePatient.referentMedical ||
"À préciser",
due: formatIsoToFr(editablePatient.dateCible) || "À planifier",
level: "medium",
};
}, [editablePatient, activeFrein]);

const summaryText = buildSummaryTextV4(
editablePatient,
activeFrein,
stayDays,
primaryAction
);

const urgencyLine = useMemo(
() => buildUrgencyLine(editablePatient, activeFrein, primaryAction, pendingDocsCount),
[editablePatient, activeFrein, primaryAction, pendingDocsCount]
);

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
notes: [note, ...(prev.notes || [])],
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

async function copyPhone(label, phone) {
if (!phone || phone === "Non renseigné" || phone === "Non concerné") return;
try {
await navigator.clipboard.writeText(phone);
setCopiedPhone(label);
setTimeout(() => setCopiedPhone(""), 1200);
} catch {}
}

function openPanelOnHover(panel) {
clearTimeout(hoverCloseTimer.current);
if (pinnedPanel) return;
hoverOpenTimer.current = setTimeout(() => setHoveredPanel(panel), 120);
}

function closeHoverPanel() {
if (pinnedPanel) return;
clearTimeout(hoverOpenTimer.current);
hoverCloseTimer.current = setTimeout(() => setHoveredPanel(null), 180);
}

function togglePinnedPanel(panel) {
setPinnedPanel((current) => (current === panel ? null : panel));
setHoveredPanel(null);
}

return (
<div style={styles.shell}>
<aside
style={{
...styles.rail,
width: railExpanded ? 320 : 64,
}}
onMouseLeave={closeHoverPanel}
>
<div style={styles.railIcons}>
<RailButton
icon="👥"
label="Entourage"
active={visiblePanel === RAIL_PANELS.contacts}
onMouseEnter={() => openPanelOnHover(RAIL_PANELS.contacts)}
onClick={() => togglePinnedPanel(RAIL_PANELS.contacts)}
/>
<RailButton
icon="🧑"
label="Acteurs"
active={visiblePanel === RAIL_PANELS.acteurs}
onMouseEnter={() => openPanelOnHover(RAIL_PANELS.acteurs)}
onClick={() => togglePinnedPanel(RAIL_PANELS.acteurs)}
/>
<RailButton
icon="📝"
label="Synthèse"
active={visiblePanel === RAIL_PANELS.synthese}
onMouseEnter={() => openPanelOnHover(RAIL_PANELS.synthese)}
onClick={() => togglePinnedPanel(RAIL_PANELS.synthese)}
/>
<RailButton
icon="🕘"
label="Historique"
active={visiblePanel === RAIL_PANELS.historique}
onMouseEnter={() => openPanelOnHover(RAIL_PANELS.historique)}
onClick={() => togglePinnedPanel(RAIL_PANELS.historique)}
/>
</div>

{railExpanded ? (
<div
style={styles.railPanel}
onMouseEnter={() => clearTimeout(hoverCloseTimer.current)}
>
<div style={styles.railPanelHeader}>
<div style={styles.railPanelTitle}>
{visiblePanel === RAIL_PANELS.contacts && "Entourage / protection"}
{visiblePanel === RAIL_PANELS.acteurs && "Acteurs du parcours"}
{visiblePanel === RAIL_PANELS.synthese && "Synthèse décisionnelle"}
{visiblePanel === RAIL_PANELS.historique && "Historique"}
</div>

{pinnedPanel ? (
<button style={styles.railCloseButton} onClick={() => setPinnedPanel(null)}>
✕
</button>
) : null}
</div>

{visiblePanel === RAIL_PANELS.contacts ? (
<div style={styles.railContentStack}>
<CompactContactRow
title="Personne de confiance"
name={editablePatient.personneConfiance || "Non renseignée"}
phone={editablePatient.personneConfiancePhone || "Non renseigné"}
copied={copiedPhone === "confiance"}
onCopy={() =>
copyPhone("confiance", editablePatient.personneConfiancePhone || "")
}
/>
<CompactContactRow
title="Personne à prévenir"
name={editablePatient.personneAPrevenir || "Non renseignée"}
phone={editablePatient.personneAPrevenirPhone || "Non renseigné"}
copied={copiedPhone === "prevenir"}
onCopy={() =>
copyPhone("prevenir", editablePatient.personneAPrevenirPhone || "")
}
/>
<CompactContactRow
title="Tutelle / curatelle"
name={editablePatient.protectionJuridique || "Non renseignée"}
phone={editablePatient.protectionJuridiquePhone || "Non renseigné"}
copied={copiedPhone === "protection"}
onCopy={() =>
copyPhone("protection", editablePatient.protectionJuridiquePhone || "")
}
/>
</div>
) : null}

{visiblePanel === RAIL_PANELS.acteurs ? (
<div style={styles.railContentStack}>
{editablePatient.acteurs.map((acteur) => (
<div key={acteur.id} style={styles.compactActorRow}>
<div style={styles.compactActorRole}>{acteur.role}</div>
<div
style={{
...styles.compactActorName,
color: acteur.nom === "À désigner" ? "#FCA5A5" : "#FFFFFF",
}}
>
{acteur.nom}
</div>
</div>
))}
</div>
) : null}

{visiblePanel === RAIL_PANELS.synthese ? (
<div style={styles.railContentStack}>
<div style={styles.summaryNarrative}>{summaryText}</div>
<div style={styles.summaryPriorityBox}>
<div style={styles.summaryPriorityLabel}>Priorité du jour</div>
<strong>{primaryAction.title}</strong>
</div>
<button
style={styles.suggestionButton}
onClick={() => quickAction("Suggestion CARABBAS générée", "info")}
>
Suggestion CARABBAS
</button>
</div>
) : null}

{visiblePanel === RAIL_PANELS.historique ? (
<div style={styles.railContentStack}>
{miniHistory.map((note) => (
<button
key={note.id}
style={{
...styles.miniHistoryRow,
...(note.unread ? styles.miniHistoryUnread : {}),
}}
onClick={() => markAsRead(note.id)}
>
<div style={styles.miniHistoryTop}>
<span style={styles.miniHistoryTime}>{note.timestamp}</span>
<NoteTypeBadge type={note.type} />
</div>
<div style={styles.miniHistoryText}>{note.text}</div>
</button>
))}
</div>
) : null}
</div>
) : null}
</aside>

<main style={styles.main}>
<header style={styles.topbar}>
<div>
<div style={styles.appTitle}>CARABBAS</div>
<div style={styles.appSubtitle}>Patient 360 — pilotage sortie complexe</div>
</div>

<div style={styles.topbarActions}>
<button onClick={onBack} style={styles.headerGhostButton}>
Retour
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

<section style={styles.identityBar}>
<div style={styles.identityTop}>
<div style={styles.patientName}>
{editablePatient.nom} {editablePatient.prenom}
</div>
<StatusPill label={status.label} tone={status.tone} />
</div>

<div style={styles.identityMeta}>
{editablePatient.age} ans • {editablePatient.service} • Chambre{" "}
{editablePatient.chambre} • Lit {editablePatient.lit} • Entrée{" "}
{editablePatient.entryDate} • {stayDays} jours • INS {editablePatient.ins} • IEP{" "}
{editablePatient.iep}
</div>

<div style={styles.kpiInlineRow}>
<MiniKpi
label="Sortant méd."
value={editablePatient.sortantMedicalement ? "Oui" : "Non"}
/>
<MiniKpi
label="J évitables"
value={editablePatient.joursEvitables || 0}
accent="amber"
/>
<MiniKpi
label="Notes"
value={unreadCount}
accent={unreadCount ? "red" : "neutral"}
/>
<MiniKpi
label="Urgentes"
value={urgentCount}
accent={urgentCount ? "red" : "neutral"}
/>
<MiniKpi
label="Docs en attente"
value={pendingDocsCount}
accent={pendingDocsCount ? "amber" : "neutral"}
/>
<div style={styles.scoreInline}>
<span style={styles.scoreInlineLabel}>Score</span>
<strong>{scoreParcours}</strong>
<div style={styles.scoreInlineBar}>
<div
style={{
...styles.scoreInlineFill,
width: `${scoreVisual.percent}%`,
background: scoreVisual.color,
}}
/>
</div>
<span
style={{
...styles.scoreInlineBadge,
color: scoreVisual.color,
background: scoreVisual.softBg,
borderColor: scoreVisual.softBorder,
}}
>
{scoreVisual.label}
</span>
</div>
</div>
</section>

<UrgencyLine level={urgencyLine.level} text={urgencyLine.text} />

<section style={styles.centerGrid}>
<section style={styles.coreCard}>
<div style={styles.coreLabel}>Frein principal</div>
<div style={styles.coreTitle}>
{activeFrein || editablePatient.blocage || "Non renseigné"}
</div>
<div style={styles.coreText}>{freinInsight.impact}</div>

<div style={styles.metaBlock}>
<div>
<span style={styles.metaBlockLabel}>Action associée</span>
<strong>{freinInsight.action}</strong>
</div>
<div>
<span style={styles.metaBlockLabel}>Acteur concerné</span>
<strong>{freinInsight.actor}</strong>
</div>
</div>

<div style={styles.freinsChipsRow}>
{(editablePatient.freins || []).slice(0, 4).map((frein, idx) => (
<button
key={`${frein}-${idx}`}
style={{
...styles.freinChip,
...(activeFrein === frein ? styles.freinChipActive : {}),
}}
onClick={() => setActiveFrein(frein)}
>
{frein}
</button>
))}
</div>
</section>

<section
style={{
...styles.coreCard,
borderTop:
primaryAction.level === "critical"
? "4px solid #DC2626"
: primaryAction.level === "high"
? "4px solid #EA580C"
: "4px solid #2563EB",
}}
>
<div style={styles.coreLabel}>Action prioritaire</div>
<div style={styles.coreTitle}>{primaryAction.title}</div>

<div style={styles.actionPriorityMeta}>
<span>
Responsable : <strong>{primaryAction.owner}</strong>
</span>
<span>
Échéance : <strong>{primaryAction.due}</strong>
</span>
</div>

<div style={styles.actionPriorityButtons}>
<button
style={styles.primaryActionButton}
onClick={() => quickAction(`Action validée : ${primaryAction.title}`, "action")}
>
Valider
</button>
<button
style={styles.secondaryActionButton}
onClick={() =>
quickAction(`Assignation confirmée : ${primaryAction.owner}`, "action")
}
>
Assigner
</button>
</div>
</section>

<section style={styles.coreCard}>
<div
style={{
...styles.activeNoteCard,
background: postItTheme.bg,
borderColor: postItTheme.border,
}}
>
<div style={styles.activeNoteTop}>
<span
style={{
...styles.postItBadge,
background: postItTheme.badgeBg,
color: postItTheme.badgeColor,
}}
>
POST-IT
</span>
<span style={{ ...styles.activeNoteType, color: postItTheme.badgeColor }}>
{labelForType(activeNote?.type || "info")}
</span>
</div>

<div style={styles.activeNoteText}>
{activeNote?.text || "Aucune note récente."}
</div>

<div style={styles.activeNoteMeta}>
{editablePatient.referentMedical || "Non renseigné"} • activité récente
</div>
</div>

<div style={styles.quickActionsCompact}>
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

<div style={styles.addNoteInline}>
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

<div style={styles.noteInlineRow}>
<input
value={newNote}
onChange={(e) => setNewNote(e.target.value)}
placeholder="Ajouter une note rapide..."
style={styles.noteInlineInput}
/>
<button style={styles.noteInlineButton} onClick={addNote}>
+
</button>
</div>
</div>
</section>
</section>

<section style={styles.planStrip}>
<SelectField
label="Orientation"
value={editablePatient.destinationPrevue}
options={ORIENTATION_OPTIONS}
onChange={(value) => updateField("destinationPrevue", value)}
/>

<DateField
label="Date cible"
value={editablePatient.dateCible}
onChange={(value) => updateField("dateCible", value)}
/>

<SelectField
label="Transport"
value={editablePatient.transport}
options={TRANSPORT_OPTIONS}
onChange={(value) => updateField("transport", value)}
/>

<div style={styles.planFieldWide}>
<div style={styles.planFieldLabel}>Documents</div>
<DocumentStatusGroup
value={editablePatient.documentsSortie}
onChange={(value) => updateField("documentsSortie", value)}
/>
</div>

<TextField
label="Prochaine étape"
value={editablePatient.nextStep || "Validation sortie médicale"}
onChange={(value) => updateField("nextStep", value)}
strong
/>
</section>
</main>
</div>
);
}

function RailButton({ icon, label, active, onMouseEnter, onClick }) {
return (
<button
type="button"
onMouseEnter={onMouseEnter}
onClick={onClick}
title={label}
style={{
...styles.railIconButton,
...(active ? styles.railIconButtonActive : {}),
}}
>
<span style={styles.railIcon}>{icon}</span>
</button>
);
}

function CompactContactRow({ title, name, phone, onCopy, copied }) {
const canCall = phone && phone !== "Non renseigné" && phone !== "Non concerné";
const telHref = canCall ? `tel:${phone}` : undefined;

return (
<div style={styles.compactContactRow}>
<div style={styles.compactContactTitle}>{title}</div>
<div style={styles.compactContactName}>{name}</div>
<div style={styles.compactContactActions}>
{canCall ? (
<a href={telHref} style={styles.compactContactPhone}>
{phone}
</a>
) : (
<span style={styles.compactContactMuted}>{phone}</span>
)}
<button style={styles.compactCopyButton} onClick={onCopy}>
{copied ? "Copié" : "Copier"}
</button>
</div>
</div>
);
}

function SelectField({ label, value, options, onChange }) {
return (
<div style={styles.planField}>
<div style={styles.planFieldLabel}>{label}</div>
<select
value={value || ""}
onChange={(e) => onChange(e.target.value)}
style={styles.planFieldInput}
>
{options.map((option) => (
<option key={option} value={option}>
{option}
</option>
))}
</select>
</div>
);
}

function DateField({ label, value, onChange }) {
return (
<div style={styles.planField}>
<div style={styles.planFieldLabel}>{label}</div>
<input
type="date"
value={value || ""}
onChange={(e) => onChange(e.target.value)}
style={styles.planFieldInput}
/>
</div>
);
}

function TextField({ label, value, onChange, strong = false }) {
return (
<div style={styles.planField}>
<div style={styles.planFieldLabel}>{label}</div>
<input
value={value}
onChange={(e) => onChange(e.target.value)}
style={{
...styles.planFieldInput,
fontWeight: strong ? 700 : 500,
}}
/>
</div>
);
}

function DocumentStatusGroup({ value, onChange }) {
const items = [
{ key: "crh", label: "CRH" },
{ key: "ordonnance", label: "Ordonnance" },
{ key: "transport", label: "Transport" },
{ key: "courrier", label: "Courrier" },
];

return (
<div style={styles.docGroup}>
{items.map((item) => (
<div key={item.key} style={styles.docItem}>
<div style={styles.docItemLabel}>{item.label}</div>
<div style={styles.docStatusRow}>
{DOC_STATUS_OPTIONS.map((status) => {
const tone = documentStatusTone(status);
const active = value?.[item.key] === status;

return (
<button
key={status}
type="button"
onClick={() =>
onChange({
...value,
[item.key]: status,
})
}
style={{
...styles.docStatusChip,
background: active ? tone.bg : "#F8FAFC",
color: active ? tone.color : "#64748B",
borderColor: active ? tone.border : "#E2E8F0",
}}
>
{documentStatusLabel(status)}
</button>
);
})}
</div>
</div>
))}
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

function MiniKpi({ label, value, accent = "neutral" }) {
const colors = {
neutral: "#0F172A",
amber: "#D97706",
red: "#DC2626",
};

return (
<div style={styles.miniKpi}>
<span style={styles.miniKpiLabel}>{label}</span>
<strong style={{ color: colors[accent] || colors.neutral }}>{value}</strong>
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

function UrgencyLine({ level, text }) {
const tones = {
normal: {
bg: "#ECFDF5",
border: "#A7F3D0",
color: "#065F46",
},
warning: {
bg: "#FFFBEB",
border: "#FDE68A",
color: "#92400E",
},
critical: {
bg: "#FEF2F2",
border: "#FECACA",
color: "#991B1B",
},
};

const tone = tones[level] || tones.normal;

return (
<section
style={{
...styles.urgencyLine,
background: tone.bg,
borderColor: tone.border,
color: tone.color,
}}
>
<span style={styles.urgencyDot}>
{level === "critical" ? "🔴" : level === "warning" ? "🟠" : "🟢"}
</span>
<span style={styles.urgencyText}>{text}</span>
</section>
);
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
const date = parseFrenchDate(dateString);
if (!date) return 0;
const today = new Date();
const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
return Math.max(0, Math.floor((end - start) / 86400000));
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
priority: note.priority ?? notePriorityFromType(note.type || "info"),
}
);
}

function normalizeDocuments(documents) {
const base = {
crh: "a_faire",
ordonnance: "a_faire",
transport: "a_faire",
courrier: "a_faire",
};
if (!documents || typeof documents !== "object") return base;
return { ...base, ...documents };
}

function documentStatusLabel(status) {
const map = {
pret: "Prêt",
a_faire: "À faire",
en_cours: "En cours",
non_concerne: "NC",
};
return map[status] || "À faire";
}

function documentStatusTone(status) {
const map = {
pret: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
a_faire: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
en_cours: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
non_concerne: { bg: "#F1F5F9", color: "#64748B", border: "#CBD5E1" },
};
return map[status] || map.a_faire;
}

function countPendingDocuments(documents) {
return Object.values(documents || {}).filter(
(status) => status === "a_faire" || status === "en_cours"
).length;
}

function documentKeyLabel(key) {
const map = {
crh: "CRH",
ordonnance: "ordonnance",
transport: "transport",
courrier: "courrier",
};
return map[key] || key;
}

function buildFreinsFromPatient(patient) {
const base = patient?.blocage ? [patient.blocage] : [];
const defaults = {
"Recherche EHPAD": ["Isolement social", "Logement inadapté", "Aidant épuisé"],
"Recherche SSIAD": ["Retour domicile non sécurisé", "Aides non organisées"],
"Recherche HAD": ["Organisation domicile", "Coordination ville", "Transport à prévoir"],
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
"Recherche HAD": {
action: "Relancer structure HAD",
actor: patient.cadre || "Cadre",
impact: "La sortie dépend d’une mise en place coordonnée à domicile.",
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

function buildMiniHistory(notes) {
return [...notes]
.sort((a, b) => {
const priorityDiff = (b.priority || 0) - (a.priority || 0);
if (priorityDiff !== 0) return priorityDiff;
if (a.unread !== b.unread) return a.unread ? -1 : 1;
return 0;
})
.slice(0, 4);
}

function buildSummaryTextV4(patient, activeFrein, stayDays, primaryAction) {
const sortant = patient.sortantMedicalement
? "Patient médicalement sortant."
: "Patient non encore déclaré sortant médicalement.";

const blocage = `Blocage principal : ${
activeFrein || patient.blocage || "non renseigné"
}.`;

const impact = `${patient.joursEvitables || 0} jours évitables, ${stayDays || 0} jours de présence.`;

const orientation = patient.destinationPrevue
? `Orientation visée : ${patient.destinationPrevue}.`
: "Orientation cible à confirmer.";

const dateCible = patient.dateCible
? `Date cible : ${formatIsoToFr(patient.dateCible)}.`
: "Date cible à confirmer.";

const priorite = `Priorité du jour : ${primaryAction.title}.`;

return `${sortant} ${blocage} ${impact} ${orientation} ${dateCible} ${priorite}`;
}

function buildUrgencyLine(patient, activeFrein, primaryAction, pendingDocsCount) {
const isCritical =
patient.sortantMedicalement &&
((patient.score || 0) >= 8 || (patient.joursEvitables || 0) >= 5);

const isWarning =
!isCritical &&
((patient.score || 0) >= 6 ||
(patient.joursEvitables || 0) >= 2 ||
pendingDocsCount > 0);

const level = isCritical ? "critical" : isWarning ? "warning" : "normal";
const levelLabel =
level === "critical" ? "Critique" : level === "warning" ? "Risque" : "Suivi";

const sortant = patient.sortantMedicalement ? "Sortant médical" : "Non sortant";
const blocage = activeFrein || patient.blocage || "Blocage non renseigné";
const jours = `${patient.joursEvitables || 0} j évitables`;
const action = primaryAction?.title || "Action à préciser";

return {
level,
text: `${levelLabel} • ${sortant} • ${blocage} • ${jours} • ${action}`,
};
}

function normalizeOrientation(value) {
if (!value) return "Domicile";
return ORIENTATION_OPTIONS.includes(value) ? value : "Autre";
}

function normalizeTransport(value) {
if (!value) return "Aucun";
return TRANSPORT_OPTIONS.includes(value) ? value : "Transport sanitaire à organiser";
}

function normalizeDateForInput(value) {
if (!value) return "";
if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
const parsed = parseFrenchDate(value);
if (!parsed) return "";
return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

function formatIsoToFr(value) {
if (!value) return "";
const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
if (!match) return value;
return `${match[3]}/${match[2]}/${match[1]}`;
}

function todayIso() {
const now = new Date();
return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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

function getPostItTheme(type) {
const themes = {
info: {
bg: "#EFF6FF",
border: "#BFDBFE",
badgeBg: "#DBEAFE",
badgeColor: "#1D4ED8",
},
action: {
bg: "#ECFDF5",
border: "#A7F3D0",
badgeBg: "#D1FAE5",
badgeColor: "#059669",
},
famille: {
bg: "#FFF7ED",
border: "#FED7AA",
badgeBg: "#FFEDD5",
badgeColor: "#EA580C",
},
urgent: {
bg: "#FEF2F2",
border: "#FECACA",
badgeBg: "#FEE2E2",
badgeColor: "#DC2626",
},
};
return themes[type] || themes.info;
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
shell: {
height: "100vh",
overflow: "hidden",
background: "#F1F5F9",
display: "grid",
gridTemplateColumns: "auto 1fr",
fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
color: "#0F172A",
},

rail: {
background: "#0F172A",
color: "white",
display: "grid",
gridTemplateColumns: "64px 1fr",
transition: "width 200ms ease",
overflow: "hidden",
borderRight: "1px solid rgba(255,255,255,0.08)",
},

railIcons: {
display: "flex",
flexDirection: "column",
gap: 8,
alignItems: "center",
padding: "12px 8px",
},

railIconButton: {
width: 44,
height: 44,
borderRadius: 12,
border: "none",
background: "transparent",
color: "white",
cursor: "pointer",
display: "grid",
placeItems: "center",
},

railIconButtonActive: {
background: "#1E293B",
boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
},

railIcon: {
fontSize: 18,
},

railPanel: {
padding: 12,
display: "flex",
flexDirection: "column",
gap: 12,
minWidth: 0,
overflow: "hidden",
},

railPanelHeader: {
display: "flex",
alignItems: "center",
justifyContent: "space-between",
gap: 8,
},

railPanelTitle: {
fontSize: 15,
fontWeight: 800,
whiteSpace: "nowrap",
overflow: "hidden",
textOverflow: "ellipsis",
},

railCloseButton: {
border: "none",
background: "#1E293B",
color: "white",
borderRadius: 8,
width: 30,
height: 30,
cursor: "pointer",
},

railContentStack: {
display: "flex",
flexDirection: "column",
gap: 10,
minHeight: 0,
overflow: "hidden",
},

main: {
minHeight: 0,
display: "grid",
gridTemplateRows: "56px 104px 42px 1fr 156px",
gap: 8,
padding: 8,
overflow: "hidden",
},

topbar: {
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

topbarActions: {
display: "flex",
gap: 8,
flexWrap: "wrap",
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

headerCrisisButton: {
background: "#DC2626",
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

identityMeta: {
fontSize: 12,
color: "#475569",
whiteSpace: "nowrap",
overflow: "hidden",
textOverflow: "ellipsis",
},

statusPill: {
padding: "8px 12px",
borderRadius: 999,
fontSize: 12,
fontWeight: 800,
whiteSpace: "nowrap",
},

kpiInlineRow: {
display: "flex",
alignItems: "center",
gap: 8,
minWidth: 0,
overflow: "hidden",
},

miniKpi: {
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

miniKpiLabel: {
color: "#64748B",
fontWeight: 700,
},

scoreInline: {
display: "flex",
alignItems: "center",
gap: 8,
background: "#F8FAFC",
border: "1px solid #E2E8F0",
borderRadius: 999,
padding: "6px 10px",
minWidth: 0,
flex: 1,
},

scoreInlineLabel: {
fontSize: 12,
color: "#64748B",
fontWeight: 700,
},

scoreInlineBar: {
flex: 1,
height: 8,
borderRadius: 999,
background: "#E2E8F0",
overflow: "hidden",
minWidth: 80,
},

scoreInlineFill: {
height: "100%",
borderRadius: 999,
},

scoreInlineBadge: {
fontSize: 10,
fontWeight: 800,
border: "1px solid",
borderRadius: 999,
padding: "3px 7px",
whiteSpace: "nowrap",
},

urgencyLine: {
border: "1px solid",
borderRadius: 10,
padding: "8px 12px",
display: "flex",
alignItems: "center",
gap: 8,
overflow: "hidden",
},

urgencyDot: {
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
gridTemplateColumns: "1fr 1fr 1fr",
gap: 8,
overflow: "hidden",
},

coreCard: {
background: "white",
borderRadius: 10,
padding: 12,
boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
display: "flex",
flexDirection: "column",
gap: 10,
minHeight: 0,
overflow: "hidden",
},

coreLabel: {
fontSize: 11,
color: "#64748B",
textTransform: "uppercase",
fontWeight: 800,
letterSpacing: 0.2,
},

coreTitle: {
fontSize: 22,
fontWeight: 800,
lineHeight: 1.05,
},

coreText: {
fontSize: 13,
color: "#475569",
lineHeight: 1.35,
},

metaBlock: {
display: "grid",
gap: 8,
background: "#F8FAFC",
border: "1px solid #E2E8F0",
borderRadius: 10,
padding: 10,
},

metaBlockLabel: {
display: "block",
fontSize: 10,
color: "#64748B",
textTransform: "uppercase",
fontWeight: 700,
marginBottom: 4,
},

freinsChipsRow: {
display: "flex",
flexWrap: "wrap",
gap: 6,
marginTop: "auto",
},

freinChip: {
border: "1px solid #E2E8F0",
background: "#F8FAFC",
borderRadius: 999,
padding: "6px 8px",
fontSize: 12,
cursor: "pointer",
},

freinChipActive: {
background: "#EFF6FF",
borderColor: "#93C5FD",
color: "#1D4ED8",
},

actionPriorityMeta: {
display: "grid",
gap: 8,
fontSize: 13,
color: "#334155",
background: "#F8FAFC",
border: "1px solid #E2E8F0",
borderRadius: 10,
padding: 10,
},

actionPriorityButtons: {
display: "flex",
gap: 8,
marginTop: "auto",
},

primaryActionButton: {
flex: 1,
background: "#2563EB",
color: "white",
border: "none",
borderRadius: 8,
padding: "10px 12px",
fontWeight: 700,
cursor: "pointer",
},

secondaryActionButton: {
flex: 1,
background: "white",
color: "#0F172A",
border: "1px solid #CBD5E1",
borderRadius: 8,
padding: "10px 12px",
fontWeight: 700,
cursor: "pointer",
},

activeNoteCard: {
border: "1px solid",
borderRadius: 10,
padding: 12,
},

activeNoteTop: {
display: "flex",
gap: 8,
alignItems: "center",
marginBottom: 8,
},

postItBadge: {
fontSize: 10,
fontWeight: 800,
borderRadius: 999,
padding: "4px 8px",
},

activeNoteType: {
fontSize: 12,
fontWeight: 700,
},

activeNoteText: {
fontSize: 14,
fontWeight: 700,
lineHeight: 1.35,
},

activeNoteMeta: {
marginTop: 6,
fontSize: 11,
color: "#64748B",
},

quickActionsCompact: {
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

addNoteInline: {
marginTop: "auto",
display: "grid",
gap: 8,
},

noteTypePills: {
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

noteInlineRow: {
display: "flex",
gap: 8,
},

noteInlineInput: {
flex: 1,
border: "1px solid #CBD5E1",
borderRadius: 8,
padding: "9px 10px",
fontSize: 13,
minWidth: 0,
},

noteInlineButton: {
width: 40,
border: "none",
background: "#2563EB",
color: "white",
borderRadius: 8,
fontWeight: 800,
fontSize: 18,
cursor: "pointer",
},

planStrip: {
background: "white",
borderRadius: 10,
padding: "10px 12px",
display: "grid",
gridTemplateColumns: "1fr 1fr 1fr 1.4fr 1.2fr",
gap: 8,
alignItems: "start",
overflow: "hidden",
},

planField: {
minWidth: 0,
display: "grid",
gap: 6,
},

planFieldWide: {
minWidth: 0,
display: "grid",
gap: 6,
},

planFieldLabel: {
fontSize: 10,
color: "#64748B",
textTransform: "uppercase",
fontWeight: 700,
},

planFieldInput: {
width: "100%",
boxSizing: "border-box",
border: "1px solid #CBD5E1",
borderRadius: 8,
padding: "9px 10px",
fontSize: 13,
background: "#F8FAFC",
},

docGroup: {
display: "grid",
gap: 6,
},

docItem: {
display: "grid",
gap: 4,
},

docItemLabel: {
fontSize: 11,
color: "#334155",
fontWeight: 700,
},

docStatusRow: {
display: "flex",
flexWrap: "wrap",
gap: 4,
},

docStatusChip: {
border: "1px solid",
borderRadius: 999,
padding: "4px 7px",
fontSize: 10,
fontWeight: 700,
cursor: "pointer",
background: "#F8FAFC",
},

compactContactRow: {
background: "#1E293B",
borderRadius: 10,
padding: 10,
display: "grid",
gap: 6,
},

compactContactTitle: {
fontSize: 10,
textTransform: "uppercase",
color: "#94A3B8",
fontWeight: 700,
},

compactContactName: {
fontSize: 14,
fontWeight: 800,
color: "white",
},

compactContactActions: {
display: "flex",
alignItems: "center",
justifyContent: "space-between",
gap: 8,
},

compactContactPhone: {
color: "#93C5FD",
textDecoration: "none",
fontWeight: 700,
fontSize: 13,
},

compactContactMuted: {
color: "#94A3B8",
fontSize: 13,
},

compactCopyButton: {
border: "none",
borderRadius: 8,
background: "#334155",
color: "white",
padding: "6px 8px",
fontSize: 11,
fontWeight: 700,
cursor: "pointer",
},

compactActorRow: {
background: "#1E293B",
borderRadius: 10,
padding: 10,
display: "flex",
justifyContent: "space-between",
gap: 12,
},

compactActorRole: {
color: "#94A3B8",
fontSize: 12,
},

compactActorName: {
color: "white",
fontWeight: 700,
fontSize: 12,
textAlign: "right",
},

summaryNarrative: {
background: "#1E293B",
borderRadius: 10,
padding: 12,
color: "white",
lineHeight: 1.45,
fontSize: 13,
},

summaryPriorityBox: {
background: "#FFF7ED",
border: "1px solid #FED7AA",
borderRadius: 10,
padding: 12,
color: "#7C2D12",
display: "grid",
gap: 4,
},

summaryPriorityLabel: {
fontSize: 10,
textTransform: "uppercase",
fontWeight: 800,
color: "#9A3412",
},

suggestionButton: {
border: "none",
background: "#2563EB",
color: "white",
borderRadius: 8,
padding: "10px 12px",
fontWeight: 700,
cursor: "pointer",
},

miniHistoryRow: {
border: "none",
textAlign: "left",
background: "#1E293B",
color: "white",
borderRadius: 10,
padding: 10,
display: "grid",
gap: 6,
cursor: "pointer",
},

miniHistoryUnread: {
boxShadow: "inset 3px 0 0 #60A5FA",
},

miniHistoryTop: {
display: "flex",
alignItems: "center",
justifyContent: "space-between",
gap: 8,
},

miniHistoryTime: {
color: "#94A3B8",
fontSize: 11,
},

miniHistoryText: {
fontSize: 12,
lineHeight: 1.35,
},

noteTypeBadge: {
padding: "2px 6px",
borderRadius: 999,
fontSize: 10,
fontWeight: 700,
},
};

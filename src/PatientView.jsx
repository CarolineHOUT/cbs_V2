import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./PatientView.css";

const patients = [
{
id: 1,
priorite: 1,
nom: "DUPONT",
prenom: "Jean",
dateNaissance: "1946-03-12",
age: 78,
ins: "1 84 03 12 345 678",
iep: "12345678",
service: "Pneumologie",
chambre: "A12",
lit: "03",
sortMedActive: true,
sortMedActivatedAt: "2026-03-14T09:00:00",
maturiteSortie: "Organisation sortie",
freinPrincipal: "Place aval",
blocage: "Attente retour structure aval",
administratifPatient: "Dossier administratif incomplet",
datePrevisionnelleSortie: "2026-03-19",
prochaineAction: "Relance structure aval",
responsableAction: "Claire Morel",
},
{
id: 5,
priorite: 5,
nom: "DEAN",
prenom: "Jane",
dateNaissance: "1958-08-12",
age: 67,
ins: "1 58 08 12 222 111",
iep: "99887766",
service: "Oncologie",
chambre: "A05",
lit: "05",
sortMedActive: false,
sortMedActivatedAt: null,
maturiteSortie: "Organisation sortie",
freinPrincipal: "Place aval",
blocage: "Attente retour structure aval / coordination partenaire",
administratifPatient: "Dossier administratif incomplet",
datePrevisionnelleSortie: "2026-03-21",
prochaineAction: "Relance place aval",
responsableAction: "Claire Morel",
},
{
id: 7,
priorite: 4,
nom: "MARTIN",
prenom: "Paul",
dateNaissance: "1954-04-18",
age: 71,
ins: "1 54 04 18 321 654",
iep: "44556677",
service: "Cardiologie",
chambre: "C12",
lit: "01",
sortMedActive: true,
sortMedActivatedAt: "2026-03-15T10:00:00",
maturiteSortie: "Organisation sortie",
freinPrincipal: "Place aval",
blocage: "Recherche d’aval spécialisé",
administratifPatient: "Mutuelle à confirmer",
datePrevisionnelleSortie: "2026-03-19",
prochaineAction: "Relance SSR cardio",
responsableAction: "Julie Arnaud",
},
];

function diffInDays(fromDate) {
if (!fromDate) return 0;
const start = new Date(fromDate);
const now = new Date();
const ms = now.getTime() - start.getTime();
return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function formatDate(dateString) {
if (!dateString) return "—";
const d = new Date(dateString);
if (Number.isNaN(d.getTime())) return dateString;
return d.toLocaleDateString("fr-FR");
}

function formatDateTime(dateString) {
if (!dateString) return "—";
const d = new Date(dateString);
if (Number.isNaN(d.getTime())) return dateString;
return d.toLocaleString("fr-FR");
}

function getRisk(patient, postIts, staffActions) {
const avoidableDays = patient.sortMedActive
? diffInDays(patient.sortMedActivatedAt)
: 0;

const hasUrgentUnanswered = postIts.some(
(item) =>
item.type === "Urgent" &&
item.statut !== "Répondu" &&
item.statut !== "Clos"
);

const pendingStaffActions = staffActions.some(
(a) => a.statut !== "Terminée"
);

if (
(patient.sortMedActive && patient.maturiteSortie !== "Solution prête") ||
hasUrgentUnanswered ||
pendingStaffActions ||
avoidableDays >= 2
) {
return {
level: "Élevé",
badge: "Alerte",
reason:
"Patient médicalement sortant encore hospitalisé avec solution non sécurisée ou actions staff en attente.",
className: "risk-high",
};
}

if (patient.sortMedActive || avoidableDays >= 1) {
return {
level: "Modéré",
badge: "Surveillance",
reason: "Sortie à piloter avec coordination active.",
className: "risk-medium",
};
}

return {
level: "Faible",
badge: "Stable",
reason: "Situation actuellement plus stable.",
className: "risk-low",
};
}

function getPostItClass(type) {
switch (type) {
case "Urgent":
return "postit-urgent";
case "Action":
return "postit-action";
case "Famille":
return "postit-famille";
default:
return "postit-info";
}
}

export default function PatientView() {
const { id } = useParams();
const basePatient =
patients.find((p) => String(p.id) === String(id)) || patients[1];

const [coordinationTab, setCoordinationTab] = useState("postits");
const [replyingId, setReplyingId] = useState(null);
const [replyText, setReplyText] = useState("");

const [patient, setPatient] = useState({
...basePatient,
situationSortie: {
besoinsIdentifies: "Retour en structure aval avec coordination",
orientationSortie: "SMR",
solutionEnvisagee: "Place aval demandée",
solutionValidee: "Non",
pointsVigilance: "Attente confirmation structure et famille",
},
duoActions: {
passees: [
{
id: "p1",
libelle: "Recueil initial des besoins de sortie",
responsable: "Sophie Martin",
date: "2026-03-15T10:00:00",
},
{
id: "p2",
libelle: "Premier contact avec la famille",
responsable: "Claire Morel",
date: "2026-03-16T14:10:00",
},
],
enCours: [
{
id: "c1",
libelle: basePatient.prochaineAction,
responsable: basePatient.responsableAction,
echeance: "2026-03-18T16:00:00",
},
],
aVenir: [
{
id: "a1",
libelle: "Réévaluation staff si pas de réponse",
responsable: "Dr Bernard",
echeance: "2026-03-19T09:00:00",
},
],
},
personneConfiance: {
nom: "DEAN",
prenom: "Paul",
lien: "Époux",
telephone: "06 12 34 56 78",
email: "paul.dean@example.fr",
},
personneAPrevenir: {
nom: "DEAN",
prenom: "Claire",
lien: "Fille",
telephone: "06 87 65 43 21",
email: "claire.dean@example.fr",
},
});

const [postIts, setPostIts] = useState([
{
id: 1,
type: "Urgent",
message: "Informer la famille avant 16h",
auteur: "Claire M.",
createdAt: "2026-03-18T14:05:00",
statut: "À traiter",
reponse: "",
repondant: "",
repliedAt: "",
},
{
id: 2,
type: "Famille",
message: "Retour de la fille patient attendu ce jour",
auteur: "Sophie L.",
createdAt: "2026-03-18T10:20:00",
statut: "Répondu",
reponse: "Famille contactée à 11h10, accord confirmé.",
repondant: "Sophie L.",
repliedAt: "2026-03-18T11:10:00",
},
]);

const [newPostIt, setNewPostIt] = useState({
type: "Action",
message: "",
});

const [staffReports, setStaffReports] = useState([
{
id: 1,
date: "2026-03-17T09:30:00",
titre: "Staff hebdomadaire",
decision:
"Maintenir orientation SMR, relancer la structure aval et consolider l’administratif.",
redacteur: "Dr Bernard",
},
]);

const [staffActions, setStaffActions] = useState([
{
id: 1,
libelle: "Relance structure aval",
responsable: "Claire Morel",
echeance: "2026-03-18",
statut: "En attente",
source: "Staff hebdomadaire",
},
{
id: 2,
libelle: "Vérifier dossier administratif",
responsable: "Nadia Leroy",
echeance: "2026-03-18",
statut: "En cours",
source: "Staff hebdomadaire",
},
]);

const [newStaffReport, setNewStaffReport] = useState({
titre: "",
decision: "",
redacteur: "",
});

const [newStaffAction, setNewStaffAction] = useState({
libelle: "",
responsable: "",
echeance: "",
statut: "En attente",
});

const unresolvedCount = postIts.filter(
(item) => item.statut !== "Répondu" && item.statut !== "Clos"
).length;

const risk = useMemo(
() => getRisk(patient, postIts, staffActions),
[patient, postIts, staffActions]
);

const joursEvitables = patient.sortMedActive
? diffInDays(patient.sortMedActivatedAt)
: null;

const toggleSortMed = () => {
setPatient((prev) => {
if (prev.sortMedActive) {
return {
...prev,
sortMedActive: false,
sortMedActivatedAt: null,
};
}

return {
...prev,
sortMedActive: true,
sortMedActivatedAt: new Date().toISOString(),
};
});
};

const addPostIt = () => {
if (!newPostIt.message.trim()) return;

const item = {
id: Date.now(),
type: newPostIt.type,
message: newPostIt.message.trim(),
auteur: "Utilisateur",
createdAt: new Date().toISOString(),
statut: "À traiter",
reponse: "",
repondant: "",
repliedAt: "",
};

setPostIts((prev) => [item, ...prev]);
setNewPostIt({ type: "Action", message: "" });
setCoordinationTab("postits");
};

const sendReply = (postId) => {
if (!replyText.trim()) return;

setPostIts((prev) =>
prev.map((item) =>
item.id === postId
? {
...item,
statut: "Répondu",
reponse: replyText.trim(),
repondant: "Utilisateur",
repliedAt: new Date().toISOString(),
}
: item
)
);

setReplyText("");
setReplyingId(null);
};

const closePostIt = (postId) => {
setPostIts((prev) =>
prev.map((item) =>
item.id === postId ? { ...item, statut: "Clos" } : item
)
);

if (replyingId === postId) {
setReplyingId(null);
setReplyText("");
}
};

const addStaffReport = () => {
if (
!newStaffReport.titre.trim() ||
!newStaffReport.decision.trim() ||
!newStaffReport.redacteur.trim()
) {
return;
}

const report = {
id: Date.now(),
date: new Date().toISOString(),
titre: newStaffReport.titre.trim(),
decision: newStaffReport.decision.trim(),
redacteur: newStaffReport.redacteur.trim(),
};

setStaffReports((prev) => [report, ...prev]);
setNewStaffReport({
titre: "",
decision: "",
redacteur: "",
});
};

const addStaffAction = () => {
if (
!newStaffAction.libelle.trim() ||
!newStaffAction.responsable.trim() ||
!newStaffAction.echeance
) {
return;
}

const action = {
id: Date.now(),
libelle: newStaffAction.libelle.trim(),
responsable: newStaffAction.responsable.trim(),
echeance: newStaffAction.echeance,
statut: newStaffAction.statut,
source: staffReports[0]?.titre || "Staff",
};

setStaffActions((prev) => [action, ...prev]);
setNewStaffAction({
libelle: "",
responsable: "",
echeance: "",
statut: "En attente",
});
};

const updateStaffActionStatus = (id, statut) => {
setStaffActions((prev) =>
prev.map((item) => (item.id === id ? { ...item, statut } : item))
);
};

return (
<div className="patient-page">
<header className="pv-header">
<div className="pv-header-brand">
<h1>CARABBAS</h1>
<p>Fiche patient — pilotage opérationnel</p>
</div>

<div className="pv-header-actions">
<Link to="/dashboard" className="pv-head-btn light">
Retour tableau
</Link>

<button className="pv-head-btn">
Coordination
{unresolvedCount > 0 && (
<span className="pv-head-badge">{unresolvedCount}</span>
)}
</button>
</div>
</header>

<main className="pv-main">
<section className="pv-hero">
<div className="pv-hero-main">
<div className="pv-priority-chip">Priorité {patient.priorite}</div>
<h2>
{patient.nom} {patient.prenom}
</h2>
<div className="pv-hero-row">
<span>Née le {formatDate(patient.dateNaissance)}</span>
<span>{patient.age} ans</span>
</div>
<div className="pv-hero-row">
<span>INS {patient.ins}</span>
<span>IEP {patient.iep}</span>
</div>
<div className="pv-hero-row">
<span>Chambre {patient.chambre}</span>
<span>Lit {patient.lit}</span>
</div>
</div>

<div className="pv-hero-side">
<div className="pv-service-badge">{patient.service}</div>
<div className="pv-room-badge">Localisation active</div>
</div>
</section>

<section className="pv-command-grid">
<article className="pv-command-card sortmed">
<span className="pv-card-label">Sort Med</span>
<strong className="pv-card-value">
{patient.sortMedActive
? `Activé · J+${diffInDays(patient.sortMedActivatedAt)}`
: "Non activé"}
</strong>
<button className="pv-inline-btn amber" onClick={toggleSortMed}>
Basculer
</button>
</article>

<article className="pv-command-card frein">
<span className="pv-card-label">Frein principal</span>
<strong className="pv-card-value">{patient.freinPrincipal}</strong>
<span className="pv-card-subvalue">Source DPI</span>
</article>

<article className="pv-command-card blocage">
<span className="pv-card-label">Blocage</span>
<strong className="pv-card-value">{patient.blocage}</strong>
<span className="pv-card-subvalue">Point de tension actuel</span>
</article>

<article className="pv-command-card action">
<span className="pv-card-label">Prochaine action</span>
<strong className="pv-card-value">{patient.prochaineAction}</strong>
<span className="pv-card-subvalue">{patient.responsableAction}</span>
</article>
</section>

<section className={`pv-risk-banner ${risk.className}`}>
<div className="pv-risk-head">
<span className="pv-risk-badge">{risk.badge}</span>
<strong>Risque de dérive : {risk.level}</strong>
</div>
<p>{risk.reason}</p>
</section>

<section className="pv-metrics-grid">
<article className="pv-metric-card strong">
<span className="pv-card-label">Maturité</span>
<strong className="pv-metric-value">{patient.maturiteSortie}</strong>
</article>

<article className="pv-metric-card">
<span className="pv-card-label">Administratif</span>
<strong className="pv-metric-value">
{patient.administratifPatient}
</strong>
</article>

<article className="pv-metric-card">
<span className="pv-card-label">Jours évitables</span>
<strong className="pv-metric-value">
{joursEvitables === null ? "—" : `J+${joursEvitables}`}
</strong>
</article>

<article className="pv-metric-card">
<span className="pv-card-label">Date sortie prévue</span>
<strong className="pv-metric-value">
{formatDate(patient.datePrevisionnelleSortie)}
</strong>
</article>
</section>

<section className="pv-layout">
<div className="pv-left-col">
<section className="pv-panel featured">
<div className="pv-panel-head">
<h3>Synthèse opérationnelle</h3>
<span className="pv-panel-tag">Pilotage</span>
</div>
<p className="pv-synthesis">
{patient.sortMedActive
? `Patient médicalement sortant, toujours hospitalisé. Frein principal : ${patient.freinPrincipal.toLowerCase()}. Blocage : ${patient.blocage.toLowerCase()}. Action prioritaire : ${patient.prochaineAction.toLowerCase()}.`
: `Sort Med non activé. Vigilance sur ${patient.freinPrincipal.toLowerCase()}. Action prioritaire : ${patient.prochaineAction.toLowerCase()}.`}
</p>
</section>

<section className="pv-panel">
<div className="pv-panel-head">
<h3>Situation de sortie</h3>
<span className="pv-panel-tag">Fiche patient / DPI</span>
</div>

<div className="pv-info-grid">
<div className="pv-info-item">
<span className="pv-field-label">Besoins identifiés</span>
<strong>{patient.situationSortie.besoinsIdentifies}</strong>
</div>
<div className="pv-info-item">
<span className="pv-field-label">Orientation sortie</span>
<strong>{patient.situationSortie.orientationSortie}</strong>
</div>
<div className="pv-info-item">
<span className="pv-field-label">Solution envisagée</span>
<strong>{patient.situationSortie.solutionEnvisagee}</strong>
</div>
<div className="pv-info-item">
<span className="pv-field-label">Solution validée</span>
<strong>{patient.situationSortie.solutionValidee}</strong>
</div>
<div className="pv-info-item wide">
<span className="pv-field-label">Points de vigilance</span>
<strong>{patient.situationSortie.pointsVigilance}</strong>
</div>
</div>
</section>

<section className="pv-panel">
<div className="pv-panel-head">
<h3>Actions vue duo</h3>
<span className="pv-panel-tag">Coordination</span>
</div>

<div className="pv-duo-grid">
<div className="pv-duo-col">
<div className="pv-subtitle">Passées</div>
{patient.duoActions.passees.map((action) => (
<div key={action.id} className="pv-action-card">
<div className="pv-action-title">{action.libelle}</div>
<div className="pv-action-meta">{action.responsable}</div>
<div className="pv-action-meta">
{formatDateTime(action.date)}
</div>
</div>
))}
</div>

<div className="pv-duo-col">
<div className="pv-subtitle">En cours</div>
{patient.duoActions.enCours.map((action) => (
<div key={action.id} className="pv-action-card current">
<div className="pv-action-title">{action.libelle}</div>
<div className="pv-action-meta">{action.responsable}</div>
<div className="pv-action-meta">
Échéance : {formatDateTime(action.echeance)}
</div>
</div>
))}
</div>

<div className="pv-duo-col">
<div className="pv-subtitle">À venir</div>
{patient.duoActions.aVenir.map((action) => (
<div key={action.id} className="pv-action-card future">
<div className="pv-action-title">{action.libelle}</div>
<div className="pv-action-meta">{action.responsable}</div>
<div className="pv-action-meta">
Échéance : {formatDateTime(action.echeance)}
</div>
</div>
))}
</div>
</div>
</section>

<section className="pv-panel">
<div className="pv-panel-head">
<h3>Staff</h3>
<span className="pv-panel-tag">Compte rendu et actions attendues</span>
</div>

<div className="pv-staff-grid">
<div className="pv-staff-box">
<h4>Nouveau compte rendu</h4>
<input
type="text"
placeholder="Titre du staff"
value={newStaffReport.titre}
onChange={(e) =>
setNewStaffReport((prev) => ({
...prev,
titre: e.target.value,
}))
}
/>
<textarea
placeholder="Décision prise en staff"
value={newStaffReport.decision}
onChange={(e) =>
setNewStaffReport((prev) => ({
...prev,
decision: e.target.value,
}))
}
/>
<input
type="text"
placeholder="Rédacteur"
value={newStaffReport.redacteur}
onChange={(e) =>
setNewStaffReport((prev) => ({
...prev,
redacteur: e.target.value,
}))
}
/>
<button onClick={addStaffReport}>Ajouter le compte rendu</button>
</div>

<div className="pv-staff-box">
<h4>Action attendue après staff</h4>
<input
type="text"
placeholder="Action attendue"
value={newStaffAction.libelle}
onChange={(e) =>
setNewStaffAction((prev) => ({
...prev,
libelle: e.target.value,
}))
}
/>
<input
type="text"
placeholder="Responsable"
value={newStaffAction.responsable}
onChange={(e) =>
setNewStaffAction((prev) => ({
...prev,
responsable: e.target.value,
}))
}
/>
<input
type="date"
value={newStaffAction.echeance}
onChange={(e) =>
setNewStaffAction((prev) => ({
...prev,
echeance: e.target.value,
}))
}
/>
<select
value={newStaffAction.statut}
onChange={(e) =>
setNewStaffAction((prev) => ({
...prev,
statut: e.target.value,
}))
}
>
<option>En attente</option>
<option>En cours</option>
<option>Terminée</option>
</select>
<button onClick={addStaffAction}>Ajouter l’action</button>
</div>
</div>

<div className="pv-staff-section">
<h4>Derniers comptes rendus</h4>
<div className="pv-history-list">
{staffReports.map((report) => (
<div key={report.id} className="pv-history-item">
<div className="pv-history-date">
{formatDateTime(report.date)}
</div>
<div className="pv-history-label">{report.titre}</div>
<div className="pv-history-detail">{report.decision}</div>
<div className="pv-postit-meta">
Rédacteur : {report.redacteur}
</div>
</div>
))}
</div>
</div>

<div className="pv-staff-section">
<h4>Actions attendues après staff</h4>
<div className="pv-staff-actions-list">
{staffActions.map((action) => (
<div key={action.id} className="pv-staff-action-card">
<div className="pv-staff-action-head">
<strong>{action.libelle}</strong>
<span
className={`pv-status-chip ${action.statut
.toLowerCase()
.replace(" ", "-")}`}
>
{action.statut}
</span>
</div>

<div className="pv-action-meta">
Responsable : {action.responsable}
</div>
<div className="pv-action-meta">
Échéance : {formatDate(action.echeance)}
</div>
<div className="pv-action-meta">Source : {action.source}</div>

<div className="pv-staff-action-actions">
<button onClick={() => updateStaffActionStatus(action.id, "En attente")}>
En attente
</button>
<button onClick={() => updateStaffActionStatus(action.id, "En cours")}>
En cours
</button>
<button onClick={() => updateStaffActionStatus(action.id, "Terminée")}>
Terminée
</button>
</div>
</div>
))}
</div>
</div>
</section>
</div>

<aside className="pv-right-col">
<section className="pv-panel">
<div className="pv-panel-head">
<h3>Coordination</h3>
<div className="pv-tab-row">
<button
className={coordinationTab === "postits" ? "active" : ""}
onClick={() => setCoordinationTab("postits")}
>
Post-it
</button>
<button
className={coordinationTab === "contacts" ? "active" : ""}
onClick={() => setCoordinationTab("contacts")}
>
Contacts
</button>
</div>
</div>

{coordinationTab === "postits" && (
<>
<div className="pv-new-postit">
<select
value={newPostIt.type}
onChange={(e) =>
setNewPostIt((prev) => ({
...prev,
type: e.target.value,
}))
}
>
<option>Action</option>
<option>Info</option>
<option>Famille</option>
<option>Urgent</option>
</select>

<textarea
placeholder="Ajouter un post-it de coordination"
value={newPostIt.message}
onChange={(e) =>
setNewPostIt((prev) => ({
...prev,
message: e.target.value,
}))
}
/>

<button onClick={addPostIt}>Ajouter</button>
</div>

<div className="pv-postit-list">
{postIts.map((item) => (
<div
key={item.id}
className={`pv-postit-card ${getPostItClass(item.type)}`}
>
<div className="pv-postit-head">
<span className="pv-postit-type">{item.type}</span>
<span className="pv-postit-status">{item.statut}</span>
</div>

<div className="pv-postit-message">{item.message}</div>

<div className="pv-postit-meta">
{item.auteur} · {formatDateTime(item.createdAt)}
</div>

{item.reponse && (
<div className="pv-postit-response">
<strong>Réponse</strong>
<div>{item.reponse}</div>
<div className="pv-postit-meta">
{item.repondant} · {formatDateTime(item.repliedAt)}
</div>
</div>
)}

<div className="pv-postit-actions">
{item.statut !== "Répondu" && item.statut !== "Clos" && (
<button onClick={() => setReplyingId(item.id)}>
Répondre
</button>
)}

{item.statut !== "Clos" && (
<button onClick={() => closePostIt(item.id)}>
Clore
</button>
)}
</div>

{replyingId === item.id && (
<div className="pv-reply-box">
<textarea
placeholder="Écrire une réponse..."
value={replyText}
onChange={(e) => setReplyText(e.target.value)}
/>
<div className="pv-reply-actions">
<button onClick={() => sendReply(item.id)}>
Valider
</button>
<button
onClick={() => {
setReplyingId(null);
setReplyText("");
}}
>
Annuler
</button>
</div>
</div>
)}
</div>
))}
</div>
</>
)}

{coordinationTab === "contacts" && (
<div className="pv-contact-stack">
<div className="pv-contact-card">
<span className="pv-field-label">Personne de confiance</span>
<strong>
{patient.personneConfiance.nom}{" "}
{patient.personneConfiance.prenom}
</strong>
<div>{patient.personneConfiance.lien}</div>
<div>{patient.personneConfiance.telephone}</div>
<div>{patient.personneConfiance.email}</div>
</div>

<div className="pv-contact-card">
<span className="pv-field-label">Personne à prévenir</span>
<strong>
{patient.personneAPrevenir.nom}{" "}
{patient.personneAPrevenir.prenom}
</strong>
<div>{patient.personneAPrevenir.lien}</div>
<div>{patient.personneAPrevenir.telephone}</div>
<div>{patient.personneAPrevenir.email}</div>
</div>
</div>
)}
</section>
</aside>
</section>
</main>
</div>
);
}

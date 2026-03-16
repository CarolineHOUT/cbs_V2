import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./PatientView.css";

const allPatients = [
{
id: 1,
priorite: 1,
nom: "DUPONT",
prenom: "Jean",
dateNaissance: "1946-03-12",
age: 78,
iep: "12345678",
ins: "1 84 03 12 345 678",
service: "Pneumologie",
chambre: "A12",
lit: "03",
sortMedActive: true,
sortMedActivatedAt: "2026-03-14T09:00:00",
maturiteSortie: "Organisation sortie",
freinPrincipal: "Place aval",
datePrevisionnelleSortie: "2026-03-19",
},
{
id: 2,
priorite: 2,
nom: "JOREL",
prenom: "Henri",
dateNaissance: "1944-11-16",
age: 79,
iep: "87654321",
ins: "1 44 11 22 333 444",
service: "Pneumologie",
chambre: "A04",
lit: "01",
sortMedActive: true,
sortMedActivatedAt: "2026-03-16T08:30:00",
maturiteSortie: "Besoins identifiés",
freinPrincipal: "Social",
datePrevisionnelleSortie: "2026-03-18",
},
{
id: 3,
priorite: 3,
nom: "PERON",
prenom: "Jocelyn",
dateNaissance: "1975-08-25",
age: 50,
iep: "23456789",
ins: "1 75 08 25 987 654",
service: "Médecine",
chambre: "B10",
lit: "02",
sortMedActive: false,
sortMedActivatedAt: null,
maturiteSortie: "Besoins identifiés",
freinPrincipal: "Coordination",
datePrevisionnelleSortie: "2026-03-20",
},
];

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

function diffInDays(fromDate) {
if (!fromDate) return 0;
const start = new Date(fromDate);
const now = new Date();
const ms = now.getTime() - start.getTime();
return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function getRisk(patient, postIts) {
const avoidableDays = patient.sortMedActive
? diffInDays(patient.sortMedActivatedAt)
: 0;

const hasUrgentUnanswered = postIts.some(
(item) => item.type === "Urgent" && item.statut !== "Répondu"
);

if (
patient.sortMedActive &&
patient.maturiteSortie !== "Solution prête" &&
patient.freinPrincipal &&
(avoidableDays >= 1 || hasUrgentUnanswered)
) {
return {
level: "Élevé",
reason: "Sort Med actif sans solution prête et frein principal non résolu",
className: "risk-high",
};
}

if (
patient.maturiteSortie === "Besoins identifiés" ||
hasUrgentUnanswered ||
patient.freinPrincipal
) {
return {
level: "Modéré",
reason: "Préparation de sortie incomplète ou vigilance de coordination",
className: "risk-medium",
};
}

return {
level: "Faible",
reason: "Sortie suffisamment préparée à ce stade",
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

const selectedPatient =
allPatients.find((p) => String(p.id) === String(id)) || allPatients[0];

const [leftMenuOpen, setLeftMenuOpen] = useState(true);
const [rightRailOpen, setRightRailOpen] = useState(true);
const [rightRailTab, setRightRailTab] = useState("contacts");

const [patient, setPatient] = useState({
...selectedPatient,
situationSortie: {
besoinsIdentifies: "Retour en structure aval avec coordination",
orientationSortie: "SMR",
solutionEnvisagee: "Place aval demandée",
solutionValidee: "Non",
pointsVigilance: "Attente confirmation structure et famille",
},
staff: {
aPresenter: true,
dernierStaff: "2026-03-17",
decision: "Maintenir orientation SMR, relance structure aval",
prochaineRevue: "2026-03-19",
note: "Réévaluer si pas de réponse sous 24h",
},
coordination: {
acteurs: "Service / Assistante sociale / Cadre",
statut: "En cours",
prochaineAction: "Relance structure aval",
dateSuivi: "2026-03-18",
note: "Famille informée, accord de principe",
},
personneConfiance: {
nom: "DUPONT",
prenom: "Marie",
lien: "Épouse",
telephone: "06 12 34 56 78",
email: "marie.dupont@example.fr",
},
personneAPrevenir: {
nom: "DUPONT",
prenom: "Claire",
lien: "Fille",
telephone: "06 87 65 43 21",
},
celluleCrise: {
concerne: false,
active: false,
motif: "",
dateActivation: "",
decisions: "",
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
reponse: "Famille contactée à 11h10, accord confirmé",
repondant: "Sophie L.",
repliedAt: "2026-03-18T11:10:00",
},
]);

const [historique] = useState([
{
id: 1,
date: "2026-03-14T09:00:00",
label: "Sort Med activé",
detail: "Activation du statut Sort Med",
},
{
id: 2,
date: "2026-03-17T09:30:00",
label: "Staff",
detail: "Orientation SMR confirmée en staff",
},
{
id: 3,
date: "2026-03-18T08:45:00",
label: "Frein principal",
detail: "Place aval confirmée comme frein principal",
},
]);

const [newPostIt, setNewPostIt] = useState({
type: "Action",
message: "",
});

const risk = useMemo(() => getRisk(patient, postIts), [patient, postIts]);

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
setRightRailTab("postits");
setRightRailOpen(true);
};

const replyToPostIt = (postId) => {
const text = window.prompt("Saisir une réponse courte :");
if (!text || !text.trim()) return;

setPostIts((prev) =>
prev.map((item) =>
item.id === postId
? {
...item,
statut: "Répondu",
reponse: text.trim(),
repondant: "Utilisateur",
repliedAt: new Date().toISOString(),
}
: item
)
);
};

const closePostIt = (postId) => {
setPostIts((prev) =>
prev.map((item) =>
item.id === postId ? { ...item, statut: "Clos" } : item
)
);
};

return (
<div className="patient-view-page">
<header className="pv-top-header">
<div className="pv-header-left">
<button
className="pv-icon-btn"
onClick={() => setLeftMenuOpen((prev) => !prev)}
aria-label="Ouvrir le menu"
>
☰
</button>

<div className="pv-brand-block">
<h1>CARABBAS</h1>
<p>Fiche patient – pilotage des sorties hospitalières</p>
</div>
</div>

<div className="pv-header-right">
<button
className="pv-ghost-btn"
onClick={() => setRightRailOpen((prev) => !prev)}
>
Outils latéraux
</button>

<button
className="pv-crisis-button"
onClick={() => alert("Ouvrir le formulaire cellule de crise")}
>
Déclencher une cellule de crise
</button>
</div>
</header>

<aside className={`pv-left-sidebar ${leftMenuOpen ? "expanded" : "collapsed"}`}>
<nav className="pv-left-sidebar-nav">
<Link to="/dashboard" className="pv-sidebar-link">
<span className="pv-sidebar-icon">🏠</span>
{leftMenuOpen && <span>Tableau de bord</span>}
</Link>

<button className="pv-sidebar-link active">
<span className="pv-sidebar-icon">🧑</span>
{leftMenuOpen && <span>Fiche patient</span>}
</button>

<button className="pv-sidebar-link">
<span className="pv-sidebar-icon">🤝</span>
{leftMenuOpen && <span>Vue duo</span>}
</button>

<button className="pv-sidebar-link">
<span className="pv-sidebar-icon">⚠️</span>
{leftMenuOpen && <span>Cellule de crise</span>}
</button>
</nav>
</aside>

<aside className={`pv-right-rail ${rightRailOpen ? "open" : "closed"}`}>
<div className="pv-right-tabs">
<button
className={rightRailTab === "contacts" ? "active" : ""}
onClick={() => setRightRailTab("contacts")}
>
Contacts
</button>
<button
className={rightRailTab === "postits" ? "active" : ""}
onClick={() => setRightRailTab("postits")}
>
Post-it
</button>
<button
className={rightRailTab === "crise" ? "active" : ""}
onClick={() => setRightRailTab("crise")}
>
Cellule crise
</button>
<button
className={rightRailTab === "historique" ? "active" : ""}
onClick={() => setRightRailTab("historique")}
>
Historique
</button>
</div>

<div className="pv-right-content">
{rightRailTab === "contacts" && (
<div className="pv-rail-section">
<h3>Personne de confiance</h3>
<div className="pv-contact-card">
<div>
<strong>
{patient.personneConfiance.nom} {patient.personneConfiance.prenom}
</strong>
</div>
<div>{patient.personneConfiance.lien}</div>
<div>{patient.personneConfiance.telephone}</div>
<div>{patient.personneConfiance.email}</div>
</div>

<h3>Personne à prévenir</h3>
<div className="pv-contact-card">
<div>
<strong>
{patient.personneAPrevenir.nom} {patient.personneAPrevenir.prenom}
</strong>
</div>
<div>{patient.personneAPrevenir.lien}</div>
<div>{patient.personneAPrevenir.telephone}</div>
</div>
</div>
)}

{rightRailTab === "postits" && (
<div className="pv-rail-section">
<h3>Post-it de coordination</h3>

<div className="pv-new-postit">
<select
value={newPostIt.type}
onChange={(e) =>
setNewPostIt((prev) => ({ ...prev, type: e.target.value }))
}
>
<option>Action</option>
<option>Info</option>
<option>Famille</option>
<option>Urgent</option>
</select>

<textarea
placeholder="Saisir un message court"
value={newPostIt.message}
onChange={(e) =>
setNewPostIt((prev) => ({ ...prev, message: e.target.value }))
}
/>

<button onClick={addPostIt}>Ajouter</button>
</div>

<div className="pv-postit-list">
{postIts.map((item) => (
<div key={item.id} className={`pv-postit-card ${getPostItClass(item.type)}`}>
<div className="pv-postit-header">
<span className="pv-postit-type">{item.type}</span>
<span className="pv-postit-status">{item.statut}</span>
</div>

<div className="pv-postit-message">{item.message}</div>

<div className="pv-postit-meta">
{item.auteur} · {formatDateTime(item.createdAt)}
</div>

{item.reponse && (
<div className="pv-postit-response">
<strong>Réponse :</strong>
<div>{item.reponse}</div>
<div className="pv-postit-meta">
{item.repondant} · {formatDateTime(item.repliedAt)}
</div>
</div>
)}

<div className="pv-postit-actions">
{item.statut !== "Répondu" && item.statut !== "Clos" && (
<button onClick={() => replyToPostIt(item.id)}>
Répondre
</button>
)}

{item.statut !== "Clos" && (
<button onClick={() => closePostIt(item.id)}>Clore</button>
)}
</div>
</div>
))}
</div>
</div>
)}

{rightRailTab === "crise" && (
<div className="pv-rail-section">
<h3>Cellule de crise</h3>

<div className="pv-info-card">
<div>
<strong>Concerné :</strong>{" "}
{patient.celluleCrise.concerne ? "Oui" : "Non"}
</div>
<div>
<strong>Active :</strong>{" "}
{patient.celluleCrise.active ? "Oui" : "Non"}
</div>
<div>
<strong>Motif :</strong> {patient.celluleCrise.motif || "—"}
</div>
<div>
<strong>Date :</strong>{" "}
{patient.celluleCrise.dateActivation
? formatDateTime(patient.celluleCrise.dateActivation)
: "—"}
</div>
<div>
<strong>Décisions :</strong>{" "}
{patient.celluleCrise.decisions || "—"}
</div>
</div>

<button
className="pv-primary-action"
onClick={() => alert("Associer ou déclencher une cellule de crise")}
>
Gérer la cellule de crise
</button>
</div>
)}

{rightRailTab === "historique" && (
<div className="pv-rail-section">
<h3>Historique</h3>

<div className="pv-history-list">
{historique.map((item) => (
<div key={item.id} className="pv-history-item">
<div className="pv-history-date">
{formatDateTime(item.date)}
</div>
<div className="pv-history-label">{item.label}</div>
<div className="pv-history-detail">{item.detail}</div>
</div>
))}
</div>
</div>
)}
</div>
</aside>

<main
className={`pv-main ${
leftMenuOpen ? "with-left-sidebar" : "with-left-sidebar-collapsed"
} ${rightRailOpen ? "with-right-rail" : "without-right-rail"}`}
>
<section className="pv-identity-banner">
<div className="pv-identity-main">
<div className="pv-patient-name">
{patient.nom} {patient.prenom}
</div>
<div className="pv-identity-line">
Né le {formatDate(patient.dateNaissance)} · {patient.age} ans ·
Priorité {patient.priorite}
</div>
<div className="pv-identity-line">
IEP {patient.iep} · INS {patient.ins}
</div>
</div>

<div className="pv-location-main">
<div className="pv-location-service">{patient.service}</div>
<div className="pv-identity-line">
Chambre {patient.chambre} · Lit {patient.lit}
</div>
</div>
</section>

<section className="pv-summary-banner">
<div className="pv-summary-card">
<span className="pv-summary-label">Sort Med</span>
<button
className={`pv-sortmed-toggle ${patient.sortMedActive ? "active" : ""}`}
onClick={toggleSortMed}
>
{patient.sortMedActive
? `Sort Med J+${diffInDays(patient.sortMedActivatedAt)}`
: "○ Sort Med"}
</button>
</div>

<div className="pv-summary-card">
<span className="pv-summary-label">Maturité sortie</span>
<strong>{patient.maturiteSortie}</strong>
</div>

<div className="pv-summary-card">
<span className="pv-summary-label">Frein principal</span>
<strong>{patient.freinPrincipal}</strong>
</div>

<div className="pv-summary-card">
<span className="pv-summary-label">Jours évitables</span>
<strong>{joursEvitables === null ? "—" : `J+${joursEvitables}`}</strong>
</div>

<div className="pv-summary-card">
<span className="pv-summary-label">Date prévisionnelle sortie</span>
<strong>{formatDate(patient.datePrevisionnelleSortie)}</strong>
</div>
</section>

<section className={`pv-risk-banner ${risk.className}`}>
<div className="pv-risk-title">Risque de dérive sortie : {risk.level}</div>
<div className="pv-risk-reason">{risk.reason}</div>
</section>

<section className="pv-content-grid">
<div className="pv-main-column">
<section className="pv-block">
<div className="pv-block-title">Situation de sortie</div>
<div className="pv-block-grid">
<div>
<span className="pv-field-label">Besoins identifiés</span>
<div>{patient.situationSortie.besoinsIdentifies}</div>
</div>

<div>
<span className="pv-field-label">Orientation sortie</span>
<div>{patient.situationSortie.orientationSortie}</div>
</div>

<div>
<span className="pv-field-label">Solution envisagée</span>
<div>{patient.situationSortie.solutionEnvisagee}</div>
</div>

<div>
<span className="pv-field-label">Solution validée</span>
<div>{patient.situationSortie.solutionValidee}</div>
</div>

<div className="pv-full-width">
<span className="pv-field-label">Points de vigilance</span>
<div>{patient.situationSortie.pointsVigilance}</div>
</div>
</div>
</section>

<section className="pv-block">
<div className="pv-block-title">Staff</div>
<div className="pv-block-grid">
<div>
<span className="pv-field-label">Présenté en staff</span>
<div>{patient.staff.aPresenter ? "Oui" : "Non"}</div>
</div>

<div>
<span className="pv-field-label">Dernier staff</span>
<div>{formatDate(patient.staff.dernierStaff)}</div>
</div>

<div>
<span className="pv-field-label">Prochaine revue</span>
<div>{formatDate(patient.staff.prochaineRevue)}</div>
</div>

<div className="pv-full-width">
<span className="pv-field-label">Décision du staff</span>
<div>{patient.staff.decision}</div>
</div>

<div className="pv-full-width">
<span className="pv-field-label">Note</span>
<div>{patient.staff.note}</div>
</div>
</div>
</section>

<section className="pv-block">
<div className="pv-block-title">Coordination / duo</div>
<div className="pv-block-grid">
<div>
<span className="pv-field-label">Acteurs concernés</span>
<div>{patient.coordination.acteurs}</div>
</div>

<div>
<span className="pv-field-label">Statut</span>
<div>{patient.coordination.statut}</div>
</div>

<div>
<span className="pv-field-label">Prochaine action</span>
<div>{patient.coordination.prochaineAction}</div>
</div>

<div>
<span className="pv-field-label">Date de suivi</span>
<div>{formatDate(patient.coordination.dateSuivi)}</div>
</div>

<div className="pv-full-width">
<span className="pv-field-label">Note</span>
<div>{patient.coordination.note}</div>
</div>
</div>
</section>
</div>

<div className="pv-side-column">
<section className="pv-block">
<div className="pv-block-title">Synthèse opérationnelle</div>
<div className="pv-synthesis-text">
{patient.sortMedActive
? `Sort Med actif, ${patient.maturiteSortie.toLowerCase()}, frein principal : ${patient.freinPrincipal.toLowerCase()}.`
: `Sort Med non activé, ${patient.maturiteSortie.toLowerCase()}, vigilance sur ${patient.freinPrincipal.toLowerCase()}.`}
</div>
</section>

<section className="pv-block">
<div className="pv-block-title">Conditions manquantes à la sortie</div>
<ul className="pv-checklist">
<li>Confirmation de la solution aval</li>
<li>Validation de la coordination de sortie</li>
<li>Suivi famille / entourage finalisé</li>
</ul>
</section>
</div>
</section>
</main>
</div>
);
}

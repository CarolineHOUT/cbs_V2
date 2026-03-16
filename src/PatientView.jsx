import React, { useEffect, useMemo, useState } from "react";
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
    ins: "1 84 03 12 345 678",
    iep: "12345678",
    service: "Pneumologie",
    chambre: "A12",
    lit: "03",
    sortMedActive: true,
    sortMedActivatedAt: "2026-03-14T09:00:00",
    maturiteSortie: "Organisation sortie",
    freinPrincipal: "Place aval",
    datePrevisionnelleSortie: "2026-03-19",
    prochaineAction: "Relance structure aval",
  },
  {
    id: 2,
    priorite: 2,
    nom: "JOREL",
    prenom: "Henri",
    dateNaissance: "1944-11-16",
    age: 79,
    ins: "1 44 11 22 333 444",
    iep: "87654321",
    service: "Pneumologie",
    chambre: "A04",
    lit: "01",
    sortMedActive: true,
    sortMedActivatedAt: "2026-03-16T08:30:00",
    maturiteSortie: "Besoins identifiés",
    freinPrincipal: "Social",
    datePrevisionnelleSortie: "2026-03-18",
    prochaineAction: "Point assistante sociale",
  },
  {
    id: 3,
    priorite: 3,
    nom: "PERON",
    prenom: "Jocelyn",
    dateNaissance: "1975-08-25",
    age: 50,
    ins: "1 75 08 25 987 654",
    iep: "23456789",
    service: "Médecine",
    chambre: "B10",
    lit: "02",
    sortMedActive: false,
    sortMedActivatedAt: null,
    maturiteSortie: "Besoins identifiés",
    freinPrincipal: "Coordination",
    datePrevisionnelleSortie: "2026-03-20",
    prochaineAction: "Recueil des besoins",
  },
  {
    id: 4,
    priorite: 4,
    nom: "MOREL",
    prenom: "Sébastien",
    dateNaissance: "1969-02-12",
    age: 56,
    ins: "1 69 02 12 888 999",
    iep: "54567890",
    service: "Chirurgie",
    chambre: "C07",
    lit: "01",
    sortMedActive: true,
    sortMedActivatedAt: "2026-03-13T11:15:00",
    maturiteSortie: "Solution prête",
    freinPrincipal: "Administratif",
    datePrevisionnelleSortie: "2026-03-18",
    prochaineAction: "Finaliser validation",
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
    datePrevisionnelleSortie: "2026-03-21",
    prochaineAction: "Relance place aval",
  },
  {
    id: 6,
    priorite: 6,
    nom: "BERNARD",
    prenom: "Luc",
    dateNaissance: "1961-06-03",
    age: 64,
    ins: "1 61 06 03 111 222",
    iep: "11223344",
    service: "Neurologie",
    chambre: "D03",
    lit: "02",
    sortMedActive: true,
    sortMedActivatedAt: "2026-03-15T14:00:00",
    maturiteSortie: "Organisation sortie",
    freinPrincipal: "Famille",
    datePrevisionnelleSortie: "2026-03-19",
    prochaineAction: "Appeler la famille",
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
    (item) =>
      item.type === "Urgent" &&
      item.statut !== "Répondu" &&
      item.statut !== "Clos"
  );

  if (
    patient.sortMedActive &&
    patient.maturiteSortie !== "Solution prête" &&
    (avoidableDays >= 1 || hasUrgentUnanswered)
  ) {
    return {
      level: "Élevé",
      reason:
        "Sort Med actif sans solution prête, avec risque de dérive de sortie.",
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
      reason:
        "Préparation de sortie incomplète ou coordination à consolider.",
      className: "risk-medium",
    };
  }

  return {
    level: "Faible",
    reason: "Sortie suffisamment préparée à ce stade.",
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
    allPatients.find((p) => String(p.id) === String(id)) || allPatients[0];

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [rightRailOpen, setRightRailOpen] = useState(true);
  const [rightRailTab, setRightRailTab] = useState("postits");

  const [patient, setPatient] = useState({
    ...basePatient,

    dpisynthese: {
      freinPrincipal: basePatient.freinPrincipal,
      blocage: "Attente retour structure aval / coordination partenaire",
      administratifPatient: "Dossier administratif incomplet",
      statutAdministratif: "À consolider",
      source: "DPI",
    },

    situationSortie: {
      besoinsIdentifies: "Retour en structure aval avec coordination",
      orientationSortie: "SMR",
      solutionEnvisagee: "Place aval demandée",
      solutionValidee: "Non",
      pointsVigilance: "Attente confirmation structure et famille",
      source: "Fiche patient / DPI",
    },

    duoActions: {
      passees: [
        {
          id: "p1",
          libelle: "Recueil initial des besoins de sortie",
          responsable: "Sophie Martin",
          date: "2026-03-15T10:00:00",
          source: "Vue duo",
        },
        {
          id: "p2",
          libelle: "Premier contact avec la famille",
          responsable: "Claire Morel",
          date: "2026-03-16T14:10:00",
          source: "Vue duo",
        },
      ],
      enCours: [
        {
          id: "c1",
          libelle: basePatient.prochaineAction,
          responsable: "Assistante sociale - Claire Morel",
          echeance: "2026-03-18T16:00:00",
          source: "Vue duo",
        },
        {
          id: "c2",
          libelle: "Vérification administrative patient",
          responsable: "Bureau des entrées - Nadia Leroy",
          echeance: "2026-03-18T17:30:00",
          source: "Vue duo",
        },
      ],
      aVenir: [
        {
          id: "a1",
          libelle: "Réévaluation staff si pas de réponse",
          responsable: "Dr Bernard",
          echeance: "2026-03-19T09:00:00",
          source: "Vue duo",
        },
      ],
    },

    staff: {
      dernierStaff: "2026-03-17T09:30:00",
      aPresenter: true,
      decision:
        "Maintenir orientation SMR, relance structure aval et suivi administratif.",
      prochaineRevue: "2026-03-19T09:00:00",
      note:
        "Patient à suivre quotidiennement tant que la solution de sortie n’est pas validée.",
      source: "Staff",
    },

    comptesRendusStaff: [
      {
        id: 1,
        date: "2026-03-17T09:30:00",
        titre: "Staff hebdomadaire",
        decision:
          "Orientation SMR maintenue. Relance structure aval. Contrôle administratif demandé.",
        redacteur: "Dr Bernard",
      },
    ],

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
      email: "claire.dupont@example.fr",
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
      reponse: "Famille contactée à 11h10, accord confirmé.",
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

  const [newStaffReport, setNewStaffReport] = useState({
    titre: "",
    decision: "",
    redacteur: "",
  });

  const unresolvedCount = postIts.filter(
    (item) => item.statut !== "Répondu" && item.statut !== "Clos"
  ).length;

  const urgentCount = postIts.filter(
    (item) =>
      item.type === "Urgent" &&
      item.statut !== "Répondu" &&
      item.statut !== "Clos"
  ).length;

  useEffect(() => {
    if (unresolvedCount > 0) {
      setRightRailTab("postits");
    }
  }, [unresolvedCount]);

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

    setPatient((prev) => ({
      ...prev,
      comptesRendusStaff: [report, ...prev.comptesRendusStaff],
    }));

    setNewStaffReport({
      titre: "",
      decision: "",
      redacteur: "",
    });

    setRightRailTab("staff");
    setRightRailOpen(true);
  };

  return (
    <div className="patient-view-page">
      <header className="pv-top-header">
        <div className="pv-header-left">
          <button
            className="pv-icon-btn"
            onClick={() => setMobileNavOpen((prev) => !prev)}
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
            className="pv-ghost-btn coordination-btn"
            onClick={() => setRightRailOpen((prev) => !prev)}
          >
            <span>Coordination patient</span>
            {unresolvedCount > 0 && (
              <span
                className={`coordination-badge ${urgentCount > 0 ? "urgent" : ""}`}
              >
                {urgentCount > 0 ? "!" : unresolvedCount}
              </span>
            )}
          </button>

          <button
            className="pv-crisis-button"
            onClick={() => alert("Ouvrir le formulaire cellule de crise")}
          >
            Déclencher une cellule de crise
          </button>
        </div>
      </header>

      <aside className={`pv-left-sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
        <nav className="pv-left-sidebar-nav">
          <Link to="/dashboard" className="pv-sidebar-link">
            <span className="pv-sidebar-icon">🏠</span>
            <span>Tableau de bord</span>
          </Link>

          <button className="pv-sidebar-link active">
            <span className="pv-sidebar-icon">🧑</span>
            <span>Fiche patient</span>
          </button>

          <button className="pv-sidebar-link">
            <span className="pv-sidebar-icon">🤝</span>
            <span>Vue duo</span>
          </button>

          <button className="pv-sidebar-link">
            <span className="pv-sidebar-icon">⚠️</span>
            <span>Cellule de crise</span>
          </button>
        </nav>
      </aside>

      {mobileNavOpen && (
        <button
          className="pv-mobile-overlay"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Fermer le menu"
        />
      )}

      <aside className={`pv-right-rail ${rightRailOpen ? "open" : "closed"}`}>
        <div className="pv-right-rail-header">
          <div className="pv-right-rail-title">Coordination</div>
        </div>

        <div className="pv-right-tabs">
          <button
            className={rightRailTab === "postits" ? "active" : ""}
            onClick={() => setRightRailTab("postits")}
          >
            Post-it
            {unresolvedCount > 0 && (
              <span className="tab-badge">{unresolvedCount}</span>
            )}
          </button>

          <button
            className={rightRailTab === "contacts" ? "active" : ""}
            onClick={() => setRightRailTab("contacts")}
          >
            Contacts
          </button>

          <button
            className={rightRailTab === "staff" ? "active" : ""}
            onClick={() => setRightRailTab("staff")}
          >
            Staff
          </button>

          <button
            className={rightRailTab === "historique" ? "active" : ""}
            onClick={() => setRightRailTab("historique")}
          >
            Historique
          </button>

          <button
            className={rightRailTab === "crise" ? "active" : ""}
            onClick={() => setRightRailTab("crise")}
          >
            Crise
          </button>
        </div>

        <div className="pv-right-content">
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
                {postIts
                  .slice()
                  .sort((a, b) => {
                    const aOpen = a.statut !== "Répondu" && a.statut !== "Clos";
                    const bOpen = b.statut !== "Répondu" && b.statut !== "Clos";
                    const aUrgent = a.type === "Urgent";
                    const bUrgent = b.type === "Urgent";
                    if (aOpen !== bOpen) return aOpen ? -1 : 1;
                    if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;
                    return 0;
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`pv-postit-card ${getPostItClass(item.type)}`}
                    >
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
                        {item.statut !== "Répondu" &&
                          item.statut !== "Clos" && (
                            <button onClick={() => replyToPostIt(item.id)}>
                              Répondre
                            </button>
                          )}

                        {item.statut !== "Clos" && (
                          <button onClick={() => closePostIt(item.id)}>
                            Clore
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {rightRailTab === "contacts" && (
            <div className="pv-rail-section">
              <h3>Personne de confiance</h3>
              <div className="pv-contact-card">
                <div>
                  <strong>
                    {patient.personneConfiance.nom}{" "}
                    {patient.personneConfiance.prenom}
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
                    {patient.personneAPrevenir.nom}{" "}
                    {patient.personneAPrevenir.prenom}
                  </strong>
                </div>
                <div>{patient.personneAPrevenir.lien}</div>
                <div>{patient.personneAPrevenir.telephone}</div>
                <div>{patient.personneAPrevenir.email}</div>
              </div>
            </div>
          )}

          {rightRailTab === "staff" && (
            <div className="pv-rail-section">
              <h3>Compte rendu staff</h3>

              <div className="pv-new-postit">
                <input
                  type="text"
                  placeholder="Titre du compte rendu"
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
                  placeholder="Rédacteur / acteur responsable"
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

              <div className="pv-history-list">
                {patient.comptesRendusStaff.map((report) => (
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
                  <strong>Décisions :</strong>{" "}
                  {patient.celluleCrise.decisions || "—"}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className={`pv-main ${rightRailOpen ? "with-right-rail" : ""}`}>
        <section className="pv-identity-banner">
          <div className="pv-identity-main">
            <div className="pv-patient-name">
              {patient.nom} {patient.prenom}
            </div>
            <div className="pv-identity-line">
              Né le {formatDate(patient.dateNaissance)} · {patient.age} ans
            </div>
            <div className="pv-identity-line">
              INS {patient.ins} · IEP {patient.iep}
            </div>
            <div className="pv-identity-line">
              Chambre {patient.chambre} · Lit {patient.lit}
            </div>
          </div>

          <div className="pv-location-main">
            <div className="pv-location-service">{patient.service}</div>
            <div className="pv-identity-line">Priorité {patient.priorite}</div>
          </div>
        </section>

        {unresolvedCount > 0 && (
          <section className="pv-alert-strip">
            <span className="pv-alert-icon">⚠</span>
            <span>
              {urgentCount > 0
                ? `${urgentCount} post-it urgent(s) à traiter`
                : `${unresolvedCount} post-it en attente`}
            </span>
            <button
              className="pv-alert-link"
              onClick={() => {
                setRightRailOpen(true);
                setRightRailTab("postits");
              }}
            >
              Ouvrir Coordination
            </button>
          </section>
        )}

        <section className="pv-summary-banner">
          <div className="pv-summary-card">
            <span className="pv-summary-label">Sort Med</span>
            <button
              className={`pv-sortmed-toggle ${
                patient.sortMedActive ? "active" : ""
              }`}
              onClick={toggleSortMed}
            >
              {patient.sortMedActive
                ? `Sort Med J+${diffInDays(patient.sortMedActivatedAt)}`
                : "○ Sort Med"}
            </button>
          </div>

          <div className="pv-summary-card">
            <span className="pv-summary-label">Frein principal</span>
            <strong>{patient.dpisynthese.freinPrincipal}</strong>
          </div>

          <div className="pv-summary-card">
            <span className="pv-summary-label">Blocage</span>
            <strong>{patient.dpisynthese.blocage}</strong>
          </div>

          <div className="pv-summary-card">
            <span className="pv-summary-label">Administratif patient</span>
            <strong>{patient.dpisynthese.administratifPatient}</strong>
          </div>

          <div className="pv-summary-card">
            <span className="pv-summary-label">Maturité sortie</span>
            <strong>{patient.maturiteSortie}</strong>
          </div>

          <div className="pv-summary-card">
            <span className="pv-summary-label">Jours évitables</span>
            <strong>
              {joursEvitables === null ? "—" : `J+${joursEvitables}`}
            </strong>
          </div>

          <div className="pv-summary-card">
            <span className="pv-summary-label">Date prévisionnelle sortie</span>
            <strong>{formatDate(patient.datePrevisionnelleSortie)}</strong>
          </div>

          <div className="pv-summary-card">
            <span className="pv-summary-label">Prochaine action</span>
            <strong>{patient.prochaineAction}</strong>
          </div>
        </section>

        <section className={`pv-risk-banner ${risk.className}`}>
          <div className="pv-risk-title">
            Risque de dérive sortie : {risk.level}
          </div>
          <div className="pv-risk-reason">{risk.reason}</div>
        </section>

        <section className="pv-content-grid">
          <div className="pv-main-column">
            <section className="pv-block">
              <div className="pv-block-title">Synthèse opérationnelle</div>
              <div className="pv-synthesis-text">
                {patient.sortMedActive
                  ? `Sort Med actif, frein principal : ${patient.dpisynthese.freinPrincipal.toLowerCase()}, blocage : ${patient.dpisynthese.blocage.toLowerCase()}, prochaine action : ${patient.prochaineAction.toLowerCase()}.`
                  : `Sort Med non activé, vigilance sur ${patient.dpisynthese.freinPrincipal.toLowerCase()}, prochaine action : ${patient.prochaineAction.toLowerCase()}.`}
              </div>
            </section>

            <section className="pv-block">
              <div className="pv-block-title">Situation de sortie</div>
              <div className="pv-source-tag">
                Source : {patient.situationSortie.source}
              </div>

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
              <div className="pv-block-title">Freins / blocages / administratif</div>
              <div className="pv-source-tag">Source : {patient.dpisynthese.source}</div>

              <div className="pv-block-grid">
                <div>
                  <span className="pv-field-label">Frein principal</span>
                  <div>{patient.dpisynthese.freinPrincipal}</div>
                </div>
                <div>
                  <span className="pv-field-label">Blocage</span>
                  <div>{patient.dpisynthese.blocage}</div>
                </div>
                <div>
                  <span className="pv-field-label">Administratif patient</span>
                  <div>{patient.dpisynthese.administratifPatient}</div>
                </div>
                <div>
                  <span className="pv-field-label">Statut administratif</span>
                  <div>{patient.dpisynthese.statutAdministratif}</div>
                </div>
              </div>
            </section>

            <section className="pv-block">
              <div className="pv-block-title">Actions vue duo</div>
              <div className="pv-source-tag">Source : Vue duo</div>

              <div className="pv-duo-sections">
                <div className="pv-duo-column">
                  <div className="pv-subtitle">Passées</div>
                  {patient.duoActions.passees.map((action) => (
                    <div key={action.id} className="pv-action-card">
                      <div className="pv-action-title">{action.libelle}</div>
                      <div className="pv-action-meta">
                        Responsable : {action.responsable}
                      </div>
                      <div className="pv-action-meta">
                        Date : {formatDateTime(action.date)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pv-duo-column">
                  <div className="pv-subtitle">En cours</div>
                  {patient.duoActions.enCours.map((action) => (
                    <div key={action.id} className="pv-action-card current">
                      <div className="pv-action-title">{action.libelle}</div>
                      <div className="pv-action-meta">
                        Responsable : {action.responsable}
                      </div>
                      <div className="pv-action-meta">
                        Échéance : {formatDateTime(action.echeance)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pv-duo-column">
                  <div className="pv-subtitle">À venir</div>
                  {patient.duoActions.aVenir.map((action) => (
                    <div key={action.id} className="pv-action-card future">
                      <div className="pv-action-title">{action.libelle}</div>
                      <div className="pv-action-meta">
                        Responsable : {action.responsable}
                      </div>
                      <div className="pv-action-meta">
                        Échéance : {formatDateTime(action.echeance)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="pv-block">
              <div className="pv-block-title">Staff</div>
              <div className="pv-source-tag">Source : {patient.staff.source}</div>

              <div className="pv-block-grid">
                <div>
                  <span className="pv-field-label">Présenté en staff</span>
                  <div>{patient.staff.aPresenter ? "Oui" : "Non"}</div>
                </div>
                <div>
                  <span className="pv-field-label">Dernier staff</span>
                  <div>{formatDateTime(patient.staff.dernierStaff)}</div>
                </div>
                <div>
                  <span className="pv-field-label">Prochaine revue</span>
                  <div>{formatDateTime(patient.staff.prochaineRevue)}</div>
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
          </div>

          <div className="pv-side-column">
            <section className="pv-block">
              <div className="pv-block-title">Contacts utiles</div>
              <div className="pv-block-grid">
                <div className="pv-full-width">
                  <span className="pv-field-label">Personne de confiance</span>
                  <div>
                    {patient.personneConfiance.nom}{" "}
                    {patient.personneConfiance.prenom} ·{" "}
                    {patient.personneConfiance.lien}
                  </div>
                </div>
                <div className="pv-full-width">
                  <span className="pv-field-label">Personne à prévenir</span>
                  <div>
                    {patient.personneAPrevenir.nom}{" "}
                    {patient.personneAPrevenir.prenom} ·{" "}
                    {patient.personneAPrevenir.lien}
                  </div>
                </div>
              </div>
            </section>

            <section className="pv-block">
              <div className="pv-block-title">Navigation rapide</div>
              <div className="pv-quick-actions">
                <Link to="/dashboard" className="pv-quick-link">
                  Retour tableau de bord
                </Link>
                <button
                  className="pv-quick-link"
                  onClick={() => {
                    setRightRailOpen(true);
                    setRightRailTab("staff");
                  }}
                >
                  Ouvrir compte rendu staff
                </button>
                <button
                  className="pv-quick-link"
                  onClick={() => {
                    setRightRailOpen(true);
                    setRightRailTab("contacts");
                  }}
                >
                  Ouvrir contacts
                </button>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

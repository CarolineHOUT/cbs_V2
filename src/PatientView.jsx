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
    sortMedActivatedBy: "Claire Morel",
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
    sortMedActivatedBy: "",
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
    sortMedActivatedBy: "Julie Arnaud",
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
      className: "high",
    };
  }

  if (patient.sortMedActive || avoidableDays >= 1) {
    return {
      level: "Modéré",
      badge: "Surveillance",
      reason: "Sortie à piloter avec coordination active.",
      className: "medium",
    };
  }

  return {
    level: "Faible",
    badge: "Stable",
    reason: "Situation actuellement plus stable.",
    className: "low",
  };
}

function getPostItClass(type) {
  switch (type) {
    case "Urgent":
      return "urgent";
    case "Action":
      return "action";
    case "Famille":
      return "family";
    default:
      return "info";
  }
}

export default function PatientView() {
  const { id } = useParams();
  const basePatient =
    patients.find((p) => String(p.id) === String(id)) || patients[0];

  const [railPinned, setRailPinned] = useState(false);
  const [railTab, setRailTab] = useState("contacts");
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
      lu: false,
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
      lu: true,
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

  const unreadCount = postIts.filter((item) => !item.lu).length;

  const risk = useMemo(
    () => getRisk(patient, postIts, staffActions),
    [patient, postIts, staffActions]
  );

  const joursEvitables = patient.sortMedActive
    ? diffInDays(patient.sortMedActivatedAt)
    : null;

  const allActionOwners = useMemo(() => {
    const names = new Set();
    patient.duoActions.passees.forEach((a) => names.add(a.responsable));
    patient.duoActions.enCours.forEach((a) => names.add(a.responsable));
    patient.duoActions.aVenir.forEach((a) => names.add(a.responsable));
    staffActions.forEach((a) => names.add(a.responsable));
    names.add(patient.responsableAction);
    return Array.from(names);
  }, [patient, staffActions]);

  const toggleSortMed = () => {
    setPatient((prev) => {
      if (prev.sortMedActive) {
        return {
          ...prev,
          sortMedActive: false,
          sortMedActivatedAt: null,
          sortMedActivatedBy: "",
        };
      }
      return {
        ...prev,
        sortMedActive: true,
        sortMedActivatedAt: new Date().toISOString(),
        sortMedActivatedBy: "Utilisateur",
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
      lu: false,
    };

    setPostIts((prev) => [item, ...prev]);
    setNewPostIt({ type: "Action", message: "" });
    setRailTab("postits");
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
              lu: true,
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
        item.id === postId ? { ...item, statut: "Clos", lu: true } : item
      )
    );
  };

  const markPostItRead = (postId) => {
    setPostIts((prev) =>
      prev.map((item) =>
        item.id === postId ? { ...item, lu: true } : item
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

    setStaffReports((prev) => [report, ...prev]);
    setNewStaffReport({ titre: "", decision: "", redacteur: "" });
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
    <div className="pv-page">
      <header className="pv-topbar">
        <div className="pv-brand">
          <h1>CARABBAS</h1>
          <p>Fiche patient — pilotage opérationnel</p>
        </div>

        <div className="pv-topbar-actions">
          <Link to="/dashboard" className="pv-header-btn light">
            Retour tableau
          </Link>

          <button
            className="pv-header-btn"
            onClick={() => setRailPinned((prev) => !prev)}
          >
            {railPinned ? "Réduire rail" : "Fixer rail"}
          </button>
        </div>
      </header>

      <div className="pv-shell">
        <main className="pv-main">
          <section className="pv-hero">
            <div className="pv-hero-main">
              <div className="pv-priority-chip">Priorité {patient.priorite}</div>
              <h2>
                {patient.nom} {patient.prenom}
              </h2>
              <div className="pv-hero-row">
                <span>Né(e) le {formatDate(patient.dateNaissance)}</span>
                <span>{patient.age} ans</span>
              </div>
              <div className="pv-hero-row">
                <span>INS {patient.ins}</span>
                <span>IEP {patient.iep}</span>
              </div>
            </div>

            <div className="pv-hero-side">
              <div className="pv-service-badge">{patient.service}</div>
              <div className="pv-room-badge">
                Chambre {patient.chambre} · Lit {patient.lit}
              </div>
            </div>
          </section>

          <section className="pv-command-grid">
            <article className="pv-command-card sortmed">
              <div className="pv-card-label">Sort Med</div>
              <div
                className={`pv-card-value ${
                  patient.sortMedActive ? "sortmed-active" : "sortmed-inactive"
                }`}
              >
                {patient.sortMedActive ? "Activé" : "Non activé"}
              </div>
              <div className="pv-card-subvalue">
                {patient.sortMedActive
                  ? `J+${diffInDays(patient.sortMedActivatedAt)} · ${formatDateTime(
                      patient.sortMedActivatedAt
                    )}`
                  : "Activation manuelle agent"}
              </div>
              {patient.sortMedActive && (
                <div className="pv-card-subvalue subtle">
                  Par {patient.sortMedActivatedBy}
                </div>
              )}
              <button className="pv-inline-btn" onClick={toggleSortMed}>
                {patient.sortMedActive ? "Désactiver" : "Activer"}
              </button>
            </article>

            <article className="pv-command-card frein">
              <div className="pv-card-label">Frein principal</div>
              <div className="pv-card-value">{patient.freinPrincipal}</div>
              <div className="pv-card-subvalue">Source DPI</div>
            </article>

            <article className="pv-command-card blocage">
              <div className="pv-card-label">Blocage</div>
              <div className="pv-card-value">{patient.blocage}</div>
              <div className="pv-card-subvalue">Point de tension actuel</div>
            </article>

            <article className="pv-command-card action">
              <div className="pv-card-label">Prochaine action</div>
              <div className="pv-card-value">{patient.prochaineAction}</div>
              <div className="pv-card-subvalue">{patient.responsableAction}</div>
            </article>
          </section>

          <section className="pv-summary-strip">
            <section className={`pv-risk-banner ${risk.className}`}>
              <div className="pv-risk-head">
                <span className="pv-risk-badge">{risk.badge}</span>
                <strong>Risque de dérive : {risk.level}</strong>
              </div>
              <p>{risk.reason}</p>
            </section>

            <section className="pv-synthesis-panel">
              <div className="pv-panel-headline">
                <h3>Synthèse opérationnelle</h3>
                <span className="pv-panel-tag">Pilotage</span>
              </div>
              <p>
                {patient.sortMedActive
                  ? `Patient médicalement sortant, toujours hospitalisé. Frein principal : ${patient.freinPrincipal.toLowerCase()}. Blocage : ${patient.blocage.toLowerCase()}. Action prioritaire : ${patient.prochaineAction.toLowerCase()}.`
                  : `Sort Med non activé. Vigilance sur ${patient.freinPrincipal.toLowerCase()}. Action prioritaire : ${patient.prochaineAction.toLowerCase()}.`}
              </p>
            </section>
          </section>

          <section className="pv-lower-grid">
            <section className="pv-panel">
              <div className="pv-panel-headline">
                <h3>Situation de sortie</h3>
                <span className="pv-panel-tag">Fiche patient / DPI</span>
              </div>

              <div className="pv-info-grid compact">
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
                <div className="pv-info-item">
                  <span className="pv-field-label">Maturité</span>
                  <strong>{patient.maturiteSortie}</strong>
                </div>
                <div className="pv-info-item">
                  <span className="pv-field-label">Administratif</span>
                  <strong>{patient.administratifPatient}</strong>
                </div>
                <div className="pv-info-item">
                  <span className="pv-field-label">Date sortie prévue</span>
                  <strong>{formatDate(patient.datePrevisionnelleSortie)}</strong>
                </div>
                <div className="pv-info-item">
                  <span className="pv-field-label">Jours évitables</span>
                  <strong>{joursEvitables === null ? "—" : `J+${joursEvitables}`}</strong>
                </div>
                <div className="pv-info-item wide">
                  <span className="pv-field-label">Points de vigilance</span>
                  <strong>{patient.situationSortie.pointsVigilance}</strong>
                </div>
              </div>
            </section>

            <section className="pv-panel">
              <div className="pv-panel-headline">
                <h3>Vue duo</h3>
                <span className="pv-panel-tag">Passées · en cours · à venir</span>
              </div>

              <div className="pv-duo-grid">
                <div className="pv-duo-column">
                  <div className="pv-subtitle">Passées</div>
                  {patient.duoActions.passees.map((action) => (
                    <div key={action.id} className="pv-action-card">
                      <div className="pv-action-title">{action.libelle}</div>
                      <div className="pv-action-meta">{action.responsable}</div>
                      <div className="pv-action-meta">{formatDateTime(action.date)}</div>
                    </div>
                  ))}
                </div>

                <div className="pv-duo-column">
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

                <div className="pv-duo-column">
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

            <section className="pv-panel full">
              <div className="pv-panel-headline">
                <h3>Staff</h3>
                <span className="pv-panel-tag">Compte rendu et actions attendues</span>
              </div>

              <div className="pv-staff-layout">
                <div className="pv-staff-column">
                  <div className="pv-mini-panel">
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

                  <div className="pv-mini-panel">
                    <h4>Derniers comptes rendus</h4>
                    <div className="pv-history-list compact">
                      {staffReports.map((report) => (
                        <div key={report.id} className="pv-history-item">
                          <div className="pv-history-date">
                            {formatDateTime(report.date)}
                          </div>
                          <div className="pv-history-label">{report.titre}</div>
                          <div className="pv-history-detail">{report.decision}</div>
                          <div className="pv-meta">Rédacteur : {report.redacteur}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pv-staff-column">
                  <div className="pv-mini-panel">
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

                  <div className="pv-mini-panel">
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

                          <div className="pv-meta">
                            Responsable : {action.responsable}
                          </div>
                          <div className="pv-meta">
                            Échéance : {formatDate(action.echeance)}
                          </div>
                          <div className="pv-meta">Source : {action.source}</div>

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
                </div>
              </div>
            </section>
          </section>
        </main>

        <aside
          className={`pv-rail ${railPinned ? "pinned" : ""}`}
          onMouseEnter={(e) => {
            if (!railPinned) e.currentTarget.classList.add("hovered");
          }}
          onMouseLeave={(e) => {
            if (!railPinned) e.currentTarget.classList.remove("hovered");
          }}
        >
          <div className="pv-rail-top">
            <button
              className="pv-rail-pin"
              onClick={() => setRailPinned((prev) => !prev)}
              title={railPinned ? "Réduire le rail" : "Fixer le rail"}
            >
              {railPinned ? "⟨" : "⟩"}
            </button>
          </div>

          <div className="pv-rail-nav">
            <button
              className={`pv-rail-tab ${railTab === "contacts" ? "active" : ""}`}
              onClick={() => setRailTab("contacts")}
            >
              <span>👥</span>
              <small>Contacts</small>
            </button>

            <button
              className={`pv-rail-tab ${railTab === "owners" ? "active" : ""}`}
              onClick={() => setRailTab("owners")}
            >
              <span>🧭</span>
              <small>Responsables</small>
            </button>

            <button
              className={`pv-rail-tab ${railTab === "postits" ? "active" : ""}`}
              onClick={() => setRailTab("postits")}
            >
              <span>📝</span>
              <small>Post-it</small>
              {unreadCount > 0 && <em>{unreadCount}</em>}
            </button>

            <button
              className={`pv-rail-tab ${railTab === "reports" ? "active" : ""}`}
              onClick={() => setRailTab("reports")}
            >
              <span>📄</span>
              <small>Compte rendu</small>
            </button>
          </div>

          <div className="pv-rail-content">
            {railTab === "contacts" && (
              <div className="pv-rail-panel">
                <h4>Personne de confiance</h4>
                <div className="pv-contact-card">
                  <strong>
                    {patient.personneConfiance.nom} {patient.personneConfiance.prenom}
                  </strong>
                  <div>{patient.personneConfiance.lien}</div>
                  <div>{patient.personneConfiance.telephone}</div>
                  <div>{patient.personneConfiance.email}</div>
                </div>

                <h4>Personne à prévenir</h4>
                <div className="pv-contact-card">
                  <strong>
                    {patient.personneAPrevenir.nom} {patient.personneAPrevenir.prenom}
                  </strong>
                  <div>{patient.personneAPrevenir.lien}</div>
                  <div>{patient.personneAPrevenir.telephone}</div>
                  <div>{patient.personneAPrevenir.email}</div>
                </div>
              </div>
            )}

            {railTab === "owners" && (
              <div className="pv-rail-panel">
                <h4>Responsables des actions</h4>
                <div className="pv-owner-list">
                  {allActionOwners.map((owner) => (
                    <div key={owner} className="pv-owner-card">
                      {owner}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {railTab === "postits" && (
              <div className="pv-rail-panel">
                <h4>Post-it</h4>

                <div className="pv-mini-form">
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
                      className={`pv-postit-card ${getPostItClass(item.type)} ${
                        !item.lu ? "unread" : ""
                      }`}
                      onClick={() => markPostItRead(item.id)}
                    >
                      <div className="pv-postit-head">
                        <span className="pv-postit-type">{item.type}</span>
                        <span className="pv-postit-status">{item.statut}</span>
                      </div>

                      <div className="pv-postit-message">{item.message}</div>

                      <div className="pv-meta">
                        {item.auteur} · {formatDateTime(item.createdAt)}
                      </div>

                      {item.reponse && (
                        <div className="pv-postit-response">
                          <strong>Réponse</strong>
                          <div>{item.reponse}</div>
                          <div className="pv-meta">
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
                          <div className="pv-postit-actions">
                            <button onClick={() => sendReply(item.id)}>Valider</button>
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
              </div>
            )}

            {railTab === "reports" && (
              <div className="pv-rail-panel">
                <h4>Compte rendu</h4>
                <div className="pv-history-list compact">
                  {staffReports.map((report) => (
                    <div key={report.id} className="pv-history-item">
                      <div className="pv-history-date">
                        {formatDateTime(report.date)}
                      </div>
                      <div className="pv-history-label">{report.titre}</div>
                      <div className="pv-history-detail">{report.decision}</div>
                      <div className="pv-meta">Rédacteur : {report.redacteur}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

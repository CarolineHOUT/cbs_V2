import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";

const initialPatients = [
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
    synthese: "Sort Med actif, solution non prête, place aval en attente.",
    urgentPostItCount: 1,
    unresolvedPostItCount: 2,
    prochaineRevue: "2026-03-19",
    prochaineAction: "Relance structure aval",
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
    synthese: "Sort Med actif, besoin de coordination sociale.",
    urgentPostItCount: 0,
    unresolvedPostItCount: 1,
    prochaineRevue: "2026-03-18",
    prochaineAction: "Point assistante sociale",
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
    synthese: "Préparation de sortie à renforcer avant Sort Med.",
    urgentPostItCount: 0,
    unresolvedPostItCount: 0,
    prochaineRevue: "2026-03-20",
    prochaineAction: "Recueil des besoins",
  },
  {
    id: 4,
    priorite: 4,
    nom: "MOREL",
    prenom: "Sébastien",
    dateNaissance: "1969-02-12",
    age: 56,
    iep: "54567890",
    ins: "1 69 02 12 888 999",
    service: "Chirurgie",
    chambre: "C07",
    lit: "01",
    sortMedActive: true,
    sortMedActivatedAt: "2026-03-13T11:15:00",
    maturiteSortie: "Solution prête",
    freinPrincipal: "Administratif",
    synthese: "Solution prête, clôture administrative à finaliser.",
    urgentPostItCount: 0,
    unresolvedPostItCount: 1,
    prochaineRevue: "2026-03-18",
    prochaineAction: "Finaliser validation",
  },
  {
    id: 5,
    priorite: 5,
    nom: "DEAN",
    prenom: "Jane",
    dateNaissance: "1958-08-12",
    age: 67,
    iep: "99887766",
    ins: "1 58 08 12 222 111",
    service: "Oncologie",
    chambre: "A05",
    lit: "05",
    sortMedActive: false,
    sortMedActivatedAt: null,
    maturiteSortie: "Organisation sortie",
    freinPrincipal: "Place aval",
    synthese: "Organisation en cours, attente retour structure aval.",
    urgentPostItCount: 1,
    unresolvedPostItCount: 1,
    prochaineRevue: "2026-03-21",
    prochaineAction: "Relance place aval",
  },
  {
    id: 6,
    priorite: 6,
    nom: "BERNARD",
    prenom: "Luc",
    dateNaissance: "1961-06-03",
    age: 64,
    iep: "11223344",
    ins: "1 61 06 03 111 222",
    service: "Neurologie",
    chambre: "D03",
    lit: "02",
    sortMedActive: true,
    sortMedActivatedAt: "2026-03-15T14:00:00",
    maturiteSortie: "Organisation sortie",
    freinPrincipal: "Famille",
    synthese: "Sort Med actif, validation famille attendue.",
    urgentPostItCount: 0,
    unresolvedPostItCount: 1,
    prochaineRevue: "2026-03-19",
    prochaineAction: "Appeler la famille",
  },
];

const services = [
  "Pneumologie",
  "Médecine",
  "Oncologie",
  "Chirurgie",
  "Neurologie",
];

const maturites = [
  "Besoins identifiés",
  "Organisation sortie",
  "Solution prête",
];

const freins = [
  "Social",
  "Place aval",
  "Coordination",
  "Famille",
  "Administratif",
];

const quickFilters = [
  { key: "sortMedOnly", label: "Sort Med actifs" },
  { key: "withoutSolutionOnly", label: "Sans solution" },
  { key: "avoidableDaysOnly", label: "Jours évitables > 0" },
  { key: "urgentOnly", label: "Urgents" },
  { key: "unansweredOnly", label: "Post-it non répondus" },
];

const capacityByService = {
  Pneumologie: 30,
  Médecine: 40,
  Oncologie: 20,
  Chirurgie: 35,
  Neurologie: 25,
};

function formatDate(dateString) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("fr-FR");
}

function diffInDays(fromDate) {
  if (!fromDate) return 0;
  const start = new Date(fromDate);
  const now = new Date();
  const ms = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function toggleInArray(value, list) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function getDaysClass(days) {
  if (days >= 3) return "critical";
  if (days >= 1) return "warning";
  return "neutral";
}

function getOccupationClass(value) {
  if (value >= 90) return "danger";
  if (value >= 75) return "warning";
  return "normal";
}

function getPatientPriorityScore(patient) {
  let score = 0;
  if (patient.sortMedActive) score += 50;
  if (patient.maturiteSortie !== "Solution prête") score += 20;
  if (patient.freinPrincipal) score += 10;
  score += diffInDays(patient.sortMedActivatedAt) * 5;
  score += patient.urgentPostItCount * 8;
  score += patient.unresolvedPostItCount * 3;
  return score;
}

export default function Dashboard() {
  const [patients, setPatients] = useState(initialPatients);
  const [leftMenuOpen, setLeftMenuOpen] = useState(true);
  const [rightRailOpen, setRightRailOpen] = useState(true);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedMaturites, setSelectedMaturites] = useState([]);
  const [selectedFreins, setSelectedFreins] = useState([]);
  const [selectedQuickFilters, setSelectedQuickFilters] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState([]);

  const coordinationCount = patients.filter(
    (p) => p.unresolvedPostItCount > 0
  ).length;

  const urgentCoordinationCount = patients.filter(
    (p) => p.urgentPostItCount > 0
  ).length;

  const toggleSortMed = (patientId) => {
    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id !== patientId) return patient;
        if (patient.sortMedActive) {
          return { ...patient, sortMedActive: false, sortMedActivatedAt: null };
        }
        return {
          ...patient,
          sortMedActive: true,
          sortMedActivatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const toggleExpandedRow = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return patients
      .filter((patient) => {
        const matchesService =
          selectedServices.length === 0 ||
          selectedServices.includes(patient.service);

        const matchesMaturite =
          selectedMaturites.length === 0 ||
          selectedMaturites.includes(patient.maturiteSortie);

        const matchesFrein =
          selectedFreins.length === 0 ||
          selectedFreins.includes(patient.freinPrincipal);

        const matchesSearch =
          !query ||
          [
            patient.nom,
            patient.prenom,
            patient.iep,
            patient.ins,
            patient.service,
            patient.chambre,
            patient.lit,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);

        const matchesSortMed =
          !selectedQuickFilters.includes("sortMedOnly") || patient.sortMedActive;

        const matchesWithoutSolution =
          !selectedQuickFilters.includes("withoutSolutionOnly") ||
          (patient.sortMedActive && patient.maturiteSortie !== "Solution prête");

        const matchesAvoidableDays =
          !selectedQuickFilters.includes("avoidableDaysOnly") ||
          (patient.sortMedActive && diffInDays(patient.sortMedActivatedAt) > 0);

        const matchesUrgent =
          !selectedQuickFilters.includes("urgentOnly") ||
          patient.urgentPostItCount > 0;

        const matchesUnanswered =
          !selectedQuickFilters.includes("unansweredOnly") ||
          patient.unresolvedPostItCount > 0;

        return (
          matchesService &&
          matchesMaturite &&
          matchesFrein &&
          matchesSearch &&
          matchesSortMed &&
          matchesWithoutSolution &&
          matchesAvoidableDays &&
          matchesUrgent &&
          matchesUnanswered
        );
      })
      .sort((a, b) => getPatientPriorityScore(b) - getPatientPriorityScore(a));
  }, [
    patients,
    selectedServices,
    selectedMaturites,
    selectedFreins,
    selectedQuickFilters,
    search,
  ]);

  const kpis = useMemo(() => {
    const occupiedBeds = filteredPatients.length;

    const selectedPool =
      selectedServices.length > 0 ? selectedServices : Object.keys(capacityByService);

    const capacityBeds = selectedPool.reduce(
      (sum, service) => sum + (capacityByService[service] || 0),
      0
    );

    const sortMedCount = filteredPatients.filter((p) => p.sortMedActive).length;

    const withoutSolution = filteredPatients.filter(
      (p) => p.sortMedActive && p.maturiteSortie !== "Solution prête"
    ).length;

    const avoidableDays = filteredPatients
      .filter((p) => p.sortMedActive)
      .reduce((sum, p) => sum + diffInDays(p.sortMedActivatedAt), 0);

    const recoverableBeds = filteredPatients.filter(
      (p) => p.sortMedActive && p.maturiteSortie === "Solution prête"
    ).length;

    return {
      occupiedBeds,
      capacityBeds,
      sortMedCount,
      withoutSolution,
      avoidableDays,
      recoverableBeds,
    };
  }, [filteredPatients, selectedServices]);

  const servicesRailData = useMemo(() => {
    return services
      .map((service) => {
        const patientsInService = patients.filter((p) => p.service === service);

        const problematicPatients = patientsInService.filter(
          (p) =>
            p.sortMedActive ||
            p.maturiteSortie !== "Solution prête" ||
            p.urgentPostItCount > 0 ||
            p.unresolvedPostItCount > 0
        );

        const capacity = capacityByService[service] || 0;
        const occupation = capacity
          ? Math.round((patientsInService.length / capacity) * 100)
          : 0;

        return {
          service,
          occupation,
          problemCount: problematicPatients.length,
        };
      })
      .sort((a, b) => b.occupation - a.occupation);
  }, [patients]);

  const handleServiceQuickFilter = (service) => {
    setSelectedServices([service]);
    setRightRailOpen(false);
  };

  const clearFilters = () => {
    setSelectedServices([]);
    setSelectedMaturites([]);
    setSelectedFreins([]);
    setSelectedQuickFilters([]);
    setSearch("");
  };

  return (
    <div className="dashboard-page">
      <header className="top-header">
        <div className="header-left">
          <button
            className="icon-btn"
            onClick={() => setLeftMenuOpen((prev) => !prev)}
            aria-label="Ouvrir le menu"
          >
            ☰
          </button>

          <div className="brand-block">
            <h1>CARABBAS</h1>
            <p>Pilotage des sorties hospitalières complexes</p>
          </div>
        </div>

        <div className="header-right">
          <button
            className="ghost-btn coordination-btn"
            onClick={() => setRightRailOpen((prev) => !prev)}
          >
            <span>Coordination</span>

            {coordinationCount > 0 && (
              <span
                className={`coordination-badge ${
                  urgentCoordinationCount > 0 ? "urgent" : ""
                }`}
              >
                {urgentCoordinationCount > 0 ? "!" : coordinationCount}
              </span>
            )}
          </button>

          <button
            className="crisis-button"
            onClick={() => alert("Ouvrir le formulaire cellule de crise")}
          >
            Déclencher une cellule de crise
          </button>
        </div>
      </header>

      <aside className={`left-sidebar ${leftMenuOpen ? "expanded" : "collapsed"}`}>
        <nav className="left-sidebar-nav">
          <button className="sidebar-link active">
            <span className="sidebar-icon">🏠</span>
            {leftMenuOpen && <span>Tableau de bord</span>}
          </button>

          <button className="sidebar-link">
            <span className="sidebar-icon">🧑</span>
            {leftMenuOpen && <span>Patients</span>}
          </button>

          <button className="sidebar-link">
            <span className="sidebar-icon">🤝</span>
            {leftMenuOpen && <span>Vue duo</span>}
          </button>

          <button className="sidebar-link">
            <span className="sidebar-icon">⚠️</span>
            {leftMenuOpen && <span>Cellule de crise</span>}
          </button>
        </nav>
      </aside>

      <aside className={`right-rail ${rightRailOpen ? "open" : "closed"}`}>
        <div className="section-title">Services en tension</div>

        <div className="rail-list">
          {servicesRailData.map((item) => (
            <button
              key={item.service}
              className="rail-service-card"
              onClick={() => handleServiceQuickFilter(item.service)}
            >
              <div className="rail-card-top">
                <span className="rail-service-name">{item.service}</span>
                <span
                  className={`rail-service-occupation ${getOccupationClass(
                    item.occupation
                  )}`}
                >
                  {item.occupation}%
                </span>
              </div>

              <div className="rail-card-bottom">
                <span>{item.problemCount} patient(s) à traiter</span>
                <span className="rail-link">Voir</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main
        className={`dashboard-main ${
          leftMenuOpen ? "with-left-sidebar" : "with-left-sidebar-collapsed"
        } ${rightRailOpen ? "with-right-rail" : "without-right-rail"}`}
      >
        <section className="kpi-row">
          <div className="kpi-card teal">
            <span className="kpi-label">Lits occupés / capacité</span>
            <strong className="kpi-value">
              {kpis.occupiedBeds} / {kpis.capacityBeds}
            </strong>
          </div>

          <div className="kpi-card blue">
            <span className="kpi-label">Sort Med</span>
            <strong className="kpi-value">{kpis.sortMedCount}</strong>
          </div>

          <div className="kpi-card orange">
            <span className="kpi-label">Patients sans solution</span>
            <strong className="kpi-value">{kpis.withoutSolution}</strong>
          </div>

          <div className="kpi-card red">
            <span className="kpi-label">Jours évitables</span>
            <strong className="kpi-value">{kpis.avoidableDays}</strong>
          </div>

          <div className="kpi-card light">
            <span className="kpi-label">Lits récupérables</span>
            <strong className="kpi-value">{kpis.recoverableBeds}</strong>
          </div>
        </section>

        <section className="filters-panel">
          <div className="filters-header">
            <div className="filters-title">Filtres</div>

            <div className="filters-actions">
              <button
                className="toggle-advanced-btn"
                onClick={() => setAdvancedFiltersOpen((prev) => !prev)}
              >
                {advancedFiltersOpen ? "▴ Filtres avancés" : "▾ Filtres avancés"}
              </button>

              <button className="reset-filters-btn" onClick={clearFilters}>
                Réinitialiser
              </button>
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-label">Services</div>
            <div className="chip-row">
              {services.map((service) => (
                <button
                  key={service}
                  className={`chip ${
                    selectedServices.includes(service) ? "selected" : ""
                  }`}
                  onClick={() =>
                    setSelectedServices((prev) => toggleInArray(service, prev))
                  }
                >
                  {service}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-label">Raccourcis pilotage</div>
            <div className="chip-row">
              {quickFilters.map((item) => (
                <button
                  key={item.key}
                  className={`chip ${
                    selectedQuickFilters.includes(item.key) ? "selected" : ""
                  }`}
                  onClick={() =>
                    setSelectedQuickFilters((prev) =>
                      toggleInArray(item.key, prev)
                    )
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-search">
            <input
              type="text"
              placeholder="Nom / INS / IEP / chambre / lit"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {advancedFiltersOpen && (
            <div className="advanced-filters">
              <div className="filter-group">
                <div className="filter-label">Maturité sortie</div>
                <div className="chip-row">
                  {maturites.map((item) => (
                    <button
                      key={item}
                      className={`chip ${
                        selectedMaturites.includes(item) ? "selected" : ""
                      }`}
                      onClick={() =>
                        setSelectedMaturites((prev) => toggleInArray(item, prev))
                      }
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <div className="filter-label">Frein principal</div>
                <div className="chip-row">
                  {freins.map((item) => (
                    <button
                      key={item}
                      className={`chip ${
                        selectedFreins.includes(item) ? "selected" : ""
                      }`}
                      onClick={() =>
                        setSelectedFreins((prev) => toggleInArray(item, prev))
                      }
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="patients-card desktop-table">
          <div className="section-title">Patients prioritaires</div>

          <div className="patients-table-wrapper">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Priorité</th>
                  <th>Identité patient</th>
                  <th>Localisation</th>
                  <th>Sort Med</th>
                  <th>Maturité sortie</th>
                  <th>Frein principal</th>
                  <th>Jours évitables</th>
                  <th>Prochaine action</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredPatients.map((patient) => {
                  const avoidableDays = patient.sortMedActive
                    ? diffInDays(patient.sortMedActivatedAt)
                    : null;
                  const isExpanded = expandedRows.includes(patient.id);

                  return (
                    <React.Fragment key={patient.id}>
                      <tr className="patient-row">
                        <td>
                          <span className="priority-badge">{patient.priorite}</span>
                        </td>

                        <td>
                          <div className="identity-block">
                            <Link
                              to={`/patient/${patient.id}`}
                              className="patient-link"
                            >
                              {patient.nom} {patient.prenom}
                            </Link>

                            <div className="identity-line">
                              Né le {formatDate(patient.dateNaissance)} ·{" "}
                              {patient.age} ans
                            </div>

                            <div className="identity-line">
                              IEP {patient.iep} · INS {patient.ins}
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="location-block">
                            <div className="location-service">{patient.service}</div>
                            <div className="location-line">
                              Ch. {patient.chambre} · Lit {patient.lit}
                            </div>
                          </div>
                        </td>

                        <td>
                          <button
                            className={`sort-med-toggle ${
                              patient.sortMedActive ? "active" : ""
                            }`}
                            onClick={() => toggleSortMed(patient.id)}
                          >
                            {patient.sortMedActive
                              ? `Sort Med J+${diffInDays(
                                  patient.sortMedActivatedAt
                                )}`
                              : "○ Sort Med"}
                          </button>
                        </td>

                        <td>
                          <span className="maturity-badge">
                            {patient.maturiteSortie}
                          </span>
                        </td>

                        <td>
                          <span className="frein-badge">
                            {patient.freinPrincipal}
                          </span>
                        </td>

                        <td>
                          {avoidableDays === null ? (
                            <span className="days-empty">—</span>
                          ) : (
                            <span
                              className={`days-badge ${getDaysClass(
                                avoidableDays
                              )}`}
                            >
                              J+{avoidableDays}
                            </span>
                          )}
                        </td>

                        <td>
                          <span className="next-action-text">
                            {patient.prochaineAction}
                          </span>
                        </td>

                        <td>
                          <button
                            className="expand-btn"
                            onClick={() => toggleExpandedRow(patient.id)}
                          >
                            {isExpanded ? "Réduire" : "Détail"}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="expanded-row">
                          <td colSpan="9">
                            <div className="expanded-content">
                              <div className="expanded-block">
                                <div className="expanded-label">Synthèse</div>
                                <div>{patient.synthese}</div>
                              </div>

                              <div className="expanded-block">
                                <div className="expanded-label">
                                  Prochaine revue
                                </div>
                                <div>{formatDate(patient.prochaineRevue)}</div>
                              </div>

                              <div className="expanded-block">
                                <div className="expanded-label">Coordination</div>
                                <div>
                                  {patient.urgentPostItCount} urgent(s) ·{" "}
                                  {patient.unresolvedPostItCount} non répondu(s)
                                </div>
                              </div>

                              <div className="expanded-actions">
                                <Link
                                  to={`/patient/${patient.id}`}
                                  className="open-patient-btn"
                                >
                                  Ouvrir la fiche patient
                                </Link>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan="9" className="empty-row">
                      Aucun patient ne correspond aux filtres.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mobile-cards">
          <div className="section-title">Patients prioritaires</div>

          <div className="patient-cards-list">
            {filteredPatients.map((patient) => {
              const avoidableDays = patient.sortMedActive
                ? diffInDays(patient.sortMedActivatedAt)
                : null;
              const isExpanded = expandedRows.includes(patient.id);

              return (
                <article className="patient-card" key={patient.id}>
                  <div className="patient-card-top">
                    <span className="priority-badge">{patient.priorite}</span>
                    <button
                      className="expand-btn"
                      onClick={() => toggleExpandedRow(patient.id)}
                    >
                      {isExpanded ? "Réduire" : "Détail"}
                    </button>
                  </div>

                  <div className="identity-block">
                    <Link to={`/patient/${patient.id}`} className="patient-link">
                      {patient.nom} {patient.prenom}
                    </Link>
                    <div className="identity-line">
                      Né le {formatDate(patient.dateNaissance)} · {patient.age} ans
                    </div>
                    <div className="identity-line">
                      IEP {patient.iep} · INS {patient.ins}
                    </div>
                  </div>

                  <div className="location-block mobile-space">
                    <div className="location-service">{patient.service}</div>
                    <div className="location-line">
                      Ch. {patient.chambre} · Lit {patient.lit}
                    </div>
                  </div>

                  <div className="patient-card-tags">
                    <button
                      className={`sort-med-toggle ${
                        patient.sortMedActive ? "active" : ""
                      }`}
                      onClick={() => toggleSortMed(patient.id)}
                    >
                      {patient.sortMedActive
                        ? `Sort Med J+${diffInDays(patient.sortMedActivatedAt)}`
                        : "○ Sort Med"}
                    </button>

                    <span className="maturity-badge">
                      {patient.maturiteSortie}
                    </span>

                    <span className="frein-badge">{patient.freinPrincipal}</span>

                    {avoidableDays === null ? (
                      <span className="days-empty mobile-days">—</span>
                    ) : (
                      <span
                        className={`days-badge ${getDaysClass(
                          avoidableDays
                        )}`}
                      >
                        J+{avoidableDays}
                      </span>
                    )}
                  </div>

                  <div className="next-action-text mobile-space">
                    {patient.prochaineAction}
                  </div>

                  {isExpanded && (
                    <div className="mobile-expanded">
                      <div className="expanded-block">
                        <div className="expanded-label">Synthèse</div>
                        <div>{patient.synthese}</div>
                      </div>

                      <div className="expanded-block">
                        <div className="expanded-label">Prochaine revue</div>
                        <div>{formatDate(patient.prochaineRevue)}</div>
                      </div>

                      <Link
                        to={`/patient/${patient.id}`}
                        className="open-patient-btn"
                      >
                        Ouvrir la fiche patient
                      </Link>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

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
    synthese: "Sort Med actif, solution non prête, place aval en attente.",
    urgentPostItCount: 1,
    unresolvedPostItCount: 2,
    prochaineRevue: "2026-03-19",
    prochaineAction: "Relance structure aval",
    responsableAction: "Claire Morel",
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
    sortMedActivatedBy: "Nora Simon",
    maturiteSortie: "Besoins identifiés",
    freinPrincipal: "Social",
    synthese: "Sort Med actif, besoin de coordination sociale.",
    urgentPostItCount: 0,
    unresolvedPostItCount: 1,
    prochaineRevue: "2026-03-18",
    prochaineAction: "Point assistante sociale",
    responsableAction: "Nora Simon",
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
    service: "Médecine polyvalente",
    chambre: "B10",
    lit: "02",
    sortMedActive: false,
    sortMedActivatedAt: null,
    sortMedActivatedBy: "",
    maturiteSortie: "Besoins identifiés",
    freinPrincipal: "Coordination",
    synthese: "Préparation de sortie à renforcer avant Sort Med.",
    urgentPostItCount: 0,
    unresolvedPostItCount: 0,
    prochaineRevue: "2026-03-20",
    prochaineAction: "Recueil des besoins",
    responsableAction: "Camille Roux",
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
    sortMedActivatedBy: "Laura Petit",
    maturiteSortie: "Solution prête",
    freinPrincipal: "Administratif",
    synthese: "Solution prête, clôture administrative à finaliser.",
    urgentPostItCount: 0,
    unresolvedPostItCount: 1,
    prochaineRevue: "2026-03-18",
    prochaineAction: "Finaliser validation",
    responsableAction: "Laura Petit",
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
    synthese: "Organisation en cours, attente retour structure aval.",
    urgentPostItCount: 1,
    unresolvedPostItCount: 1,
    prochaineRevue: "2026-03-21",
    prochaineAction: "Relance place aval",
    responsableAction: "Claire Morel",
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
    sortMedActivatedBy: "Sophie Martin",
    maturiteSortie: "Organisation sortie",
    freinPrincipal: "Famille",
    synthese: "Sort Med actif, validation famille attendue.",
    urgentPostItCount: 0,
    unresolvedPostItCount: 1,
    prochaineRevue: "2026-03-19",
    prochaineAction: "Appeler la famille",
    responsableAction: "Sophie Martin",
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
    synthese: "Sort Med actif, besoin d’aval avant départ.",
    urgentPostItCount: 0,
    unresolvedPostItCount: 2,
    prochaineRevue: "2026-03-18",
    prochaineAction: "Relance SSR cardio",
    responsableAction: "Julie Arnaud",
  },
  {
    id: 8,
    priorite: 5,
    nom: "ROUSSEAU",
    prenom: "Nina",
    dateNaissance: "1963-09-09",
    age: 62,
    ins: "1 63 09 09 123 222",
    iep: "77889900",
    service: "Néphrologie",
    chambre: "N04",
    lit: "02",
    sortMedActive: false,
    sortMedActivatedAt: null,
    sortMedActivatedBy: "",
    maturiteSortie: "Besoins identifiés",
    freinPrincipal: "Administratif",
    synthese: "Dossier à consolider avant activation Sort Med.",
    urgentPostItCount: 0,
    unresolvedPostItCount: 1,
    prochaineRevue: "2026-03-20",
    prochaineAction: "Compléter dossier administratif",
    responsableAction: "Nadia Leroy",
  },
  {
    id: 9,
    priorite: 3,
    nom: "GARCIA",
    prenom: "Louis",
    dateNaissance: "1950-01-25",
    age: 76,
    ins: "1 50 01 25 444 333",
    iep: "66554433",
    service: "Gastro",
    chambre: "G11",
    lit: "01",
    sortMedActive: true,
    sortMedActivatedAt: "2026-03-16T09:45:00",
    sortMedActivatedBy: "Camille Roux",
    maturiteSortie: "Besoins identifiés",
    freinPrincipal: "Coordination",
    synthese: "Sort Med actif, plusieurs intervenants à synchroniser.",
    urgentPostItCount: 1,
    unresolvedPostItCount: 2,
    prochaineRevue: "2026-03-18",
    prochaineAction: "Organiser point équipe mobile",
    responsableAction: "Camille Roux",
  },
];

const services = [
  "Pneumologie",
  "Médecine polyvalente",
  "Oncologie",
  "Chirurgie",
  "Neurologie",
  "Cardiologie",
  "Néphrologie",
  "Gastro",
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
  "Médecine polyvalente": 36,
  Oncologie: 20,
  Chirurgie: 35,
  Neurologie: 25,
  Cardiologie: 24,
  Néphrologie: 18,
  Gastro: 22,
};

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

export default function Dashboard() {
  const [patients, setPatients] = useState(initialPatients);
  const [leftMenuOpen, setLeftMenuOpen] = useState(true);
  const [rightRailOpen, setRightRailOpen] = useState(false);
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
          return {
            ...patient,
            sortMedActive: false,
            sortMedActivatedAt: null,
            sortMedActivatedBy: "",
          };
        }
        return {
          ...patient,
          sortMedActive: true,
          sortMedActivatedAt: new Date().toISOString(),
          sortMedActivatedBy: "Utilisateur",
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
      .sort((a, b) => a.priorite - b.priorite);
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
      selectedServices.length > 0
        ? selectedServices
        : Object.keys(capacityByService);

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
    <div className="db-page">
      <header className="db-topbar">
        <div className="db-topbar-left">
          <button
            className="db-icon-btn"
            onClick={() => setLeftMenuOpen((prev) => !prev)}
            aria-label="Ouvrir le menu"
          >
            ☰
          </button>

          <div className="db-brand">
            <h1>CARABBAS</h1>
            <p>Pilotage des sorties hospitalières complexes</p>
          </div>
        </div>

        <div className="db-topbar-right">
          <button
            className="db-soft-btn"
            onClick={() => setRightRailOpen((prev) => !prev)}
          >
            <span>Services en tension</span>
            {coordinationCount > 0 && (
              <span
                className={`db-count-badge ${
                  urgentCoordinationCount > 0 ? "urgent" : ""
                }`}
              >
                {urgentCoordinationCount > 0 ? "!" : coordinationCount}
              </span>
            )}
          </button>

          <button
            className="db-crisis-btn"
            onClick={() => alert("Ouvrir le formulaire cellule de crise")}
          >
            Déclencher une cellule de crise
          </button>
        </div>
      </header>

      <aside
        className={`db-left-sidebar ${leftMenuOpen ? "expanded" : "collapsed"}`}
      >
        <nav className="db-left-nav">
          <button className="db-nav-link active">
            <span className="db-nav-icon">🏠</span>
            {leftMenuOpen && <span>Tableau de bord</span>}
          </button>

          <button className="db-nav-link">
            <span className="db-nav-icon">🤝</span>
            {leftMenuOpen && <span>Vue duo</span>}
          </button>

          <button className="db-nav-link">
            <span className="db-nav-icon">⚠️</span>
            {leftMenuOpen && <span>Cellule de crise</span>}
          </button>
        </nav>
      </aside>

      <aside className={`db-right-rail ${rightRailOpen ? "open" : "closed"}`}>
        <div className="db-section-title">Services en tension</div>

        <div className="db-rail-list">
          {servicesRailData.map((item) => (
            <button
              key={item.service}
              className="db-rail-card"
              onClick={() => handleServiceQuickFilter(item.service)}
            >
              <div className="db-rail-card-head">
                <span className="db-rail-service">{item.service}</span>
                <span
                  className={`db-rail-occupation ${getOccupationClass(
                    item.occupation
                  )}`}
                >
                  {item.occupation}%
                </span>
              </div>

              <div className="db-rail-card-foot">
                <span>{item.problemCount} patient(s) à traiter</span>
                <span className="db-rail-view">Filtrer</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main
        className={`db-main ${
          leftMenuOpen ? "with-left-expanded" : "with-left-collapsed"
        } ${rightRailOpen ? "with-right-open" : "with-right-closed"}`}
      >
        <section className="db-kpi-row">
          <div className="db-kpi soft-blue">
            <span className="db-kpi-label">Lits occupés / capacité</span>
            <strong className="db-kpi-value">
              {kpis.occupiedBeds} / {kpis.capacityBeds}
            </strong>
          </div>

          <div className="db-kpi soft-amber">
            <span className="db-kpi-label">Sort Med</span>
            <strong className="db-kpi-value">{kpis.sortMedCount}</strong>
          </div>

          <div className="db-kpi soft-orange signal">
            <span className="db-kpi-label">Patients sans solution</span>
            <strong className="db-kpi-value">{kpis.withoutSolution}</strong>
          </div>

          <div className="db-kpi soft-red signal">
            <span className="db-kpi-label">Jours évitables</span>
            <strong className="db-kpi-value">{kpis.avoidableDays}</strong>
          </div>

          <div className="db-kpi soft-green">
            <span className="db-kpi-label">Lits récupérables</span>
            <strong className="db-kpi-value">{kpis.recoverableBeds}</strong>
          </div>
        </section>

        <section className="db-filters">
          <div className="db-filters-head">
            <div className="db-filters-title">Filtres</div>

            <div className="db-filters-actions">
              <button
                className="db-compact-btn"
                onClick={() => setAdvancedFiltersOpen((prev) => !prev)}
              >
                {advancedFiltersOpen ? "▴ Filtres avancés" : "▾ Filtres avancés"}
              </button>

              <button className="db-compact-btn" onClick={clearFilters}>
                Réinitialiser
              </button>
            </div>
          </div>

          <div className="db-filter-group">
            <div className="db-filter-label">Services</div>
            <div className="db-chip-row">
              {services.map((service) => (
                <button
                  key={service}
                  className={`db-chip ${
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

          <div className="db-filter-group">
            <div className="db-filter-label">Raccourcis pilotage</div>
            <div className="db-chip-row">
              {quickFilters.map((item) => (
                <button
                  key={item.key}
                  className={`db-chip ${
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

          <div className="db-search-row">
            <input
              type="text"
              placeholder="Nom / INS / IEP / chambre / lit"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {advancedFiltersOpen && (
            <div className="db-advanced-filters">
              <div className="db-filter-group">
                <div className="db-filter-label">Maturité sortie</div>
                <div className="db-chip-row">
                  {maturites.map((item) => (
                    <button
                      key={item}
                      className={`db-chip ${
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

              <div className="db-filter-group">
                <div className="db-filter-label">Frein principal</div>
                <div className="db-chip-row">
                  {freins.map((item) => (
                    <button
                      key={item}
                      className={`db-chip ${
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

        <section className="db-table-card desktop-only">
          <div className="db-section-title">Patients</div>

          <div className="db-table-wrap">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Priorité / identité</th>
                  <th>Localisation</th>
                  <th>Sort Med</th>
                  <th>Blocage</th>
                  <th>Action</th>
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
                      <tr className="db-row">
                        <td>
                          <div className="db-cell-identity">
                            <div className="db-priority-line">
                              <span className="db-priority-mark">
                                P{patient.priorite}
                              </span>
                              <Link
                                to={`/patient/${patient.id}`}
                                className="db-patient-link"
                              >
                                {patient.nom} {patient.prenom}
                              </Link>
                            </div>

                            <div className="db-subline">
                              Né le {formatDate(patient.dateNaissance)} · {patient.age} ans
                            </div>

                            <div className="db-subline">
                              INS {patient.ins} · IEP {patient.iep}
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="db-cell-location">
                            <div className="db-strong">{patient.service}</div>
                            <div className="db-subline">
                              Chambre {patient.chambre} · Lit {patient.lit}
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="db-sortmed-block">
                            <div
                              className={`db-sortmed-status ${
                                patient.sortMedActive ? "active" : ""
                              }`}
                            >
                              {patient.sortMedActive ? "Activé" : "Non activé"}
                            </div>

                            <div className="db-sortmed-meta">
                              {patient.sortMedActive
                                ? `J+${diffInDays(patient.sortMedActivatedAt)} · ${formatDateTime(
                                    patient.sortMedActivatedAt
                                  )}`
                                : "Activation manuelle agent"}
                            </div>

                            {patient.sortMedActive && (
                              <div className="db-sortmed-meta subtle">
                                Par {patient.sortMedActivatedBy}
                              </div>
                            )}

                            <button
                              className={`db-sortmed-btn ${
                                patient.sortMedActive ? "active" : ""
                              }`}
                              onClick={() => toggleSortMed(patient.id)}
                            >
                              {patient.sortMedActive ? "Désactiver" : "Activer"}
                            </button>
                          </div>
                        </td>

                        <td>
                          <div className="db-cell-blockage">
                            <div className="db-inline-pair">
                              <span className="db-inline-label">Maturité</span>
                              <span className="db-inline-value">
                                {patient.maturiteSortie}
                              </span>
                            </div>

                            <div className="db-inline-pair">
                              <span className="db-inline-label">Frein</span>
                              <span className="db-inline-value">
                                {patient.freinPrincipal}
                              </span>
                            </div>

                            <div className="db-inline-pair">
                              <span className="db-inline-label">Jours évitables</span>
                              <span
                                className={`db-days-text ${
                                  avoidableDays === null
                                    ? "neutral"
                                    : getDaysClass(avoidableDays)
                                }`}
                              >
                                {avoidableDays === null ? "—" : `J+${avoidableDays}`}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="db-cell-action">
                            <div className="db-strong">{patient.prochaineAction}</div>
                            <div className="db-subline">
                              Responsable : {patient.responsableAction}
                            </div>
                          </div>
                        </td>

                        <td className="db-detail-cell">
                          <button
                            className="db-detail-btn"
                            onClick={() => toggleExpandedRow(patient.id)}
                          >
                            {isExpanded ? "Réduire" : "Détail"}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="db-expanded-row">
                          <td colSpan="6">
                            <div className="db-expanded-grid">
                              <div className="db-expanded-block">
                                <div className="db-expanded-title">Synthèse</div>
                                <div className="db-expanded-text">
                                  {patient.synthese}
                                </div>
                              </div>

                              <div className="db-expanded-block">
                                <div className="db-expanded-title">Pilotage</div>
                                <div className="db-expanded-text">
                                  Prochaine revue : {formatDate(patient.prochaineRevue)}
                                </div>
                                <div className="db-expanded-text">
                                  Action : {patient.prochaineAction}
                                </div>
                                <div className="db-expanded-text">
                                  Responsable : {patient.responsableAction}
                                </div>
                              </div>

                              <div className="db-expanded-block">
                                <div className="db-expanded-title">Coordination</div>
                                <div className="db-expanded-text">
                                  {patient.urgentPostItCount} urgent(s)
                                </div>
                                <div className="db-expanded-text">
                                  {patient.unresolvedPostItCount} non répondu(s)
                                </div>
                              </div>

                              <div className="db-expanded-block action">
                                <Link
                                  to={`/patient/${patient.id}`}
                                  className="db-open-btn"
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
                    <td colSpan="6" className="db-empty-row">
                      Aucun patient ne correspond aux filtres.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="db-mobile-list mobile-only">
          <div className="db-section-title">Patients</div>

          <div className="db-mobile-cards">
            {filteredPatients.map((patient) => {
              const avoidableDays = patient.sortMedActive
                ? diffInDays(patient.sortMedActivatedAt)
                : null;
              const isExpanded = expandedRows.includes(patient.id);

              return (
                <article className="db-mobile-card" key={patient.id}>
                  <div className="db-mobile-head">
                    <div className="db-priority-line">
                      <span className="db-priority-mark">P{patient.priorite}</span>
                      <Link
                        to={`/patient/${patient.id}`}
                        className="db-patient-link"
                      >
                        {patient.nom} {patient.prenom}
                      </Link>
                    </div>

                    <button
                      className="db-detail-btn"
                      onClick={() => toggleExpandedRow(patient.id)}
                    >
                      {isExpanded ? "Réduire" : "Détail"}
                    </button>
                  </div>

                  <div className="db-subline">
                    Né le {formatDate(patient.dateNaissance)} · {patient.age} ans
                  </div>
                  <div className="db-subline">
                    INS {patient.ins} · IEP {patient.iep}
                  </div>
                  <div className="db-subline">
                    {patient.service} · Chambre {patient.chambre} · Lit {patient.lit}
                  </div>

                  <div className="db-mobile-grid">
                    <div className="db-mobile-item">
                      <div className="db-inline-label">Sort Med</div>
                      <div className="db-inline-value">
                        {patient.sortMedActive
                          ? `Activé · J+${diffInDays(patient.sortMedActivatedAt)}`
                          : "Non activé"}
                      </div>
                    </div>

                    <div className="db-mobile-item">
                      <div className="db-inline-label">Frein</div>
                      <div className="db-inline-value">{patient.freinPrincipal}</div>
                    </div>

                    <div className="db-mobile-item">
                      <div className="db-inline-label">Maturité</div>
                      <div className="db-inline-value">{patient.maturiteSortie}</div>
                    </div>

                    <div className="db-mobile-item">
                      <div className="db-inline-label">Jours évitables</div>
                      <div
                        className={`db-days-text ${
                          avoidableDays === null
                            ? "neutral"
                            : getDaysClass(avoidableDays)
                        }`}
                      >
                        {avoidableDays === null ? "—" : `J+${avoidableDays}`}
                      </div>
                    </div>
                  </div>

                  <div className="db-mobile-action">
                    <div className="db-strong">{patient.prochaineAction}</div>
                    <div className="db-subline">
                      Responsable : {patient.responsableAction}
                    </div>
                  </div>

                  <div className="db-mobile-sortmed-action">
                    <button
                      className={`db-sortmed-btn ${
                        patient.sortMedActive ? "active" : ""
                      }`}
                      onClick={() => toggleSortMed(patient.id)}
                    >
                      {patient.sortMedActive ? "Désactiver Sort Med" : "Activer Sort Med"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="db-mobile-expanded">
                      <div className="db-expanded-block">
                        <div className="db-expanded-title">Synthèse</div>
                        <div className="db-expanded-text">{patient.synthese}</div>
                      </div>

                      <div className="db-expanded-block">
                        <div className="db-expanded-title">Pilotage</div>
                        <div className="db-expanded-text">
                          Prochaine revue : {formatDate(patient.prochaineRevue)}
                        </div>
                        <div className="db-expanded-text">
                          Responsable : {patient.responsableAction}
                        </div>
                      </div>

                      <div className="db-expanded-block">
                        <div className="db-expanded-title">Coordination</div>
                        <div className="db-expanded-text">
                          {patient.urgentPostItCount} urgent(s) ·{" "}
                          {patient.unresolvedPostItCount} non répondu(s)
                        </div>
                      </div>

                      <Link to={`/patient/${patient.id}`} className="db-open-btn">
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

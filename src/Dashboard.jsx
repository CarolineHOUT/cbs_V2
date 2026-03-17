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
    maturiteSortie: "Organisation sortie",
    freinPrincipal: "Place aval",
    blocage: "Attente retour structure aval",
    administratifPatient: "Dossier incomplet",
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
    maturiteSortie: "Besoins identifiés",
    freinPrincipal: "Social",
    blocage: "Évaluation sociale en attente",
    administratifPatient: "Mutuelle à confirmer",
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
    service: "Médecine",
    chambre: "B10",
    lit: "02",
    sortMedActive: false,
    sortMedActivatedAt: null,
    maturiteSortie: "Besoins identifiés",
    freinPrincipal: "Coordination",
    blocage: "Actions non réparties",
    administratifPatient: "RAS",
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
    maturiteSortie: "Solution prête",
    freinPrincipal: "Administratif",
    blocage: "Validation finale",
    administratifPatient: "Attente clôture",
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
    maturiteSortie: "Organisation sortie",
    freinPrincipal: "Place aval",
    blocage: "Pas de place identifiée",
    administratifPatient: "RAS",
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
    maturiteSortie: "Organisation sortie",
    freinPrincipal: "Famille",
    blocage: "Accord entourage en attente",
    administratifPatient: "RAS",
    synthese: "Sort Med actif, validation famille attendue.",
    urgentPostItCount: 0,
    unresolvedPostItCount: 1,
    prochaineRevue: "2026-03-19",
    prochaineAction: "Appeler la famille",
    responsableAction: "Sophie Martin",
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
  { key: "sortMedOnly", label: "Sort Med" },
  { key: "withoutSolutionOnly", label: "Sans solution" },
  { key: "avoidableDaysOnly", label: "J évitables" },
  { key: "urgentOnly", label: "Urgents" },
  { key: "unansweredOnly", label: "Post-it ouverts" },
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false);
  const [servicesPanelOpen, setServicesPanelOpen] = useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState([]);

  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedMaturites, setSelectedMaturites] = useState([]);
  const [selectedFreins, setSelectedFreins] = useState([]);
  const [selectedQuickFilters, setSelectedQuickFilters] = useState([]);
  const [search, setSearch] = useState("");

  const tensionCount = patients.filter((p) => p.unresolvedPostItCount > 0).length;
  const urgentTensionCount = patients.filter((p) => p.urgentPostItCount > 0).length;

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
    setServicesPanelOpen(false);
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
      <header className="db-top-header">
        <div className="db-header-left">
          <button
            className="db-icon-btn"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label="Ouvrir le menu"
          >
            ☰
          </button>

          <div className="db-brand-block">
            <h1>CARABBAS</h1>
            <p>Pilotage des sorties hospitalières</p>
          </div>
        </div>

        <div className="db-header-right">
          <button
            className="db-ghost-btn db-filter-btn mobile-only-btn"
            onClick={() => setFiltersOpenMobile(true)}
          >
            Filtres
          </button>

          <button
            className="db-ghost-btn db-tension-btn"
            onClick={() => setServicesPanelOpen((prev) => !prev)}
          >
            <span>Services en tension</span>
            {tensionCount > 0 && (
              <span
                className={`db-tension-badge ${
                  urgentTensionCount > 0 ? "urgent" : ""
                }`}
              >
                {urgentTensionCount > 0 ? "!" : tensionCount}
              </span>
            )}
          </button>

          <button
            className="db-crisis-button"
            onClick={() => alert("Ouvrir le formulaire cellule de crise")}
          >
            Crise
          </button>
        </div>
      </header>

      <aside className={`db-left-sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
        <nav className="db-left-sidebar-nav">
          <button className="db-sidebar-link active">
            <span className="db-sidebar-icon">🏠</span>
            <span>Tableau</span>
          </button>

          <Link to="/patients" className="pv-sidebar-link">
  <span className="pv-sidebar-icon">🧑</span>
  <span>Patients</span>
</Link>

          <button className="db-sidebar-link">
            <span className="db-sidebar-icon">🤝</span>
            <span>Vue duo</span>
          </button>

          <button className="db-sidebar-link">
            <span className="db-sidebar-icon">⚠️</span>
            <span>Crise</span>
          </button>
        </nav>
      </aside>

      {mobileNavOpen && (
        <button
          className="db-mobile-overlay"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Fermer le menu"
        />
      )}

      {filtersOpenMobile && (
        <>
          <button
            className="db-mobile-overlay strong"
            onClick={() => setFiltersOpenMobile(false)}
            aria-label="Fermer les filtres"
          />
          <aside className="db-mobile-panel">
            <div className="db-mobile-panel-header">
              <span>Filtres</span>
              <button onClick={() => setFiltersOpenMobile(false)}>Fermer</button>
            </div>

            <div className="db-mobile-panel-body">
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
                <div className="db-filter-label">Raccourcis</div>
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

              <div className="db-filter-search">
                <input
                  type="text"
                  placeholder="Nom / INS / IEP / chambre / lit"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="db-filter-group">
                <div className="db-filter-label">Maturité</div>
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

              <div className="db-mobile-panel-actions">
                <button className="db-reset-filters-btn" onClick={clearFilters}>
                  Réinitialiser
                </button>
                <button
                  className="db-apply-btn"
                  onClick={() => setFiltersOpenMobile(false)}
                >
                  Appliquer
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {servicesPanelOpen && (
        <>
          <button
            className="db-mobile-overlay strong"
            onClick={() => setServicesPanelOpen(false)}
            aria-label="Fermer le panneau services"
          />
          <aside className="db-services-panel">
            <div className="db-mobile-panel-header">
              <span>Services en tension</span>
              <button onClick={() => setServicesPanelOpen(false)}>Fermer</button>
            </div>

            <div className="db-rail-list compact">
              {servicesRailData.map((item) => (
                <button
                  key={item.service}
                  className="db-rail-service-card"
                  onClick={() => handleServiceQuickFilter(item.service)}
                >
                  <div className="db-rail-card-top">
                    <span className="db-rail-service-name">{item.service}</span>
                    <span
                      className={`db-rail-service-occupation ${getOccupationClass(
                        item.occupation
                      )}`}
                    >
                      {item.occupation}%
                    </span>
                  </div>

                  <div className="db-rail-card-bottom">
                    <span>{item.problemCount} patient(s)</span>
                    <span className="db-rail-link">Filtrer</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </>
      )}

      <main className="db-main compact">
        <section className="db-kpi-row compact">
          <div className="db-kpi-card teal compact">
            <span className="db-kpi-label">Lits occupés</span>
            <strong className="db-kpi-value">
              {kpis.occupiedBeds}/{kpis.capacityBeds}
            </strong>
          </div>

          <div className="db-kpi-card blue compact">
            <span className="db-kpi-label">Sort Med</span>
            <strong className="db-kpi-value">{kpis.sortMedCount}</strong>
          </div>

          <div className="db-kpi-card orange compact">
            <span className="db-kpi-label">Sans solution</span>
            <strong className="db-kpi-value">{kpis.withoutSolution}</strong>
          </div>

          <div className="db-kpi-card red compact">
            <span className="db-kpi-label">J évitables</span>
            <strong className="db-kpi-value">{kpis.avoidableDays}</strong>
          </div>

          <div className="db-kpi-card light compact">
            <span className="db-kpi-label">Lits récupérables</span>
            <strong className="db-kpi-value">{kpis.recoverableBeds}</strong>
          </div>
        </section>

        <section className="db-filters-panel desktop-filters">
          <div className="db-filters-header">
            <div className="db-filters-title">Filtres</div>

            <div className="db-filters-actions">
              <button
                className="db-toggle-advanced-btn"
                onClick={() => setAdvancedFiltersOpen((prev) => !prev)}
              >
                {advancedFiltersOpen ? "Masquer" : "Avancés"}
              </button>

              <button className="db-reset-filters-btn" onClick={clearFilters}>
                Réinit.
              </button>
            </div>
          </div>

          <div className="db-filter-group">
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

          <div className="db-filter-search">
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

        <section className="db-patients-card db-desktop-table compact">
          <div className="db-section-title">Patients prioritaires</div>

          <div className="db-patients-table-wrapper">
            <table className="db-patients-table compact">
              <thead>
                <tr>
                  <th>Prio</th>
                  <th>Patient</th>
                  <th>Service</th>
                  <th>Sort Med</th>
                  <th>Frein</th>
                  <th>Maturité</th>
                  <th>J évitables</th>
                  <th>Action</th>
                  <th>Résumé</th>
                  <th>Fiche</th>
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
                      <tr className="db-patient-row compact">
                        <td>
                          <span className="db-priority-badge small">
                            {patient.priorite}
                          </span>
                        </td>

                        <td>
                          <div className="db-identity-block compact">
                            <Link
                              to={`/patient/${patient.id}`}
                              className="db-patient-link compact"
                            >
                              {patient.nom} {patient.prenom}
                            </Link>

                            <div className="db-identity-line compact">
                              Né le {formatDate(patient.dateNaissance)} · {patient.age} ans
                            </div>

                            <div className="db-identity-line compact">
                              INS {patient.ins} · IEP {patient.iep}
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="db-location-block compact">
                            <div className="db-location-service compact">
                              {patient.service}
                            </div>
                            <div className="db-location-line compact">
                              Ch {patient.chambre} · Lit {patient.lit}
                            </div>
                          </div>
                        </td>

                        <td>
                          <button
                            className={`db-sort-med-toggle compact ${
                              patient.sortMedActive ? "active" : ""
                            }`}
                            onClick={() => toggleSortMed(patient.id)}
                          >
                            {patient.sortMedActive
                              ? `J+${diffInDays(patient.sortMedActivatedAt)}`
                              : "—"}
                          </button>
                        </td>

                        <td>
                          <span className="db-frein-badge compact">
                            {patient.freinPrincipal}
                          </span>
                        </td>

                        <td>
                          <span className="db-maturity-badge compact">
                            {patient.maturiteSortie}
                          </span>
                        </td>

                        <td>
                          {avoidableDays === null ? (
                            <span className="db-days-empty">—</span>
                          ) : (
                            <span
                              className={`db-days-badge compact ${getDaysClass(
                                avoidableDays
                              )}`}
                            >
                              J+{avoidableDays}
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="db-next-action-text compact">
                            {patient.prochaineAction}
                          </div>
                          <div className="db-inline-meta compact">
                            {patient.responsableAction}
                          </div>
                        </td>

                        <td>
                          <button
                            className="db-expand-btn compact"
                            onClick={() => toggleExpandedRow(patient.id)}
                          >
                            {isExpanded ? "Fermer" : "Résumé"}
                          </button>
                        </td>

                        <td>
                          <Link
                            to={`/patient/${patient.id}`}
                            className="db-open-patient-btn compact"
                          >
                            Fiche
                          </Link>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="db-expanded-row">
                          <td colSpan="10">
                            <div className="db-expanded-content compact">
                              <div className="db-expanded-block">
                                <div className="db-expanded-label">Synthèse</div>
                                <div>{patient.synthese}</div>
                              </div>

                              <div className="db-expanded-block">
                                <div className="db-expanded-label">Blocage</div>
                                <div>{patient.blocage}</div>
                              </div>

                              <div className="db-expanded-block">
                                <div className="db-expanded-label">
                                  Administratif
                                </div>
                                <div>{patient.administratifPatient}</div>
                              </div>

                              <div className="db-expanded-block">
                                <div className="db-expanded-label">Revue</div>
                                <div>{formatDate(patient.prochaineRevue)}</div>
                              </div>

                              <div className="db-expanded-block">
                                <div className="db-expanded-label">
                                  Coordination
                                </div>
                                <div>
                                  {patient.urgentPostItCount} urgent(s) ·{" "}
                                  {patient.unresolvedPostItCount} ouvert(s)
                                </div>
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
                    <td colSpan="10" className="db-empty-row">
                      Aucun patient ne correspond aux filtres.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="db-mobile-cards">
          <div className="db-section-title">Patients prioritaires</div>

          <div className="db-patient-cards-list compact">
            {filteredPatients.map((patient) => {
              const avoidableDays = patient.sortMedActive
                ? diffInDays(patient.sortMedActivatedAt)
                : null;
              const isExpanded = expandedRows.includes(patient.id);

              return (
                <article className="db-patient-card compact" key={patient.id}>
                  <div className="db-patient-card-top">
                    <span className="db-priority-badge small">
                      {patient.priorite}
                    </span>
                    <div className="db-card-actions compact">
                      <button
                        className="db-expand-btn compact"
                        onClick={() => toggleExpandedRow(patient.id)}
                      >
                        {isExpanded ? "Fermer" : "Résumé"}
                      </button>
                      <Link
                        to={`/patient/${patient.id}`}
                        className="db-open-patient-btn compact"
                      >
                        Fiche
                      </Link>
                    </div>
                  </div>

                  <div className="db-identity-block compact">
                    <Link
                      to={`/patient/${patient.id}`}
                      className="db-patient-link compact"
                    >
                      {patient.nom} {patient.prenom}
                    </Link>
                    <div className="db-identity-line compact">
                      Né le {formatDate(patient.dateNaissance)} · {patient.age} ans
                    </div>
                    <div className="db-identity-line compact">
                      INS {patient.ins} · IEP {patient.iep}
                    </div>
                    <div className="db-identity-line compact">
                      Ch {patient.chambre} · Lit {patient.lit}
                    </div>
                  </div>

                  <div className="db-location-block db-mobile-space">
                    <div className="db-location-service compact">
                      {patient.service}
                    </div>
                  </div>

                  <div className="db-patient-card-tags compact">
                    <button
                      className={`db-sort-med-toggle compact ${
                        patient.sortMedActive ? "active" : ""
                      }`}
                      onClick={() => toggleSortMed(patient.id)}
                    >
                      {patient.sortMedActive
                        ? `SortMed J+${diffInDays(patient.sortMedActivatedAt)}`
                        : "SortMed"}
                    </button>

                    <span className="db-frein-badge compact">
                      {patient.freinPrincipal}
                    </span>

                    <span className="db-maturity-badge compact">
                      {patient.maturiteSortie}
                    </span>

                    {avoidableDays === null ? (
                      <span className="db-days-empty">—</span>
                    ) : (
                      <span
                        className={`db-days-badge compact ${getDaysClass(
                          avoidableDays
                        )}`}
                      >
                        J+{avoidableDays}
                      </span>
                    )}
                  </div>

                  <div className="db-mobile-space">
                    <div className="db-next-action-text compact">
                      {patient.prochaineAction}
                    </div>
                    <div className="db-inline-meta compact">
                      Responsable : {patient.responsableAction}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="db-mobile-expanded compact">
                      <div className="db-expanded-block">
                        <div className="db-expanded-label">Synthèse</div>
                        <div>{patient.synthese}</div>
                      </div>

                      <div className="db-expanded-block">
                        <div className="db-expanded-label">Blocage</div>
                        <div>{patient.blocage}</div>
                      </div>

                      <div className="db-expanded-block">
                        <div className="db-expanded-label">Administratif</div>
                        <div>{patient.administratifPatient}</div>
                      </div>

                      <div className="db-expanded-block">
                        <div className="db-expanded-label">Coordination</div>
                        <div>
                          {patient.urgentPostItCount} urgent(s) ·{" "}
                          {patient.unresolvedPostItCount} ouvert(s)
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

            {filteredPatients.length === 0 && (
              <div className="db-empty-mobile">
                Aucun patient ne correspond aux filtres.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

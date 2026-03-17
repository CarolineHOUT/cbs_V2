import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./PatientsView.css";

const patientsData = [
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

export default function PatientsView() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedMaturites, setSelectedMaturites] = useState([]);
  const [sortMedOnly, setSortMedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("priorite");

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    const list = patientsData.filter((patient) => {
      const matchesSearch =
        !query ||
        [
          patient.nom,
          patient.prenom,
          patient.ins,
          patient.iep,
          patient.service,
          patient.chambre,
          patient.lit,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesService =
        selectedServices.length === 0 ||
        selectedServices.includes(patient.service);

      const matchesMaturite =
        selectedMaturites.length === 0 ||
        selectedMaturites.includes(patient.maturiteSortie);

      const matchesSortMed = !sortMedOnly || patient.sortMedActive;

      return (
        matchesSearch && matchesService && matchesMaturite && matchesSortMed
      );
    });

    const sorted = [...list];

    if (sortBy === "priorite") {
      sorted.sort((a, b) => a.priorite - b.priorite);
    }

    if (sortBy === "nom") {
      sorted.sort((a, b) =>
        `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`)
      );
    }

    if (sortBy === "service") {
      sorted.sort((a, b) => a.service.localeCompare(b.service));
    }

    if (sortBy === "joursEvitables") {
      sorted.sort(
        (a, b) =>
          diffInDays(b.sortMedActivatedAt) - diffInDays(a.sortMedActivatedAt)
      );
    }

    return sorted;
  }, [search, selectedServices, selectedMaturites, sortMedOnly, sortBy]);

  const clearFilters = () => {
    setSearch("");
    setSelectedServices([]);
    setSelectedMaturites([]);
    setSortMedOnly(false);
    setSortBy("priorite");
  };

  return (
    <div className="patients-page">
      <header className="pvw-top-header">
        <div className="pvw-header-left">
          <button
            className="pvw-icon-btn"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label="Ouvrir le menu"
          >
            ☰
          </button>

          <div className="pvw-brand-block">
            <h1>CARABBAS</h1>
            <p>Vue Patients</p>
          </div>
        </div>

        <div className="pvw-header-right">
          <button
            className="pvw-ghost-btn"
            onClick={() => setFiltersOpen((prev) => !prev)}
          >
            Filtres
          </button>

          <Link to="/dashboard" className="pvw-back-btn">
            Retour tableau
          </Link>
        </div>
      </header>

      <aside className={`pvw-left-sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
        <nav className="pvw-left-sidebar-nav">
          <Link to="/dashboard" className="pvw-sidebar-link">
            <span className="pvw-sidebar-icon">🏠</span>
            <span>Tableau</span>
          </Link>

          <button className="pvw-sidebar-link active">
            <span className="pvw-sidebar-icon">🧑</span>
            <span>Patients</span>
          </button>

          <button className="pvw-sidebar-link">
            <span className="pvw-sidebar-icon">🤝</span>
            <span>Vue duo</span>
          </button>

          <button className="pvw-sidebar-link">
            <span className="pvw-sidebar-icon">⚠️</span>
            <span>Crise</span>
          </button>
        </nav>
      </aside>

      {mobileNavOpen && (
        <button
          className="pvw-mobile-overlay"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Fermer le menu"
        />
      )}

      {filtersOpen && (
        <>
          <button
            className="pvw-mobile-overlay strong"
            onClick={() => setFiltersOpen(false)}
            aria-label="Fermer les filtres"
          />
          <aside className="pvw-filters-panel">
            <div className="pvw-panel-header">
              <span>Filtres patients</span>
              <button onClick={() => setFiltersOpen(false)}>Fermer</button>
            </div>

            <div className="pvw-panel-body">
              <div className="pvw-filter-block">
                <label>Recherche</label>
                <input
                  type="text"
                  placeholder="Nom / INS / IEP / chambre / lit"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="pvw-filter-block">
                <label>Trier par</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="priorite">Priorité</option>
                  <option value="nom">Nom</option>
                  <option value="service">Service</option>
                  <option value="joursEvitables">Jours évitables</option>
                </select>
              </div>

              <div className="pvw-filter-block">
                <label>Services</label>
                <div className="pvw-chip-row">
                  {services.map((service) => (
                    <button
                      key={service}
                      className={`pvw-chip ${
                        selectedServices.includes(service) ? "selected" : ""
                      }`}
                      onClick={() =>
                        setSelectedServices((prev) =>
                          toggleInArray(service, prev)
                        )
                      }
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pvw-filter-block">
                <label>Maturité</label>
                <div className="pvw-chip-row">
                  {maturites.map((item) => (
                    <button
                      key={item}
                      className={`pvw-chip ${
                        selectedMaturites.includes(item) ? "selected" : ""
                      }`}
                      onClick={() =>
                        setSelectedMaturites((prev) =>
                          toggleInArray(item, prev)
                        )
                      }
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pvw-filter-block">
                <label className="pvw-checkbox-line">
                  <input
                    type="checkbox"
                    checked={sortMedOnly}
                    onChange={(e) => setSortMedOnly(e.target.checked)}
                  />
                  <span>Afficher uniquement les Sort Med</span>
                </label>
              </div>

              <div className="pvw-panel-actions">
                <button className="pvw-reset-btn" onClick={clearFilters}>
                  Réinitialiser
                </button>
                <button className="pvw-apply-btn" onClick={() => setFiltersOpen(false)}>
                  Appliquer
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      <main className="pvw-main">
        <section className="pvw-toolbar">
          <div className="pvw-toolbar-left">
            <input
              type="text"
              placeholder="Rechercher un patient"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="pvw-toolbar-right">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="priorite">Tri : priorité</option>
              <option value="nom">Tri : nom</option>
              <option value="service">Tri : service</option>
              <option value="joursEvitables">Tri : jours évitables</option>
            </select>
          </div>
        </section>

        <section className="pvw-summary-strip">
          <div className="pvw-summary-card">
            <span>Patients visibles</span>
            <strong>{filteredPatients.length}</strong>
          </div>
          <div className="pvw-summary-card">
            <span>Sort Med</span>
            <strong>{filteredPatients.filter((p) => p.sortMedActive).length}</strong>
          </div>
          <div className="pvw-summary-card">
            <span>Services</span>
            <strong>
              {new Set(filteredPatients.map((p) => p.service)).size}
            </strong>
          </div>
        </section>

        <section className="pvw-table-card desktop-only">
          <div className="pvw-section-title">Liste patients</div>
          <div className="pvw-table-wrapper">
            <table className="pvw-table">
              <thead>
                <tr>
                  <th>Prio</th>
                  <th>Patient</th>
                  <th>Service</th>
                  <th>Chambre</th>
                  <th>Sort Med</th>
                  <th>Maturité</th>
                  <th>Frein</th>
                  <th>Action</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <span className="pvw-priority-badge">{patient.priorite}</span>
                    </td>
                    <td>
                      <div className="pvw-patient-main">
                        <Link
                          to={`/patient/${patient.id}`}
                          className="pvw-patient-link"
                        >
                          {patient.nom} {patient.prenom}
                        </Link>
                        <div className="pvw-meta-line">
                          Né le {formatDate(patient.dateNaissance)} · {patient.age} ans
                        </div>
                        <div className="pvw-meta-line">
                          INS {patient.ins} · IEP {patient.iep}
                        </div>
                      </div>
                    </td>
                    <td>{patient.service}</td>
                    <td>
                      Ch {patient.chambre} · Lit {patient.lit}
                    </td>
                    <td>
                      <span
                        className={`pvw-sortmed-badge ${
                          patient.sortMedActive ? "active" : ""
                        }`}
                      >
                        {patient.sortMedActive
                          ? `J+${diffInDays(patient.sortMedActivatedAt)}`
                          : "Non"}
                      </span>
                    </td>
                    <td>
                      <span className="pvw-maturity-badge">
                        {patient.maturiteSortie}
                      </span>
                    </td>
                    <td>
                      <span className="pvw-frein-badge">
                        {patient.freinPrincipal}
                      </span>
                    </td>
                    <td>
                      <div className="pvw-action-text">{patient.prochaineAction}</div>
                      <div className="pvw-meta-line">{patient.responsableAction}</div>
                    </td>
                    <td>
                      <Link
                        to={`/patient/${patient.id}`}
                        className="pvw-open-btn"
                      >
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                ))}

                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan="9" className="pvw-empty-row">
                      Aucun patient trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="pvw-mobile-list mobile-only">
          <div className="pvw-section-title">Liste patients</div>

          <div className="pvw-cards">
            {filteredPatients.map((patient) => (
              <article className="pvw-card" key={patient.id}>
                <div className="pvw-card-top">
                  <span className="pvw-priority-badge">{patient.priorite}</span>
                  <Link to={`/patient/${patient.id}`} className="pvw-open-btn">
                    Ouvrir
                  </Link>
                </div>

                <Link to={`/patient/${patient.id}`} className="pvw-patient-link">
                  {patient.nom} {patient.prenom}
                </Link>

                <div className="pvw-meta-line">
                  Né le {formatDate(patient.dateNaissance)} · {patient.age} ans
                </div>
                <div className="pvw-meta-line">
                  INS {patient.ins} · IEP {patient.iep}
                </div>
                <div className="pvw-meta-line">
                  {patient.service} · Ch {patient.chambre} · Lit {patient.lit}
                </div>

                <div className="pvw-tags">
                  <span
                    className={`pvw-sortmed-badge ${
                      patient.sortMedActive ? "active" : ""
                    }`}
                  >
                    {patient.sortMedActive
                      ? `Sort Med J+${diffInDays(patient.sortMedActivatedAt)}`
                      : "Non Sort Med"}
                  </span>

                  <span className="pvw-maturity-badge">
                    {patient.maturiteSortie}
                  </span>

                  <span className="pvw-frein-badge">
                    {patient.freinPrincipal}
                  </span>
                </div>

                <div className="pvw-action-zone">
                  <div className="pvw-action-text">{patient.prochaineAction}</div>
                  <div className="pvw-meta-line">
                    Responsable : {patient.responsableAction}
                  </div>
                </div>
              </article>
            ))}

            {filteredPatients.length === 0 && (
              <div className="pvw-empty-mobile">Aucun patient trouvé.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

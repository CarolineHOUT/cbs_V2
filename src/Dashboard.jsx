import React, { useMemo, useState } from "react";
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
    smActive: true,
    smActivatedAt: "2026-03-14T09:00:00",
    maturiteSortie: "Organisation sortie",
    freinPrincipal: "Place aval",
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
    smActive: true,
    smActivatedAt: "2026-03-16T08:30:00",
    maturiteSortie: "Besoins identifiés",
    freinPrincipal: "Social",
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
    smActive: false,
    smActivatedAt: null,
    maturiteSortie: "Besoins identifiés",
    freinPrincipal: "Coordination",
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
    smActive: true,
    smActivatedAt: "2026-03-13T11:15:00",
    maturiteSortie: "Solution prête",
    freinPrincipal: "Administratif",
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
    smActive: false,
    smActivatedAt: null,
    maturiteSortie: "Organisation sortie",
    freinPrincipal: "Place aval",
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
    smActive: true,
    smActivatedAt: "2026-03-15T14:00:00",
    maturiteSortie: "Organisation sortie",
    freinPrincipal: "Famille",
  },
];

const services = [
  "Tous",
  "Pneumologie",
  "Médecine",
  "Oncologie",
  "Chirurgie",
  "Neurologie",
];

const maturites = [
  "Toutes",
  "Besoins identifiés",
  "Organisation sortie",
  "Solution prête",
];

const freins = [
  "Tous",
  "Social",
  "Place aval",
  "Coordination",
  "Famille",
  "Administratif",
];

const servicesTensionData = [
  { service: "Pneumologie", occupation: 92, anticipation: 33 },
  { service: "Médecine", occupation: 78, anticipation: 67 },
  { service: "Chirurgie", occupation: 61, anticipation: 82 },
  { service: "Neurologie", occupation: 45, anticipation: 74 },
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

function getSmLabel(patient) {
  if (!patient.smActive) return "Activer SM";
  const days = diffInDays(patient.smActivatedAt);
  return days === 0 ? "SM J0" : `SM J+${days}`;
}

function getOccupationClass(value) {
  if (value >= 90) return "danger";
  if (value >= 75) return "warning";
  return "normal";
}

function getAnticipationClass(value) {
  if (value < 40) return "danger";
  if (value < 70) return "warning";
  return "good";
}

export default function Dashboard() {
  const [patients, setPatients] = useState(initialPatients);
  const [selectedService, setSelectedService] = useState("Tous");
  const [selectedMaturite, setSelectedMaturite] = useState("Toutes");
  const [selectedFrein, setSelectedFrein] = useState("Tous");
  const [search, setSearch] = useState("");

  const toggleSM = (patientId) => {
    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id !== patientId) return patient;

        if (patient.smActive) {
          return {
            ...patient,
            smActive: false,
            smActivatedAt: null,
          };
        }

        return {
          ...patient,
          smActive: true,
          smActivatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return patients
      .filter((patient) => {
        if (selectedService !== "Tous" && patient.service !== selectedService) {
          return false;
        }

        if (
          selectedMaturite !== "Toutes" &&
          patient.maturiteSortie !== selectedMaturite
        ) {
          return false;
        }

        if (
          selectedFrein !== "Tous" &&
          patient.freinPrincipal !== selectedFrein
        ) {
          return false;
        }

        if (!query) return true;

        const haystack = [
          patient.nom,
          patient.prenom,
          patient.iep,
          patient.ins,
          patient.chambre,
          patient.lit,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      })
      .sort((a, b) => a.priorite - b.priorite);
  }, [patients, selectedService, selectedMaturite, selectedFrein, search]);

  const kpis = useMemo(() => {
    const occupiedBeds = 92;
    const capacityBeds = 100;

    const smPatients = patients.filter((p) => p.smActive).length;

    const withoutSolution = patients.filter(
      (p) => p.smActive && p.maturiteSortie !== "Solution prête"
    ).length;

    const avoidableDays = patients
      .filter((p) => p.smActive)
      .reduce((sum, p) => sum + diffInDays(p.smActivatedAt), 0);

    const recoverableBeds = patients.filter(
      (p) => p.smActive && p.maturiteSortie === "Solution prête"
    ).length;

    return {
      occupiedBeds,
      capacityBeds,
      smPatients,
      withoutSolution,
      avoidableDays,
      recoverableBeds,
    };
  }, [patients]);

  return (
    <div className="dashboard-page">
      <aside className="sidebar">
        <div className="brand">CARABBAS</div>

        <nav className="sidebar-nav">
          <button className="nav-item active">Tableau de bord</button>
          <button className="nav-item">Patients</button>
          <button className="nav-item">Vue duo</button>
          <button className="nav-item">Cellule de crise</button>
        </nav>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Tableau de bord</h1>
            <p>Pilotage des sorties hospitalières complexes</p>
          </div>

          <button
            className="crisis-button"
            onClick={() => alert("Ouvrir le formulaire cellule de crise")}
          >
            Déclencher une cellule de crise
          </button>
        </header>

        <section className="kpi-row">
          <div className="kpi-card teal">
            <span className="kpi-label">Lits occupés / capacité</span>
            <strong className="kpi-value">
              {kpis.occupiedBeds} / {kpis.capacityBeds}
            </strong>
          </div>

          <div className="kpi-card blue">
            <span className="kpi-label">Sortants médicalement</span>
            <strong className="kpi-value">{kpis.smPatients}</strong>
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
          <div className="service-filters">
            {services.map((service) => (
              <button
                key={service}
                className={`chip ${
                  selectedService === service ? "selected" : ""
                }`}
                onClick={() => setSelectedService(service)}
              >
                {service}
              </button>
            ))}
          </div>

          <div className="secondary-filters">
            <select
              value={selectedMaturite}
              onChange={(e) => setSelectedMaturite(e.target.value)}
            >
              {maturites.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedFrein}
              onChange={(e) => setSelectedFrein(e.target.value)}
            >
              {freins.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Nom / INS / IEP"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </section>

        <section className="content-grid">
          <div className="patients-card">
            <div className="section-title">Patients prioritaires</div>

            <div className="patients-table-wrapper">
              <table className="patients-table">
                <thead>
                  <tr>
                    <th>Priorité</th>
                    <th>Identité patient</th>
                    <th>Localisation</th>
                    <th>SM</th>
                    <th>Maturité sortie</th>
                    <th>Frein principal</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        <span className="priority-badge">{patient.priorite}</span>
                      </td>

                      <td>
                        <div className="identity-block">
                          <div className="identity-name">
                            {patient.nom}, {patient.prenom}
                          </div>
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
                          <div className="location-service">
                            {patient.service}
                          </div>
                          <div className="location-line">
                            Ch. {patient.chambre} · Lit {patient.lit}
                          </div>
                        </div>
                      </td>

                      <td>
                        <button
                          className={`sm-toggle ${
                            patient.smActive ? "active" : ""
                          }`}
                          onClick={() => toggleSM(patient.id)}
                        >
                          {getSmLabel(patient)}
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
                    </tr>
                  ))}

                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan="6" className="empty-row">
                        Aucun patient ne correspond aux filtres.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="right-rail">
            <div className="section-title">Services en tension</div>

            <div className="rail-list">
              {servicesTensionData.map((item) => (
                <div key={item.service} className="rail-item">
                  <div className="rail-item-top">
                    <span className="rail-service">{item.service}</span>
                    <span
                      className={`rail-occupation ${getOccupationClass(
                        item.occupation
                      )}`}
                    >
                      {item.occupation}%
                    </span>
                  </div>

                  <div className="rail-meta">
                    <span>Occupation</span>
                  </div>

                  <div className="rail-item-bottom">
                    <span>Anticipation</span>
                    <span
                      className={`rail-anticipation ${getAnticipationClass(
                        item.anticipation
                      )}`}
                    >
                      {item.anticipation}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

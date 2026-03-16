import React from "react";
import { Link } from "react-router-dom";
import "../styles/dashboard.css";
import patients from "../data/mockPatients";

export default function Dashboard() {

  const totalBeds = 150;
  const occupiedBeds = patients.length;

  const sortMed = patients.filter(p => p.sortMed !== null).length;
  const noSolution = patients.filter(p => p.freins !== null).length;
  const avoidableDays = patients.reduce((sum,p)=>sum + (p.joursEvitable || 0),0);

  return (
    <div className="dashboard">

      <header className="header">
        <div>
          <h1>CARABBAS</h1>
          <p>Pilotage des sorties hospitalières complexes</p>
        </div>

        <div className="header-actions">
          <button className="btn-warning">Services en tension</button>
          <button className="btn-danger">Déclencher cellule de crise</button>
        </div>
      </header>

      <div className="kpi-grid">

        <div className="kpi green">
          <span>Lits occupés / capacité</span>
          <strong>{occupiedBeds} / {totalBeds}</strong>
        </div>

        <div className="kpi blue">
          <span>Sort Med</span>
          <strong>{sortMed}</strong>
        </div>

        <div className="kpi orange">
          <span>Patients sans solution</span>
          <strong>{noSolution}</strong>
        </div>

        <div className="kpi red">
          <span>Jours évitables</span>
          <strong>{avoidableDays}</strong>
        </div>

      </div>


      <div className="patients-section">

        <h2>Patients prioritaires</h2>

        <table className="patients-table">

          <thead>
            <tr>
              <th>Priorité</th>
              <th>Identité</th>
              <th>Localisation</th>
              <th>Sort Med</th>
              <th>Frein principal</th>
              <th>Maturité</th>
              <th>Jours évitables</th>
              <th>Prochaine action</th>
              <th></th>
            </tr>
          </thead>

          <tbody>

            {patients.map(p => (

              <tr key={p.id}>

                <td>
                  <span className="priority">{p.priority}</span>
                </td>

                <td>
                  <Link to={`/patient/${p.id}`} className="patient-link">
                    {p.nom} {p.prenom}
                  </Link>

                  <div className="patient-info">
                    Né le {p.birthDate} · {p.age} ans
                  </div>

                  <div className="patient-info">
                    INS {p.ins} · IEP {p.iep}
                  </div>

                </td>

                <td>
                  {p.service}
                  <div className="patient-info">
                    Chambre {p.room} · Lit {p.bed}
                  </div>
                </td>

                <td>
                  <span className="badge green">
                    Sort Med {p.sortMed}
                  </span>
                </td>

                <td>
                  <span className="badge orange">
                    {p.freins}
                  </span>
                </td>

                <td>
                  {p.maturite}
                </td>

                <td>
                  <span className="badge red">
                    J+{p.joursEvitable}
                  </span>
                </td>

                <td>
                  {p.nextAction}
                  <div className="patient-info">
                    {p.responsable}
                  </div>
                </td>

                <td>
                  <Link to={`/patient/${p.id}`}>
                    <button className="btn-primary">
                      Fiche patient
                    </button>
                  </Link>
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

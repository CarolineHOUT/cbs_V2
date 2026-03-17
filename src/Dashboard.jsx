import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";

function days(d) {
  if (!d) return 0;
  return Math.floor((Date.now() - new Date(d)) / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const [patients, setPatients] = useState([
    {
      id: 1,
      priorite: 1,
      nom: "DUPONT",
      prenom: "Jean",
      age: 78,
      service: "Pneumologie",
      chambre: "A12",
      lit: "03",
      sortMed: true,
      date: "2026-03-14",
      frein: "Place aval",
      action: "Relance structure",
      resp: "Claire",
      synthese: "Sortie non sécurisée",
      urgent: 1,
      nonLus: 2,
    },
  ]);

  const [open, setOpen] = useState([]);

  const toggle = (id) => {
    setOpen((o) =>
      o.includes(id) ? o.filter((x) => x !== id) : [...o, id]
    );
  };

  const toggleSM = (id) => {
    setPatients((p) =>
      p.map((pt) =>
        pt.id === id
          ? {
              ...pt,
              sortMed: !pt.sortMed,
              date: !pt.sortMed ? new Date() : null,
            }
          : pt
      )
    );
  };

  return (
    <div className="dashboard">
      {/* KPI */}
      <div className="kpi-row">
        <div className="kpi"><span>Lits</span><strong>120</strong></div>
        <div className="kpi"><span>Sort Med</span><strong>32</strong></div>
        <div className="kpi"><span>Sans solution</span><strong>12</strong></div>
        <div className="kpi"><span>Jours évitables</span><strong>18</strong></div>
      </div>

      {/* TABLE */}
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Patient</th>
            <th>Localisation</th>
            <th>Sort Med</th>
            <th>Frein</th>
            <th>Action</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {patients.map((p) => (
            <React.Fragment key={p.id}>
              <tr>
                <td>{p.priorite}</td>

                <td>
                  <div className="row-main">
                    <Link to={`/patient/${p.id}`}>
                      {p.nom} {p.prenom}
                    </Link>
                    <div className="row-sub">{p.age} ans</div>
                  </div>
                </td>

                <td>
                  <div className="row-main">
                    {p.service}
                    <div className="row-sub">
                      {p.chambre} · {p.lit}
                    </div>
                  </div>
                </td>

                <td className="sortmed">
                  {p.sortMed ? (
                    <>
                      Actif J+{days(p.date)}
                      <button onClick={() => toggleSM(p.id)}>
                        désactiver
                      </button>
                    </>
                  ) : (
                    <button onClick={() => toggleSM(p.id)}>
                      activer
                    </button>
                  )}
                </td>

                <td>{p.frein}</td>

                <td className="action">
                  {p.action}
                  <div className="resp">{p.resp}</div>
                </td>

                <td>
                  <button onClick={() => toggle(p.id)}>
                    {open.includes(p.id) ? "−" : "+"}
                  </button>
                </td>
              </tr>

              {open.includes(p.id) && (
                <tr className="expand">
                  <td colSpan="7">
                    <div className="expand-wrap">
                      <div>
                        <div className="expand-title">Synthèse</div>
                        {p.synthese}
                      </div>

                      <div>
                        <div className="expand-title">Pilotage</div>
                        {p.action}
                      </div>

                      <div>
                        <div className="expand-title">Coordination</div>
                        {p.urgent} urgent · {p.nonLus} non lus
                      </div>

                      <Link to={`/patient/${p.id}`}>
                        Ouvrir fiche
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

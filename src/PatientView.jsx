import React, { useState } from "react";
import "./PatientView.css";

export default function PatientView() {
  const [open, setOpen] = useState(false);

  return (
    <div className="patient">
      <div className="main">
        <h2>DEAN Jane</h2>

        <div className="grid">
          <div className="card"><h4>Sort Med</h4>Actif J+2</div>
          <div className="card"><h4>Frein</h4>Place aval</div>
          <div className="card"><h4>Action</h4>Relance SSR</div>
          <div className="card"><h4>Risque</h4>Élevé</div>
        </div>

        <div className="card">
          <h4>Staff</h4>
          Décision : relance structure
        </div>
      </div>

      <div
        className={`rail ${open ? "open" : ""}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div>Contacts</div>
        <div>Responsables</div>
        <div>Post-it (2)</div>
        <div>Compte rendu</div>
      </div>
    </div>
  );
}

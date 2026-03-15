import { useState } from "react";
import Dashboard from "./Dashboard.jsx";
import PatientView from "./PatientView.jsx";

const patientsData = [
  {
    id: 1,
    nom: "Renard",
    prenom: "Camille",
    ins: "1800612345987",
    service: "Oncologie",
    blocage: "Coordination ville insuffisante",
    score: 6
  },
  {
    id: 2,
    nom: "Martin",
    prenom: "Pierre",
    ins: "1800654321789",
    service: "Médecine",
    blocage: "Suivi simple",
    score: 3
  }
];

export default function App() {

  const [patients] = useState(patientsData);
  const [selectedPatient, setSelectedPatient] = useState(null);

  return (
    <div style={{ padding: 30 }}>

      <h1>CARABBAS</h1>

      {!selectedPatient && (
        <Dashboard
          patients={patients}
          onOpenPatient={setSelectedPatient}
        />
      )}

      {selectedPatient && (
        <PatientView
          patient={selectedPatient}
          onBack={() => setSelectedPatient(null)}
        />
      )}

    </div>
  );
}

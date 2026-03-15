import { useState } from "react";
import Dashboard from "./Dashboard.jsx";

const patientsData = [
  {
    id: 1,
    nom: "Renard",
    prenom: "Camille",
    age: 76,
    birthDate: "12/03/1948",
    ins: "1800612345987",
    iep: "CHX0002464",
    service: "Oncologie",
    chambre: "214",
    lit: "B",
    blocage: "Coordination ville insuffisante",
    score: 6,
    joursEvitables: 3,
    sortantMedicalement: true,
  },
  {
    id: 2,
    nom: "Martin",
    prenom: "Pierre",
    age: 85,
    birthDate: "01/10/1939",
    ins: "1800654321789",
    iep: "CHX0002451",
    service: "Médecine",
    chambre: "118",
    lit: "A",
    blocage: "Recherche SSIAD",
    score: 8,
    joursEvitables: 6,
    sortantMedicalement: true,
  },
  {
    id: 3,
    nom: "Dubois",
    prenom: "Jean",
    age: 81,
    birthDate: "12/05/1943",
    ins: "1800543210987",
    iep: "CHX0002452",
    service: "Pneumologie",
    chambre: "320",
    lit: "C",
    blocage: "Logement insalubre",
    score: 9,
    joursEvitables: 8,
    sortantMedicalement: true,
  },
  {
    id: 4,
    nom: "Leroy",
    prenom: "Michel",
    age: 75,
    birthDate: "18/02/1949",
    ins: "1800321456987",
    iep: "CHX0002454",
    service: "Pneumologie",
    chambre: "219",
    lit: "A",
    blocage: "Isolement social",
    score: 7,
    joursEvitables: 4,
    sortantMedicalement: false,
  },
];

export default function App() {
  const [patients] = useState(patientsData);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <Dashboard patients={patients} />
    </div>
  );
}

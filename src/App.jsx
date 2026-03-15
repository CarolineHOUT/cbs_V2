import { useMemo, useState } from "react";
import Dashboard from "./Dashboard.jsx";
import PatientView from "./PatientView.jsx";

const initialPatients = [
  {
    id: 1,
    nom: "Dubois",
    prenom: "Jean",
    age: 81,
    birthDate: "12/05/1943",
    ins: "1800543210987",
    iep: "CHX0002452",
    service: "Pneumologie",
    chambre: "320",
    lit: "C",
    territory: "Cherbourg",
    city: "Cherbourg-en-Cotentin",
    entryDate: "10/03/2026",
    estimatedDischargeDate: "22/03/2026",
    blocage: "Logement insalubre",
    score: 9,
    joursEvitables: 8,
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
    territory: "Valognes",
    city: "Valognes",
    entryDate: "14/03/2026",
    estimatedDischargeDate: "24/03/2026",
    blocage: "Recherche SSIAD",
    score: 8,
    joursEvitables: 6,
    sortantMedicalement: true,
  },
  {
    id: 3,
    nom: "Renard",
    prenom: "Camille",
    age: 76,
    birthDate: "12/03/1948",
    ins: "1800612345987",
    iep: "CHX0002464",
    service: "Oncologie",
    chambre: "214",
    lit: "B",
    territory: "Cherbourg",
    city: "Cherbourg-en-Cotentin",
    entryDate: "18/03/2026",
    estimatedDischargeDate: "26/03/2026",
    blocage: "Coordination ville insuffisante",
    score: 6,
    joursEvitables: 3,
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
    territory: "Valognes",
    city: "Valognes",
    entryDate: "20/03/2026",
    estimatedDischargeDate: "29/03/2026",
    blocage: "Isolement social",
    score: 7,
    joursEvitables: 4,
    sortantMedicalement: false,
  },
];

const initialPatientStates = {
  1: {
    trustedPerson: {
      name: "Marie Dubois",
      relation: "Fille",
      phone: "06 12 34 56 78",
    },
    emergencyContact: {
      name: "Pierre Dubois",
      relation: "Fils",
      phone: "06 98 76 54 32",
    },
    protection: {
      type: "Aucune",
      representative: "",
      phone: "",
    },
    intake: {
      livingPlace: "Domicile",
      aidant: "Oui",
      autonomy: "Fragile",
      territory: "Cherbourg-en-Cotentin",
      anticipation: "Prioritaire dès maintenant",
    },
    barriers: [
      "logement insalubre",
      "absence d'aidant disponible",
      "recherche SSIAD",
    ],
    status: {
      solutionFound: false,
      transportReady: false,
      dischargePlanned: false,
    },
    workflow: [
      {
        id: 1,
        title: "Demande SSIAD",
        owner: "Coordination",
        status: "En cours",
        lastUpdate: "18/03",
      },
      {
        id: 2,
        title: "Évaluation logement",
        owner: "Assistante sociale",
        status: "À lancer",
        lastUpdate: "18/03",
      },
      {
        id: 3,
        title: "Recherche accueil temporaire",
        owner: "Coordination",
        status: "Refusé",
        lastUpdate: "17/03",
      },
    ],
    notes: [
      {
        id: 1,
        author: "Coordination",
        priority: "Urgent",
        read: false,
        date: "18/03 09:10",
        text: "Relancer le SSIAD secteur nord demain matin.",
      },
    ],
    solutions: [
      { id: 1, label: "SSIAD", status: "En cours" },
      { id: 2, label: "Accueil temporaire", status: "Refusé" },
      { id: 3, label: "DAC", status: "À contacter" },
    ],
  },
  2: {
    trustedPerson: {
      name: "Luc Martin",
      relation: "Fils",
      phone: "06 44 55 66 77",
    },
    emergencyContact: {
      name: "Claire Martin",
      relation: "Belle-fille",
      phone: "06 11 22 33 44",
    },
    protection: {
      type: "Curatelle",
      representative: "Mme Perrin",
      phone: "02 33 00 11 22",
    },
    intake: {
      livingPlace: "Domicile avec aide",
      aidant: "Oui",
      autonomy: "Dépendant",
      territory: "Valognes",
      anticipation: "Prioritaire dès maintenant",
    },
    barriers: ["demande SSIAD", "fatigue aidant", "retour domicile complexe"],
    status: {
      solutionFound: false,
      transportReady: false,
      dischargePlanned: false,
    },
    workflow: [
      {
        id: 1,
        title: "Demande SSIAD",
        owner: "Assistante sociale",
        status: "En cours",
        lastUpdate: "19/03",
      },
      {
        id: 2,
        title: "Contact curatrice",
        owner: "Service",
        status: "Terminé",
        lastUpdate: "19/03",
      },
    ],
    notes: [
      {
        id: 1,
        author: "Service",
        priority: "Normal",
        read: true,
        date: "19/03 11:20",
        text: "Curatrice informée de la préparation de sortie.",
      },
    ],
    solutions: [
      { id: 1, label: "SSIAD", status: "En cours" },
      { id: 2, label: "Aide à domicile", status: "À contacter" },
    ],
  },
  3: {
    trustedPerson: {
      name: "Sophie Renard",
      relation: "Sœur",
      phone: "06 21 43 65 87",
    },
    emergencyContact: {
      name: "Sophie Renard",
      relation: "Sœur",
      phone: "06 21 43 65 87",
    },
    protection: {
      type: "Aucune",
      representative: "",
      phone: "",
    },
    intake: {
      livingPlace: "Domicile",
      aidant: "Non",
      autonomy: "Fragile",
      territory: "Cherbourg-en-Cotentin",
      anticipation: "Vigilance",
    },
    barriers: ["coordination ville", "suivi post-sortie"],
    status: {
      solutionFound: false,
      transportReady: false,
      dischargePlanned: false,
    },
    workflow: [
      {
        id: 1,
        title: "Contact DAC",
        owner: "Coordination",
        status: "À lancer",
        lastUpdate: "20/03",
      },
    ],
    notes: [],
    solutions: [
      { id: 1, label: "DAC", status: "À contacter" },
      { id: 2, label: "HDJ", status: "À évaluer" },
    ],
  },
  4: {
    trustedPerson: {
      name: "Aucune donnée",
      relation: "",
      phone: "",
    },
    emergencyContact: {
      name: "",
      relation: "",
      phone: "",
    },
    protection: {
      type: "Aucune",
      representative: "",
      phone: "",
    },
    intake: {
      livingPlace: "Domicile",
      aidant: "Non",
      autonomy: "Fragile",
      territory: "Valognes",
      anticipation: "Vigilance",
    },
    barriers: ["isolement social"],
    status: {
      solutionFound: false,
      transportReady: false,
      dischargePlanned: false,
    },
    workflow: [
      {
        id: 1,
        title: "Évaluation DAC",
        owner: "Coordination",
        status: "À lancer",
        lastUpdate: "20/03",
      },
    ],
    notes: [],
    solutions: [{ id: 1, label: "DAC", status: "À contacter" }],
  },
};

export default function App() {
  const [patients] = useState(initialPatients);
  const [patientStates, setPatientStates] = useState(initialPatientStates);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  function updatePatientState(patientId, updater) {
    setPatientStates((prev) => {
      const current = prev[patientId];
      const nextValue =
        typeof updater === "function" ? updater(current) : { ...current, ...updater };

      return {
        ...prev,
        [patientId]: nextValue,
      };
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", color: "#111827" }}>
      {!selectedPatient ? (
        <Dashboard
          patients={patients}
          onOpenPatient={(patient) => setSelectedPatientId(patient.id)}
        />
      ) : (
        <PatientView
          patient={selectedPatient}
          patientState={patientStates[selectedPatient.id]}
          onBack={() => setSelectedPatientId(null)}
          updatePatientState={(updater) =>
            updatePatientState(selectedPatient.id, updater)
          }
        />
      )}
    </div>
  );
}

import { useState } from "react";
import Dashboard from "./Dashboard";

const patientsData = [
  {
    id: 1,
    nom: "Dubois",
    prenom: "Jean",
    age: 81,
    birthDate: "12/05/1943",
    ins: "1800543210987",
    iep: "CHX0002452",
    entryDate: "10/03/2026",
    service: "Pneumologie",
    chambre: "320",
    lit: "C",
    blocage: "Logement insalubre",
    joursEvitables: 8,
    score: 9,
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
    entryDate: "09/03/2026",
    service: "Médecine",
    chambre: "118",
    lit: "A",
    blocage: "Recherche SSIAD",
    joursEvitables: 6,
    score: 8,
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
    entryDate: "11/03/2026",
    service: "Oncologie",
    chambre: "214",
    lit: "B",
    blocage: "Coordination ville insuffisante",
    joursEvitables: 3,
    score: 6,
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
    entryDate: "20/03/2026",
    service: "Pneumologie",
    chambre: "219",
    lit: "A",
    blocage: "Isolement social",
    joursEvitables: 0,
    score: 5,
    sortantMedicalement: false,
  },
  {
    id: 5,
    nom: "Moreau",
    prenom: "Alice",
    age: 68,
    birthDate: "04/07/1957",
    ins: "1800456123789",
    iep: "CHX0002501",
    entryDate: "08/03/2026",
    service: "Chirurgie",
    chambre: "402",
    lit: "B",
    blocage: "Attente place SSR",
    joursEvitables: 7,
    score: 8,
    sortantMedicalement: true,
  },
  {
    id: 6,
    nom: "Faure",
    prenom: "Louis",
    age: 73,
    birthDate: "21/01/1952",
    ins: "1800789456123",
    iep: "CHX0002502",
    entryDate: "14/03/2026",
    service: "Chirurgie",
    chambre: "405",
    lit: "A",
    blocage: "Transport sanitaire",
    joursEvitables: 2,
    score: 6,
    sortantMedicalement: true,
  },
  {
    id: 7,
    nom: "Bernard",
    prenom: "Sophie",
    age: 79,
    birthDate: "16/09/1945",
    ins: "1800123498765",
    iep: "CHX0002503",
    entryDate: "07/03/2026",
    service: "Médecine polyvalente",
    chambre: "155",
    lit: "C",
    blocage: "Retour domicile non sécurisé",
    joursEvitables: 5,
    score: 7,
    sortantMedicalement: true,
  },
  {
    id: 8,
    nom: "Petit",
    prenom: "Henri",
    age: 84,
    birthDate: "03/04/1941",
    ins: "1800432198765",
    iep: "CHX0002504",
    entryDate: "06/03/2026",
    service: "Médecine polyvalente",
    chambre: "160",
    lit: "B",
    blocage: "Recherche EHPAD",
    joursEvitables: 9,
    score: 9,
    sortantMedicalement: true,
  },
  {
    id: 9,
    nom: "Garnier",
    prenom: "Lucie",
    age: 70,
    birthDate: "15/11/1955",
    ins: "1800876543211",
    iep: "CHX0002505",
    entryDate: "13/03/2026",
    service: "Neurologie",
    chambre: "510",
    lit: "A",
    blocage: "Rééducation non organisée",
    joursEvitables: 4,
    score: 7,
    sortantMedicalement: true,
  },
  {
    id: 10,
    nom: "Chevalier",
    prenom: "Paul",
    age: 82,
    birthDate: "29/08/1943",
    ins: "1800549876123",
    iep: "CHX0002506",
    entryDate: "05/03/2026",
    service: "Neurologie",
    chambre: "512",
    lit: "C",
    blocage: "Attente accord famille",
    joursEvitables: 3,
    score: 6,
    sortantMedicalement: true,
  },
  {
    id: 11,
    nom: "Roux",
    prenom: "Claire",
    age: 77,
    birthDate: "22/06/1948",
    ins: "1800112233445",
    iep: "CHX0002507",
    entryDate: "04/03/2026",
    service: "Cardiologie",
    chambre: "610",
    lit: "B",
    blocage: "Education thérapeutique incomplète",
    joursEvitables: 2,
    score: 6,
    sortantMedicalement: true,
  },
  {
    id: 12,
    nom: "Masson",
    prenom: "André",
    age: 88,
    birthDate: "10/12/1936",
    ins: "1800998877665",
    iep: "CHX0002508",
    entryDate: "02/03/2026",
    service: "Cardiologie",
    chambre: "615",
    lit: "A",
    blocage: "Recherche HAD",
    joursEvitables: 6,
    score: 8,
    sortantMedicalement: true,
  },
  {
    id: 13,
    nom: "Perrot",
    prenom: "Nadia",
    age: 66,
    birthDate: "14/02/1959",
    ins: "1800765432198",
    iep: "CHX0002509",
    entryDate: "16/03/2026",
    service: "Médecine",
    chambre: "122",
    lit: "B",
    blocage: "Ordonnances non finalisées",
    joursEvitables: 1,
    score: 5,
    sortantMedicalement: false,
  },
  {
    id: 14,
    nom: "Lemaire",
    prenom: "Hugo",
    age: 72,
    birthDate: "30/01/1953",
    ins: "1800456789123",
    iep: "CHX0002510",
    entryDate: "12/03/2026",
    service: "Chirurgie",
    chambre: "408",
    lit: "C",
    blocage: "Matériel domicile non livré",
    joursEvitables: 4,
    score: 7,
    sortantMedicalement: true,
  },
  {
    id: 15,
    nom: "Blanc",
    prenom: "Marianne",
    age: 83,
    birthDate: "05/05/1942",
    ins: "1800678901234",
    iep: "CHX0002511",
    entryDate: "03/03/2026",
    service: "Médecine polyvalente",
    chambre: "162",
    lit: "A",
    blocage: "Tutelle à formaliser",
    joursEvitables: 5,
    score: 8,
    sortantMedicalement: true,
  },
  {
    id: 16,
    nom: "Rey",
    prenom: "Thomas",
    age: 69,
    birthDate: "09/09/1956",
    ins: "1800345612987",
    iep: "CHX0002512",
    entryDate: "18/03/2026",
    service: "Neurologie",
    chambre: "520",
    lit: "B",
    blocage: "Aide humaine à domicile absente",
    joursEvitables: 2,
    score: 6,
    sortantMedicalement: true,
  },
  {
    id: 17,
    nom: "Noel",
    prenom: "Jacqueline",
    age: 90,
    birthDate: "17/01/1936",
    ins: "1800222333444",
    iep: "CHX0002513",
    entryDate: "01/03/2026",
    service: "Cardiologie",
    chambre: "618",
    lit: "C",
    blocage: "Recherche EHPAD",
    joursEvitables: 8,
    score: 9,
    sortantMedicalement: true,
  },
  {
    id: 18,
    nom: "Colin",
    prenom: "Marc",
    age: 74,
    birthDate: "11/06/1951",
    ins: "1800555666777",
    iep: "CHX0002514",
    entryDate: "19/03/2026",
    service: "Chirurgie",
    chambre: "410",
    lit: "A",
    blocage: "Validation ordonnance de sortie",
    joursEvitables: 1,
    score: 5,
    sortantMedicalement: false,
  },
];

function PatientSheet({ patient, onClose }) {
  if (!patient) return null;

  return (
    <div style={sheetStyles.overlay}>
      <div style={sheetStyles.sheet}>
        <div style={sheetStyles.header}>
          <div>
            <div style={sheetStyles.title}>
              {patient.nom} {patient.prenom}
            </div>
            <div style={sheetStyles.subtitle}>
              {patient.birthDate} • {patient.age} ans • INS {patient.ins} • IEP {patient.iep}
            </div>
          </div>

          <button onClick={onClose} style={sheetStyles.closeButton}>
            Fermer
          </button>
        </div>

        <div style={sheetStyles.grid}>
          <Info label="Service" value={patient.service} />
          <Info label="Chambre / lit" value={`${patient.chambre} • lit ${patient.lit}`} />
          <Info label="Admission" value={patient.entryDate} />
          <Info label="Frein principal" value={patient.blocage} />
          <Info
            label="Sortant médical"
            value={patient.sortantMedicalement ? "Oui" : "Non"}
          />
          <Info label="Jours évitables" value={`${patient.joursEvitables} j`} />
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={sheetStyles.infoCard}>
      <div style={sheetStyles.infoLabel}>{label}</div>
      <div style={sheetStyles.infoValue}>{value}</div>
    </div>
  );
}

export default function App() {
  const [selectedPatient, setSelectedPatient] = useState(null);

  return (
    <div style={appStyles.page}>
      <Dashboard patients={patientsData} onOpenPatient={setSelectedPatient} />
      <PatientSheet
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </div>
  );
}

const appStyles = {
  page: {
    minHeight: "100vh",
    background: "#F8FAFC",
  },
};

const sheetStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.28)",
    display: "flex",
    justifyContent: "flex-end",
    zIndex: 50,
  },
  sheet: {
    width: "min(520px, 100%)",
    height: "100%",
    background: "#FFFFFF",
    boxShadow: "-12px 0 40px rgba(15,23,42,0.18)",
    padding: 20,
    boxSizing: "border-box",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748B",
    lineHeight: 1.45,
  },
  closeButton: {
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 700,
    color: "#334155",
  },
  grid: {
    display: "grid",
    gap: 12,
  },
  infoCard: {
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    padding: 14,
    background: "#FFFFFF",
  },
  infoLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.2,
    color: "#64748B",
    fontWeight: 800,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: 600,
    lineHeight: 1.45,
  },
};

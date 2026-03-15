import Notes from "./Notes.jsx";
import Workflow from "./Workflow.jsx";
import IntakeForm from "./IntakeForm.jsx";

export default function PatientView({ patient, onBack }) {

  return (

    <div>

      <button onClick={onBack}>
        Retour
      </button>

      <h2>
        {patient.prenom} {patient.nom}
      </h2>

      <div>INS : {patient.ins}</div>
      <div>Service : {patient.service}</div>
      <div>Blocage : {patient.blocage}</div>

      <hr/>

      <IntakeForm />

      <Workflow />

      <Notes />

    </div>
  );
}

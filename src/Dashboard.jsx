export default function Dashboard({ patients, onOpenPatient }) {

  const blockedPatients = patients.filter(p => p.score >= 7).length;
  const riskPatients = patients.filter(p => p.score >= 5 && p.score < 7).length;

  return (

    <div>

      <h2>Tableau de bord</h2>

      <div style={{marginBottom:20}}>
        Patients suivis : {patients.length}
        <br/>
        Patients bloqués : {blockedPatients}
        <br/>
        Patients à risque : {riskPatients}
      </div>

      {patients.map(p => (

        <div
          key={p.id}
          onClick={() => onOpenPatient(p)}
          style={{
            border:"1px solid #ddd",
            padding:12,
            marginBottom:10,
            cursor:"pointer"
          }}
        >

          <strong>{p.prenom} {p.nom}</strong>

          <div>INS : {p.ins}</div>
          <div>Service : {p.service}</div>
          <div>Blocage : {p.blocage}</div>
          <div>Score : {p.score}</div>

        </div>

      ))}

    </div>
  );
}

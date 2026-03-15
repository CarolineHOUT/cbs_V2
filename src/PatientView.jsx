export default function Dashboard({ patients, onOpenPatient }) {
  const totalPatients = patients.length;

  const blockedPatients = patients.filter((p) => p.score >= 8).length;

  const riskPatients = patients.filter(
    (p) => p.score >= 6 && p.score < 8
  ).length;

  const avoidableDays = patients.reduce(
    (sum, p) => sum + (p.score >= 8 ? 6 : p.score >= 6 ? 3 : 1),
    0
  );

  const recoverableBeds = Math.round(avoidableDays / 7);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "auto" }}>
      <div
        style={{
          background: "linear-gradient(135deg,#6366f1,#7c3aed)",
          borderRadius: 20,
          padding: 30,
          color: "white",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 14, opacity: 0.8 }}>CARABBAS</div>

        <div style={{ fontSize: 32, fontWeight: "bold", marginTop: 8 }}>
          Tableau de bord des sorties complexes
        </div>

        <div style={{ marginTop: 10 }}>
          {totalPatients} patient(s) sortant(s) médicalement encore présent(s),
          {blockedPatients} bloqué(s), {avoidableDays} jours évitables estimés,
          soit environ {recoverableBeds} lit(s) récupérable(s).
        </div>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        <StatCard
          title="Patients suivis"
          value={totalPatients}
          color="#ede9fe"
        />

        <StatCard
          title="Patients bloqués"
          value={blockedPatients}
          color="#fee2e2"
        />

        <StatCard
          title="Patients à risque"
          value={riskPatients}
          color="#fef3c7"
        />

        <StatCard
          title="Jours évitables"
          value={avoidableDays}
          color="#dcfce7"
        />
      </div>

      <div style={{ marginTop: 30 }}>
        <h2>Liste des patients</h2>

        {patients.map((p) => (
          <div
            key={p.id}
            onClick={() => onOpenPatient(p)}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 16,
              marginTop: 10,
              cursor: "pointer",
              background: "white",
            }}
          >
            <div style={{ fontWeight: "bold" }}>
              {p.nom} {p.prenom}
            </div>

            <div style={{ fontSize: 14, color: "#64748b" }}>
              {p.service} • chambre {p.chambre}
            </div>

            <div style={{ marginTop: 6 }}>
              Score CARABBAS : {p.score}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div
      style={{
        background: color,
        borderRadius: 16,
        padding: 24,
      }}
    >
      <div style={{ fontSize: 16 }}>{title}</div>

      <div style={{ fontSize: 36, fontWeight: "bold" }}>{value}</div>
    </div>
  );
}

export default function Dashboard({ patients }) {
  const totalPatients = patients.length;

  const blockedPatients = patients.filter(
    (p) => p.sortantMedicalement && p.score >= 8
  ).length;

  const riskPatients = patients.filter(
    (p) => !p.sortantMedicalement && p.score >= 7
  ).length;

  const avoidableDays = patients
    .filter((p) => p.sortantMedicalement)
    .reduce((sum, p) => sum + p.joursEvitables, 0);

  const recoverableBeds = Math.max(0, Math.round(avoidableDays / 7));

  return (
    <div style={{ padding: 24, maxWidth: 1300, margin: "0 auto" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          color: "white",
          borderRadius: 18,
          padding: 24,
          marginBottom: 20,
          boxShadow: "0 10px 30px rgba(79,70,229,0.18)",
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.85, textTransform: "uppercase", letterSpacing: 1 }}>
          CARABBAS
        </div>
        <h1 style={{ margin: "8px 0 10px 0", fontSize: 32 }}>
          Tableau de bord des sorties complexes
        </h1>
        <div style={{ fontSize: 16, lineHeight: 1.5 }}>
          {patients.filter((p) => p.sortantMedicalement).length} patient(s) sortant(s) médicalement encore présent(s),{" "}
          {blockedPatients} bloqué(s), {avoidableDays} jours évitables estimés, soit environ{" "}
          {recoverableBeds} lit(s) récupérable(s).
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <KpiCard title="Patients suivis" value={totalPatients} color="#ede9fe" textColor="#5b21b6" />
        <KpiCard title="Patients bloqués" value={blockedPatients} color="#fee2e2" textColor="#b91c1c" />
        <KpiCard title="Patients à risque" value={riskPatients} color="#ffedd5" textColor="#c2410c" />
        <KpiCard title="Jours évitables" value={avoidableDays} color="#dcfce7" textColor="#166534" />
      </div>

      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 18,
          padding: 20,
          boxShadow: "0 4px 16px rgba(15,23,42,0.05)",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Patients prioritaires
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#64748b" }}>
                <th style={thStyle}>Patient</th>
                <th style={thStyle}>INS</th>
                <th style={thStyle}>Service</th>
                <th style={thStyle}>Chambre</th>
                <th style={thStyle}>Lit</th>
                <th style={thStyle}>Blocage</th>
                <th style={thStyle}>Jours évitables</th>
                <th style={thStyle}>Score</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>
                      {p.prenom} {p.nom}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {p.age} ans · {p.birthDate} · IEP {p.iep}
                    </div>
                  </td>
                  <td style={tdStyle}>{p.ins}</td>
                  <td style={tdStyle}>{p.service}</td>
                  <td style={tdStyle}>{p.chambre}</td>
                  <td style={tdStyle}>{p.lit}</td>
                  <td style={tdStyle}>{p.blocage}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "#c2410c" }}>
                    {p.sortantMedicalement ? p.joursEvitables : 0}
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "6px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        background: getScoreBg(p.score),
                        color: getScoreText(p.score),
                      }}
                    >
                      {p.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, color, textColor }) {
  return (
    <div
      style={{
        background: color,
        borderRadius: 18,
        padding: 18,
        border: "1px solid rgba(15,23,42,0.06)",
      }}
    >
      <div style={{ fontSize: 13, color: "#475569", marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 800, color: textColor }}>{value}</div>
    </div>
  );
}

function getScoreBg(score) {
  if (score >= 9) return "#fee2e2";
  if (score >= 7) return "#ffedd5";
  if (score >= 5) return "#fef3c7";
  return "#dcfce7";
}

function getScoreText(score) {
  if (score >= 9) return "#b91c1c";
  if (score >= 7) return "#c2410c";
  if (score >= 5) return "#a16207";
  return "#166534";
}

const thStyle = {
  paddingBottom: 12,
  paddingTop: 4,
  fontWeight: 600,
};

const tdStyle = {
  paddingTop: 14,
  paddingBottom: 14,
};

export default function Dashboard({ patients, onOpenPatient }) {

  const sortedPatients = [...patients].sort((a, b) => b.score - a.score)

  const totalPatients = patients.length

  const blockedPatients = patients.filter(p => p.score >= 8).length

  const riskPatients = patients.filter(p => p.score >= 6 && p.score < 8).length

  const avoidableDays = patients.reduce(
    (sum, p) => sum + (p.score >= 8 ? 6 : p.score >= 6 ? 3 : 1),
    0
  )

  const recoverableBeds = Math.round(avoidableDays / 7)

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "auto" }}>

      {/* Bandeau principal */}

      <div style={{
        background: "linear-gradient(135deg,#6366f1,#7c3aed)",
        borderRadius: 20,
        padding: 30,
        color: "white",
        marginBottom: 30
      }}>

        <div style={{ fontSize: 14, opacity: 0.8 }}>
          CARABBAS
        </div>

        <div style={{
          fontSize: 34,
          fontWeight: "bold",
          marginTop: 6
        }}>
          Tableau de bord des sorties complexes
        </div>

        <div style={{ marginTop: 10 }}>
          {totalPatients} patients suivis, {blockedPatients} bloqués,
          {avoidableDays} jours évitables estimés,
          soit environ {recoverableBeds} lits récupérables.
        </div>

      </div>

      {/* KPI */}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
        gap: 20,
        marginBottom: 30
      }}>

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

      {/* Liste patients */}

      <div>

        <h2 style={{ marginBottom: 10 }}>
          Patients prioritaires
        </h2>

        {sortedPatients.map((p) => (

          <div
            key={p.id}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: 18,
              marginBottom: 12,
              background: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10
            }}
          >

            <div>

              <div style={{
                fontWeight: "bold",
                fontSize: 16
              }}>
                {p.nom} {p.prenom}
              </div>

              <div style={{
                fontSize: 13,
                color: "#64748b"
              }}>
                {p.service} • chambre {p.chambre}
              </div>

              <div style={{
                marginTop: 4,
                fontSize: 13
              }}>
                Frein : {p.blocage}
              </div>

            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>

              <ScoreBadge score={p.score} />

              <button
                onClick={() => onOpenPatient(p)}
                style={{
                  border: "none",
                  background: "#6366f1",
                  color: "white",
                  padding: "10px 14px",
                  borderRadius: 10,
                  cursor: "pointer"
                }}
              >
                Ouvrir dossier
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}

function StatCard({ title, value, color }) {

  return (

    <div style={{
      background: color,
      borderRadius: 16,
      padding: 24
    }}>

      <div style={{ fontSize: 15 }}>
        {title}
      </div>

      <div style={{
        fontSize: 38,
        fontWeight: "bold",
        marginTop: 4
      }}>
        {value}
      </div>

    </div>

  )
}

function ScoreBadge({ score }) {

  let bg = "#dcfce7"
  let text = "#166534"

  if (score >= 8) {
    bg = "#fee2e2"
    text = "#b91c1c"
  }

  else if (score >= 6) {
    bg = "#fef3c7"
    text = "#92400e"
  }

  return (

    <div style={{
      background: bg,
      color: text,
      padding: "8px 12px",
      borderRadius: 999,
      fontWeight: "bold",
      fontSize: 13
    }}>
      Score {score}
    </div>

  )
}

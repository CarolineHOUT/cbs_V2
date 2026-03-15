export default function Dashboard({ patients, onOpenPatient }) {
  const sortedPatients = [...patients].sort((a, b) => b.score - a.score);
  
  const totalPatients = patients.length;
  const blockedPatients = patients.filter((p) => p.score >= 8).length;
  const riskPatients = patients.filter((p) => p.score >= 6 && p.score < 8).length;

  const avoidableDays = patients.reduce(
    (sum, p) => sum + (p.score >= 8 ? 6 : p.score >= 6 ? 3 : 1),
    0
  );

  const recoverableBeds = Math.round(avoidableDays / 7);

  const serviceStats = buildServiceStats(patients);

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: "auto" }}>
      <div
        style={{
          background: "linear-gradient(135deg,#6366f1,#7c3aed)",
          borderRadius: 20,
          padding: 30,
          color: "white",
          marginBottom: 30,
        }}
      >
        <div style={{ fontSize: 14, opacity: 0.8 }}>CARABBAS</div>

        <div style={{ fontSize: 34, fontWeight: "bold", marginTop: 6 }}>
          Tableau de bord des sorties complexes
        </div>

        <div style={{ marginTop: 10, lineHeight: 1.5 }}>
          {totalPatients} patients suivis, {blockedPatients} bloqués,
          {avoidableDays} jours évitables estimés, soit environ {recoverableBeds} lits récupérables.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
          marginBottom: 30,
        }}
      >
        <StatCard title="Patients suivis" value={totalPatients} color="#ede9fe" />
        <StatCard title="Patients bloqués" value={blockedPatients} color="#fee2e2" />
        <StatCard title="Patients à risque" value={riskPatients} color="#fef3c7" />
        <StatCard title="Jours évitables" value={avoidableDays} color="#dcfce7" />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 1fr)",
          gap: 20,
          alignItems: "start",
        }}
      >
        <div>
          <SectionCard title="Patients prioritaires">
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
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: "bold", fontSize: 16 }}>
                    {p.nom} {p.prenom}
                  </div>

                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    {p.service} • chambre {p.chambre} • lit {p.lit}
                  </div>

                  <div style={{ marginTop: 4, fontSize: 13 }}>
                    Frein : {p.blocage}
                  </div>

                  <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
                    INS : {p.ins}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <PriorityBadge score={p.score} />
                  <ScoreBadge score={p.score} />

                  <button
                    onClick={() => onOpenPatient(p)}
                    style={{
                      border: "none",
                      background: "#6366f1",
                      color: "white",
                      padding: "10px 14px",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Ouvrir dossier
                  </button>
                </div>
              </div>
            ))}
          </SectionCard>
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          <SectionCard title="Services exposés">
            {serviceStats.map((service) => (
              <div
                key={service.name}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                  background: "white",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{service.name}</div>
                  <ServiceToneBadge level={service.level} />
                </div>

                <div style={{ marginTop: 8, fontSize: 13, color: "#475569" }}>
                  {service.blocked} bloqué(s) • {service.risk} à risque
                </div>

                <div style={{ marginTop: 6, fontSize: 13, color: "#475569" }}>
                  {service.avoidableDays} jours évitables estimés
                </div>
              </div>
            ))}
          </SectionCard>

          <SectionCard title="Lecture coordination">
            <InfoLine
              label="Situation la plus tendue"
              value={serviceStats[0] ? serviceStats[0].name : "Non disponible"}
            />
            <InfoLine
              label="Patients bloqués prioritaires"
              value={String(blockedPatients)}
            />
            <InfoLine
              label="Risque de saturation"
              value={recoverableBeds >= 2 ? "Élevé" : "Modéré"}
            />
            <InfoLine
              label="Focus du jour"
              value={
                blockedPatients > 0
                  ? "Finaliser les solutions d'aval des patients bloqués"
                  : "Sécuriser les patients à risque"
              }
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function buildServiceStats(patients) {
  const grouped = {};

  patients.forEach((p) => {
    if (!grouped[p.service]) {
      grouped[p.service] = {
        name: p.service,
        blocked: 0,
        risk: 0,
        avoidableDays: 0,
      };
    }

    if (p.score >= 8) grouped[p.service].blocked += 1;
    else if (p.score >= 6) grouped[p.service].risk += 1;

    grouped[p.service].avoidableDays += p.score >= 8 ? 6 : p.score >= 6 ? 3 : 1;
  });

  return Object.values(grouped)
    .map((service) => ({
      ...service,
      level:
        service.blocked >= 2
          ? "critical"
          : service.blocked >= 1 || service.risk >= 2
            ? "high"
            : service.risk >= 1
              ? "medium"
              : "low",
    }))
    .sort((a, b) => {
      const rank = { critical: 4, high: 3, medium: 2, low: 1 };
      return rank[b.level] - rank[a.level];
    });
}

function SectionCard({ title, children }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 4px 16px rgba(15,23,42,0.05)",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        {title}
      </div>
      {children}
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
      <div style={{ fontSize: 15 }}>{title}</div>
      <div style={{ fontSize: 38, fontWeight: "bold", marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}

function ScoreBadge({ score }) {
  let bg = "#dcfce7";
  let text = "#166534";

  if (score >= 8) {
    bg = "#fee2e2";
    text = "#b91c1c";
  } else if (score >= 6) {
    bg = "#fef3c7";
    text = "#92400e";
  }

  return (
    <div
      style={{
        background: bg,
        color: text,
        padding: "8px 12px",
        borderRadius: 999,
        fontWeight: "bold",
        fontSize: 13,
      }}
    >
      Score {score}
    </div>
  );
}

function PriorityBadge({ score }) {
  let bg = "#dcfce7";
  let text = "#166534";
  let label = "Suivi";

  if (score >= 8) {
    bg = "#fee2e2";
    text = "#b91c1c";
    label = "Bloqué";
  } else if (score >= 6) {
    bg = "#ffedd5";
    text = "#c2410c";
    label = "Risque";
  }

  return (
    <div
      style={{
        background: bg,
        color: text,
        padding: "8px 12px",
        borderRadius: 999,
        fontWeight: "bold",
        fontSize: 13,
      }}
    >
      {label}
    </div>
  );
}

function ServiceToneBadge({ level }) {
  const config = {
    critical: { label: "Critique", bg: "#fee2e2", color: "#b91c1c" },
    high: { label: "Élevé", bg: "#ffedd5", color: "#c2410c" },
    medium: { label: "Modéré", bg: "#fef3c7", color: "#92400e" },
    low: { label: "Stable", bg: "#dcfce7", color: "#166534" },
  };

  const tone = config[level];

  return (
    <div
      style={{
        background: tone.bg,
        color: tone.color,
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {tone.label}
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div
      style={{
        padding: "10px 0",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <div style={{ fontSize: 13, color: "#64748b" }}>{label}</div>
      <div style={{ marginTop: 4, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

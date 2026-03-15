export default function Dashboard({ patients, onOpenPatient }) {
  const sortedPatients = [...patients].sort((a, b) => b.score - a.score);

  const totalPatients = patients.length;
  const blockedPatients = patients.filter((p) => p.score >= 8).length;
  const riskPatients = patients.filter((p) => p.score >= 6 && p.score < 8).length;

  const avoidableDays = patients.reduce(
    (sum, p) => sum + (p.score >= 8 ? 6 : p.score >= 6 ? 3 : 1),
    0
  );

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div style={headerTopStyle}>
          <div>
            <div style={brandStyle}>CARABBAS</div>
            <div style={subtitleStyle}>Pilotage des sorties hospitalières complexes</div>
          </div>
        </div>

        <div style={navWrapStyle}>
          <NavPill active>Tableau de bord</NavPill>
          <NavPill>Patient en fiche</NavPill>
          <NavPill>Vue DUO</NavPill>
          <NavPill>Équipe</NavPill>
          <NavDanger>Crise</NavDanger>
        </div>
      </header>

      <section style={kpiGridStyle}>
        <KpiCard title="Patients suivis" value={totalPatients} tone="violet" />
        <KpiCard title="Bloqués" value={blockedPatients} tone="red" />
        <KpiCard title="À risque" value={riskPatients} tone="amber" />
        <KpiCard title="Jours évitables" value={avoidableDays} tone="green" />
      </section>

      <section style={contentGridStyle}>
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelTitleStyle}>Patients prioritaires</div>
              <div style={panelSubStyle}>Service • coordination • gestion des lits</div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {sortedPatients.map((p) => (
              <div key={p.id} style={patientRowStyle}>
                <div style={patientMainStyle}>
                  <div style={patientHeaderLineStyle}>
                    <div style={patientNameStyle}>
                      {p.nom} {p.prenom}
                    </div>

                    <div style={badgeRowStyle}>
                      <PriorityBadge score={p.score} />
                      <ScoreBadge score={p.score} />
                    </div>
                  </div>

                  <div style={patientMetaStyle}>
                    {p.service} • chambre {p.chambre} • lit {p.lit}
                  </div>

                  <div style={patientDetailStyle}>
                    <strong>Frein :</strong> {p.blocage}
                  </div>

                  <div style={patientMutedStyle}>INS : {p.ins}</div>
                </div>

                <button onClick={() => onOpenPatient(p)} style={openButtonStyle}>
                  Ouvrir
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={sideColStyle}>
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <div style={panelTitleStyle}>Lecture rapide</div>
                <div style={panelSubStyle}>Vue direction / coordination</div>
              </div>
            </div>

            <InfoLine label="Patients bloqués" value={String(blockedPatients)} />
            <InfoLine label="Patients à risque" value={String(riskPatients)} />
            <InfoLine label="Jours évitables" value={String(avoidableDays)} />
            <InfoLine
              label="Tension"
              value={blockedPatients >= 2 ? "Élevée" : "Modérée"}
            />
          </div>

          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <div style={panelTitleStyle}>Action du jour</div>
                <div style={panelSubStyle}>Priorité opérationnelle</div>
              </div>
            </div>

            <div style={focusBoxStyle}>
              {blockedPatients > 0
                ? "Finaliser les solutions d’aval des patients bloqués."
                : "Sécuriser rapidement les patients à risque."}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function NavPill({ children, active = false }) {
  return (
    <div
      style={{
        padding: "7px 11px",
        borderRadius: 10,
        border: active ? "1px solid #312e81" : "1px solid #e5e7eb",
        background: active ? "#4f46e5" : "#ffffff",
        color: active ? "#ffffff" : "#374151",
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

function NavDanger({ children }) {
  return (
    <div
      style={{
        padding: "7px 11px",
        borderRadius: 10,
        border: "1px solid #fecaca",
        background: "#fff7f7",
        color: "#b91c1c",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

function KpiCard({ title, value, tone }) {
  const tones = {
    violet: { bg: "#f5f3ff", color: "#6d28d9" },
    red: { bg: "#fef2f2", color: "#b91c1c" },
    amber: { bg: "#fffbeb", color: "#b45309" },
    green: { bg: "#ecfdf5", color: "#15803d" },
  };

  return (
    <div style={kpiCardStyle}>
      <div style={kpiTitleStyle}>{title}</div>
      <div
        style={{
          ...kpiValueStyle,
          background: tones[tone].bg,
          color: tones[tone].color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PriorityBadge({ score }) {
  let bg = "#ecfdf5";
  let color = "#15803d";
  let label = "Suivi";

  if (score >= 8) {
    bg = "#fef2f2";
    color = "#b91c1c";
    label = "Bloqué";
  } else if (score >= 6) {
    bg = "#fffbeb";
    color = "#b45309";
    label = "Risque";
  }

  return <span style={badgeStyle(bg, color)}>{label}</span>;
}

function ScoreBadge({ score }) {
  let bg = "#ecfdf5";
  let color = "#15803d";

  if (score >= 8) {
    bg = "#fef2f2";
    color = "#b91c1c";
  } else if (score >= 6) {
    bg = "#fffbeb";
    color = "#b45309";
  }

  return <span style={badgeStyle(bg, color)}>Score {score}</span>;
}

function badgeStyle(bg, color) {
  return {
    display: "inline-block",
    background: bg,
    color,
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
  };
}

function InfoLine({ label, value }) {
  return (
    <div style={{ padding: "9px 0", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ marginTop: 3, fontWeight: 700, color: "#111827", fontSize: 14 }}>
        {value}
      </div>
    </div>
  );
}

const pageStyle = {
  maxWidth: 1240,
  margin: "0 auto",
  padding: 14,
};

const headerStyle = {
  background: "linear-gradient(135deg,#5b54c7,#6d66d8)",
  color: "#ffffff",
  borderRadius: 18,
  padding: "14px 14px 12px 14px",
  marginBottom: 12,
};

const headerTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "start",
};

const brandStyle = {
  fontSize: "clamp(22px, 5vw, 28px)",
  fontWeight: 800,
  letterSpacing: 0.4,
  lineHeight: 1.05,
};

const subtitleStyle = {
  marginTop: 3,
  fontSize: 13,
  opacity: 0.92,
};

const navWrapStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 12,
};

const kpiGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 10,
  marginBottom: 14,
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.7fr) minmax(260px, 0.9fr)",
  gap: 14,
  alignItems: "start",
};

const sideColStyle = {
  display: "grid",
  gap: 14,
};

const panelStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 16,
  boxShadow: "0 2px 10px rgba(15,23,42,0.04)",
};

const panelHeaderStyle = {
  marginBottom: 12,
};

const panelTitleStyle = {
  fontSize: 17,
  fontWeight: 800,
  color: "#111827",
};

const panelSubStyle = {
  marginTop: 3,
  fontSize: 12,
  color: "#6b7280",
};

const kpiCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 14,
  boxShadow: "0 2px 10px rgba(15,23,42,0.04)",
};

const kpiTitleStyle = {
  fontSize: 13,
  color: "#6b7280",
  marginBottom: 10,
};

const kpiValueStyle = {
  display: "inline-block",
  borderRadius: 12,
  padding: "8px 12px",
  fontSize: 24,
  fontWeight: 800,
  minWidth: 52,
};

const patientRowStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 14,
  background: "#ffffff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const patientMainStyle = {
  minWidth: 0,
  flex: 1,
};

const patientHeaderLineStyle = {
  display: "flex",
  gap: 10,
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
};

const patientNameStyle = {
  fontSize: 15,
  fontWeight: 800,
  color: "#111827",
};

const badgeRowStyle = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const patientMetaStyle = {
  fontSize: 12,
  color: "#6b7280",
  marginTop: 4,
};

const patientDetailStyle = {
  marginTop: 6,
  fontSize: 14,
  color: "#111827",
};

const patientMutedStyle = {
  marginTop: 4,
  fontSize: 12,
  color: "#6b7280",
};

const openButtonStyle = {
  border: "none",
  background: "#5b54c7",
  color: "#ffffff",
  padding: "9px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
  whiteSpace: "nowrap",
  fontSize: 13,
};

const focusBoxStyle = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
  color: "#111827",
  lineHeight: 1.55,
  fontSize: 14,
};

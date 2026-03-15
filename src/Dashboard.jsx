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

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <div style={brandStyle}>CARABBAS</div>
          <div style={subtitleStyle}>Pilotage des sorties hospitalières complexes</div>
        </div>

        <div style={navWrapStyle}>
          <NavPill active>Tableau de bord</NavPill>
          <NavPill>Patient en fiche</NavPill>
          <NavPill>Vue DUO</NavPill>
          <NavPill>Équipe Vue</NavPill>
          <NavDanger>Déclencher cellule de crise</NavDanger>
        </div>
      </header>

      <section style={heroStyle}>
        <div style={heroEyebrowStyle}>Impact du jour</div>
        <h1 style={heroTitleStyle}>Pilotage capacitaire et coordination</h1>
        <p style={heroTextStyle}>
          {patients.filter((p) => p.sortantMedicalement).length} patient(s) sortant(s)
          médicalement encore présent(s), {blockedPatients} bloqué(s), {avoidableDays} jours
          évitables estimés, soit environ {recoverableBeds} lit(s) récupérable(s).
        </p>
      </section>

      <section style={kpiGridStyle}>
        <KpiCard title="Patients suivis" value={totalPatients} tone="violet" />
        <KpiCard title="Patients bloqués" value={blockedPatients} tone="red" />
        <KpiCard title="Patients à risque" value={riskPatients} tone="amber" />
        <KpiCard title="Jours évitables" value={avoidableDays} tone="green" />
      </section>

      <section style={contentGridStyle}>
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelTitleStyle}>Patients prioritaires</div>
              <div style={panelSubStyle}>Lecture service, coordination et gestion des lits</div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {sortedPatients.map((p) => (
              <div key={p.id} style={patientCardStyle}>
                <div style={{ minWidth: 0 }}>
                  <div style={patientTopRowStyle}>
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

                  <div style={patientInfoStyle}>Frein : {p.blocage}</div>
                  <div style={patientInfoMutedStyle}>INS : {p.ins}</div>
                </div>

                <button onClick={() => onOpenPatient(p)} style={openButtonStyle}>
                  Ouvrir dossier
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
              label="Niveau de tension"
              value={blockedPatients >= 2 ? "Élevé" : "Modéré"}
            />
          </div>

          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <div style={panelTitleStyle}>Action du jour</div>
                <div style={panelSubStyle}>Focus opérationnel</div>
              </div>
            </div>

            <div style={focusBoxStyle}>
              {blockedPatients > 0
                ? "Finaliser en priorité les solutions d’aval des patients bloqués."
                : "Sécuriser les patients à risque avant aggravation du blocage."}
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
        padding: "10px 14px",
        borderRadius: 14,
        border: active ? "2px solid #1f2937" : "1px solid #e5e7eb",
        background: active ? "#6d28d9" : "#ffffff",
        color: active ? "#ffffff" : "#374151",
        fontSize: 14,
        fontWeight: 600,
        whiteSpace: "nowrap",
        boxShadow: active ? "0 3px 10px rgba(0,0,0,0.08)" : "none",
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
        padding: "10px 14px",
        borderRadius: 14,
        border: "1px solid #fecaca",
        background: "#fff7f7",
        color: "#b91c1c",
        fontSize: 14,
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
    violet: { bg: "#f3e8ff", color: "#6d28d9" },
    red: { bg: "#fef2f2", color: "#b91c1c" },
    amber: { bg: "#fffbeb", color: "#b45309" },
    green: { bg: "#ecfdf5", color: "#15803d" },
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 3px 12px rgba(15,23,42,0.04)",
      }}
    >
      <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 10 }}>{title}</div>
      <div
        style={{
          display: "inline-block",
          background: tones[tone].bg,
          color: tones[tone].color,
          borderRadius: 14,
          padding: "10px 14px",
          fontSize: 28,
          fontWeight: 800,
          minWidth: 64,
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

  return (
    <span style={badgeStyle(bg, color)}>
      {label}
    </span>
  );
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

  return (
    <span style={badgeStyle(bg, color)}>
      Score {score}
    </span>
  );
}

function badgeStyle(bg, color) {
  return {
    display: "inline-block",
    background: bg,
    color,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  };
}

function InfoLine({ label, value }) {
  return (
    <div style={{ padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ fontSize: 13, color: "#6b7280" }}>{label}</div>
      <div style={{ marginTop: 4, fontWeight: 700, color: "#111827" }}>{value}</div>
    </div>
  );
}

const pageStyle = {
  maxWidth: 1280,
  margin: "0 auto",
  padding: 16,
};

const headerStyle = {
  background: "linear-gradient(135deg,#5b54c7,#6d66d8)",
  color: "#ffffff",
  borderRadius: 24,
  padding: 20,
  marginBottom: 16,
};

const brandStyle = {
  fontSize: 28,
  fontWeight: 800,
  letterSpacing: 0.5,
};

const subtitleStyle = {
  marginTop: 4,
  fontSize: 15,
  opacity: 0.92,
};

const navWrapStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 18,
};

const heroStyle = {
  background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
  color: "#ffffff",
  borderRadius: 24,
  padding: 24,
  marginBottom: 16,
};

const heroEyebrowStyle = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  opacity: 0.75,
};

const heroTitleStyle = {
  fontSize: 28,
  lineHeight: 1.1,
  margin: "8px 0 10px 0",
  fontWeight: 800,
};

const heroTextStyle = {
  fontSize: 16,
  lineHeight: 1.6,
  margin: 0,
  maxWidth: 880,
};

const kpiGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginBottom: 16,
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.6fr) minmax(280px, 0.9fr)",
  gap: 16,
  alignItems: "start",
};

const sideColStyle = {
  display: "grid",
  gap: 16,
};

const panelStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 20,
  padding: 18,
  boxShadow: "0 3px 12px rgba(15,23,42,0.04)",
};

const panelHeaderStyle = {
  marginBottom: 14,
};

const panelTitleStyle = {
  fontSize: 18,
  fontWeight: 800,
  color: "#111827",
};

const panelSubStyle = {
  marginTop: 4,
  fontSize: 13,
  color: "#6b7280",
};

const patientCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  background: "#ffffff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const patientTopRowStyle = {
  display: "flex",
  gap: 10,
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
};

const patientNameStyle = {
  fontSize: 16,
  fontWeight: 800,
  color: "#111827",
};

const badgeRowStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const patientMetaStyle = {
  fontSize: 13,
  color: "#6b7280",
  marginTop: 4,
};

const patientInfoStyle = {
  marginTop: 6,
  fontSize: 14,
  color: "#111827",
};

const patientInfoMutedStyle = {
  marginTop: 4,
  fontSize: 12,
  color: "#6b7280",
};

const openButtonStyle = {
  border: "none",
  background: "#5b54c7",
  color: "#ffffff",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const focusBoxStyle = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 14,
  color: "#111827",
  lineHeight: 1.6,
};

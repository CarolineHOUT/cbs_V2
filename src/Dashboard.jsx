export default function Dashboard({ patients, onOpenPatient }) {
  const sortedPatients = [...patients].sort((a, b) => b.score - a.score);

  const totalPatients = patients.length;
  const blockedPatients = patients.filter((p) => p.score >= 8).length;
  const riskPatients = patients.filter((p) => p.score >= 6 && p.score < 8).length;
  const medicalReadyPatients = patients.filter((p) => p.sortantMedicalement).length;

  const avoidableDays = patients.reduce(
    (sum, p) => sum + (p.score >= 8 ? 6 : p.score >= 6 ? 3 : 1),
    0
  );

  const recoverableBeds = Math.max(0, Math.round(avoidableDays / 7));

  return (
    <div style={pageStyle}>
      <header style={topBarStyle}>
        <div style={topBarLeftStyle}>
          <button style={burgerButtonStyle} aria-label="Menu">
            <span style={burgerLineStyle} />
            <span style={burgerLineStyle} />
            <span style={burgerLineStyle} />
          </button>

          <div>
            <div style={appTitleStyle}>CARABBAS</div>
            <div style={appSubtitleStyle}>Sorties hospitalières complexes</div>
          </div>
        </div>

        <div style={topBarRightStyle}>
          <span style={topBadgeStyle}>Dashboard</span>
          <button style={dangerButtonStyle}>Cellule de crise</button>
        </div>
      </header>

      <section style={summaryStripStyle}>
        <div style={summaryItemStyle}>
          <div style={summaryLabelStyle}>Sortants médicaux</div>
          <div style={summaryValueStyle}>{medicalReadyPatients}</div>
        </div>

        <div style={summaryItemStyle}>
          <div style={summaryLabelStyle}>Bloqués</div>
          <div style={summaryValueStyle}>{blockedPatients}</div>
        </div>

        <div style={summaryItemStyle}>
          <div style={summaryLabelStyle}>Jours évitables</div>
          <div style={summaryValueStyle}>{avoidableDays}</div>
        </div>

        <div style={summaryItemStyle}>
          <div style={summaryLabelStyle}>Lits récupérables</div>
          <div style={summaryValueStyle}>{recoverableBeds}</div>
        </div>
      </section>

      <section style={mainGridStyle}>
        <div style={mainColStyle}>
          <Panel
            title="Patients prioritaires"
            subtitle="Service, coordination, gestion des lits"
          >
            <div style={{ display: "grid", gap: 10 }}>
              {sortedPatients.map((p) => (
                <PatientRow
                  key={p.id}
                  patient={p}
                  onOpenPatient={onOpenPatient}
                />
              ))}
            </div>
          </Panel>
        </div>

        <div style={sideColStyle}>
          <Panel
            title="Lecture rapide"
            subtitle="Vue direction / coordination"
          >
            <InfoLine label="Patients suivis" value={String(totalPatients)} />
            <InfoLine label="Patients bloqués" value={String(blockedPatients)} />
            <InfoLine label="Patients à risque" value={String(riskPatients)} />
            <InfoLine label="Jours évitables" value={String(avoidableDays)} />
            <InfoLine
              label="Tension"
              value={blockedPatients >= 2 ? "Élevée" : "Modérée"}
            />
          </Panel>

          <Panel
            title="Priorité du jour"
            subtitle="Action immédiate"
          >
            <div style={focusBoxStyle}>
              {blockedPatients > 0
                ? "Lever les freins des patients bloqués et relancer les solutions d’aval en attente."
                : "Sécuriser les patients à risque avant aggravation du blocage."}
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function PatientRow({ patient, onOpenPatient }) {
  return (
    <div style={patientRowStyle}>
      <div style={patientMainStyle}>
        <div style={patientTopStyle}>
          <div style={patientNameStyle}>
            {patient.nom} {patient.prenom}
          </div>

          <div style={badgeRowStyle}>
            <PriorityBadge score={patient.score} />
            <ScoreBadge score={patient.score} />
          </div>
        </div>

        <div style={patientMetaStyle}>
          {patient.service} • chambre {patient.chambre} • lit {patient.lit}
        </div>

        <div style={patientDetailStyle}>
          <strong>Frein :</strong> {patient.blocage}
        </div>

        <div style={patientMutedStyle}>INS : {patient.ins}</div>
      </div>

      <button onClick={() => onOpenPatient(patient)} style={openButtonStyle}>
        Ouvrir
      </button>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <div style={panelStyle}>
      <div style={panelHeaderStyle}>
        <div style={panelTitleStyle}>{title}</div>
        <div style={panelSubStyle}>{subtitle}</div>
      </div>
      {children}
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
  let bg = "#eef2ff";
  let color = "#4338ca";

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
    whiteSpace: "nowrap",
  };
}

function InfoLine({ label, value }) {
  return (
    <div style={infoLineStyle}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value}</div>
    </div>
  );
}

const pageStyle = {
  maxWidth: 1240,
  margin: "0 auto",
  padding: 12,
  background: "#f8fafc",
};

const topBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: "12px 14px",
  marginBottom: 12,
  boxShadow: "0 2px 10px rgba(15,23,42,0.04)",
};

const topBarLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const burgerButtonStyle = {
  width: 38,
  height: 38,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  gap: 4,
  padding: 0,
};

const burgerLineStyle = {
  width: 16,
  height: 2,
  borderRadius: 999,
  background: "#334155",
};

const appTitleStyle = {
  fontSize: 18,
  fontWeight: 800,
  color: "#111827",
  lineHeight: 1.1,
};

const appSubtitleStyle = {
  marginTop: 2,
  fontSize: 12,
  color: "#64748b",
};

const topBarRightStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const topBadgeStyle = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: 999,
  background: "#eef2ff",
  color: "#4338ca",
  fontSize: 11,
  fontWeight: 800,
};

const dangerButtonStyle = {
  border: "1px solid #fecaca",
  background: "#fff7f7",
  color: "#b91c1c",
  padding: "8px 10px",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 12,
  whiteSpace: "nowrap",
};

const summaryStripStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 10,
  marginBottom: 12,
};

const summaryItemStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 12,
  boxShadow: "0 2px 10px rgba(15,23,42,0.04)",
};

const summaryLabelStyle = {
  fontSize: 12,
  color: "#6b7280",
  marginBottom: 6,
};

const summaryValueStyle = {
  fontSize: 24,
  fontWeight: 800,
  color: "#111827",
};

const mainGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 12,
  alignItems: "start",
};

const mainColStyle = {
  minWidth: 0,
};

const sideColStyle = {
  display: "grid",
  gap: 12,
};

const panelStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 14,
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
  marginTop: 2,
  fontSize: 12,
  color: "#6b7280",
};

const patientRowStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 12,
  background: "#ffffff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const patientMainStyle = {
  minWidth: 0,
  flex: 1,
};

const patientTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
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
  lineHeight: 1.45,
};

const patientMutedStyle = {
  marginTop: 4,
  fontSize: 12,
  color: "#6b7280",
};

const openButtonStyle = {
  border: "none",
  background: "#4338ca",
  color: "#ffffff",
  padding: "9px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
  whiteSpace: "nowrap",
  fontSize: 13,
};

const infoLineStyle = {
  padding: "9px 0",
  borderBottom: "1px solid #f1f5f9",
};

const infoLabelStyle = {
  fontSize: 12,
  color: "#6b7280",
};

const infoValueStyle = {
  marginTop: 3,
  fontWeight: 700,
  color: "#111827",
  fontSize: 14,
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

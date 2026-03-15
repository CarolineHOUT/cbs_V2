export default function Dashboard({ patients, onOpenPatient }) {
  const sortedPatients = [...patients].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.joursEvitables - a.joursEvitables;
  });

  const medicalReady = patients.filter((p) => p.sortantMedicalement).length;
  const blocked = patients.filter((p) => p.score >= 8).length;
  const risk = patients.filter((p) => p.score >= 6 && p.score < 8).length;
  const avoidableDays = patients.reduce((sum, p) => sum + p.joursEvitables, 0);
  const recoverableBeds = Math.max(0, Math.round(avoidableDays / 7));

  const services = buildServiceStats(patients);

  return (
    <div style={pageStyle}>
      <header style={topBarStyle}>
        <div style={topLeftStyle}>
          <button style={burgerStyle} aria-label="Menu">
            <span style={burgerLineStyle} />
            <span style={burgerLineStyle} />
            <span style={burgerLineStyle} />
          </button>

          <div>
            <div style={titleStyle}>CARABBAS</div>
            <div style={subtitleStyle}>Cockpit des sorties hospitalières</div>
          </div>
        </div>

        <div style={topRightStyle}>
          <span style={contextBadgeStyle}>Pilotage</span>
          <button style={dangerButtonStyle}>Cellule de crise</button>
        </div>
      </header>

      <section style={kpiGridStyle}>
        <KpiCard label="Sortants médicaux" value={medicalReady} tone="blue" />
        <KpiCard label="Patients bloqués" value={blocked} tone="red" />
        <KpiCard label="Patients à risque" value={risk} tone="amber" />
        <KpiCard label="Jours évitables" value={avoidableDays} tone="green" />
        <KpiCard label="Lits récupérables" value={recoverableBeds} tone="blue" />
      </section>

      <section style={contentGridStyle}>
        <div style={mainColumnStyle}>
          <Panel
            title="Patients prioritaires"
            subtitle="Lecture service, coordination et gestion capacitaire"
          >
            <div style={{ display: "grid", gap: 10 }}>
              {sortedPatients.map((patient) => (
                <div key={patient.id} style={patientRowStyle}>
                  <div style={patientMainStyle}>
                    <div style={patientTopRowStyle}>
                      <div style={patientNameStyle}>
                        {patient.nom} {patient.prenom}
                      </div>

                      <div style={badgeWrapStyle}>
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

                    <div style={patientMutedStyle}>
                      INS : {patient.ins} • {patient.joursEvitables} j évitables
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenPatient(patient)}
                    style={openButtonStyle}
                  >
                    Ouvrir
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div style={sideColumnStyle}>
          <Panel title="Lecture rapide" subtitle="Vue direction / coordination">
            <InfoLine label="Sortants médicaux présents" value={String(medicalReady)} />
            <InfoLine label="Patients bloqués" value={String(blocked)} />
            <InfoLine label="Patients à risque" value={String(risk)} />
            <InfoLine label="Jours évitables" value={String(avoidableDays)} />
            <InfoLine
              label="Niveau de tension"
              value={blocked >= 2 ? "Élevé" : "Modéré"}
            />
          </Panel>

          <Panel title="Services exposés" subtitle="Lecture capacitaire">
            <div style={{ display: "grid", gap: 10 }}>
              {services.map((service) => (
                <div key={service.name} style={serviceRowStyle}>
                  <div>
                    <div style={serviceNameStyle}>{service.name}</div>
                    <div style={serviceMetaStyle}>
                      {service.blocked} bloqué(s) • {service.risk} à risque •{" "}
                      {service.avoidableDays} j évitables
                    </div>
                  </div>
                  <ServiceBadge level={service.level} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Action du jour" subtitle="Priorité opérationnelle">
            <div style={focusBoxStyle}>
              {blocked > 0
                ? "Lever les freins des patients bloqués, relancer les solutions d’aval et prioriser les situations à fort impact capacitaire."
                : "Sécuriser les patients à risque avant dégradation de la situation de sortie."}
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function KpiCard({ label, value, tone }) {
  const tones = {
    blue: { bg: "#DBEAFE", color: "#1D4ED8" },
    red: { bg: "#FEE2E2", color: "#DC2626" },
    amber: { bg: "#FEF3C7", color: "#D97706" },
    green: { bg: "#D1FAE5", color: "#059669" },
  };

  return (
    <div style={kpiCardStyle}>
      <div style={kpiLabelStyle}>{label}</div>
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

function Panel({ title, subtitle, children }) {
  return (
    <div style={panelStyle}>
      <div style={panelHeaderStyle}>
        <div style={panelTitleStyle}>{title}</div>
        <div style={panelSubtitleStyle}>{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div style={infoLineStyle}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value}</div>
    </div>
  );
}

function PriorityBadge({ score }) {
  let label = "Suivi";
  let bg = "#D1FAE5";
  let color = "#059669";

  if (score >= 8) {
    label = "Bloqué";
    bg = "#FEE2E2";
    color = "#DC2626";
  } else if (score >= 6) {
    label = "Risque";
    bg = "#FEF3C7";
    color = "#D97706";
  }

  return <span style={badgeStyle(bg, color)}>{label}</span>;
}

function ScoreBadge({ score }) {
  return <span style={badgeStyle("#DBEAFE", "#1D4ED8")}>Score {score}</span>;
}

function ServiceBadge({ level }) {
  const config = {
    critical: { label: "Critique", bg: "#FEE2E2", color: "#DC2626" },
    high: { label: "Élevé", bg: "#FEF3C7", color: "#D97706" },
    medium: { label: "Modéré", bg: "#DBEAFE", color: "#1D4ED8" },
    low: { label: "Stable", bg: "#D1FAE5", color: "#059669" },
  };

  const tone = config[level];

  return <span style={badgeStyle(tone.bg, tone.color)}>{tone.label}</span>;
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

    grouped[p.service].avoidableDays += p.joursEvitables;
  });

  return Object.values(grouped)
    .map((service) => ({
      ...service,
      level:
        service.blocked >= 2
          ? "critical"
          : service.blocked >= 1
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

const pageStyle = {
  maxWidth: 1280,
  margin: "0 auto",
  padding: 12,
};

const topBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 16,
  padding: "12px 14px",
  marginBottom: 12,
  boxShadow: "0 2px 10px rgba(15,23,42,0.04)",
};

const topLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const burgerStyle = {
  width: 38,
  height: 38,
  borderRadius: 10,
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
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
  background: "#334155",
  borderRadius: 999,
};

const titleStyle = {
  fontSize: 18,
  fontWeight: 800,
  color: "#111827",
};

const subtitleStyle = {
  marginTop: 2,
  fontSize: 12,
  color: "#6B7280",
};

const topRightStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const contextBadgeStyle = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: 999,
  background: "#DBEAFE",
  color: "#1D4ED8",
  fontSize: 11,
  fontWeight: 800,
};

const dangerButtonStyle = {
  border: "1px solid #FECACA",
  background: "#FFF7F7",
  color: "#DC2626",
  padding: "8px 10px",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 12,
  whiteSpace: "nowrap",
};

const kpiGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 10,
  marginBottom: 12,
};

const kpiCardStyle = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 14,
  padding: 12,
  boxShadow: "0 2px 10px rgba(15,23,42,0.04)",
};

const kpiLabelStyle = {
  fontSize: 12,
  color: "#6B7280",
  marginBottom: 8,
};

const kpiValueStyle = {
  display: "inline-block",
  borderRadius: 12,
  padding: "8px 12px",
  fontSize: 22,
  fontWeight: 800,
  minWidth: 50,
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 12,
  alignItems: "start",
};

const mainColumnStyle = {
  minWidth: 0,
};

const sideColumnStyle = {
  display: "grid",
  gap: 12,
};

const panelStyle = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 16,
  padding: 14,
  boxShadow: "0 2px 10px rgba(15,23,42,0.04)",
};

const panelHeaderStyle = {
  marginBottom: 12,
};

const panelTitleStyle = {
  fontSize: 16,
  fontWeight: 800,
  color: "#111827",
};

const panelSubtitleStyle = {
  marginTop: 2,
  fontSize: 12,
  color: "#6B7280",
};

const patientRowStyle = {
  border: "1px solid #E5E7EB",
  borderRadius: 14,
  padding: 12,
  background: "#FFFFFF",
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

const patientTopRowStyle = {
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

const badgeWrapStyle = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const patientMetaStyle = {
  fontSize: 12,
  color: "#6B7280",
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
  color: "#6B7280",
};

const openButtonStyle = {
  border: "none",
  background: "#2563EB",
  color: "#FFFFFF",
  padding: "9px 12px",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 13,
  whiteSpace: "nowrap",
};

const infoLineStyle = {
  padding: "9px 0",
  borderBottom: "1px solid #F1F5F9",
};

const infoLabelStyle = {
  fontSize: 12,
  color: "#6B7280",
};

const infoValueStyle = {
  marginTop: 3,
  fontWeight: 700,
  color: "#111827",
  fontSize: 14,
};

const serviceRowStyle = {
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 12,
  background: "#FFFFFF",
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
};

const serviceNameStyle = {
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
};

const serviceMetaStyle = {
  marginTop: 4,
  fontSize: 12,
  color: "#6B7280",
  lineHeight: 1.45,
};

const focusBoxStyle = {
  background: "#F8FAFC",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 12,
  color: "#111827",
  lineHeight: 1.55,
  fontSize: 14,
};

import { useMemo } from "react";

export default function PatientView({ patient, onBack }) {

  const status = useMemo(() => {
    if (patient.score >= 8) return { label: "Bloqué", tone: "red" };
    if (patient.score >= 6) return { label: "Risque", tone: "amber" };
    return { label: "Suivi", tone: "green" };
  }, [patient]);

  function parseFrenchDate(value) {
    if (!value) return null;
    const parts = value.split("/");
    const [d, m, y] = parts;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  function computeStayDays(dateString) {
    const date = parseFrenchDate(dateString);
    const today = new Date();
    return Math.floor((today - date) / 86400000);
  }

  const stayDays = computeStayDays(patient.entryDate);

  return (
    <div style={styles.page}>

      <div style={styles.topBar}>
        <button onClick={onBack} style={styles.backButton}>
          ← Retour cockpit
        </button>
      </div>

      <section style={styles.identityHero}>

        <div>
          <div style={styles.patientName}>
            {patient.nom} {patient.prenom}
          </div>

          <div style={styles.identityMeta}>
            {patient.birthDate} • {patient.age} ans
          </div>

          <div style={styles.identityMeta}>
            INS {patient.ins} • IEP {patient.iep}
          </div>

          <div style={styles.identityMeta}>
            {patient.service} • chambre {patient.chambre} • lit {patient.lit}
          </div>
        </div>

        <StatusBadge label={status.label} tone={status.tone} />

      </section>

      <section style={styles.grid}>

        <div style={styles.leftColumn}>

          <Panel title="Pilotage sortie">

            <div style={styles.kpiGrid}>
              <MiniKpi label="Admission" value={patient.entryDate} />
              <MiniKpi label="Présence" value={`${stayDays} j`} />
              <MiniKpi
                label="Sortant médical"
                value={patient.sortantMedicalement ? "Oui" : "Non"}
                tone="blue"
              />
              <MiniKpi
                label="Jours évitables"
                value={`${patient.joursEvitables} j`}
                tone="amber"
              />
            </div>

            <div style={styles.focusCard}>
              <div style={styles.focusLabel}>Frein principal</div>
              <div style={styles.focusValue}>{patient.blocage}</div>
            </div>

          </Panel>

          <Panel title="Parcours et aval">

            <InfoGrid
              items={[
                ["Destination prévue", patient.destinationPrevue],
                ["Besoin aval", patient.besoinAval],
                ["Transport", patient.transport],
                ["Documents sortie", patient.documentsSortie],
              ]}
            />

          </Panel>

          <Panel title="Entourage et protection">

            <InfoGrid
              items={[
                ["Personne de confiance", patient.personneConfiance],
                ["Personne à prévenir", patient.personneAPrevenir],
                ["Protection juridique", patient.protectionJuridique],
              ]}
            />

          </Panel>

        </div>

        <div style={styles.rightColumn}>

          <Panel title="Coordination">

            <InfoGrid
              items={[
                ["Référent médical", patient.referentMedical],
                ["Cadre", patient.cadre],
                ["Assistante sociale", patient.assistanteSociale],
                ["Prochaine action", patient.nextStep],
              ]}
            />

          </Panel>

          <Panel title="Actions rapides">

            <div style={styles.actionsGrid}>

              <button style={styles.actionButton}>
                Contacter assistante sociale
              </button>

              <button style={styles.actionButton}>
                Programmer sortie
              </button>

              <button style={styles.actionButton}>
                Ajouter note
              </button>

              <button style={styles.actionButton}>
                Réunion coordination
              </button>

            </div>

          </Panel>

          <Panel title="Historique opérationnel">

            <div style={styles.timeline}>

              {patient.notes.map((note, index) => (
                <div key={index} style={styles.timelineItem}>

                  <div style={styles.timelineDot}></div>

                  <div>

                    <div style={styles.timelineDate}>
                      15/03 • 10:45
                    </div>

                    <div style={styles.timelineText}>
                      {note}
                    </div>

                  </div>

                </div>
              ))}

            </div>

          </Panel>

        </div>

      </section>

    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section style={styles.panel}>
      <div style={styles.panelTitle}>{title}</div>
      <div style={{ marginTop: 14 }}>{children}</div>
    </section>
  );
}

function MiniKpi({ label, value }) {
  return (
    <div style={styles.miniKpi}>
      <div style={styles.miniKpiLabel}>{label}</div>
      <div style={styles.miniKpiValue}>{value}</div>
    </div>
  );
}

function InfoGrid({ items }) {
  return (
    <div style={styles.infoGrid}>
      {items.map(([label, value]) => (
        <div key={label} style={styles.infoCard}>
          <div style={styles.infoLabel}>{label}</div>
          <div style={styles.infoValue}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ label, tone }) {

  const tones = {
    red: { bg: "#FEE2E2", color: "#DC2626" },
    amber: { bg: "#FEF3C7", color: "#D97706" },
    green: { bg: "#D1FAE5", color: "#059669" },
  };

  const t = tones[tone];

  return (
    <span style={{ ...styles.badge, background: t.bg, color: t.color }}>
      {label}
    </span>
  );
}

const styles = {

page:{
maxWidth:1360,
margin:"0 auto",
padding:18,
background:"#F8FAFC",
minHeight:"100vh"
},

topBar:{
marginBottom:16
},

backButton:{
border:"1px solid #CBD5E1",
background:"#FFFFFF",
borderRadius:12,
padding:"10px 14px",
fontWeight:700
},

identityHero:{
display:"flex",
justifyContent:"space-between",
background:"linear-gradient(90deg,#1E3A8A,#2563EB)",
color:"#fff",
borderRadius:20,
padding:20,
marginBottom:20
},

patientName:{
fontSize:34,
fontWeight:900
},

identityMeta:{
fontSize:14,
marginTop:6
},

badge:{
padding:"8px 12px",
borderRadius:999,
fontWeight:800
},

grid:{
display:"grid",
gridTemplateColumns:"1.8fr 1fr",
gap:16
},

leftColumn:{
display:"grid",
gap:16
},

rightColumn:{
display:"grid",
gap:16
},

panel:{
background:"#fff",
border:"1px solid #E5E7EB",
borderRadius:18,
padding:18
},

panelTitle:{
fontSize:20,
fontWeight:800
},

kpiGrid:{
display:"grid",
gridTemplateColumns:"repeat(4,1fr)",
gap:12
},

miniKpi:{
border:"1px solid #E5E7EB",
borderRadius:12,
padding:12
},

miniKpiLabel:{
fontSize:11,
color:"#64748B"
},

miniKpiValue:{
fontSize:22,
fontWeight:800
},

focusCard:{
marginTop:12,
border:"1px solid #DBEAFE",
background:"#EEF5FF",
borderRadius:14,
padding:14
},

focusLabel:{
fontSize:11,
color:"#1E40AF",
fontWeight:700
},

focusValue:{
fontSize:20,
fontWeight:800
},

infoGrid:{
display:"grid",
gridTemplateColumns:"repeat(2,1fr)",
gap:10
},

infoCard:{
border:"1px solid #E5E7EB",
borderRadius:12,
padding:12
},

infoLabel:{
fontSize:11,
color:"#64748B"
},

infoValue:{
fontSize:14,
fontWeight:600
},

actionsGrid:{
display:"grid",
gridTemplateColumns:"repeat(2,1fr)",
gap:10
},

actionButton:{
padding:12,
borderRadius:12,
border:"1px solid #CBD5E1",
background:"#EFF6FF",
fontWeight:700
},

timeline:{
display:"grid",
gap:12
},

timelineItem:{
display:"flex",
gap:10
},

timelineDot:{
width:10,
height:10,
borderRadius:999,
background:"#2563EB",
marginTop:6
},

timelineDate:{
fontSize:12,
color:"#64748B"
},

timelineText:{
fontSize:14
}

};

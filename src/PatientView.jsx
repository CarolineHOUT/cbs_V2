import { useState, useMemo } from "react";

export default function PatientCockpit({ patient }) {

  const [notes, setNotes] = useState(patient.notes || []);
  const [newNote, setNewNote] = useState("");

  const stayDays = computeStayDays(patient.entryDate);

  const criticity = useMemo(() => {
    if (patient.score >= 8 || patient.joursEvitables >= 5) return "critique";
    if (patient.score >= 6) return "risque";
    return "suivi";
  }, [patient]);

  const urgencyLine = useMemo(() => {
    return `Sortant médical • ${patient.blocage} • ${patient.joursEvitables} j évitables • ${patient.nextStep}`;
  }, [patient]);

  function addNote() {
    if (!newNote.trim()) return;

    setNotes([
      {
        text: newNote,
        date: new Date().toLocaleString(),
      },
      ...notes,
    ]);

    setNewNote("");
  }

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <header style={styles.header}>
        <div>
          <div style={styles.appTitle}>CARABBAS</div>
          <div style={styles.subtitle}>Patient 360 — pilotage sortie complexe</div>
        </div>
      </header>

      {/* IDENTITE */}
      <section style={styles.identity}>

        <div style={styles.identityTop}>
          <div style={styles.patientName}>
            {patient.nom} {patient.prenom}
          </div>

          <div style={styles.identityStatus}>
            <StatusBadge level={criticity} />

            {criticity === "critique" && (
              <button style={styles.crisisButton}>
                ⚡ Cellule de crise
              </button>
            )}
          </div>
        </div>

        <div style={styles.identityMeta}>
          {patient.age} ans • {patient.service} • Chambre {patient.chambre} •
          Entrée {patient.entryDate} • {stayDays} jours
        </div>

        <div style={styles.kpis}>
          <KPI label="Sortant méd." value={patient.sortantMedicalement ? "Oui" : "Non"} />
          <KPI label="J évitables" value={patient.joursEvitables} />
          <KPI label="Notes" value={notes.length} />
          <KPI label="Urgentes" value={notes.filter(n => n.type === "urgent").length} />
        </div>

      </section>

      {/* LIGNE URGENCE */}
      <section style={styles.urgency}>
        🔴 {urgencyLine}
      </section>

      {/* BLOC CENTRAL */}
      <section style={styles.center}>

        {/* FREIN */}
        <div style={styles.card}>
          <div style={styles.cardLabel}>Frein principal</div>
          <div style={styles.cardTitle}>{patient.blocage}</div>

          <p style={styles.cardText}>
            Frein d’aval majeur retardant la sortie.
          </p>

          <div style={styles.metaBox}>
            <span>Action associée</span>
            <strong>Relancer admissions EHPAD</strong>
          </div>
        </div>

        {/* ACTION */}
        <div style={styles.card}>
          <div style={styles.cardLabel}>Action prioritaire</div>

          <div style={styles.cardTitle}>
            {patient.nextStep}
          </div>

          <div style={styles.metaBox}>
            Responsable : {patient.assistanteSociale}
          </div>

          <div style={styles.buttons}>
            <button style={styles.primary}>Valider</button>
            <button style={styles.secondary}>Assigner</button>
          </div>
        </div>

        {/* COORDINATION */}
        <div style={styles.card}>

          <div style={styles.cardLabel}>Coordination</div>

          <div style={styles.postIt}>
            {notes[0]?.text || "Aucune note récente"}
          </div>

          <div style={styles.quickActions}>
            <button>AS</button>
            <button>Sortie</button>
            <button>Réunion</button>
            <button>Famille</button>
          </div>

          <div style={styles.addNote}>
            <input
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Ajouter note..."
            />

            <button onClick={addNote}>+</button>
          </div>

        </div>

      </section>

      {/* TIMELINE PARCOURS */}
      <section style={styles.timeline}>

        <TimelineStep
          state="done"
          title="Orientation"
          value={patient.destinationPrevue}
        />

        <TimelineStep
          state="done"
          title="Date cible"
          value={patient.dateCible}
        />

        <TimelineStep
          state="progress"
          title="Transport"
          value={patient.transport}
        />

        <TimelineStep
          state="next"
          title="Prochaine étape"
          value={patient.nextStep}
        />

      </section>

    </div>
  );
}


function TimelineStep({ state, title, value }) {

  const icon =
    state === "done" ? "✓" :
    state === "progress" ? "●" :
    "→";

  return (
    <div style={styles.step}>
      <div style={styles.stepIcon}>{icon}</div>
      <div>
        <div style={styles.stepTitle}>{title}</div>
        <div style={styles.stepValue}>{value}</div>
      </div>
    </div>
  );
}


function StatusBadge({ level }) {

  const config = {
    critique: { color: "#DC2626", label: "Bloqué" },
    risque: { color: "#D97706", label: "Risque" },
    suivi: { color: "#059669", label: "Suivi" },
  };

  const c = config[level];

  return (
    <div style={{ ...styles.status, color: c.color }}>
      {c.label}
    </div>
  );
}


function KPI({ label, value }) {
  return (
    <div style={styles.kpi}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}


function computeStayDays(date) {
  const start = new Date(date);
  const today = new Date();
  return Math.floor((today - start) / 86400000);
}


const styles = {

container:{
height:"100vh",
padding:12,
display:"grid",
gridTemplateRows:"60px 120px 40px 1fr 120px",
gap:10,
background:"#F1F5F9",
fontFamily:"system-ui"
},

header:{
display:"flex",
alignItems:"center"
},

appTitle:{
fontWeight:800,
fontSize:18
},

subtitle:{
fontSize:12,
color:"#64748B"
},

identity:{
background:"white",
borderRadius:10,
padding:12
},

identityTop:{
display:"flex",
justifyContent:"space-between",
alignItems:"center"
},

patientName:{
fontSize:24,
fontWeight:800
},

identityStatus:{
display:"flex",
gap:10,
alignItems:"center"
},

crisisButton:{
background:"#FEF2F2",
border:"1px solid #FECACA",
color:"#B91C1C",
borderRadius:8,
padding:"6px 10px",
cursor:"pointer"
},

identityMeta:{
fontSize:12,
color:"#64748B",
marginTop:4
},

kpis:{
display:"flex",
gap:10,
marginTop:8
},

kpi:{
background:"#F8FAFC",
padding:"6px 10px",
borderRadius:999,
fontSize:12
},

status:{
fontWeight:700
},

urgency:{
background:"#FEF2F2",
padding:"8px 12px",
borderRadius:8,
fontWeight:600
},

center:{
display:"grid",
gridTemplateColumns:"1fr 1fr 1fr",
gap:10
},

card:{
background:"white",
borderRadius:10,
padding:12,
display:"flex",
flexDirection:"column",
gap:10
},

cardLabel:{
fontSize:11,
textTransform:"uppercase",
color:"#64748B"
},

cardTitle:{
fontSize:18,
fontWeight:700
},

cardText:{
fontSize:13,
color:"#475569"
},

metaBox:{
background:"#F8FAFC",
padding:8,
borderRadius:6,
fontSize:13
},

buttons:{
display:"flex",
gap:8
},

primary:{
background:"#2563EB",
color:"white",
border:"none",
padding:"8px 12px",
borderRadius:8
},

secondary:{
background:"white",
border:"1px solid #CBD5E1",
padding:"8px 12px",
borderRadius:8
},

postIt:{
background:"#FFF7ED",
padding:10,
borderRadius:8
},

quickActions:{
display:"grid",
gridTemplateColumns:"repeat(4,1fr)",
gap:6
},

addNote:{
display:"flex",
gap:6
},

timeline:{
background:"white",
borderRadius:10,
padding:12,
display:"grid",
gridTemplateColumns:"repeat(4,1fr)"
},

step:{
display:"flex",
gap:10,
alignItems:"center"
},

stepIcon:{
fontWeight:700
},

stepTitle:{
fontSize:11,
color:"#64748B"
},

stepValue:{
fontWeight:600
}

};

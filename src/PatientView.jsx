import { useState } from "react";

export default function PatientView({ patient, onBack }) {

const [notes,setNotes] = useState([
{
id:1,
text:"Recherche EHPAD prioritaire",
type:"action",
date:"15/03 20:17"
},
{
id:2,
text:"Patient médicalement sortant",
type:"info",
date:"15/03 20:17"
}
])

function addNote(text,type){

setNotes([
{
id:Date.now(),
text,
type,
date:new Date().toLocaleString()
},
...notes
])

}

return (

<div style={styles.page}>

<header style={styles.header}>
<div style={styles.logo}>CARABBAS</div>

<div style={styles.headerRight}>

<button style={styles.secondaryButton} onClick={onBack}>
Retour cockpit
</button>

<button style={styles.crisisButton}>
Cellule de crise
</button>

</div>
</header>

<section style={styles.patientBanner}>

<div style={styles.patientIdentity}>

<div style={styles.patientName}>
{patient.nom} {patient.prenom}
</div>

<div style={styles.patientMeta}>
{patient.birthDate} • {patient.age} ans • INS {patient.ins} • IEP {patient.iep}
</div>

<div style={styles.patientMeta}>
{patient.service} • Chambre {patient.chambre} • Lit {patient.lit}
</div>

</div>

<div style={styles.patientStatus}>

<div style={styles.statusBlock}>
<div style={styles.statusLabel}>Sortant médical</div>
<div style={styles.statusValue}>
{patient.sortantMedicalement ? "Oui":"Non"}
</div>
</div>

<div style={styles.statusBlock}>
<div style={styles.statusLabel}>Jours évitables</div>
<div style={styles.statusValueAlert}>
{patient.joursEvitables}
</div>
</div>

<div style={styles.statusBlock}>
<div style={styles.statusLabel}>Score parcours</div>
<div style={styles.statusValue}>
{patient.score}
</div>
</div>

<button style={styles.duoButton}>
Vue DUO
</button>

</div>

</section>

<section style={styles.grid}>

{/* PLAN SORTIE */}

<div style={styles.card}>

<h3 style={styles.cardTitle}>
Plan de sortie
</h3>

<div style={styles.rowItem}>
Orientation prévue
<span>{patient.destinationPrevue}</span>
</div>

<div style={styles.rowItem}>
Date cible
<span>{patient.dateCible}</span>
</div>

<div style={styles.rowItem}>
Transport
<span>{patient.transport}</span>
</div>

</div>

{/* FREINS */}

<div style={styles.card}>

<h3 style={styles.cardTitle}>
Freins à la sortie
</h3>

<ul style={styles.list}>

<li>Isolement social</li>
<li>Logement inadapté</li>
<li>Aidant épuisé</li>

</ul>

<button style={styles.smallButton}>
Ajouter un frein
</button>

</div>

{/* ACTEURS */}

<div style={styles.card}>

<h3 style={styles.cardTitle}>
Acteurs du parcours
</h3>

<ul style={styles.list}>

<li>Dr Lefevre – Médecin référent</li>
<li>Mme Girard – Assistante sociale</li>
<li>IDE parcours – Mme Dupont</li>
<li>M. Roussel – Cadre</li>

</ul>

</div>

{/* ACTIONS */}

<div style={styles.card}>

<h3 style={styles.cardTitle}>
Actions
</h3>

<table style={styles.table}>

<tbody>

<tr>
<td>15 mai</td>
<td>Évaluation sociale</td>
<td>Mme Girard</td>
</tr>

<tr>
<td>16 mai</td>
<td>Contact SSIAD</td>
<td>Dr Lefevre</td>
</tr>

</tbody>

</table>

<button style={styles.smallButton}>
Ajouter une action
</button>

</div>

{/* COORDINATION */}

<div style={styles.card}>

<h3 style={styles.cardTitle}>
Coordination
</h3>

<div style={styles.noteBox}>

Famille : appeler pour confirmer sortie

</div>

</div>

{/* SYNTHÈSE */}

<div style={styles.card}>

<h3 style={styles.cardTitle}>
Synthèse CARABBAS
</h3>

<div style={styles.summaryItem}>
Actions ouvertes : 3
</div>

<div style={styles.summaryItem}>
Risque de blocage : élevé
</div>

<div style={styles.summaryItem}>
Prochaine étape : validation sortie médicale
</div>

</div>

</section>

{/* HISTORIQUE */}

<section style={styles.history}>

<h3 style={styles.cardTitle}>
Historique
</h3>

{notes.map(n =>(

<div key={n.id} style={styles.noteItem}>

<div style={styles.noteDate}>
{n.date}
</div>

<div>
{n.text}
</div>

</div>

))}

</section>

</div>

)
}

const styles = {

page:{
padding:20,
background:"#F8FAFC",
minHeight:"100vh"
},

header:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
background:"#1E3A8A",
color:"white",
padding:14,
borderRadius:10
},

logo:{
fontWeight:"bold",
fontSize:20
},

headerRight:{
display:"flex",
gap:10
},

secondaryButton:{
background:"white",
borderRadius:8,
padding:"6px 10px",
border:"none"
},

crisisButton:{
background:"#DC2626",
color:"white",
border:"none",
borderRadius:8,
padding:"6px 10px"
},

patientBanner:{
display:"flex",
justifyContent:"space-between",
marginTop:20,
background:"white",
padding:16,
borderRadius:12
},

patientName:{
fontSize:22,
fontWeight:"bold"
},

patientMeta:{
fontSize:13,
color:"#555"
},

patientStatus:{
display:"flex",
gap:20,
alignItems:"center"
},

statusBlock:{
textAlign:"center"
},

statusLabel:{
fontSize:12,
color:"#666"
},

statusValue:{
fontWeight:"bold"
},

statusValueAlert:{
fontWeight:"bold",
color:"#DC2626"
},

duoButton:{
background:"#2563EB",
color:"white",
border:"none",
padding:"6px 12px",
borderRadius:8
},

grid:{
display:"grid",
gridTemplateColumns:"repeat(3,1fr)",
gap:16,
marginTop:20
},

card:{
background:"white",
padding:16,
borderRadius:12
},

cardTitle:{
marginBottom:10
},

rowItem:{
display:"flex",
justifyContent:"space-between",
marginBottom:8
},

list:{
paddingLeft:16
},

table:{
width:"100%"
},

smallButton:{
marginTop:10,
fontSize:12
},

summaryItem:{
marginBottom:8
},

noteBox:{
background:"#FFF7ED",
padding:10,
borderRadius:8
},

history:{
marginTop:20,
background:"white",
padding:16,
borderRadius:12
},

noteItem:{
borderBottom:"1px solid #eee",
padding:8
},

noteDate:{
fontSize:12,
color:"#888"
}

}

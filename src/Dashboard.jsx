import { useMemo, useState } from "react";

export default function Dashboard({ patients = [], onOpenPatient }) {

  const [service, setService] = useState("Tous");
  const [status, setStatus] = useState("Tous");
  const [barrier, setBarrier] = useState("Tous");
  const [search, setSearch] = useState("");

  const services = ["Tous", ...new Set(patients.map(p => p.service))];
  const barriers = ["Tous", ...new Set(patients.map(p => p.blocage))];

  const filtered = useMemo(() => {

    return patients.filter(p => {

      if (service !== "Tous" && p.service !== service) return false;

      if (status === "Bloqué" && p.score < 8) return false;
      if (status === "Risque" && (p.score < 6 || p.score >= 8)) return false;
      if (status === "Suivi" && p.score >= 6) return false;

      if (barrier !== "Tous" && p.blocage !== barrier) return false;

      const q = search.toLowerCase();

      if (!q) return true;

      return (
        p.nom.toLowerCase().includes(q) ||
        p.prenom.toLowerCase().includes(q) ||
        p.ins.toLowerCase().includes(q) ||
        p.service.toLowerCase().includes(q)
      );

    });

  }, [patients, service, status, barrier, search]);

  const kpi = {
    medicalReady: filtered.filter(p => p.sortantMedicalement).length,
    blocked: filtered.filter(p => p.score >= 8).length,
    risk: filtered.filter(p => p.score >= 6 && p.score < 8).length,
    avoidableDays: filtered.reduce((s,p)=>s+p.joursEvitables,0)
  };

  const recoverableBeds = Math.round(kpi.avoidableDays / 7);

  const blockingReasons = useMemo(()=>{

    const map = {};

    filtered.forEach(p=>{
      map[p.blocage] = (map[p.blocage]||0)+1;
    });

    return Object.entries(map)
      .map(([label,count])=>({label,count}))
      .sort((a,b)=>b.count-a.count)
      .slice(0,4);

  },[filtered]);

  return (

<div style={page}>

<header style={header}>

<div style={headerLeft}>

<div style={burger}>
<div style={burgerLine}/>
<div style={burgerLine}/>
<div style={burgerLine}/>
</div>

<div>
<div style={appTitle}>CARABBAS</div>
<div style={appSubtitle}>Sorties hospitalières complexes</div>
</div>

</div>

<button style={crisisBtn}>Cellule de crise</button>

</header>

<section style={kpiBar}>

<KPI label="Sortants médicaux" value={kpi.medicalReady}/>
<KPI label="Bloqués" value={kpi.blocked} tone="red"/>
<KPI label="À risque" value={kpi.risk} tone="amber"/>
<KPI label="Jours évitables" value={kpi.avoidableDays}/>
<KPI label="Lits récupérables" value={recoverableBeds}/>

</section>

<section style={filters}>

<select value={service} onChange={e=>setService(e.target.value)}>
{services.map(s=><option key={s}>{s}</option>)}
</select>

<select value={status} onChange={e=>setStatus(e.target.value)}>
<option>Tous</option>
<option>Bloqué</option>
<option>Risque</option>
<option>Suivi</option>
</select>

<select value={barrier} onChange={e=>setBarrier(e.target.value)}>
{barriers.map(b=><option key={b}>{b}</option>)}
</select>

<input
placeholder="Nom, INS, service"
value={search}
onChange={e=>setSearch(e.target.value)}
/>

</section>

<section style={layout}>

<div style={patientsBlock}>

<h2>Patients prioritaires</h2>

{filtered.map(p=>(

<div key={p.id} style={patientRow}>

<div>

<div style={patientName}>
{p.nom} {p.prenom}
</div>

<div style={patientMeta}>
{p.birthDate} • {p.age} ans • INS {p.ins} • IEP {p.iep}
</div>

<div style={patientMeta}>
{p.service} • chambre {p.chambre} • lit {p.lit}
</div>

<div style={patientMeta}>
Frein : {p.blocage} • {p.joursEvitables} j évitables
</div>

</div>

<div style={patientRight}>

<StatusBadge score={p.score}/>
<button style={openBtn} onClick={()=>onOpenPatient(p)}>
Ouvrir
</button>

</div>

</div>

))}

</div>

<div style={sidePanel}>

<Panel title="Lecture rapide">

<Line label="Sortants médicaux" value={kpi.medicalReady}/>
<Line label="Patients bloqués" value={kpi.blocked}/>
<Line label="Patients à risque" value={kpi.risk}/>
<Line label="Jours évitables" value={kpi.avoidableDays}/>
<Line label="Tension capacitaire" value={kpi.blocked>1?"Élevée":"Modérée"}/>

</Panel>

<Panel title="Blocages principaux">

{blockingReasons.map(b=>(
<Line key={b.label} label={b.label} value={b.count}/>
))}

</Panel>

</div>

</section>

</div>

);
}

function KPI({label,value,tone="blue"}){

const colors={
blue:"#2563EB",
red:"#DC2626",
amber:"#D97706"
};

return(

<div style={kpiTile}>
<div style={kpiLabel}>{label}</div>
<div style={{...kpiValue,color:colors[tone]}}>
{value}
</div>
</div>

);

}

function Panel({title,children}){

return(

<div style={panel}>
<h3>{title}</h3>
{children}
</div>

);

}

function Line({label,value}){

return(

<div style={line}>
<span>{label}</span>
<strong>{value}</strong>
</div>

);

}

function StatusBadge({score}){

if(score>=8) return <span style={badgeRed}>Bloqué</span>;
if(score>=6) return <span style={badgeAmber}>Risque</span>;

return <span style={badgeGreen}>Suivi</span>;

}

const page={
maxWidth:1200,
margin:"0 auto",
padding:16
};

const header={
display:"flex",
justifyContent:"space-between",
alignItems:"center",
background:"#1E3A8A",
color:"white",
padding:"10px 16px",
borderRadius:10,
marginBottom:12
};

const headerLeft={
display:"flex",
alignItems:"center",
gap:10
};

const burger={
width:28,
height:28,
display:"flex",
flexDirection:"column",
justifyContent:"center",
gap:4
};

const burgerLine={
height:2,
background:"white"
};

const appTitle={
fontWeight:700
};

const appSubtitle={
fontSize:12,
opacity:.8
};

const crisisBtn={
background:"#FEE2E2",
border:"none",
padding:"6px 10px",
borderRadius:8,
color:"#B91C1C",
fontWeight:600
};

const kpiBar={
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",
gap:8,
marginBottom:12
};

const kpiTile={
background:"white",
border:"1px solid #E5E7EB",
borderRadius:10,
padding:10
};

const kpiLabel={
fontSize:12,
color:"#6B7280"
};

const kpiValue={
fontSize:20,
fontWeight:700
};

const filters={
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",
gap:8,
marginBottom:12
};

const layout={
display:"grid",
gridTemplateColumns:"2fr 1fr",
gap:12
};

const patientsBlock={
background:"white",
border:"1px solid #E5E7EB",
borderRadius:10,
padding:12
};

const patientRow={
display:"flex",
justifyContent:"space-between",
borderBottom:"1px solid #E5E7EB",
padding:"10px 0"
};

const patientName={
fontWeight:700
};

const patientMeta={
fontSize:12,
color:"#6B7280"
};

const patientRight={
display:"flex",
flexDirection:"column",
alignItems:"flex-end",
gap:6
};

const openBtn={
background:"#2563EB",
color:"white",
border:"none",
padding:"6px 10px",
borderRadius:8,
fontSize:12
};

const sidePanel={
display:"flex",
flexDirection:"column",
gap:12
};

const panel={
background:"white",
border:"1px solid #E5E7EB",
borderRadius:10,
padding:12
};

const line={
display:"flex",
justifyContent:"space-between",
margin:"6px 0"
};

const badgeRed={
background:"#FEE2E2",
color:"#DC2626",
padding:"3px 6px",
borderRadius:6,
fontSize:11
};

const badgeAmber={
background:"#FEF3C7",
color:"#D97706",
padding:"3px 6px",
borderRadius:6,
fontSize:11
};

const badgeGreen={
background:"#D1FAE5",
color:"#059669",
padding:"3px 6px",
borderRadius:6,
fontSize:11
};

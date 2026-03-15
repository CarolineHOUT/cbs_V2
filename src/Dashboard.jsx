import { useState, useMemo } from "react";

export default function Dashboard({ patients = [], onOpenPatient }) {

const [service,setService]=useState("Tous")
const [status,setStatus]=useState("Tous")
const [barrier,setBarrier]=useState("Tous")
const [search,setSearch]=useState("")
const [selectedBarrier,setSelectedBarrier]=useState(null)

function stayDays(date){
const [d,m,y]=date.split("/")
const start=new Date(y,m-1,d)
const today=new Date()
return Math.floor((today-start)/86400000)
}

const services=["Tous",...new Set(patients.map(p=>p.service))]
const barriers=["Tous",...new Set(patients.map(p=>p.blocage))]

const filtered=useMemo(()=>{

return patients
.map(p=>({...p,stay:stayDays(p.entryDate)}))
.filter(p=>{

if(service!=="Tous" && p.service!==service) return false
if(barrier!=="Tous" && p.blocage!==barrier) return false

const q=search.toLowerCase()

if(q){
return(
p.nom.toLowerCase().includes(q)||
p.prenom.toLowerCase().includes(q)||
p.ins.includes(q)
)
}

return true

})

},[patients,service,barrier,search])


const medicalReady=filtered.filter(p=>p.sortantMedicalement)

const stats={

sortants:medicalReady.length,
bloques:medicalReady.filter(p=>p.score>=8).length,
risque:medicalReady.filter(p=>p.score>=6 && p.score<8).length,
jours:medicalReady.reduce((a,b)=>a+(b.joursEvitables||0),0)

}


const freins=useMemo(()=>{

const map={}

medicalReady.forEach(p=>{

if(!map[p.blocage]) map[p.blocage]={count:0,patients:[]}

map[p.blocage].count++
map[p.blocage].patients.push(p)

})

return Object.entries(map)

},[medicalReady])

return(

<div style={{maxWidth:1200,margin:"auto",padding:20}}>


<header style={{
background:"#1e3a8a",
color:"white",
padding:12,
borderRadius:8,
display:"flex",
justifyContent:"space-between"
}}>

<div>
<div style={{fontWeight:700}}>CARABBAS</div>
<div style={{fontSize:12}}>Sorties hospitalières complexes</div>
</div>

<button style={{
background:"#fee2e2",
border:"none",
padding:"6px 12px",
borderRadius:6
}}>
Cellule de crise
</button>

</header>


<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:20}}>

<Kpi label="Sortants médicaux" value={stats.sortants}/>
<Kpi label="Bloqués" value={stats.bloques}/>
<Kpi label="Risque" value={stats.risque}/>
<Kpi label="Jours évitables" value={stats.jours}/>

</div>


<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:20}}>

<select value={service} onChange={e=>setService(e.target.value)}>
{services.map(s=><option key={s}>{s}</option>)}
</select>

<select value={barrier} onChange={e=>setBarrier(e.target.value)}>
{barriers.map(b=><option key={b}>{b}</option>)}
</select>

<input
placeholder="Nom ou INS"
value={search}
onChange={e=>setSearch(e.target.value)}
/>

</div>


<div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20,marginTop:30}}>


<div>

<h3>Patients prioritaires</h3>

<table style={{width:"100%"}}>

<thead>
<tr>
<th>Patient</th>
<th>Service</th>
<th>Frein</th>
<th>Impact</th>
<th>Sortant</th>
<th></th>
</tr>
</thead>

<tbody>

{filtered.map(p=>(

<tr key={p.id} style={{borderTop:"1px solid #eee"}}>

<td>
<b>{p.nom} {p.prenom}</b><br/>
{p.birthDate} • {p.age} ans<br/>
INS {p.ins}<br/>
Entrée {p.entryDate} • {p.stay} j
</td>

<td>{p.service}</td>

<td>{p.blocage}</td>

<td>
{p.sortantMedicalement ? p.joursEvitables+" j" : "-"}
</td>

<td>
<input type="checkbox" checked={p.sortantMedicalement}/>
</td>

<td>

<button onClick={()=>onOpenPatient(p)}>
Ouvrir
</button>

</td>

</tr>

))}

</tbody>

</table>

</div>


<div>

<h3>Freins dominants</h3>

{freins.map(([label,data])=>(

<div
key={label}
style={{
border:"1px solid #eee",
padding:10,
marginBottom:10,
cursor:"pointer"
}}
onClick={()=>setSelectedBarrier(label)}
>

<b>{label}</b> ({data.count})

</div>

))}


{selectedBarrier &&

<div style={{marginTop:20}}>

<h4>Patients concernés</h4>

{freins.find(f=>f[0]===selectedBarrier)[1].patients.map(p=>(

<div key={p.id} style={{marginBottom:10}}>

{p.nom} {p.prenom}

</div>

))}

</div>

}

</div>

</div>

</div>

)

}


function Kpi({label,value}){

return(

<div style={{
background:"#fff",
border:"1px solid #eee",
padding:10,
borderRadius:6
}}>

<div style={{fontSize:12,color:"#777"}}>{label}</div>

<div style={{fontSize:22,fontWeight:700}}>
{value}
</div>

</div>

)

}

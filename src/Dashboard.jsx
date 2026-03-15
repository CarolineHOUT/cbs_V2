<section style={summaryBarStyle}>
  <div style={summaryLabelStyle}>Lecture immédiate</div>
  <div style={summaryTextStyle}>
    <strong>{patients.filter((p) => p.sortantMedicalement).length}</strong> sortants médicaux présents ·{" "}
    <strong>{blockedPatients}</strong> bloqués ·{" "}
    <strong>{avoidableDays}</strong> jours évitables ·{" "}
    <strong>{recoverableBeds}</strong> lits récupérables
  </div>
</section>

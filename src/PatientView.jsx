import { useState } from "react";

export default function PatientView({ patient, onBack }) {
  const [intake, setIntake] = useState({
    livingPlace: "",
    livesAlone: "",
    caregiver: "",
    barriers: "",
    anticipation: "",
  });

  const [actions, setActions] = useState([
    {
      id: 1,
      title: "Demande SSIAD",
      status: "À lancer",
    },
    {
      id: 2,
      title: "Contact DAC",
      status: "En cours",
    },
    {
      id: 3,
      title: "Recherche aide à domicile",
      status: "Refusé",
    },
  ]);

  const [notes, setNotes] = useState([
    {
      id: 1,
      text: "SSIAD secteur nord saturé, relancer demain.",
      priority: "urgent",
      read: false,
      author: "Coordination",
      date: "Aujourd'hui 09:10",
    },
  ]);

  const [newNote, setNewNote] = useState("");
  const [newPriority, setNewPriority] = useState("normal");

  const unreadCount = notes.filter((n) => !n.read).length;
  const urgentCount = notes.filter((n) => n.priority === "urgent").length;

  function updateIntake(field, value) {
    setIntake((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function addAction() {
    const title = window.prompt("Nom de l'action");
    if (!title) return;

    setActions((prev) => [
      ...prev,
      {
        id: Date.now(),
        title,
        status: "À lancer",
      },
    ]);
  }

  function updateActionStatus(id, status) {
    setActions((prev) =>
      prev.map((action) =>
        action.id === id ? { ...action, status } : action
      )
    );
  }

  function addNote() {
    if (!newNote.trim()) return;

    setNotes((prev) => [
      {
        id: Date.now(),
        text: newNote,
        priority: newPriority,
        read: false,
        author: "Équipe",
        date: new Date().toLocaleString(),
      },
      ...prev,
    ]);

    setNewNote("");
    setNewPriority("normal");
  }

  function markAsRead(id) {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, read: true } : note
      )
    );
  }

  const groupedActions = {
    "À lancer": actions.filter((a) => a.status === "À lancer"),
    "En cours": actions.filter((a) => a.status === "En cours"),
    "Accepté": actions.filter((a) => a.status === "Accepté"),
    "Refusé": actions.filter((a) => a.status === "Refusé"),
    "Terminé": actions.filter((a) => a.status === "Terminé"),
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <button
        onClick={onBack}
        style={{
          marginBottom: 18,
          border: "1px solid #cbd5e1",
          background: "white",
          borderRadius: 10,
          padding: "10px 14px",
        }}
      >
        ← Retour au dashboard
      </button>

      <div
        style={{
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          color: "white",
          borderRadius: 18,
          padding: 24,
          marginBottom: 20,
          boxShadow: "0 10px 30px rgba(79,70,229,0.18)",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 800 }}>
          {patient.nom.toUpperCase()} {patient.prenom}
        </div>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            fontSize: 13,
          }}
        >
          <BadgeDark label={`Naissance : ${patient.birthDate}`} />
          <BadgeDark label={`Âge : ${patient.age} ans`} />
          <BadgeDark label={`INS : ${patient.ins}`} />
          <BadgeDark label={`IEP : ${patient.iep}`} />
          <BadgeDark label={`Service : ${patient.service}`} />
          <BadgeDark label={`Chambre : ${patient.chambre}`} />
          <BadgeDark label={`Lit : ${patient.lit}`} />
          <BadgeDark label={`Territoire : ${patient.territory}`} />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <InfoCard
          title="Frein principal"
          value={patient.blocage}
          bg="#ffedd5"
          color="#c2410c"
        />
        <InfoCard
          title="Statut coordination"
          value={
            patient.sortantMedicalement
              ? "Sortant médicalement sans sortie finalisée"
              : "Préparation de sortie en cours"
          }
          bg="#dbeafe"
          color="#1d4ed8"
        />
        <InfoCard
          title="Impact hospitalier"
          value={`${patient.joursEvitables} jours évitables`}
          bg="#dcfce7"
          color="#166534"
        />
        <InfoCard
          title="Score CARABBAS"
          value={String(patient.score)}
          bg={getScoreBg(patient.score)}
          color={getScoreText(patient.score)}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        <SectionCard title="Recueil d'entrée">
          <Field label="Lieu de vie">
            <input
              value={intake.livingPlace}
              onChange={(e) => updateIntake("livingPlace", e.target.value)}
              style={inputStyle}
              placeholder="Domicile, EHPAD, résidence autonomie..."
            />
          </Field>

          <Field label="Vit seul">
            <select
              value={intake.livesAlone}
              onChange={(e) => updateIntake("livesAlone", e.target.value)}
              style={inputStyle}
            >
              <option value="">Choisir</option>
              <option value="oui">Oui</option>
              <option value="non">Non</option>
              <option value="inconnu">Inconnu</option>
            </select>
          </Field>

          <Field label="Aidant principal">
            <input
              value={intake.caregiver}
              onChange={(e) => updateIntake("caregiver", e.target.value)}
              style={inputStyle}
              placeholder="Nom ou précision"
            />
          </Field>

          <Field label="Freins identifiés">
            <textarea
              value={intake.barriers}
              onChange={(e) => updateIntake("barriers", e.target.value)}
              style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
              placeholder="Isolement, logement, absence d'aidant..."
            />
          </Field>

          <Field label="Niveau d'anticipation">
            <select
              value={intake.anticipation}
              onChange={(e) => updateIntake("anticipation", e.target.value)}
              style={inputStyle}
            >
              <option value="">Choisir</option>
              <option value="standard">Standard</option>
              <option value="vigilance">Vigilance</option>
              <option value="rapide">Anticiper rapidement</option>
              <option value="prioritaire">Prioritaire dès maintenant</option>
            </select>
          </Field>
        </SectionCard>

        <SectionCard title="Communication équipe">
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <SmallBadge label={`Non lus : ${unreadCount}`} bg="#e2e8f0" color="#334155" />
            <SmallBadge label={`Urgents : ${urgentCount}`} bg="#fee2e2" color="#b91c1c" />
          </div>

          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            style={{ ...inputStyle, minHeight: 90, resize: "vertical", marginBottom: 10 }}
            placeholder="Ajouter un message pour l'équipe..."
          />

          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              style={inputStyle}
            >
              <option value="normal">Normal</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </select>

            <button onClick={addNote} style={primaryButtonStyle}>
              Ajouter le post-it
            </button>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {notes.map((note) => (
              <div
                key={note.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 12,
                  background:
                    note.priority === "urgent"
                      ? "#fef2f2"
                      : note.priority === "important"
                        ? "#fff7ed"
                        : "#fefce8",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {note.author} · {note.date}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <SmallBadge
                      label={note.priority}
                      bg={note.priority === "urgent" ? "#fee2e2" : note.priority === "important" ? "#ffedd5" : "#e2e8f0"}
                      color={note.priority === "urgent" ? "#b91c1c" : note.priority === "important" ? "#c2410c" : "#334155"}
                    />
                    {!note.read && (
                      <button onClick={() => markAsRead(note.id)} style={secondaryButtonStyle}>
                        Marquer lu
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{note.text}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div style={{ marginTop: 20 }}>
        <SectionCard title="Workflow des actions">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(180px, 1fr))",
              gap: 12,
              alignItems: "start",
            }}
          >
            {Object.entries(groupedActions).map(([status, items]) => (
              <div
                key={status}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  background: "#f8fafc",
                  padding: 12,
                  minHeight: 220,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>
                  {status}
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {items.map((action) => (
                    <div
                      key={action.id}
                      style={{
                        background: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        padding: 10,
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
                        {action.title}
                      </div>

                      <select
                        value={action.status}
                        onChange={(e) => updateActionStatus(action.id, e.target.value)}
                        style={inputStyle}
                      >
                        <option>À lancer</option>
                        <option>En cours</option>
                        <option>Accepté</option>
                        <option>Refusé</option>
                        <option>Terminé</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <button onClick={addAction} style={primaryButtonStyle}>
              Ajouter une action
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 4px 16px rgba(15,23,42,0.05)",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

function InfoCard({ title, value, bg, color }) {
  return (
    <div
      style={{
        background: bg,
        borderRadius: 18,
        padding: 18,
        border: "1px solid rgba(15,23,42,0.06)",
      }}
    >
      <div style={{ fontSize: 13, color: "#475569", marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function BadgeDark({ label }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "7px 10px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.14)",
        border: "1px solid rgba(255,255,255,0.18)",
      }}
    >
      {label}
    </span>
  );
}

function SmallBadge({ label, bg, color }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: bg,
        color,
      }}
    >
      {label}
    </span>
  );
}

function getScoreBg(score) {
  if (score >= 9) return "#fee2e2";
  if (score >= 7) return "#ffedd5";
  if (score >= 5) return "#fef3c7";
  return "#dcfce7";
}

function getScoreText(score) {
  if (score >= 9) return "#b91c1c";
  if (score >= 7) return "#c2410c";
  if (score >= 5) return "#a16207";
  return "#166534";
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  fontSize: 14,
  boxSizing: "border-box",
  background: "white",
};

const primaryButtonStyle = {
  border: "none",
  background: "#4f46e5",
  color: "white",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 600,
};

const secondaryButtonStyle = {
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#334155",
  borderRadius: 10,
  padding: "6px 10px",
  fontSize: 12,
};

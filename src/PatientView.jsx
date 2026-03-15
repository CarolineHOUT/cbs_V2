import { useMemo, useState } from "react";

export default function PatientView({
  patient,
  patientState,
  onBack,
  updatePatientState,
}) {
  const [newBarrier, setNewBarrier] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newNotePriority, setNewNotePriority] = useState("Normal");

  const unreadNotes = useMemo(
    () => patientState.notes.filter((n) => !n.read).length,
    [patientState.notes]
  );

  function updateTrusted(field, value) {
    updatePatientState((prev) => ({
      ...prev,
      trustedPerson: {
        ...prev.trustedPerson,
        [field]: value,
      },
    }));
  }

  function updateEmergency(field, value) {
    updatePatientState((prev) => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value,
      },
    }));
  }

  function updateProtection(field, value) {
    updatePatientState((prev) => ({
      ...prev,
      protection: {
        ...prev.protection,
        [field]: value,
      },
    }));
  }

  function updateIntake(field, value) {
    updatePatientState((prev) => ({
      ...prev,
      intake: {
        ...prev.intake,
        [field]: value,
      },
    }));
  }

  function updateStatus(field, value) {
    updatePatientState((prev) => ({
      ...prev,
      status: {
        ...prev.status,
        [field]: value,
      },
    }));
  }

  function addBarrier() {
    const value = newBarrier.trim();
    if (!value) return;

    updatePatientState((prev) => ({
      ...prev,
      barriers: [...prev.barriers, value],
    }));
    setNewBarrier("");
  }

  function removeBarrier(index) {
    updatePatientState((prev) => ({
      ...prev,
      barriers: prev.barriers.filter((_, i) => i !== index),
    }));
  }

  function addWorkflowAction() {
    const title = window.prompt("Nom de l'action");
    if (!title) return;

    updatePatientState((prev) => ({
      ...prev,
      workflow: [
        ...prev.workflow,
        {
          id: Date.now(),
          title,
          owner: "Coordination",
          status: "À lancer",
          lastUpdate: "Aujourd'hui",
        },
      ],
    }));
  }

  function updateWorkflowAction(id, field, value) {
    updatePatientState((prev) => ({
      ...prev,
      workflow: prev.workflow.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addNote() {
    const text = newNote.trim();
    if (!text) return;

    updatePatientState((prev) => ({
      ...prev,
      notes: [
        {
          id: Date.now(),
          author: "Équipe",
          priority: newNotePriority,
          read: false,
          date: new Date().toLocaleString(),
          text,
        },
        ...prev.notes,
      ],
    }));

    setNewNote("");
    setNewNotePriority("Normal");
  }

  function markNoteRead(id) {
    updatePatientState((prev) => ({
      ...prev,
      notes: prev.notes.map((note) =>
        note.id === id ? { ...note, read: true } : note
      ),
    }));
  }

  function updateSolution(id, status) {
    updatePatientState((prev) => ({
      ...prev,
      solutions: prev.solutions.map((solution) =>
        solution.id === id ? { ...solution, status } : solution
      ),
    }));
  }

  return (
    <div style={pageStyle}>
      <header style={topBarStyle}>
        <div style={topLeftStyle}>
          <button onClick={onBack} style={backButtonStyle}>
            ← Retour
          </button>

          <div>
            <div style={titleStyle}>
              {patient.nom} {patient.prenom}
            </div>
            <div style={subtitleStyle}>
              Coordination de sortie • {patient.service}
            </div>
          </div>
        </div>

        <div style={topRightStyle}>
          <StatusBadge
            label={patient.sortantMedicalement ? "Sortant médicalement" : "En hospitalisation"}
            tone={patient.sortantMedicalement ? "blue" : "slate"}
          />
          <StatusBadge
            label={`Score ${patient.score}`}
            tone={patient.score >= 8 ? "red" : patient.score >= 6 ? "amber" : "green"}
          />
        </div>
      </header>

      <section style={identityGridStyle}>
        <IdentityCard title="Identité et séjour">
          <IdentityRow label="Date de naissance" value={patient.birthDate} />
          <IdentityRow label="Âge" value={`${patient.age} ans`} />
          <IdentityRow label="INS" value={patient.ins} />
          <IdentityRow label="IEP" value={patient.iep} />
          <IdentityRow label="Service" value={patient.service} />
          <IdentityRow label="Chambre / Lit" value={`${patient.chambre} / ${patient.lit}`} />
          <IdentityRow label="Entrée" value={patient.entryDate} />
          <IdentityRow label="Sortie estimée" value={patient.estimatedDischargeDate} />
          <IdentityRow label="Territoire" value={patient.city} />
        </IdentityCard>

        <IdentityCard title="Contacts et protection">
          <Field label="Personne de confiance">
            <input
              value={patientState.trustedPerson.name}
              onChange={(e) => updateTrusted("name", e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="Lien">
            <input
              value={patientState.trustedPerson.relation}
              onChange={(e) => updateTrusted("relation", e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="Téléphone">
            <input
              value={patientState.trustedPerson.phone}
              onChange={(e) => updateTrusted("phone", e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="Personne à prévenir">
            <input
              value={patientState.emergencyContact.name}
              onChange={(e) => updateEmergency("name", e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="Téléphone">
            <input
              value={patientState.emergencyContact.phone}
              onChange={(e) => updateEmergency("phone", e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="Mesure de protection">
            <select
              value={patientState.protection.type}
              onChange={(e) => updateProtection("type", e.target.value)}
              style={inputStyle}
            >
              <option>Aucune</option>
              <option>Tutelle</option>
              <option>Curatelle</option>
              <option>Sauvegarde de justice</option>
            </select>
          </Field>

          {patientState.protection.type !== "Aucune" && (
            <>
              <Field label="Représentant">
                <input
                  value={patientState.protection.representative}
                  onChange={(e) => updateProtection("representative", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Téléphone">
                <input
                  value={patientState.protection.phone}
                  onChange={(e) => updateProtection("phone", e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </>
          )}
        </IdentityCard>
      </section>

      <section style={statusGridStyle}>
        <Panel title="Statut de sortie" subtitle="Lecture immédiate">
          <CheckRow
            label="Sortant médicalement"
            checked={patient.sortantMedicalement}
            readOnly
          />
          <CheckRow
            label="Solution d’aval trouvée"
            checked={patientState.status.solutionFound}
            onChange={(value) => updateStatus("solutionFound", value)}
          />
          <CheckRow
            label="Transport organisé"
            checked={patientState.status.transportReady}
            onChange={(value) => updateStatus("transportReady", value)}
          />
          <CheckRow
            label="Sortie programmée"
            checked={patientState.status.dischargePlanned}
            onChange={(value) => updateStatus("dischargePlanned", value)}
          />
        </Panel>

        <Panel title="Recueil d’entrée" subtitle="Anticipation sortie">
          <Field label="Lieu de vie">
            <select
              value={patientState.intake.livingPlace}
              onChange={(e) => updateIntake("livingPlace", e.target.value)}
              style={inputStyle}
            >
              <option>Domicile</option>
              <option>Domicile avec aide</option>
              <option>EHPAD</option>
              <option>Résidence autonomie</option>
              <option>Foyer</option>
              <option>Sans domicile</option>
            </select>
          </Field>

          <Field label="Aidant">
            <select
              value={patientState.intake.aidant}
              onChange={(e) => updateIntake("aidant", e.target.value)}
              style={inputStyle}
            >
              <option>Oui</option>
              <option>Non</option>
              <option>Aidant épuisé</option>
            </select>
          </Field>

          <Field label="Autonomie">
            <select
              value={patientState.intake.autonomy}
              onChange={(e) => updateIntake("autonomy", e.target.value)}
              style={inputStyle}
            >
              <option>Indépendant</option>
              <option>Fragile</option>
              <option>Dépendant</option>
            </select>
          </Field>

          <Field label="Territoire">
            <input
              value={patientState.intake.territory}
              onChange={(e) => updateIntake("territory", e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="Niveau d’anticipation">
            <select
              value={patientState.intake.anticipation}
              onChange={(e) => updateIntake("anticipation", e.target.value)}
              style={inputStyle}
            >
              <option>Standard</option>
              <option>Vigilance</option>
              <option>Prioritaire dès maintenant</option>
            </select>
          </Field>
        </Panel>
      </section>

      <section style={mainGridStyle}>
        <div style={mainColumnStyle}>
          <Panel title="Freins identifiés" subtitle="Évolutifs pendant l’hospitalisation">
            <div style={barrierListStyle}>
              {patientState.barriers.map((barrier, index) => (
                <div key={`${barrier}-${index}`} style={barrierTagStyle}>
                  <span>{barrier}</span>
                  <button
                    onClick={() => removeBarrier(index)}
                    style={miniRemoveButtonStyle}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div style={inlineFormStyle}>
              <input
                value={newBarrier}
                onChange={(e) => setNewBarrier(e.target.value)}
                placeholder="Ajouter un frein"
                style={inputStyle}
              />
              <button onClick={addBarrier} style={primaryButtonStyle}>
                Ajouter
              </button>
            </div>
          </Panel>

          <Panel title="Workflow des actions" subtitle="Ce qui a été tenté, en cours ou refusé">
            <div style={{ display: "grid", gap: 10 }}>
              {patientState.workflow.map((item) => (
                <div key={item.id} style={workflowRowStyle}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={workflowTitleStyle}>{item.title}</div>
                    <div style={workflowMetaStyle}>
                      {item.owner} • dernière maj : {item.lastUpdate}
                    </div>
                  </div>

                  <select
                    value={item.status}
                    onChange={(e) =>
                      updateWorkflowAction(item.id, "status", e.target.value)
                    }
                    style={statusSelectStyle}
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

            <div style={{ marginTop: 12 }}>
              <button onClick={addWorkflowAction} style={primaryButtonStyle}>
                Ajouter une action
              </button>
            </div>
          </Panel>
        </div>

        <div style={sideColumnStyle}>
          <Panel title="Notes équipe" subtitle={`Messages non lus : ${unreadNotes}`}>
            <div style={inlineFormColumnStyle}>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Ajouter une note utile à l’équipe"
                style={textareaStyle}
              />
              <div style={inlineFormStyle}>
                <select
                  value={newNotePriority}
                  onChange={(e) => setNewNotePriority(e.target.value)}
                  style={inputStyle}
                >
                  <option>Normal</option>
                  <option>Important</option>
                  <option>Urgent</option>
                </select>
                <button onClick={addNote} style={primaryButtonStyle}>
                  Ajouter
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {patientState.notes.map((note) => (
                <div key={note.id} style={noteCardStyle(note.priority)}>
                  <div style={noteTopStyle}>
                    <div style={noteMetaStyle}>
                      {note.author} • {note.date}
                    </div>

                    <div style={badgeGroupStyle}>
                      <PriorityTextBadge label={note.priority} />
                      {!note.read && (
                        <button
                          onClick={() => markNoteRead(note.id)}
                          style={miniActionButtonStyle}
                        >
                          Marquer lu
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={noteTextStyle}>{note.text}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Solutions d’aval" subtitle="Suivi des propositions">
            <div style={{ display: "grid", gap: 10 }}>
              {patientState.solutions.map((solution) => (
                <div key={solution.id} style={solutionRowStyle}>
                  <div style={workflowTitleStyle}>{solution.label}</div>
                  <select
                    value={solution.status}
                    onChange={(e) => updateSolution(solution.id, e.target.value)}
                    style={statusSelectStyle}
                  >
                    <option>À contacter</option>
                    <option>À évaluer</option>
                    <option>En cours</option>
                    <option>Accepté</option>
                    <option>Refusé</option>
                  </select>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>
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

function IdentityCard({ title, children }) {
  return (
    <div style={panelStyle}>
      <div style={panelTitleStyle}>{title}</div>
      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>{children}</div>
    </div>
  );
}

function IdentityRow({ label, value }) {
  return (
    <div style={identityRowStyle}>
      <div style={identityLabelStyle}>{label}</div>
      <div style={identityValueStyle}>{value}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={fieldLabelStyle}>{label}</div>
      {children}
    </div>
  );
}

function CheckRow({ label, checked, onChange, readOnly = false }) {
  return (
    <label style={checkRowStyle}>
      <input
        type="checkbox"
        checked={checked}
        disabled={readOnly}
        onChange={(e) => onChange && onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function StatusBadge({ label, tone }) {
  const tones = {
    blue: { bg: "#DBEAFE", color: "#1D4ED8" },
    red: { bg: "#FEE2E2", color: "#DC2626" },
    amber: { bg: "#FEF3C7", color: "#D97706" },
    green: { bg: "#D1FAE5", color: "#059669" },
    slate: { bg: "#E5E7EB", color: "#475569" },
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: 999,
        background: tones[tone].bg,
        color: tones[tone].color,
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {label}
    </span>
  );
}

function PriorityTextBadge({ label }) {
  const config = {
    Urgent: { bg: "#FEE2E2", color: "#DC2626" },
    Important: { bg: "#FEF3C7", color: "#D97706" },
    Normal: { bg: "#DBEAFE", color: "#1D4ED8" },
  };

  const tone = config[label] || config.Normal;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: 999,
        background: tone.bg,
        color: tone.color,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

function noteCardStyle(priority) {
  let bg = "#FFFFFF";

  if (priority === "Urgent") bg = "#FFF7F7";
  if (priority === "Important") bg = "#FFFBEB";

  return {
    background: bg,
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 12,
  };
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
  flexWrap: "wrap",
};

const backButtonStyle = {
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  color: "#111827",
  padding: "8px 10px",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 12,
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
  gap: 8,
  flexWrap: "wrap",
};

const identityGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 12,
  marginBottom: 12,
};

const statusGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 12,
  marginBottom: 12,
};

const mainGridStyle = {
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

const identityRowStyle = {
  display: "grid",
  gap: 3,
};

const identityLabelStyle = {
  fontSize: 12,
  color: "#6B7280",
};

const identityValueStyle = {
  fontSize: 14,
  color: "#111827",
  fontWeight: 700,
};

const fieldLabelStyle = {
  fontSize: 12,
  color: "#6B7280",
  fontWeight: 700,
};

const checkRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 0",
  borderBottom: "1px solid #F1F5F9",
  fontSize: 14,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  fontSize: 14,
  boxSizing: "border-box",
};

const textareaStyle = {
  width: "100%",
  minHeight: 90,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  fontSize: 14,
  resize: "vertical",
  boxSizing: "border-box",
};

const inlineFormStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const inlineFormColumnStyle = {
  display: "grid",
  gap: 8,
};

const primaryButtonStyle = {
  border: "none",
  background: "#2563EB",
  color: "#FFFFFF",
  padding: "10px 12px",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 13,
  whiteSpace: "nowrap",
};

const barrierListStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 12,
};

const barrierTagStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "#EFF6FF",
  color: "#1D4ED8",
  borderRadius: 999,
  padding: "7px 10px",
  fontSize: 12,
  fontWeight: 700,
};

const miniRemoveButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#1D4ED8",
  fontWeight: 800,
  cursor: "pointer",
  padding: 0,
};

const workflowRowStyle = {
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 12,
  background: "#FFFFFF",
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const workflowTitleStyle = {
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
};

const workflowMetaStyle = {
  marginTop: 4,
  fontSize: 12,
  color: "#6B7280",
};

const statusSelectStyle = {
  minWidth: 140,
  padding: "9px 10px",
  borderRadius: 10,
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  fontSize: 13,
};

const noteTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 8,
};

const noteMetaStyle = {
  fontSize: 12,
  color: "#6B7280",
};

const badgeGroupStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const miniActionButtonStyle = {
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  color: "#111827",
  padding: "5px 8px",
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 700,
};

const noteTextStyle = {
  fontSize: 14,
  color: "#111827",
  lineHeight: 1.5,
};

const solutionRowStyle = {
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 12,
  background: "#FFFFFF",
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

import React, { useState } from "react";
import "./PatientView.css";

export default function PatientView() {
  const [postits, setPostits] = useState([
    {
      id: 1,
      type: "Urgent",
      message: "Appeler la famille aujourd’hui",
      statut: "À traiter",
      reponse: "",
    },
  ]);

  const [replying, setReplying] = useState(null);
  const [replyText, setReplyText] = useState("");

  const sendReply = (id) => {
    setPostits((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, statut: "Répondu", reponse: replyText } : p
      )
    );
    setReplyText("");
    setReplying(null);
  };

  return (
    <div className="pv-page">
      {/* HEADER */}
      <header className="pv-header">
        <div className="pv-title">CARABBAS</div>
        <div className="pv-sub">Fiche patient</div>
      </header>

      {/* IDENTITÉ */}
      <section className="pv-identity">
        <div>
          <h1>DEAN Jane</h1>
          <p>Née le 12/08/1958 · 67 ans</p>
          <p>INS 1 58 08 12 222 111 · IEP 99887766</p>
          <p>Chambre A05 · Lit 05</p>
        </div>

        <div className="pv-service">
          <strong>Oncologie</strong>
          <span>Priorité 5</span>
        </div>
      </section>

      {/* PILOTAGE CRITIQUE */}
      <section className="pv-critical">
        <div className="card sortmed">
          <span>Sort Med</span>
          <strong>Non activé</strong>
        </div>

        <div className="card frein">
          <span>Frein</span>
          <strong>Place aval</strong>
        </div>

        <div className="card blocage">
          <span>Blocage</span>
          <strong>Attente retour structure</strong>
        </div>

        <div className="card action">
          <span>Action</span>
          <strong>Relance structure</strong>
        </div>
      </section>

      {/* RISQUE */}
      <section className="pv-risk high">
        <strong>Risque ÉLEVÉ</strong>
        <p>Patient sortant sans solution → dérive en cours</p>
      </section>

      {/* INDICATEURS */}
      <section className="pv-kpi">
        <div>
          <span>Maturité</span>
          <strong>Organisation sortie</strong>
        </div>

        <div>
          <span>Administratif</span>
          <strong>Incomplet</strong>
        </div>

        <div>
          <span>J évitables</span>
          <strong>J+2</strong>
        </div>

        <div>
          <span>Sortie prévue</span>
          <strong>21/03</strong>
        </div>
      </section>

      {/* SYNTHÈSE */}
      <section className="pv-block highlight">
        <h3>Synthèse</h3>
        <p>
          Patient médicalement sortant sans solution. Frein principal : place
          aval. Action prioritaire : relance structure.
        </p>
      </section>

      {/* ACTIONS */}
      <section className="pv-block">
        <h3>Actions en cours</h3>

        <div className="action-card">
          <strong>Relance structure aval</strong>
          <span>Claire Morel</span>
        </div>
      </section>

      {/* POST-IT */}
      <section className="pv-block">
        <h3>Coordination (post-it)</h3>

        {postits.map((p) => (
          <div key={p.id} className="postit">
            <div className="postit-header">
              <span>{p.type}</span>
              <span>{p.statut}</span>
            </div>

            <p>{p.message}</p>

            {p.reponse && <div className="response">{p.reponse}</div>}

            {p.statut !== "Répondu" && (
              <>
                <button onClick={() => setReplying(p.id)}>Répondre</button>

                {replying === p.id && (
                  <div className="reply-box">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button onClick={() => sendReply(p.id)}>Valider</button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

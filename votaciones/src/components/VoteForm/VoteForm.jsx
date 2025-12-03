import { useState } from "react";
import { supabase } from "../../api/supabaseClient";

export function VoteForm({ players, sessionId, voterId, onSuccess }) {
  const [best, setBest] = useState({ first: "", second: "", third: "" });
  const [worst, setWorst] = useState({ first: "", second: "", third: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const validate = () => {
    const all = [...Object.values(best), ...Object.values(worst)];
    if (all.some((v) => !v)) return false;
    const s = new Set(all);
    return s.size === all.length;
  };

  const buildPayload = () => [
    { vote_session_id: sessionId, voter_id: voterId, player_id: best.first,  type: "best",  points: 3 },
    { vote_session_id: sessionId, voter_id: voterId, player_id: best.second, type: "best",  points: 2 },
    { vote_session_id: sessionId, voter_id: voterId, player_id: best.third,  type: "best",  points: 1 },
    { vote_session_id: sessionId, voter_id: voterId, player_id: worst.first,  type: "worst", points: -3 },
    { vote_session_id: sessionId, voter_id: voterId, player_id: worst.second, type: "worst", points: -2 },
    { vote_session_id: sessionId, voter_id: voterId, player_id: worst.third,  type: "worst", points: -1 }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setErrorMsg("Debes elegir 6 jugadores distintos.");
      return;
    }
    setLoading(true);

    const payload = buildPayload();
    const { error } = await supabase.from("votes").insert(payload);

    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Mejores</h3>
      <select value={best.first} onChange={(e) => setBest({ ...best, first: e.target.value })}>
        <option value="">3 puntos</option>
        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select value={best.second} onChange={(e) => setBest({ ...best, second: e.target.value })}>
        <option value="">2 puntos</option>
        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select value={best.third} onChange={(e) => setBest({ ...best, third: e.target.value })}>
        <option value="">1 punto</option>
        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      <h3>Peores</h3>
      <select value={worst.first} onChange={(e) => setWorst({ ...worst, first: e.target.value })}>
        <option value="">-3 puntos</option>
        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select value={worst.second} onChange={(e) => setWorst({ ...worst, second: e.target.value })}>
        <option value="">-2 puntos</option>
        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select value={worst.third} onChange={(e) => setWorst({ ...worst, third: e.target.value })}>
        <option value="">-1 punto</option>
        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar voto"}
      </button>
    </form>
  );
}

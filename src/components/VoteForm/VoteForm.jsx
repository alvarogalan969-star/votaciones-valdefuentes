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
    setErrorMsg("");

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

  const selectBaseClasses =
    "w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mejores */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Mejores jugadores</h3>
        <p className="text-xs text-slate-400">
          Elige a los 3 mejores del partido. No puedes repetir jugador.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-300">
              3 puntos
            </label>
            <select
              value={best.first}
              onChange={(e) => setBest({ ...best, first: e.target.value })}
              className={selectBaseClasses}
            >
              <option value="" className="bg-slate-900 text-slate-100">
                Selecciona jugador
              </option>
              {players.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                  className="bg-slate-900 text-slate-100"
                >
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-300">
              2 puntos
            </label>
            <select
              value={best.second}
              onChange={(e) => setBest({ ...best, second: e.target.value })}
              className={selectBaseClasses}
            >
              <option value="" className="bg-slate-900 text-slate-100">
                Selecciona jugador
              </option>
              {players.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                  className="bg-slate-900 text-slate-100"
                >
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-300">
              1 punto
            </label>
            <select
              value={best.third}
              onChange={(e) => setBest({ ...best, third: e.target.value })}
              className={selectBaseClasses}
            >
              <option value="" className="bg-slate-900 text-slate-100">
                Selecciona jugador
              </option>
              {players.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                  className="bg-slate-900 text-slate-100"
                >
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Peores */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Peores jugadores</h3>
        <p className="text-xs text-slate-400">
          Elige a los 3 peores del partido. Tampoco pueden repetirse.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-300">
              -3 puntos
            </label>
            <select
              value={worst.first}
              onChange={(e) => setWorst({ ...worst, first: e.target.value })}
              className={selectBaseClasses}
            >
              <option value="" className="bg-slate-900 text-slate-100">
                Selecciona jugador
              </option>
              {players.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                  className="bg-slate-900 text-slate-100"
                >
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-300">
              -2 puntos
            </label>
            <select
              value={worst.second}
              onChange={(e) => setWorst({ ...worst, second: e.target.value })}
              className={selectBaseClasses}
            >
              <option value="" className="bg-slate-900 text-slate-100">
                Selecciona jugador
              </option>
              {players.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                  className="bg-slate-900 text-slate-100"
                >
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-300">
              -1 punto
            </label>
            <select
              value={worst.third}
              onChange={(e) => setWorst({ ...worst, third: e.target.value })}
              className={selectBaseClasses}
            >
              <option value="" className="bg-slate-900 text-slate-100">
                Selecciona jugador
              </option>
              {players.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                  className="bg-slate-900 text-slate-100"
                >
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {errorMsg && (
        <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/60 rounded-md px-3 py-2">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-red-600 py-3 text-sm font-semibold text-white tracking-wide shadow-lg shadow-red-900/40 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black transition"
      >
        {loading ? "Enviando..." : "Enviar voto"}
      </button>
    </form>
  );
}

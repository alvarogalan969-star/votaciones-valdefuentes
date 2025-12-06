import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabaseClient";

export default function GlobalRanking() {
  const [rows, setRows] = useState([]);
  const [matchesCols, setMatchesCols] = useState([]);
  const [totalsRow, setTotalsRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const nowIso = new Date().toISOString();

      // 1) Jugadores
      const playersPromise = supabase
        .from("players")
        .select("id, name")
        .order("name", { ascending: true });

      // 2) Partidos
      const matchesPromise = supabase
        .from("matches")
        .select("id, date, rival")
        .order("date", { ascending: true });

      // 3) Votos de sesiones cerradas (asumo vote_sessions tiene match_id)
      const votesPromise = supabase
        .from("votes")
        .select("player_id, points, vote_sessions!inner(match_id, closes_at)")
        .lt("vote_sessions.closes_at", nowIso);

      const [playersRes, matchesRes, votesRes] = await Promise.all([
        playersPromise,
        matchesPromise,
        votesPromise,
      ]);

      if (playersRes.error || matchesRes.error || votesRes.error) {
        console.error(playersRes.error || matchesRes.error || votesRes.error);
        setLoading(false);
        return;
      }

      const players = playersRes.data || [];
      const matches = matchesRes.data || [];
      const votes = votesRes.data || [];

      // IDs de partidos que tienen votos
      const matchIdsWithVotes = Array.from(
        new Set(
          votes
            .map((v) => v.vote_sessions?.match_id)
            .filter(Boolean)
        )
      );

      // Columnas de partidos: solo los que tienen votos, ordenados por fecha
      const matchesColsOrdered = matches
        .filter((m) => matchIdsWithVotes.includes(m.id))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Mapas de puntos
      const pointsByPlayerAndMatch = new Map(); // key `${playerId}-${matchId}`
      const totalByPlayer = new Map();
      const totalByMatch = new Map();
      let globalTotal = 0;

      for (const v of votes) {
        const matchId = v.vote_sessions?.match_id;
        if (!matchId || !v.player_id || v.points == null) continue;

        const key = `${v.player_id}-${matchId}`;
        const accum = (pointsByPlayerAndMatch.get(key) || 0) + v.points;
        pointsByPlayerAndMatch.set(key, accum);

        totalByPlayer.set(
          v.player_id,
          (totalByPlayer.get(v.player_id) || 0) + v.points
        );

        totalByMatch.set(
          matchId,
          (totalByMatch.get(matchId) || 0) + v.points
        );

        globalTotal += v.points;
      }

      // Filas por jugador (eje Y)
      const rankingRows = players.map((p) => {
        const perMatch = matchesColsOrdered.map((match) => {
          const key = `${p.id}-${match.id}`;
          return pointsByPlayerAndMatch.get(key) || 0;
        });

        const total = totalByPlayer.get(p.id) || 0;

        return {
          id: p.id,
          name: p.name,
          total,
          perMatch,
        };
      });

      // Ordenar jugadores por puntos totales
      rankingRows.sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        return a.name.localeCompare(b.name);
      });

      // Primera fila: totales globales
      const totalsRowData = {
        label: "Totales",
        total: globalTotal,
        perMatch: matchesColsOrdered.map((m) => totalByMatch.get(m.id) || 0),
      };

      setMatchesCols(matchesColsOrdered);
      setRows(rankingRows);
      setTotalsRow(totalsRowData);
      setLoading(false);
    };

    load();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-slate-950 to-red-700 text-slate-100">
        <p className="text-sm text-slate-300">Cargando clasificación...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-red-700 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Barra superior */}
        <div className="flex items-center justify-between gap-3 mb-8">
          <button
            onClick={() => navigate("/partidos")}
            className="inline-flex items-center text-xs font-medium text-slate-300 hover:text-white"
          >
            ← Volver a partidos
          </button>
        </div>

        {/* Cabecera */}
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-red-400">
            Valdefuentes
          </p>
          <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-white">
            Clasificación global por partido
          </h1>
          <p className="mt-1 text-sm text-slate-300 max-w-xl">
            Eje Y: jugadores · Eje X: partidos · Primera fila: puntos totales.
          </p>
        </header>

        {/* Tabla con scroll horizontal */}
        {rows.length === 0 ? (
          <div className="rounded-2xl bg-black/70 border border-slate-800 px-6 py-6 shadow-xl">
            <p className="text-sm text-slate-300">
              Todavía no hay votos registrados.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-black/70 border border-slate-800 px-4 sm:px-6 py-6 shadow-xl overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4 text-left w-12">Pos.</th>
                  <th className="py-2 pr-4 text-left min-w-[130px]">Jugador</th>
                  <th className="py-2 pr-4 text-right min-w-[80px]">Total</th>
                  {matchesCols.map((m) => (
                    <th
                      key={m.id}
                      className="py-2 px-2 text-right min-w-[90px]"
                    >
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400">
                          {m.date}
                        </span>
                        <span className="text-[11px] text-slate-200">
                          {m.rival}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Primera fila: totales globales */}
                {totalsRow && (
                  <tr className="border-b border-slate-900/80 bg-slate-900/40">
                    <td className="py-2 pr-4 text-slate-400 text-[11px]">
                      —
                    </td>
                    <td className="py-2 pr-4 font-semibold text-slate-100 text-[11px]">
                      {totalsRow.label}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <span className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold bg-slate-900/70 text-slate-100">
                        {totalsRow.total} pts
                      </span>
                    </td>
                    {totalsRow.perMatch.map((value, idx) => (
                      <td key={idx} className="py-2 px-2 text-right">
                        <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] bg-slate-900/70 text-slate-100">
                          {value}
                        </span>
                      </td>
                    ))}
                  </tr>
                )}

                {/* Filas por jugador */}
                {rows.map((r, idx) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-900/70 last:border-b-0"
                  >
                    <td className="py-2 pr-4 text-slate-400">
                      #{idx + 1}
                    </td>
                    <td className="py-2 pr-4 text-slate-100">
                      {r.name}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                          r.total > 0
                            ? "bg-emerald-900/60 text-emerald-200"
                            : r.total < 0
                            ? "bg-red-900/60 text-red-200"
                            : "bg-slate-900/60 text-slate-200"
                        }`}
                      >
                        {r.total} pts
                      </span>
                    </td>
                    {r.perMatch.map((value, i) => (
                      <td key={i} className="py-2 px-2 text-right">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] ${
                            value > 0
                              ? "bg-emerald-900/60 text-emerald-200"
                              : value < 0
                              ? "bg-red-900/60 text-red-200"
                              : "bg-slate-900/60 text-slate-200"
                          }`}
                        >
                          {value}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

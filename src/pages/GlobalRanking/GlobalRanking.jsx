import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabaseClient";

export default function GlobalRanking() {
  const [rows, setRows] = useState([]);
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

      const { data: votes, error } = await supabase
        .from("votes")
        .select("player_id, points, players(name), vote_sessions!inner(closes_at)")
        .lt("vote_sessions.closes_at", nowIso);

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const map = new Map();

      for (const v of votes || []) {
        const key = v.player_id;
        const name = v.players?.name || "Desconocido";
        const prev = map.get(key) || { name, total: 0 };

        map.set(key, {
          name,
          total: prev.total + v.points,
        });
      }

      const arr = Array.from(map.values()).sort(
        (a, b) => b.total - a.total
      );

      setRows(arr);
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
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
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
            Clasificación global
          </h1>
          <p className="mt-1 text-sm text-slate-300 max-w-xl">
            Ranking acumulado de todos los votos: puntos positivos por mejores
            y negativos por peores.
          </p>
        </header>

        {/* Contenido */}
        {rows.length === 0 ? (
          <div className="rounded-2xl bg-black/70 border border-slate-800 px-6 py-6 shadow-xl">
            <p className="text-sm text-slate-300">
              Todavía no hay votos registrados.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-black/70 border border-slate-800 px-4 sm:px-6 py-6 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2 text-left w-16">Pos.</th>
                    <th className="py-2 text-left">Jugador</th>
                    <th className="py-2 text-right w-24">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr
                      key={r.name}
                      className="border-b border-slate-900/70 last:border-b-0"
                    >
                      <td className="py-2 pr-4 text-slate-300">
                        #{idx + 1}
                      </td>
                      <td className="py-2 pr-4 text-slate-100">
                        {r.name}
                      </td>
                      <td className="py-2 text-right">
                        <span
                          className={`inline-flex items-center justify-end rounded-full px-3 py-1 text-xs font-semibold ${
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

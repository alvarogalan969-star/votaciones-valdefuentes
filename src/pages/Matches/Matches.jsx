import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabaseClient";
import { ADMIN_EMAIL } from "../../config/admin";

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // reintento rápido por si viene de magic link
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) {
          navigate("/login");
          return;
        }
      }

       let currentUser = user;

      if (!currentUser) {
       // reintento rápido por si viene de magic link
        const { data: sessionData } = await supabase.auth.getSession();
        currentUser = sessionData?.session?.user ?? null;

        if (!currentUser) {
          navigate("/login");
          return;
        }
      }

      setAuthUser(currentUser);

      const { data, error } = await supabase
        .from("matches")
        .select("id, date, rival, vote_sessions(id, opens_at, closes_at)")
        .order("date", { ascending: true });

      if (error) {
        console.error(error);
      } else {
        setMatches(data || []);
      }
      setLoading(false);
    };

    load();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-slate-100">
        <p className="text-sm text-slate-300">Cargando partidos...</p>
      </div>
    );
  }

  const isAdmin = authUser?.email === ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-black text-slate-100">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Header superior */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-red-400">
              Valdefuentes
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-white">
              Partidos
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Selecciona un partido para ver los detalles y realizar tu
              votación.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/clasificacion")}
              className="rounded-full border border-slate-700 bg-black/60 px-4 py-2 text-xs font-medium text-slate-100 hover:border-red-500 hover:bg-black/80 transition"
            >
              Ver clasificación global
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="rounded-full border border-red-600 bg-red-600/90 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 hover:border-red-500 transition"
              >
                Administración
              </button>
            )}
          </div>
        </header>

        {/* Grid de partidos */}
        {matches.length === 0 ? (
          <p className="mt-10 text-sm text-slate-300">
            No hay partidos disponibles por el momento.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => {
              const session = Array.isArray(m.vote_sessions)
                ? m.vote_sessions[0]
                : m.vote_sessions || null;

              let label = "(sin votación)";
              let statusClass =
                "bg-slate-900/70 border border-slate-700 text-slate-300";

              if (session && session.opens_at && session.closes_at) {
                const now = new Date();
                const opensAt = new Date(session.opens_at);
                const closesAt = new Date(session.closes_at);

                if (now < opensAt) {
                  label = "Votación pendiente";
                  statusClass =
                    "bg-amber-900/50 border border-amber-700 text-amber-200";
                } else if (now >= opensAt && now <= closesAt) {
                  label = "Votación abierta";
                  statusClass =
                    "bg-emerald-900/50 border border-emerald-600 text-emerald-200";
                } else if (now > closesAt) {
                  label = "Votación cerrada";
                  statusClass =
                    "bg-slate-900/70 border border-slate-600 text-slate-200";
                }
              }

              return (
                <button
                  key={m.id}
                  onClick={() => navigate(`/partidos/${m.id}`)}
                  className="group text-left rounded-2xl bg-black border border-slate-800 px-5 py-4 shadow-lg shadow-black/40 hover:border-red-500/70 hover:bg-black/80 transition flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      Partido
                    </p>
                    <span className={`text-[11px] px-2 py-1 rounded-full ${statusClass}`}>
                      {label}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white">
                      {m.rival}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{m.date}</p>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Pulsa para ver detalles
                    </span>
                    <span className="font-medium text-red-400 group-hover:text-red-300">
                      Ver partido →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// src/pages/MatchDetail/MatchDetail.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../api/supabaseClient";
import { VoteForm } from "../../components/VoteForm/VoteForm";

export default function MatchDetail() {
  const { id: matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [voterId, setVoterId] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [bestTop, setBestTop] = useState([]);
  const [worstTop, setWorstTop] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      // 1. usuario logueado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      // 2. asegurar voter en tabla voters (buscar primero por email)
      let { data: voter } = await supabase
        .from("voters")
        .select("id, email, allowed_voter_id")
        .eq("email", user.email)
        .maybeSingle();

      if (!voter) {
        // buscar en allowed_voters
        const { data: allowed } = await supabase
          .from("allowed_voters")
          .select("id")
          .eq("email", user.email)
          .eq("is_active", true)
          .maybeSingle();

        if (!allowed) {
          alert("Tu correo no está permitido para votar.");
          navigate("/login");
          return;
        }

        // crear voter
        let { data: newVoter, error: insertError } = await supabase
          .from("voters")
          .insert({
            auth_user_id: user.id,
            email: user.email,
            allowed_voter_id: allowed.id,
          })
          .select("id, email, allowed_voter_id")
          .maybeSingle();

        if (insertError) {
          // Si ya existe por email, lo leemos y seguimos
          if (insertError.code === "23505") {
            const { data: existing } = await supabase
              .from("voters")
              .select("id, email, allowed_voter_id")
              .eq("email", user.email)
              .maybeSingle();

            if (!existing) {
              alert("Error creando el votante (conflicto de email).");
              return;
            }

            voter = existing;
          } else {
            console.error(insertError);
            alert("Error creando el votante.");
            return;
          }
        } else {
          voter = newVoter;
        }
      }

      setVoterId(voter.id);

      // 3. partido
      const { data: matchData } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();
      setMatch(matchData);

      // 4. sesión de voto
      const { data: sessionData } = await supabase
        .from("vote_sessions")
        .select("*")
        .eq("match_id", matchId)
        .maybeSingle();
      setSession(sessionData);

      if (!sessionData) {
        setSession(null);
        setHasVoted(false);
        setLoading(false);
        return;
      }

      // 5. jugadores
      const { data: playersData } = await supabase
        .from("players")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      setPlayers(playersData || []);

      // 6. comprobar si ya ha votado
      const { data: voteCheck } = await supabase
        .from("votes")
        .select("id")
        .eq("vote_session_id", sessionData.id)
        .eq("voter_id", voter.id)
        .limit(1);

      setHasVoted(voteCheck && voteCheck.length > 0);

      // 7. si la votación está cerrada (por fecha), cargar ranking
      const now = new Date();
      const opensAt = sessionData.opens_at
        ? new Date(sessionData.opens_at)
        : null;
      const closesAt = sessionData.closes_at
        ? new Date(sessionData.closes_at)
        : null;

      const isClosedByTime =
        opensAt && closesAt ? now > closesAt : false;

      if (isClosedByTime) {
        const { data: votesData } = await supabase
          .from("votes")
          .select("player_id, type, points, players(name)")
          .eq("vote_session_id", sessionData.id);

        if (votesData) {
          const totalsMap = new Map(); // player_id -> { name, total }

          for (const v of votesData) {
            const key = v.player_id;
            const name = v.players?.name || "Desconocido";

            // Si tus "worst" ya guardan points en negativo, esto suma bien.
            // Si los "worst" se guardan en positivo, los convertimos a negativo:
            const signedPoints = v.type === "worst" ? -Math.abs(v.points) : v.points;

            const prev = totalsMap.get(key)?.total || 0;
            totalsMap.set(key, { name, total: prev + signedPoints });
          }

          const totalsArr = Array.from(totalsMap.values());

          const bestArr = [...totalsArr].sort((a, b) => b.total - a.total);
          const worstArr = [...totalsArr].sort((a, b) => a.total - b.total);

          setBestTop(bestArr.slice(0, 3).map(x => ({ name: x.name, points: x.total })));
          setWorstTop(worstArr.slice(0, 3).map(x => ({ name: x.name, points: x.total })));
        }
      }

      setLoading(false);
    };

    load();
  }, [matchId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-slate-950 to-red-700 text-slate-100">
        <p className="text-sm text-slate-300">Cargando partido...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-slate-950 to-red-700 text-slate-100">
        <div className="mx-auto max-w-md px-4 text-center">
          <p className="text-sm text-slate-200 mb-4">
            Partido no encontrado.
          </p>
          <button
            onClick={() => navigate("/partidos")}
            className="inline-flex items-center text-xs font-medium text-red-300 hover:text-red-200"
          >
            ← Volver a partidos
          </button>
        </div>
      </div>
    );
  }

  // Si no hay sesión
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-red-700 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <div className="mb-6">
            <button
              onClick={() => navigate("/partidos")}
              className="inline-flex items-center text-xs font-medium text-slate-300 hover:text-white"
            >
              ← Volver a partidos
            </button>
          </div>

          <div className="rounded-2xl bg-black/70 border border-slate-800 px-6 py-6 shadow-xl">
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">
              Partido: {match.date} — {match.rival}
            </h2>
            <p className="text-sm text-slate-300 mt-3">
              Este partido no tiene votación configurada.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Estados de votación
  const now = new Date();
  const opensAt = session.opens_at ? new Date(session.opens_at) : null;
  const closesAt = session.closes_at ? new Date(session.closes_at) : null;

  const isPending = opensAt && closesAt ? now < opensAt : false;
  const isOpen = opensAt && closesAt ? now >= opensAt && now <= closesAt : false;
  const isClosed = opensAt && closesAt ? now > closesAt : false;

  let statusLabel = "Sin estado";
  let statusClass =
    "bg-slate-900/70 border border-slate-700 text-slate-300";

  if (isPending) {
    statusLabel = "Votación pendiente";
    statusClass =
      "bg-amber-900/50 border border-amber-700 text-amber-200";
  } else if (isOpen) {
    statusLabel = "Votación abierta";
    statusClass =
      "bg-emerald-900/50 border border-emerald-600 text-emerald-200";
  } else if (isClosed) {
    statusLabel = "Votación cerrada";
    statusClass =
      "bg-slate-900/70 border border-slate-600 text-slate-200";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-red-700 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Barra superior */}
        <div className="flex items-center justify-between gap-3 mb-8">
          <button
            onClick={() => navigate("/partidos")}
            className="inline-flex items-center text-xs font-medium text-slate-300 hover:text-white"
          >
            ← Volver a partidos
          </button>
          <button
            onClick={() => navigate("/clasificacion")}
            className="rounded-full border border-slate-700 bg-black/60 px-4 py-2 text-xs font-medium text-slate-100 hover:border-red-500 hover:bg-black/80 transition"
          >
            Ver clasificación global
          </button>
        </div>

        {/* Cabecera */}
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-red-400">
            Valdefuentes
          </p>
          <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-white">
            Partido: {match.date} — {match.rival}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <span className={`px-3 py-1 rounded-full ${statusClass}`}>
              {statusLabel}
            </span>
          </div>
        </header>

        {/* Contenido según estado */}
        {isPending && (
          <div className="rounded-2xl bg-black/70 border border-slate-800 px-6 py-6 shadow-xl">
            <p className="text-sm text-slate-300">
              La votación todavía no está abierta.
            </p>
          </div>
        )}

        {isOpen && (
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            {/* Info partido */}
            <section className="rounded-2xl bg-black/70 border border-slate-800 px-6 py-6 shadow-xl">
              <h2 className="text-sm font-semibold text-white mb-4">
                Detalles del partido
              </h2>
              <p className="text-sm text-slate-300">
                Rival:{" "}
                <span className="font-medium text-white">
                  {match.rival}
                </span>
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Fecha:{" "}
                <span className="font-medium text-white">
                  {match.date}
                </span>
              </p>
            </section>

            {/* Formulario / mensaje */}
            <section className="rounded-2xl bg-black/70 border border-slate-800 px-6 py-8 shadow-xl">
              <h2 className="text-base font-semibold text-white mb-5">
                Tu votación
              </h2>

              {hasVoted ? (
                <p className="text-sm text-slate-300">
                  Ya has enviado tus votos para este partido.
                </p>
              ) : (
                <VoteForm
                  players={players}
                  sessionId={session.id}
                  voterId={voterId}
                  onSuccess={() => navigate(`/partidos/${matchId}/gracias`)}
                />
              )}
            </section>
          </div>
        )}

        {isClosed && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-black/70 border border-slate-800 px-6 py-6 shadow-xl">
              <p className="text-sm text-slate-300">
                La votación está cerrada.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Top mejores */}
              <section className="rounded-2xl bg-black/70 border border-slate-800 px-6 py-6 shadow-xl">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Top 3 mejores
                </h3>
                {bestTop.length === 0 ? (
                  <p className="text-sm text-slate-300">No hay votos.</p>
                ) : (
                  <ol className="space-y-2 text-sm">
                    {bestTop.map((p, idx) => (
                      <li
                        key={p.name}
                        className="flex items-center justify-between text-slate-200"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-4">
                            #{idx + 1}
                          </span>
                          {p.name}
                        </span>
                        <span className="text-xs font-medium text-emerald-300">
                          {p.points} pts
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              {/* Top peores */}
              <section className="rounded-2xl bg-black/70 border border-slate-800 px-6 py-6 shadow-xl">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Top 3 peores
                </h3>
                {worstTop.length === 0 ? (
                  <p className="text-sm text-slate-300">No hay votos.</p>
                ) : (
                  <ol className="space-y-2 text-sm">
                    {worstTop.map((p, idx) => (
                      <li
                        key={p.name}
                        className="flex items-center justify-between text-slate-200"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-4">
                            #{idx + 1}
                          </span>
                          {p.name}
                        </span>
                        <span className="text-xs font-medium text-red-300">
                          {p.points} pts
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

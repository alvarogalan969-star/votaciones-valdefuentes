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
        // No hay sesión de voto creada para este partido
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
          const bestMap = new Map();
          const worstMap = new Map();

          for (const v of votesData) {
            const key = v.player_id;
            const name = v.players?.name || "Desconocido";

            if (v.type === "best") {
              const prev = bestMap.get(key)?.points || 0;
              bestMap.set(key, { name, points: prev + v.points });
            } else if (v.type === "worst") {
              const prev = worstMap.get(key)?.points || 0;
              worstMap.set(key, { name, points: prev + v.points });
            }
          }

          const bestArr = Array.from(bestMap.values()).sort(
            (a, b) => b.points - a.points
          );

          // peores: puntos negativos → más negativo = peor
          const worstArr = Array.from(worstMap.values()).sort(
            (a, b) => a.points - b.points
          );

          setBestTop(bestArr.slice(0, 3));
          setWorstTop(worstArr.slice(0, 3));
        }
      }

      setLoading(false);
    };

    load();
  }, [matchId, navigate]);

  if (loading) return <p>Cargando...</p>;
  if (!match) return <p>Partido no encontrado</p>;

  if (!session) {
    return (
      <div>
        <h2>
          Partido: {match.date} — {match.rival}
        </h2>
        <p>Este partido no tiene votación configurada.</p>
      </div>
    );
  }

  const now = new Date();
  const opensAt = session.opens_at ? new Date(session.opens_at) : null;
  const closesAt = session.closes_at ? new Date(session.closes_at) : null;

  const isPending =
    opensAt && closesAt ? now < opensAt : false;
  const isOpen =
    opensAt && closesAt ? now >= opensAt && now <= closesAt : false;
  const isClosed =
    opensAt && closesAt ? now > closesAt : false;

  return (
    <div>
      <h2>
        Partido: {match.date} — {match.rival}
      </h2>

      {isPending && (
        <p>La votación todavía no está abierta.</p>
      )}

      {isOpen && (
        hasVoted ? (
          <p>Ya has enviado tus votos para este partido.</p>
        ) : (
          <VoteForm
            players={players}
            sessionId={session.id}
            voterId={voterId}
            onSuccess={() => navigate(`/partidos/${matchId}/gracias`)}
          />
        )
      )}

      {isClosed && (
        <>
          <p>La votación está cerrada.</p>

          <h3>Top 3 mejores</h3>
          {bestTop.length === 0 ? (
            <p>No hay votos.</p>
          ) : (
            <ol>
              {bestTop.map((p) => (
                <li key={p.name}>
                  {p.name} — {p.points} pts
                </li>
              ))}
            </ol>
          )}

          <h3>Top 3 peores</h3>
          {worstTop.length === 0 ? (
            <p>No hay votos.</p>
          ) : (
            <ol>
              {worstTop.map((p) => (
                <li key={p.name}>
                  {p.name} — {p.points} pts
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}

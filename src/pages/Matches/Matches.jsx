import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabaseClient";

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      // comprobar usuario logueado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // cargar partidos + sesión de voto
      const { data, error } = await supabase
        .from("matches")
        .select("id, date, rival, vote_sessions(id, opens_at, closes_at)")
        .order("date", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setMatches(data || []);
      }
      setLoading(false);
    };

    load();
  }, [navigate]);

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <button onClick={() => navigate("/admin")}>
        Administración
      </button>
      <button onClick={() => navigate("/clasificacion")}>
        Ver clasificación global
      </button>
      <h2>Partidos</h2>
      <ul>
        {matches.map((m) => {
          const session = Array.isArray(m.vote_sessions)
            ? m.vote_sessions[0]
            : m.vote_sessions || null;

          let label = "(sin votación)";

          if (session && session.opens_at && session.closes_at) {
            const now = new Date();
            const opensAt = new Date(session.opens_at);
            const closesAt = new Date(session.closes_at);

            if (now < opensAt) label = "(votación pendiente)";
            else if (now >= opensAt && now <= closesAt) label = "(votación abierta)";
            else if (now > closesAt) label = "(votación cerrada)";
          }

          return (
            <li key={m.id}>
              <button onClick={() => navigate(`/partidos/${m.id}`)}>
                {m.date} — {m.rival} {label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

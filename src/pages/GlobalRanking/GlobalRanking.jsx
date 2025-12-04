import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabaseClient";

export default function GlobalRanking() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      // comprobar login
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      // cargar todos los votos con el nombre del jugador
      const { data: votes, error } = await supabase
        .from("votes")
        .select("player_id, points, players(name)");

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      // agrupar por jugador
      const map = new Map();

      for (const v of votes || []) {
        const key = v.player_id;
        const name = v.players?.name || "Desconocido";
        const prev = map.get(key) || { name, total: 0 };

        map.set(key, {
          name,
          total: prev.total + v.points, // incluye mejores (+) y peores (-)
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

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h2>Clasificación global</h2>

      {rows.length === 0 ? (
        <p>Todavía no hay votos.</p>
      ) : (
        <ol>
          {rows.map((r) => (
            <li key={r.name}>
              {r.name} — {r.total} pts
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

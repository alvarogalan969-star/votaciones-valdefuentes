import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabaseClient";

const ADMIN_EMAIL = "alvarogalan969@gmail.com";

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("matches");
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);

  // datos
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [voters, setVoters] = useState([]);

  // formularios
  const [newMatch, setNewMatch] = useState({ date: "", rival: "" });
  const [newPlayer, setNewPlayer] = useState({ name: "", dorsal: "" });
  const [newAllowed, setNewAllowed] = useState({ player_name: "", email: "" });

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      if (user.email !== ADMIN_EMAIL) {
        alert("No tienes acceso a la administración.");
        navigate("/partidos");
        return;
      }

      setAuthUser(user);

      // cargar datos básicos
      const [matchesRes, playersRes, allowedRes] = await Promise.all([
        supabase
          .from("matches")
          .select("id, date, rival, vote_sessions(id, opens_at, closes_at)")
          .order("date", { ascending: false }),
        supabase
          .from("players")
          .select("*")
          .order("name", { ascending: true }),
        supabase
          .from("allowed_voters")
          .select("*")
          .order("player_name", { ascending: true }),
      ]);

      setMatches(matchesRes.data || []);
      setPlayers(playersRes.data || []);
      setVoters(allowedRes.data || []);

      setLoading(false);
    };

    load();
  }, [navigate]);

  const reloadMatches = async () => {
    const { data } = await supabase
      .from("matches")
      .select("id, date, rival, vote_sessions(id, opens_at, closes_at)")
      .order("date", { ascending: false });
    setMatches(data || []);
  };

  const reloadPlayers = async () => {
    const { data } = await supabase
      .from("players")
      .select("*")
      .order("name", { ascending: true });
    setPlayers(data || []);
  };

  const reloadAllowed = async () => {
    const { data } = await supabase
      .from("allowed_voters")
      .select("*")
      .order("player_name", { ascending: true });
    setVoters(data || []);
  };

  // crear partido (el trigger en BBDD crea vote_session solo)
  const handleCreateMatch = async (e) => {
    e.preventDefault();
    if (!newMatch.date || !newMatch.rival) return;

    const { error } = await supabase.from("matches").insert({
      date: newMatch.date,
      rival: newMatch.rival,
    });

    if (error) {
      alert("Error creando partido: " + error.message);
      return;
    }

    setNewMatch({ date: "", rival: "" });
    await reloadMatches();
  };

  // crear jugador
  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    if (!newPlayer.name) return;

    const dorsalNum = newPlayer.dorsal
      ? parseInt(newPlayer.dorsal, 10)
      : null;

    const { error } = await supabase.from("players").insert({
      name: newPlayer.name,
      dorsal: dorsalNum,
      is_active: true,
    });

    if (error) {
      alert("Error creando jugador: " + error.message);
      return;
    }

    setNewPlayer({ name: "", dorsal: "" });
    await reloadPlayers();
  };

  // crear correo permitido
  const handleCreateAllowed = async (e) => {
    e.preventDefault();
    if (!newAllowed.player_name || !newAllowed.email) return;

    const { error } = await supabase.from("allowed_voters").insert({
      player_name: newAllowed.player_name,
      email: newAllowed.email,
      is_active: true,
    });

    if (error) {
      alert("Error creando correo permitido: " + error.message);
      return;
    }

    setNewAllowed({ player_name: "", email: "" });
    await reloadAllowed();
  };

  if (loading) return <p>Cargando admin...</p>;
  if (!authUser) return null;

  return (
    <div>
      <h2>Administración</h2>
      <p>Has iniciado sesión como {authUser.email}</p>

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => setTab("matches")}>Partidos</button>
        <button onClick={() => setTab("players")}>Jugadores</button>
        <button onClick={() => setTab("allowed")}>Correos permitidos</button>
      </div>

      {tab === "matches" && (
        <div>
          <h3>Partidos</h3>

          <form onSubmit={handleCreateMatch}>
            <div>
              <label>
                Fecha:
                <input
                  type="date"
                  value={newMatch.date}
                  onChange={(e) =>
                    setNewMatch((m) => ({ ...m, date: e.target.value }))
                  }
                />
              </label>
            </div>
            <div>
              <label>
                Rival:
                <input
                  type="text"
                  value={newMatch.rival}
                  onChange={(e) =>
                    setNewMatch((m) => ({ ...m, rival: e.target.value }))
                  }
                />
              </label>
            </div>
            <button type="submit">Crear partido</button>
          </form>

          <h4>Listado</h4>
          <ul>
            {matches.map((m) => {
              const session =
                Array.isArray(m.vote_sessions) && m.vote_sessions.length > 0
                  ? m.vote_sessions[0]
                  : m.vote_sessions || null;

              let estado = "sin votación";
              if (session && session.opens_at && session.closes_at) {
                const now = new Date();
                const opensAt = new Date(session.opens_at);
                const closesAt = new Date(session.closes_at);

                if (now < opensAt) estado = "pendiente";
                else if (now >= opensAt && now <= closesAt) estado = "abierta";
                else if (now > closesAt) estado = "cerrada";
              }

              return (
                <li key={m.id}>
                  {m.date} — {m.rival} ({estado})
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {tab === "players" && (
        <div>
          <h3>Jugadores</h3>

          <form onSubmit={handleCreatePlayer}>
            <div>
              <label>
                Nombre:
                <input
                  type="text"
                  value={newPlayer.name}
                  onChange={(e) =>
                    setNewPlayer((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </label>
            </div>
            <div>
              <label>
                Dorsal:
                <input
                  type="number"
                  value={newPlayer.dorsal}
                  onChange={(e) =>
                    setNewPlayer((p) => ({ ...p, dorsal: e.target.value }))
                  }
                />
              </label>
            </div>
            <button type="submit">Crear jugador</button>
          </form>

          <h4>Listado</h4>
          <ul>
            {players.map((p) => (
              <li key={p.id}>
                #{p.dorsal ?? "-"} — {p.name}{" "}
                {p.is_active ? "(activo)" : "(inactivo)"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "allowed" && (
        <div>
          <h3>Correos permitidos</h3>

          <form onSubmit={handleCreateAllowed}>
            <div>
              <label>
                Nombre:
                <input
                  type="text"
                  value={newAllowed.player_name}
                  onChange={(e) =>
                    setNewAllowed((a) => ({
                      ...a,
                      player_name: e.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <div>
              <label>
                Email:
                <input
                  type="email"
                  value={newAllowed.email}
                  onChange={(e) =>
                    setNewAllowed((a) => ({ ...a, email: e.target.value }))
                  }
                />
              </label>
            </div>
            <button type="submit">Añadir correo permitido</button>
          </form>

          <h4>Listado</h4>
          <ul>
            {voters.map((v) => (
              <li key={v.id}>
                {v.player_name} — {v.email}{" "}
                {v.is_active ? "(activo)" : "(inactivo)"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

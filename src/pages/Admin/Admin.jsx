import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabaseClient";
import { ADMIN_EMAIL } from "../../config/admin";

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

  // crear partido
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-slate-950 to-red-700 text-slate-100">
        <p className="text-sm text-slate-300">Cargando panel de administración...</p>
      </div>
    );
  }

  if (!authUser) return null;

  const tabButtonBase =
    "px-4 py-2 text-xs font-medium rounded-full transition";
  const tabButtonActive =
    "bg-red-600 text-white shadow-md shadow-red-900/40";
  const tabButtonInactive =
    "bg-transparent text-slate-300 hover:text-white";

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-red-700 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-red-400">
              Panel admin
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-white">
              Administración
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-300">
              Has iniciado sesión como{" "}
              <span className="font-medium text-white">{authUser.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/partidos")}
              className="text-xs font-medium text-slate-300 hover:text-white"
            >
              ← Volver a partidos
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="inline-flex rounded-full bg-black/60 border-none gap-4 p-1">
            <button
              onClick={() => setTab("matches")}
              className={`${tabButtonBase} ${
                tab === "matches" ? tabButtonActive : tabButtonInactive
              }`}
            >
              Partidos
            </button>
            <button
              onClick={() => setTab("players")}
              className={`${tabButtonBase} ${
                tab === "players" ? tabButtonActive : tabButtonInactive
              }`}
            >
              Jugadores
            </button>
            <button
              onClick={() => setTab("allowed")}
              className={`${tabButtonBase} ${
                tab === "allowed" ? tabButtonActive : tabButtonInactive
              }`}
            >
              Correos permitidos
            </button>
          </div>
        </div>

        {/* CONTENIDOS */}
        {tab === "matches" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
            {/* Crear partido */}
            <section className="rounded-2xl bg-black/70 border border-slate-800 px-6 py-6 shadow-xl">
              <h3 className="text-sm font-semibold text-white mb-4">
                Crear partido
              </h3>
              <form onSubmit={handleCreateMatch} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={newMatch.date}
                    onChange={(e) =>
                      setNewMatch((m) => ({ ...m, date: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Rival
                  </label>
                  <input
                    type="text"
                    value={newMatch.rival}
                    onChange={(e) =>
                      setNewMatch((m) => ({ ...m, rival: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-red-900/40 hover:bg-red-500"
                >
                  Crear partido
                </button>
              </form>
            </section>

            {/* Listado partidos */}
            <section className="rounded-2xl bg-black/70 border border-slate-800 px-6 py-6 shadow-xl">
              <h4 className="text-sm font-semibold text-white mb-4">
                Listado de partidos
              </h4>
              {matches.length === 0 ? (
                <p className="text-sm text-slate-300">
                  No hay partidos creados.
                </p>
              ) : (
                <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {matches.map((m) => {
                    const session =
                      Array.isArray(m.vote_sessions) &&
                      m.vote_sessions.length > 0
                        ? m.vote_sessions[0]
                        : m.vote_sessions || null;

                    let estado = "sin votación";
                    let badgeClass =
                      "bg-slate-900/70 border border-slate-700 text-slate-300";

                    if (session && session.opens_at && session.closes_at) {
                      const now = new Date();
                      const opensAt = new Date(session.opens_at);
                      const closesAt = new Date(session.closes_at);

                      if (now < opensAt) {
                        estado = "pendiente";
                        badgeClass =
                          "bg-amber-900/50 border border-amber-700 text-amber-200";
                      } else if (now >= opensAt && now <= closesAt) {
                        estado = "abierta";
                        badgeClass =
                          "bg-emerald-900/50 border border-emerald-600 text-emerald-200";
                      } else if (now > closesAt) {
                        estado = "cerrada";
                        badgeClass =
                          "bg-slate-900/80 border border-slate-600 text-slate-200";
                      }
                    }

                    return (
                      <li
                        key={m.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/50 border border-slate-800 px-4 py-3 text-xs"
                      >
                        <div className="flex flex-col">
                          <span className="text-slate-100">
                            {m.date} — {m.rival}
                          </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[11px] ${badgeClass}`}>
                          {estado}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}

        {tab === "players" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
            {/* Crear jugador */}
            <section className="rounded-2xl bg-black/70 border border-slate-800 px-6 py-6 shadow-xl">
              <h3 className="text-sm font-semibold text-white mb-4">
                Crear jugador
              </h3>
              <form onSubmit={handleCreatePlayer} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={newPlayer.name}
                    onChange={(e) =>
                      setNewPlayer((p) => ({ ...p, name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Dorsal
                  </label>
                  <input
                    type="number"
                    value={newPlayer.dorsal}
                    onChange={(e) =>
                      setNewPlayer((p) => ({ ...p, dorsal: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-red-900/40 hover:bg-red-500"
                >
                  Crear jugador
                </button>
              </form>
            </section>

            {/* Listado jugadores */}
            <section className="rounded-2xl bg-black/70 border border-slate-800 px-6 py-6 shadow-xl">
              <h4 className="text-sm font-semibold text-white mb-4">
                Listado de jugadores
              </h4>
              {players.length === 0 ? (
                <p className="text-sm text-slate-300">
                  No hay jugadores creados.
                </p>
              ) : (
                <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1 text-xs">
                  {players.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/50 border border-slate-800 px-4 py-3"
                    >
                      <div>
                        <span className="text-slate-100">
                          #{p.dorsal ?? "-"} — {p.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {p.is_active ? "activo" : "inactivo"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {tab === "allowed" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
            {/* Crear correo permitido */}
            <section className="rounded-2xl bg-black/70 border border-slate-800 px-6 py-6 shadow-xl">
              <h3 className="text-sm font-semibold text-white mb-4">
                Añadir correo permitido
              </h3>
              <form onSubmit={handleCreateAllowed} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={newAllowed.player_name}
                    onChange={(e) =>
                      setNewAllowed((a) => ({
                        ...a,
                        player_name: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newAllowed.email}
                    onChange={(e) =>
                      setNewAllowed((a) => ({ ...a, email: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-red-900/40 hover:bg-red-500"
                >
                  Añadir correo permitido
                </button>
              </form>
            </section>

            {/* Listado correos permitidos */}
            <section className="rounded-2xl bg-black/70 border border-slate-800 px-6 py-6 shadow-xl">
              <h4 className="text-sm font-semibold text-white mb-4">
                Listado de correos permitidos
              </h4>
              {voters.length === 0 ? (
                <p className="text-sm text-slate-300">
                  No hay correos configurados.
                </p>
              ) : (
                <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1 text-xs">
                  {voters.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/50 border border-slate-800 px-4 py-3"
                    >
                      <div className="flex flex-col">
                        <span className="text-slate-100">
                          {v.player_name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {v.email}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {v.is_active ? "activo" : "inactivo"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

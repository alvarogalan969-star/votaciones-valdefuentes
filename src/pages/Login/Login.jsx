// src/pages/Login/Login.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) navigate("/partidos");
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "http://localhost:5173/partidos",
      },
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-red-700 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex items-center justify-center py-10">
          <div className="w-full max-w-md rounded-2xl bg-black/70 border border-slate-800 px-8 py-10 shadow-2xl backdrop-blur">
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
              Revisa tu correo
            </h2>
            <p className="text-sm md:text-base text-slate-300">
              Te hemos enviado un enlace de acceso. Ábrelo desde este dispositivo
              para entrar a las votaciones.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center bg-gradient-to-br from-black via-slate-950 to-red-700 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Columna izquierda (solo se ve en md+) */}
          <div className="hidden md:flex flex-col gap-4">
            <p className="text-xs uppercase tracking-[0.35em] text-red-400">
              Valdefuentes
            </p>
            <h1 className="text-3xl lg:text-4xl font-semibold text-white">
              Votaciones del club
            </h1>
            <p className="text-sm lg:text-base text-slate-300 max-w-md">
              Accede con tu correo autorizado para participar en las votaciones
              oficiales del club. El sistema es seguro y cada voto cuenta.
            </p>
          </div>

          {/* Columna derecha: tarjeta de login */}
          <div className="w-full">
            <div className="w-full max-w-md ml-auto mr-auto md:mr-0 rounded-2xl bg-black/70 border border-slate-800 px-6 sm:px-8 py-8 sm:py-10 shadow-2xl backdrop-blur">
              {/* Header (visible en móvil dentro de la tarjeta) */}
              <header className="mb-8 md:mb-6 md:hidden">
                <p className="text-xs uppercase tracking-[0.25em] text-red-400">
                  Valdefuentes
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">
                  Accede a las votaciones
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  Introduce tu correo y te enviaremos un enlace seguro para
                  participar.
                </p>
              </header>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-200 mb-2"
                  >
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-600/70 transition"
                  />
                </div>

                {errorMsg && (
                  <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-md px-3 py-2">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-red-600 py-3 text-sm font-semibold text-white tracking-wide shadow-lg shadow-red-900/40 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black transition"
                >
                  Enviar enlace de acceso
                </button>
              </form>

              <p className="mt-6 text-[11px] text-slate-500 text-center leading-relaxed">
                Solo se permiten correos autorizados por el club. Si tienes
                problemas para acceder, contacta con la organización.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        // Intercambiar el código/token del magic link por una sesión
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (error) {
          console.error(error);
          setErrorMsg("No se ha podido completar el inicio de sesión.");
          return;
        }

        // En este punto Supabase ya debería haber guardado la sesión en localStorage
        navigate("/partidos", { replace: true });
      } catch (err) {
        console.error(err);
        setErrorMsg("Ha ocurrido un error inesperado.");
      }
    };

    run();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-slate-950 to-red-700 text-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-black/70 border border-slate-800 px-8 py-10 shadow-2xl backdrop-blur text-center">
        <h1 className="text-2xl font-semibold text-white mb-3">
          Completando acceso…
        </h1>
        {!errorMsg ? (
          <p className="text-sm text-slate-300">
            Estamos validando tu enlace de acceso. Un momento…
          </p>
        ) : (
          <>
            <p className="text-sm text-red-300 mb-4">{errorMsg}</p>
            <button
              onClick={() => navigate("/login")}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
            >
              Volver al inicio de sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
}

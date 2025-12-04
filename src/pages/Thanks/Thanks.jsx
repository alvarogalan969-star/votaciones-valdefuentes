import { useNavigate, useParams } from "react-router-dom";

export default function Thanks() {
  const navigate = useNavigate();
  const { id: matchId } = useParams();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-slate-950 to-red-700 text-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-black/70 border border-slate-800 px-8 py-10 shadow-2xl backdrop-blur text-center">

        <h2 className="text-2xl font-semibold text-white mb-3">
          ¡Gracias por votar!
        </h2>

        <p className="text-sm text-slate-300 mb-8">
          Tu voto se ha registrado correctamente.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/partidos")}
            className="w-full rounded-lg bg-red-600 py-3 text-sm font-semibold text-white tracking-wide shadow-md hover:bg-red-500 transition"
          >
            Volver a la lista de partidos
          </button>

          <button
            onClick={() => navigate(`/partidos/${matchId}`)}
            className="w-full rounded-lg border border-slate-700 bg-black/60 py-3 text-sm font-medium text-slate-100 hover:border-red-500 hover:bg-black/80 transition"
          >
            Ver partido
          </button>
        </div>
      </div>
    </div>
  );
}

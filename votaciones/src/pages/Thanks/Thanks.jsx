import { useNavigate, useParams } from "react-router-dom";

export default function Thanks() {
  const navigate = useNavigate();
  const { id: matchId } = useParams();

  return (
    <div>
      <h2>¡Gracias por votar!</h2>
      <p>Tu voto se ha registrado correctamente.</p>

      <button onClick={() => navigate("/partidos")}>
        Volver a la lista de partidos
      </button>

      <button onClick={() => navigate(`/partidos/${matchId}`)}>
        Ver partido
      </button>
    </div>
  );
}

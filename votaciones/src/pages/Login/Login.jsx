import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // si ya estoy logueado, mando a /partidos
  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      console.log("getUser =>", data, error); // 👈 añade esto
      if (data.user) navigate("/partidos");
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "http://localhost:5173/partidos", // 👈 EXACTO
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
      <div>
        <h2>Revisa tu correo</h2>
        <p>Te hemos enviado un enlace de acceso.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Entrar</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="tu correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit">Enviar enlace</button>
      </form>

      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
    </div>
  );
}

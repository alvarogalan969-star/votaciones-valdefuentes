import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login/Login.jsx";
import Matches from "./pages/Matches/Matches.jsx";
import MatchDetail from "./pages/MatchDetail/MatchDetail.jsx";
import Thanks from "./pages/Thanks/Thanks.jsx";
import GlobalRanking from "./pages/GlobalRanking/GlobalRanking.jsx";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/partidos" element={<Matches />} />
        <Route path="/partidos/:id" element={<MatchDetail />} />
        <Route path="*" element={<Navigate to="/partidos" />} />
        <Route path="/partidos/:id/gracias" element={<Thanks />} />
        <Route path="/clasificacion" element={<GlobalRanking />} />
      </Routes>
    </BrowserRouter>
  );
}

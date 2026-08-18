import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { getSessionKind } from "./lib/session";

function StartRoute() {
  return <Navigate to={getSessionKind() === "none" ? "/login" : "/home"} replace />;
}

function App() {
  return (
    <Router>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Routes>
        <Route path="/" element={<StartRoute />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

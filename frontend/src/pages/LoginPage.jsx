import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  async function handleLogin() {
    // If admin, call backend auth
    if (username.trim().toLowerCase() === "admin") {
      try {
        await login(username.trim(), password);
        navigate("/dashboard");
      } catch (e) {
        alert("Admin pålogging mislyktes: " + (e.message || e));
      }
      return;
    }

    // For normal users: create or fetch user on backend, then navigate to user dashboard
    try {
      const res = await fetch("/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username.trim() || "Bruker" }),
      });

      if (!res.ok) {
        const txt = await res.text();
        let errBody = null;
        try { errBody = JSON.parse(txt); } catch { errBody = txt; }
        alert("Kunne ikke opprette / hente bruker: " + (errBody?.error || errBody || res.status));
        return;
      }

      const user = await res.json();
      navigate("/dashboard-user", { state: { username: user.name, userId: user.id } });
    } catch (err) {
      console.error("Login error:", err);
      alert("Feil ved kommunikasjon med serveren. Sjekk at backend kjører.");
    }
  }

  return (
    <div className="text-center">
      <h1 className="text-4xl mt-10 font-black">Logg inn</h1>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="bg-gray-200 mt-6 text-center p-2 rounded-xl"
        type="text"
        placeholder="Brukernavn"
      /><br />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="bg-gray-200 mt-4 text-center p-2 rounded-xl"
        type="password"
        placeholder="Passord (for admin)"
      /><br />
      <button
        onClick={handleLogin}
        className="mt-6 bg-gray-200 px-5 py-3 rounded-sm hover:bg-gray-400 transition-colors"
      >
        Logg Inn
      </button>
    </div>
  );
}

export default LoginPage;

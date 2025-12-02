import { useState } from "react";

export default function AddUserForm({ onNewUser }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const [classYear, setClassYear] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Navn er påkrevd");
      return;
    }

    const payload = {
      name: name.trim(),
      role: role || "user",
      class_year: classYear || null,
      username: username || null,
      password: password || null,
      qr_code: qrCode ? qrCode : null,
    };

    setLoading(true);
    try {
      const res = await fetch("/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        let errBody = null;
        try { errBody = JSON.parse(txt); } catch { errBody = txt; }
        alert("Kunne ikke opprette bruker: " + (errBody?.error || errBody || res.status));
        return;
      }

      const data = await res.json();
      onNewUser && onNewUser(data);

      // reset
      setName("");
      setRole("user");
      setClassYear("");
      setUsername("");
      setPassword("");
      setQrCode("");
    } catch (err) {
      console.error("Error creating user:", err);
      alert("Feil ved kommunikasjon med serveren");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-800 rounded shadow-lg space-y-3 transition hover:shadow-xl">
      <h3 className="font-bold text-lg">Legg til bruker</h3>
      <input
        type="text"
        placeholder="Navn"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 rounded w-full"
        required
      />

      <div className="flex gap-2">
        <select value={role} onChange={(e) => setRole(e.target.value)} className="border p-2 rounded">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <input
          type="text"
          placeholder="Klasse / år"
          value={classYear}
          onChange={(e) => setClassYear(e.target.value)}
          className="border p-2 rounded flex-1"
        />
      </div>

      <input
        type="text"
        placeholder="Brukernavn (valgfritt)"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 rounded w-full"
      />

      <input
        type="password"
        placeholder="Passord (valgfritt)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded w-full"
      />

      <input
        type="text"
        placeholder="QR-kode (valgfritt)"
        value={qrCode}
        onChange={(e) => setQrCode(e.target.value)}
        className="border p-2 rounded w-full"
      />

      <button type="submit" disabled={loading} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-400">
        {loading ? "Lager..." : "Legg til bruker"}
      </button>
    </form>
  );
}

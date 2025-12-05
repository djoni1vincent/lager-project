import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", role: "user", class_year: "", username: "", password: "", qr_code: "" });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
          const res = await fetch(`/users/${id}`, { credentials: "include" });
        if (!res.ok) throw new Error("Kunne ikke hente bruker");
        const data = await res.json();
        setUser(data.user);
        setLoans(data.loans || []);
        setForm({
          name: data.user.name || "",
          role: data.user.role || "user",
          class_year: data.user.class_year || "",
          username: data.user.username || "",
          password: data.user.password || "",
          qr_code: data.user.qr_code || "",
        });
      } catch (err) {
        console.error(err);
        alert("Kunne ikke laste bruker. Gå tilbake til admin.");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
          const res = await fetch(`/users/${id}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
      if (!res.ok) {
        const txt = await res.text();
        let err = null;
        try { err = JSON.parse(txt); } catch { err = txt; }
        alert("Feil ved lagring: " + (err?.error || err));
        return;
      }
      const updated = await res.json();
      setUser(updated);
      alert("Bruker oppdatert");
    } catch (err) {
      console.error(err);
      alert("Feil ved kommunikasjon med serveren");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Brukerdetaljer</h1>
        <Link to="/dashboard" className="text-sm text-blue-600">Tilbake</Link>
      </div>

      {loading && <div>Laster...</div>}

      {!loading && user && (
        <div className="grid grid-cols-2 gap-6">
          <div className="p-4 bg-gray-800 rounded shadow-lg">
            <h2 className="font-semibold mb-2">Informasjon</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <input type="text" className="border p-2 rounded w-full" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <div className="flex gap-2">
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="border p-2 rounded">
                  <option value="user">Bruker</option>
                  <option value="admin">Admin</option>
                </select>
                <input type="text" placeholder="Klasse/År" value={form.class_year} onChange={e => setForm({...form, class_year: e.target.value})} className="border p-2 rounded flex-1" />
              </div>

              <input type="text" placeholder="Brukernavn" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="border p-2 rounded w-full" />
              <input type="password" placeholder="Passord" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="border p-2 rounded w-full" />
              <input type="text" placeholder="QR-kode" value={form.qr_code} onChange={e => setForm({...form, qr_code: e.target.value})} className="border p-2 rounded w-full" />

              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded">{saving ? 'Lagrer...' : 'Lagre'}</button>
                <button type="button" onClick={() => { setForm({ name: user.name || '', role: user.role || 'user', class_year: user.class_year || '', username: user.username || '', password: user.password || '', qr_code: user.qr_code || '' }); }} className="px-4 py-2 border rounded">Tilbakestill</button>
              </div>
            </form>
          </div>

          <div className="p-4 bg-gray-800 rounded shadow-lg">
            <h2 className="font-semibold mb-2">Lånehistorikk</h2>
            {loans.length === 0 ? (
              <div className="text-gray-500">Ingen lån funnet</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="p-2">Gjenstand</th>
                    <th className="p-2">Lånedato</th>
                    <th className="p-2">Til dato</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map(l => (
                    <tr key={l.loan_id} className="border-b">
                      <td className="p-2">{l.item_name || l.item_id}</td>
                      <td className="p-2">{l.loan_date || '-'}</td>
                      <td className="p-2">{l.return_date || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

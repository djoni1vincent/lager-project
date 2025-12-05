import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

export default function ItemEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      const res = await fetch(`/items/${id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) setMsg(data.error || "Mislyktes");
      else {
        setItem(data);
        setForm({
          name: data.name || "",
          description: data.description || "",
          category: data.category || "",
          location: data.location || "",
          quantity: data.quantity || 1,
          barcode: data.barcode || data.qr_code || ""
        });
      }
    } catch (e) { setMsg(String(e)); }
  }

  async function save(e) {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetch(`/items/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error || "Lagring mislyktes");
      else {
        navigate(`/items/${id}`);
      }
    } catch (e) { setMsg(String(e)); }
  }

  if (!item) return <div className="p-6">Laster...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Rediger gjenstand</h2>
        <div className="flex gap-2">
          <Link to="/inventory" className="px-3 py-1 bg-gray-200 rounded">Tilbake</Link>
          <Link to={`/items/${id}`} className="px-3 py-1 bg-blue-600 text-white rounded">Vis</Link>
        </div>
      </div>

      {msg && <div className="mb-2 text-red-600">{msg}</div>}

      <form onSubmit={save} className="space-y-3">
        <div>
          <label className="block text-sm">Navn</label>
          <input className="border p-2 w-full" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Beskrivelse</label>
          <input className="border p-2 w-full" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-sm">Kategori</label>
            <input className="border p-2 w-full" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">Plassering</label>
            <input className="border p-2 w-full" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">Antall</label>
            <input type="number" className="border p-2 w-full" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} />
          </div>
        </div>
        <div>
          <label className="block text-sm">Strekkode / QR</label>
          <input className="border p-2 w-full" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} />
        </div>
        <div>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Lagre</button>
        </div>
      </form>
    </div>
  );
}

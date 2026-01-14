import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch(`/items`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setItems(data);
    } catch (e) {
      console.error(e);
    }
  }

  const filtered = items.filter(i => !q || (i.name && i.name.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Varelager</h2>
          <p className="text-sm text-gray-500">Alle gjenstander på lageret</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard" className="px-3 py-1 bg-gray-200 rounded">Tilbake</Link>
          <Link to="/scan" className="px-3 py-1 bg-indigo-600 text-white rounded">Skanner</Link>
        </div>
      </div>

      <div className="mb-4">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Søk navn..." className="border p-2 w-full rounded" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(it => (
          <div key={it.id} className="bg-gray-800 p-4 rounded shadow-lg flex justify-between items-center transition hover:shadow-xl hover:-translate-y-1 transform">
            <div>
              <div className="font-medium">{it.name}</div>
              <div className="text-xs text-gray-500">{it.category || '-'} • {it.location || '-'}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{it.quantity}</div>
              <div className="mt-2">
                <Link to={`/items/${it.id}`} className="text-indigo-600 hover:underline">Åpne</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

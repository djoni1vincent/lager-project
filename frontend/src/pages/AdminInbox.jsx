import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function AdminInbox() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadFlags();
  }, []);

  async function loadFlags() {
    setLoading(true);
    try {
      const res = await fetch(`/flags`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setFlags(data);
      else setMsg(data.error || "Failed to load flags");
    } catch (e) {
      setMsg(String(e));
    }
    setLoading(false);
  }

  async function resolveFlag(id) {
    if (!confirm("Mark flag as resolved?")) return;
    try {
      const res = await fetch(`/flags/${id}/resolve`, { method: "PUT", credentials: "include" });
      if (!res.ok) {
        const data = await res.json();
        setMsg(data.error || "Failed to resolve");
        return;
      }
      setFlags(prev => prev.filter(f => f.id !== id));
    } catch (e) {
      setMsg(String(e));
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Admin Inbox — Flags</h2>
          <p className="text-sm text-gray-500">Reported issues from scans and users</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard" className="px-3 py-1 bg-gray-200 rounded">Back</Link>
          <button onClick={loadFlags} className="px-3 py-1 bg-indigo-600 text-white rounded">Reload</button>
        </div>
      </div>

      {msg && <div className="mb-3 text-sm text-red-600">{msg}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : flags.length === 0 ? (
        <div className="text-gray-500">No flags</div>
      ) : (
        <div className="space-y-3">
          {flags.map(f => (
            <div key={f.id} className="p-3 bg-gray-800 rounded shadow-lg flex justify-between items-start transition hover:shadow-xl">
              <div>
                <div className="text-sm text-gray-600">ID: {f.id} — {f.created_at}</div>
                <div className="font-medium">{f.description || f.message || 'No description'}</div>
                <div className="text-xs text-gray-500 mt-1">Item: {f.item_name || f.item_id || '-'} | By: {f.created_by_name || f.created_by || '-'}</div>
              </div>
              <div className="flex flex-col gap-2">
                <a href={`/items/${f.item_id}`} className="text-sm text-indigo-600 hover:underline">Open item</a>
                <button onClick={() => resolveFlag(f.id)} className="px-3 py-1 bg-green-600 text-white rounded">Resolve</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

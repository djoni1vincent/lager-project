import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Offentlig gjenstandsside: detaljer, historikk og mulighet til å låne gjenstand med brukerstrekkode.
export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isUser, user } = useAuth();
  const [item, setItem] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    loadItem();
  }, [id]);

  async function loadItem() {
    try {
      const res = await fetch(`/items/${id}`);
      const data = await res.json();
      if (!res.ok) setMsg(data.error || "Kunne ikke laste gjenstand");
      else {
        setItem(data);
        setMsg("");
      }
    } catch (e) {
      setMsg(String(e));
    }
  }

  async function handleTakeItem() {
    if (!item) return;

    // If user not logged in, redirect to login
    if (!isUser) {
      if (window.confirm("Du må logge inn for å låne gjenstander. Gå til innloggingssiden?")) {
        navigate('/user/login');
      }
      return;
    }

    // If no due date set, set default (next week)
    if (!dueDate) {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      setDueDate(nextWeek.toISOString().split('T')[0]);
      return; // Will retry on next click
    }

    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          item_id: item.id,
          due_date: dueDate.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Kunne ikke låne gjenstand");
      } else {
        setMsg(`Gjenstand lånt til ${dueDate}`);
        setDueDate("");
        await loadItem();
      }
    } catch (e) {
      setMsg(String(e));
    } finally {
      setLoading(false);
    }
  }

  if (!item) return <div className="p-6 text-slate-200">Laster...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto text-slate-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">{item.name}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 text-sm"
          >
            ← Tilbake
          </button>
          <Link
            to="/scan"
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm"
          >
            📷 Åpne skanner
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-xl border border-slate-700/50 shadow-lg">
          <h4 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wide">Informasjon</h4>
          <div className="space-y-3">
            {item.barcode && (
              <div>
                <div className="text-xs text-slate-500 mb-1.5">Strekkode</div>
                <div className="flex items-center gap-2">
                  <code className="text-base font-mono bg-slate-900/70 px-3 py-2 rounded-lg border border-slate-700 text-emerald-300 font-semibold tracking-wider flex-1">
                    {item.barcode}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(item.barcode);
                      alert('Strekkode kopiert!');
                    }}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition text-sm"
                    title="Kopier strekkode"
                  >
                    📋
                  </button>
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-slate-500 mb-1.5">Kategori</div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                {item.category || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1.5">Plassering</div>
              <div className="text-white font-medium">📍 {item.location || "—"}</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-xl border border-slate-700/50 shadow-lg">
          <h4 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wide">Lager</h4>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-500 mb-1.5">Antall tilgjengelig</div>
              <div className="flex items-center gap-2">
                <div className={`text-3xl font-bold ${
                  item.quantity > 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {item.quantity}
                </div>
                <span className="text-slate-300">stk</span>
              </div>
            </div>
            {item.due_date && (
              <div>
                <div className="text-xs text-slate-500 mb-1.5">Nærmeste returdato</div>
                <div className="text-orange-300 font-medium">📅 {item.due_date}</div>
              </div>
            )}
            {item.description && (
              <div className="pt-3 border-t border-slate-700/50">
                <div className="text-xs text-slate-500 mb-1.5">Beskrivelse</div>
                <div className="text-sm text-slate-300">{item.description}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {msg && (
        <div className="mb-4 text-sm text-amber-200 bg-amber-900/40 border border-amber-700 rounded px-3 py-2">
          {msg}
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-medium mb-2">Gjeldende status</h3>
        {item.active_loan ? (
          <div className="bg-sky-900/40 border border-sky-700 rounded p-3 text-sm">
            <div>
              Utlånt til: {item.active_loan.user_name || item.active_loan.user_id}
            </div>
            <div>Til: {item.active_loan.due_date || "—"}</div>
          </div>
        ) : (
          <div className="text-emerald-300 text-sm">Gjenstand er ledig</div>
        )}
      </div>

      <div className="mb-8">
        {isUser ? (
          <>
            {!item.active_loan && (
              <>
                <div className="mb-4">
                  <label className="block text-sm text-slate-300 mb-2">
                    Til når låner du gjenstanden?
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={handleTakeItem}
                  disabled={loading || !dueDate}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded text-sm font-semibold"
                >
                  {loading ? 'Behandler...' : 'Lån denne gjenstanden'}
                </button>
              </>
            )}
          </>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded p-4">
            <p className="text-slate-300 mb-3">Du må logge inn for å låne gjenstander</p>
            <button
              onClick={() => navigate('/user/login')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-semibold"
            >
              Logg inn
            </button>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-medium mb-2">Utlånshistorikk</h3>
        {item.history.length === 0 ? (
          <div className="text-slate-400 text-sm">Historikken er tom foreløpig.</div>
        ) : (
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {item.history.map((h) => (
              <li key={h.id}>
                {h.loan_date} — {h.user_name || h.user_id || "Ukjent bruker"} —{" "}
                {h.return_date ? `returnerte ${h.return_date}` : `til ${h.due_date || "—"}`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

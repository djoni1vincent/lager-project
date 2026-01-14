import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Detaljert vareside for administrator: redigering + logg over alle utlån.
export default function AdminItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loans, setLoans] = useState([]);
  const [form, setForm] = useState({
    name: '',
    barcode: '',
    category: '',
    location: '',
    description: '',
    quantity: 1,
    status: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`/admin/items/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || 'Kunne ikke laste gjenstand');
        return;
      }
      setItem(data.item);
      setLoans(data.loans || []);
      setForm({
        name: data.item.name || '',
        barcode: data.item.barcode || '',
        category: data.item.category || '',
        location: data.item.location || '',
        description: data.item.description || '',
        quantity: data.item.quantity ?? 1,
        status: data.item.status || '',
        notes: data.item.notes || ''
      });
    } catch (e) {
      setMsg(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch(`/admin/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || 'Kunne ikke lagre gjenstand');
      } else {
        setItem(data);
        setMsg('Lagret');
      }
    } catch (e) {
      setMsg(String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading && !item) {
    return <div className="text-slate-200 p-6">Laster inn...</div>;
  }

  if (!item) {
    return (
      <div className="text-slate-200 p-6">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1 bg-slate-800 border border-slate-600 rounded text-sm"
        >
          ← Tilbake
        </button>
        <div className="mt-4 text-red-300">{msg || 'Gjenstand ikke funnet'}</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">📦 {item.name}</h1>
          <p className="text-slate-400 text-sm">
            ID: {item.id} · Strekkode: {item.barcode || '—'}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/items')}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
        >
          ← Tilbake til liste
        </button>
      </div>

      {msg && (
        <div className="mb-4 text-sm text-amber-200 bg-amber-900/40 border border-amber-700 rounded px-3 py-2">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Redigeringsskjema */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Rediger gjenstand</h2>
          <form onSubmit={handleSave} className="space-y-3 text-sm">
            <div>
              <label className="block mb-1 text-slate-300">Navn</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-300">Strekkode</label>
              <input
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block mb-1 text-slate-300">Kategori</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1 text-slate-300">Plassering</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 text-slate-300">Beskrivelse</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-2">
              <div>
                <label className="block mb-1 text-slate-300">Antall</label>
                <input
                  type="number"
                  min={0}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: parseInt(e.target.value || '0', 10) })
                  }
                  className="w-24 px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1 text-slate-300">Status</label>
                <input
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  placeholder="tilgjengelig / vedlikehold / tapt..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 text-slate-300">Merknader (interne)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-semibold disabled:bg-slate-600"
              >
                {saving ? 'Lagrer...' : 'Lagre endringer'}
              </button>
            </div>
          </form>
        </div>

        {/* Лог займов */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-3">Utlånshistorikk</h2>
          {loans.length === 0 ? (
            <p className="text-slate-400 text-sm">Ingen har lånt denne gjenstanden ennå.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-700">
                    <th className="py-1 pr-2">Bruker</th>
                    <th className="py-1 pr-2">Utlånsdato</th>
                    <th className="py-1 pr-2">Til</th>
                    <th className="py-1">Retur</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((l) => (
                    <tr key={l.id} className="border-b border-slate-800">
                      <td className="py-1 pr-2">
                        {l.user_name || l.user_id || '—'}
                      </td>
                      <td className="py-1 pr-2">{l.loan_date || '—'}</td>
                      <td className="py-1 pr-2">{l.due_date || '—'}</td>
                      <td className="py-1">
                        {l.return_date ? (
                          <span className="text-emerald-300">{l.return_date}</span>
                        ) : (
                          <span className="text-amber-300">utlånt</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



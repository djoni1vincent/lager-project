import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

// Публичная страница предмета: детали, история и возможность взять предмет по штрихкоду пользователя.
export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadItem();
  }, [id]);

  async function loadItem() {
    try {
      const res = await fetch(`/items/${id}`);
      const data = await res.json();
      if (!res.ok) setMsg(data.error || "Не удалось загрузить предмет");
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
    const userBarcode = window.prompt("Штрихкод пользователя:");
    if (!userBarcode) return;
    const due = window.prompt("Дата возврата (YYYY-MM-DD):");
    if (!due) return;

    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_barcode: userBarcode.trim(),
          item_id: item.id,
          due_date: due.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Не удалось создать займ");
      } else {
        setMsg("Предмет выдан этому пользователю");
        await loadItem();
      }
    } catch (e) {
      setMsg(String(e));
    } finally {
      setLoading(false);
    }
  }

  if (!item) return <div className="p-6 text-slate-200">Загрузка...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto text-slate-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">{item.name}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 text-sm"
          >
            ← Назад
          </button>
          <Link
            to="/scan"
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm"
          >
            📷 Открыть сканер
          </Link>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 p-4 rounded border border-slate-700">
          <div>
            <strong>Штрихкод:</strong> {item.barcode || "—"}
          </div>
          <div>
            <strong>Категория:</strong> {item.category || "—"}
          </div>
          <div>
            <strong>Локация:</strong> {item.location || "—"}
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded border border-slate-700">
          <div>
            <strong>Количество:</strong>{" "}
            <span className="font-semibold">{item.quantity}</span>
          </div>
          {item.due_date && (
            <div className="mt-1 text-sm text-slate-300">
              Ближайший срок возврата: {item.due_date}
            </div>
          )}
        </div>
      </div>

      {msg && (
        <div className="mb-4 text-sm text-amber-200 bg-amber-900/40 border border-amber-700 rounded px-3 py-2">
          {msg}
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-medium mb-2">Текущий статус</h3>
        {item.active_loan ? (
          <div className="bg-sky-900/40 border border-sky-700 rounded p-3 text-sm">
            <div>
              В аренде у: {item.active_loan.user_name || item.active_loan.user_id}
            </div>
            <div>До: {item.active_loan.due_date || "—"}</div>
          </div>
        ) : (
          <div className="text-emerald-300 text-sm">Предмет свободен</div>
        )}
      </div>

      <div className="mb-8">
        <button
          onClick={handleTakeItem}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 rounded text-sm font-semibold"
        >
          Взять этот предмет по штрихкоду пользователя
        </button>
      </div>

      <div>
        <h3 className="font-medium mb-2">История займов</h3>
        {item.history.length === 0 ? (
          <div className="text-slate-400 text-sm">История пока пуста.</div>
        ) : (
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {item.history.map((h) => (
              <li key={h.id}>
                {h.loan_date} — {h.user_name || h.user_id || "Неизвестный пользователь"} —{" "}
                {h.return_date ? `вернул ${h.return_date}` : `до ${h.due_date || "—"}`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

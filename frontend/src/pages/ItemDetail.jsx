import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadItem();
  }, [id]);

  async function loadItem() {
    try {
      const res = await fetch(`/items/${id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) setMsg(data.error || "Не удалось загрузить");
      else setItem(data);
    } catch (e) {
      setMsg(String(e));
    }
  }

  if (!item) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">{item.name}</h2>
        <div className="flex gap-2">
          <Link to="/dashboard" className="px-3 py-1 bg-gray-200 rounded">Back</Link>
          <Link to="/scan" className="px-3 py-1 bg-blue-600 text-white rounded">Scan</Link>
        </div>
      </div>
      <div className="mb-4">
        <Link to={`/items/${item.id}/edit`} className="px-3 py-1 bg-yellow-500 text-white rounded">Edit Item</Link>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded shadow-lg">
          <div><strong>Категория:</strong> {item.category || '-'}</div>
          <div><strong>Локация:</strong> {item.location || '-'}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded shadow-lg">
          <div><strong>Кол-во:</strong> <span className="font-semibold">{item.quantity}</span></div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-medium">Текущий статус</h3>
        {item.active_loan ? (
          <div>
            <div>В аренде у {item.active_loan.user_name} (ID: {item.active_loan.user_id})</div>
            <div>До: {item.active_loan.due_date}</div>
          </div>
        ) : (
          <div>Доступен</div>
        )}
      </div>

      <div>
        <h3 className="font-medium mb-2">История займов</h3>
        {item.history.length === 0 ? (
          <div className="text-gray-500">Нет истории</div>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {item.history.map(h => (
              <li key={h.loan_id}>{h.loan_date} — {h.user_name || h.user_id} — {h.return_date ? `returned ${h.return_date}` : `due ${h.due_date}`}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

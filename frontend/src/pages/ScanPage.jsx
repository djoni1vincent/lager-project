import React, { useState, useEffect, useRef } from "react";

export default function ScanPage() {
  const [barcode, setBarcode] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [scannedItem, setScannedItem] = useState(null);
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleScan() {
    if (!barcode) return setMsg("Введите штрихкод или QR");
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/scan`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Ошибка сканирования");
        setLoading(false);
        return;
      }

      if (data.type === "user") {
        setCurrentUser(data.user);
        setMsg(`Пользователь: ${data.user.name} (теперь просканируйте предмет)`);
        setScannedItem(null);
        setLoan(null);
      } else if (data.type === "item") {
        setScannedItem(data.item);
        setLoan(data.loan || null);
        setMsg(`Найден предмет: ${data.item.name}`);
      } else {
        // unknown code: offer quick-create
        setMsg("Код не найден. Можно создать новый предмет.");
        setScannedItem(null);
        setLoan(null);
      }
    } catch (e) {
      setMsg(String(e));
    }
    setLoading(false);
  }

  function clearSession() {
    setCurrentUser(null);
    setScannedItem(null);
    setLoan(null);
    setMsg("");
  }

  // Initialize camera QR scanner
  useEffect(() => {
    let scanner;

    (async () => {
      try {
        // dynamic import so app doesn't fail at build time if dependency isn't installed
        const mod = await import("html5-qrcode");
        const Html5QrcodeScanner = mod.Html5QrcodeScanner || (mod.default && mod.default.Html5QrcodeScanner) || mod.default;
        if (!Html5QrcodeScanner) {
          console.warn("html5-qrcode did not export Html5QrcodeScanner");
          return;
        }

        scanner = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: 250 },
          false
        );

        const onScanSuccess = (decodedText, decodedResult) => {
          setBarcode(decodedText);
          // trigger normal scan flow
          setTimeout(() => handleScan(), 150);
        };

        const onScanFailure = (error) => {
          // ignore individual scan failures
        };

        scanner.render(onScanSuccess, onScanFailure);
      } catch (e) {
        console.warn("QR scanner init failed:", e);
      }
    })();

    return () => {
      if (scanner) {
        try { scanner.clear(); } catch (e) { /* ignore */ }
      }
    };
  }, []);

  async function doLoan() {
    if (!scannedItem) return setMsg("Сначала просканируйте предмет");
    if (!currentUser) return setMsg("Сначала просканируйте пользователя для выдачи");

    // default due: 14 days from now
    const due = new Date();
    due.setDate(due.getDate() + 14);
    const dueStr = due.toISOString().slice(0, 10);

    setLoading(true);
    try {
      const res = await fetch(`/loans`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: scannedItem.id, user_id: currentUser.id, due_date: dueStr }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Ошибка при создании займа");
      } else {
        setLoan(data);
        setMsg("Предмет выдан");
      }
    } catch (e) {
      setMsg(String(e));
    }
    setLoading(false);
  }

  async function doReturn() {
    if (!loan) return setMsg("Нет активного займа для возврата");
    setLoading(true);
    try {
      const res = await fetch(`/loans/${loan.id}/return`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUser ? currentUser.id : null }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error || "Ошибка при возврате");
      else {
        setLoan(data);
        setMsg("Предмет возвращён");
      }
    } catch (e) {
      setMsg(String(e));
    }
    setLoading(false);
  }

  async function doExtend() {
    if (!loan) return setMsg("Нет активного займа для продления");
    const newDue = prompt("Новая дата возврата (YYYY-MM-DD)", loan.due_date || "");
    if (!newDue) return;
    setLoading(true);
    try {
      const res = await fetch(`/loans/${loan.id}/extend`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ due_date: newDue, user_id: currentUser ? currentUser.id : null }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error || "Ошибка при продлении");
      else {
        setLoan(data);
        setMsg("Срок продлён");
      }
    } catch (e) {
      setMsg(String(e));
    }
    setLoading(false);
  }

  async function doFlag() {
    if (!scannedItem) return setMsg("Сначала просканируйте предмет для жалобы");
    const desc = prompt("Короткое описание проблемы");
    if (!desc) return;
    setLoading(true);
    try {
      const res = await fetch(`/flags`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: scannedItem.id, description: desc, created_by: currentUser ? currentUser.id : null }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error || "Не удалось отправить жалобу");
      else setMsg("Жалоба отправлена, админы уведомлены (если настроено)");
    } catch (e) {
      setMsg(String(e));
    }
    setLoading(false);
  }

  async function quickCreate() {
    if (!barcode) return setMsg("Введите штрихкод для нового предмета");
    const name = prompt("Название предмета", "");
    if (!name) return;
    setLoading(true);
    try {
      const res = await fetch(`/items/quick`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode, name, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error || "Не удалось создать предмет");
      else {
        setScannedItem(data);
        setMsg("Предмет создан и доступен");
      }
    } catch (e) {
      setMsg(String(e));
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mt-6 transition hover:shadow-xl">
        <h2 className="text-2xl font-semibold mb-4">Сканер</h2>

        <div id="qr-reader" className="mb-4 rounded overflow-hidden" />

        <div className="mb-4">
        <input
          className="border p-2 w-full"
          placeholder="Введите штрихкод или QR"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleScan()}
        />
        <div className="flex gap-2 mt-2">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded shadow" onClick={handleScan} disabled={loading}>
            {loading ? "..." : "Сканировать"}
          </button>
          <button className="px-4 py-2 bg-gray-100 rounded" onClick={clearSession} disabled={loading}>
            Сброс
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={quickCreate} disabled={loading}>Создать предмет</button>
        </div>
      </div>
        {msg && <div className="mb-4 text-sm text-gray-700">{msg}</div>}

        {currentUser && (
          <div className="mb-4 p-3 border rounded bg-gray-50">
            <strong>Текущий пользователь:</strong>
            <div className="font-medium">{currentUser.name} {currentUser.class ? `— ${currentUser.class}` : ""}</div>
            <div className="text-xs text-gray-500">ID: {currentUser.id}</div>
          </div>
        )}

        {scannedItem && (
          <div className="mb-4 p-3 border rounded bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-lg font-medium">{scannedItem.name}</div>
                <div className="text-xs text-gray-500">Категория: {scannedItem.category || "-"} | Кол-во: {scannedItem.quantity}</div>
              </div>
              <div className="text-right">
                <Link to={`/items/${scannedItem.id}`} className="text-indigo-600 hover:underline text-sm">Open</Link>
              </div>
            </div>

            {loan ? (
              <div className="mt-3">
                <div className="text-sm">В аренде у: {loan.user_name || loan.user_id}</div>
                <div className="text-sm">Срок до: {loan.due_date}</div>
                <div className="flex gap-2 mt-2">
                  <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={doReturn} disabled={loading}>Вернуть</button>
                  <button className="px-3 py-1 bg-yellow-500 text-white rounded" onClick={doExtend} disabled={loading}>Продлить</button>
                  <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={doFlag} disabled={loading}>Пожаловаться</button>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <div className="text-sm text-green-700">Предмет доступен</div>
                <div className="flex gap-2 mt-2">
                  <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={doLoan} disabled={loading}>Выдать</button>
                  <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={doFlag} disabled={loading}>Пожаловаться</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

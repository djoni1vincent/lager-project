import { useState } from "react";

export default function AddItemForm({ onNewItem }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [barcode, setBarcode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // if QR code is empty, send null so SQLite UNIQUE constraint on empty string
    // doesn't block future inserts (empty string may be treated as a value)
    const newItem = { name, description, location, quantity, barcode: barcode ? barcode : null };

    try {
      const res = await fetch("/admin/items", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      if (!res.ok) {
        const txt = await res.text();
        let errBody = null;
        try { errBody = JSON.parse(txt); } catch { errBody = txt; }
        console.error("Add item failed:", res.status, errBody);
        alert("Kunne ikke legge til produkt: " + (errBody?.error || errBody || res.status));
        return;
      }

      const data = await res.json();
      console.log("Added:", data);

      // Сбрасываем форму
      setName("");
      setDescription("");
      setLocation("");
      setQuantity(1);
      setBarcode("");

      // Обновляем список товаров в Dashboard — backend возвращает объект
      onNewItem && onNewItem(data);
    } catch (err) {
      console.error("Error adding item:", err);
      alert("Feil ved kommunikasjon med serveren. Sjekk at backend kjører.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-800 rounded shadow-lg space-y-3 transition hover:shadow-xl">
      <h3 className="font-bold text-lg">Legg til nytt produkt</h3>
      <input
        type="text"
        placeholder="Navn"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 rounded w-full"
        required
      />
      <input
        type="text"
        placeholder="Beskrivelse"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-2 rounded w-full"
      />
      <input
        type="text"
        placeholder="Plassering"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="border p-2 rounded w-full"
      />
      <input
        type="number"
        placeholder="Antall"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value) || 1)}
        className="border p-2 rounded w-full"
        min={1}
      />
      <input
        type="text"
        placeholder="Strekkode"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        className="border p-2 rounded w-full"
      />
      <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-400">
        Legg til
      </button>
    </form>
  );
}

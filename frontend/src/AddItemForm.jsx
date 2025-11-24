import { useState } from "react";

export default function AddItemForm({ onNewItem }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [qrCode, setQrCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newItem = { name, description, location, quantity, qr_code: qrCode };

    try {
      const res = await fetch("http://127.0.0.1:5000/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      const data = await res.json();
      console.log("Added:", data);

      // Сбрасываем форму
      setName("");
      setDescription("");
      setLocation("");
      setQuantity(1);
      setQrCode("");

      // Обновляем список товаров в Dashboard
      onNewItem && onNewItem(data);
    } catch (err) {
      console.error("Error adding item:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow space-y-3">
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
        onChange={(e) => setQuantity(e.target.value)}
        className="border p-2 rounded w-full"
        min={1}
      />
      <input
        type="text"
        placeholder="QR kode"
        value={qrCode}
        onChange={(e) => setQrCode(e.target.value)}
        className="border p-2 rounded w-full"
      />
      <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-400">
        Legg til
      </button>
    </form>
  );
}

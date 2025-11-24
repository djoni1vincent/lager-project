import { useEffect, useState } from "react";
import AddItemForm from "../AddItemForm";

export default function DashboardPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/items")
      .then(r => r.json())
      .then(data => setItems(data));
  }, []);

  const handleNewItem = (item) => {
    setItems(prev => [...prev, item]);
  };

  const deleteItem = (id) => {
    fetch(`http://127.0.0.1:5000/items/${id}`, { method: "DELETE" })
      .then(() => {
        setItems(prev => prev.filter(i => i.id !== id));
      });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Produktliste</h1>

      <AddItemForm onNewItem={handleNewItem} />

      <table className="w-full mt-6 border text-center">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-center">Navn</th>
            <th className="p-2 text-center">Plassering</th>
            <th className="p-2 text-center">Antall</th>
            <th className="p-2 text-center">Slett</th>
          </tr>
        </thead>

        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan="4" className="p-2 text-center text-gray-400">
                Ingen produkter
              </td>
            </tr>
          ) : (
            items.map(item => (
              <tr key={item.id} className="border-b">
                <td className="p-2 text-center">{item.name}</td>
                <td className="p-2 text-center">{item.location}</td>
                <td className="p-2 text-center">{item.quantity}</td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

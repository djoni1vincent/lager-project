import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function DashboardUser() {
  const location = useLocation();
  const brukernavn = location.state?.username || "Bruker";

  const [gjenstander, setGjenstander] = useState([]);

  // Henter alle produkter fra backend
  useEffect(() => {
    fetch("/items", { credentials: "include" })
      .then(r => r.json())
      .then(data => setGjenstander(data))
      .catch(err => console.error(err));
  }, []);

  // Låne et produkt
  const lånGjenstand = async (gjenstand_id) => {
    const bruker_id = prompt("Skriv inn ditt ID eller brukernavn:");
    const retur_dato = prompt("Til hvilken dato låner du gjenstanden (YYYY-MM-DD)?");

    if (!bruker_id || !retur_dato) return;

    try {
      await fetch(`/items/${gjenstand_id}/take`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: bruker_id, return_date: retur_dato })
      });

      setGjenstander(prev =>
        prev.map(p => p.id === gjenstand_id ? { ...p, quantity: p.quantity - 1 } : p)
      );
    } catch (err) {
      console.error("Feil ved lån:", err);
    }
  };

  // Levere et produkt tilbake
  const leverGjenstand = async (gjenstand_id) => {
    const bruker_id = prompt("Skriv inn ditt ID eller brukernavn:");

    if (!bruker_id) return;

    try {
      await fetch(`/items/${gjenstand_id}/return`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: bruker_id })
      });

      setGjenstander(prev =>
        prev.map(p => p.id === gjenstand_id ? { ...p, quantity: p.quantity + 1 } : p)
      );
    } catch (err) {
      console.error("Feil ved tilbakelevering:", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Velkommen, {brukernavn}</h1>
      <h2 className="text-xl mb-4">Tilgjengelige gjenstander</h2>

      <table className="w-full border text-center">
        <thead>
          <tr className="border-b">
            <th className="p-2">Navn</th>
            <th className="p-2">Plassering</th>
            <th className="p-2">Antall</th>
            <th className="p-2">Handling</th>
          </tr>
        </thead>
        <tbody>
          {gjenstander.length === 0 ? (
            <tr>
              <td colSpan="4" className="p-2 text-center text-gray-400">
                Ingen gjenstander tilgjengelig
              </td>
            </tr>
          ) : (
            gjenstander.map(p => (
              <tr key={p.id} className="border-b">
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.location}</td>
                <td className="p-2">{p.quantity}</td>
                <td className="p-2 flex gap-2 justify-center">
                  {p.quantity > 0 && (
                    <button
                      onClick={() => lånGjenstand(p.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-400"
                    >
                      Lån
                    </button>
                  )}
                  <button
                    onClick={() => leverGjenstand(p.id)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-400"
                  >
                    Lever
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

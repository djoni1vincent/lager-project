import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AddItemForm from "../AddItemForm";

export default function DashboardPage() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);

  // --- Загрузка товаров ---
  useEffect(() => {
    fetch("/items", { credentials: "include" })
      .then(r => r.json())
      .then(data => setItems(data));
  }, []);

  // --- Загрузка пользователей ---
  useEffect(() => {
    fetch("/users", { credentials: "include" })
      .then(r => r.json())
      .then(data => setUsers(data));
  }, []);

  // --- Добавление товара ---
  const handleNewItem = (item) => {
    setItems(prev => [...prev, item]);
  };

  // Note: user creation is handled on login. Admin panel shows and deletes users only.

  // --- Удаление товара ---
  const deleteItem = (id) => {
    fetch(`/items/${id}`, { method: "DELETE", credentials: "include" })
      .then(() => setItems(prev => prev.filter(i => i.id !== id)));
  };

  // --- Удаление пользователя ---
  const deleteUser = (id) => {
    fetch(`/users/${id}`, { method: "DELETE", credentials: "include" })
      .then(() => setUsers(prev => prev.filter(u => u.id !== id)));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Overview and quick actions</p>
        </div>
        <div className="flex gap-3">
          <Link to="/flags" className="px-4 py-2 bg-yellow-500 text-white rounded shadow">Inbox</Link>
          <Link to="/scan" className="px-4 py-2 bg-indigo-600 text-white rounded shadow">Scanner</Link>
          <Link to="/inventory" className="px-4 py-2 bg-gray-800 text-white rounded shadow">Inventory</Link>
        </div>
      </div>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 transition hover:shadow-xl">
          <h2 className="text-lg font-semibold mb-3">Products</h2>
          <AddItemForm onNewItem={handleNewItem} />
          <div className="mt-4 space-y-3">
            {items.length === 0 ? (
              <div className="text-gray-400">No products yet</div>
            ) : (
              items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.location || '-'} • {item.category || '-'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{item.quantity}</div>
                    <div className="mt-2 flex gap-2 justify-end">
                      <Link to={`/items/${item.id}`} className="text-sm text-indigo-600 hover:underline">Open</Link>
                      <button onClick={() => deleteItem(item.id)} className="px-3 py-1 bg-red-500 text-white rounded text-sm">Delete</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg p-4 transition hover:shadow-xl">
          <h2 className="text-lg font-semibold mb-3">Users</h2>
          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="text-gray-400">No users</div>
            ) : (
              users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <Link to={`/users/${user.id}`} className="font-medium text-indigo-600 hover:underline">{user.name}</Link>
                    <div className="text-xs text-gray-500">ID: {user.id}</div>
                  </div>
                  <div>
                    <button onClick={() => deleteUser(user.id)} className="px-3 py-1 bg-red-500 text-white rounded text-sm">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

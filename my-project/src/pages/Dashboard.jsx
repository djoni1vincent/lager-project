import { Link } from "react-router-dom";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-10 flex gap-8">
        <aside className="w-56">
          <div className="text-2xl font-bold mb-6">Hoveddashboard</div>
          <nav className="flex flex-col gap-3">
            <Link to="/dashboard" className="px-4 py-2 border rounded bg-white text-left">Dashbord</Link>
            <button className="px-4 py-2 border rounded text-left">Producter</button>
            <button className="px-4 py-2 border rounded text-left">Brukere</button>
            <button className="px-4 py-2 border rounded text-left">Logg ut</button>
          </nav>
        </aside>

        <main className="flex-1">
          <h2 className="text-3xl font-extrabold mb-4">Produktliste</h2>

          <div className="rounded-2xl bg-white border p-4 mb-6">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium pb-2 border-b mb-2">
              <div>Product</div>
              <div>Plassering</div>
              <div>Tilgjengelig</div>
              <div>Handlinger</div>
            </div>

            <div className="space-y-2">
              <div className="h-10 bg-gray-50 rounded" />
              <div className="h-10 bg-gray-50 rounded" />
              <div className="h-10 bg-gray-50 rounded" />
              <div className="h-10 bg-gray-50 rounded" />
              <div className="h-10 bg-gray-50 rounded" />
            </div>
          </div>

          <div className="rounded-xl bg-white border p-3">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium pb-2 border-b mb-2">
              <div>Product</div>
              <div>Lånes av</div>
              <div>Utlånskonto</div>
              <div>Tilbake</div>
            </div>

            <div className="h-10 bg-gray-50 rounded" />
          </div>
        </main>
      </div>
    </div>
  );
}

import { Link, Outlet } from 'react-router-dom';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">
              N
            </span>
            <span>Nexora</span>
          </Link>
          <nav aria-label="Primary Navigation" className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-slate-300 transition hover:text-white">
              Foundation Status
            </Link>
            <Link to="/architecture" className="text-slate-300 transition hover:text-white">
              Architecture Scope
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800/80 py-5 text-center text-xs text-slate-500">
        Nexora Single-Vendor Hardware E-Commerce Foundation · Modular Monolith Baseline
      </footer>
    </div>
  );
}

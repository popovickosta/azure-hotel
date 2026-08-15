export default function Navbar({ korisnik, onLogout }) {
  return (
    <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-serif font-bold text-blue-800 tracking-wide">Azure Hotel</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-base font-medium text-slate-600">Dobrodošli nazad, {korisnik.ime}!</span>
        <button
          onClick={onLogout}
          className="text-base bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 px-4 py-2 rounded-lg transition-colors"
        >
          Odjavi se
        </button>
      </div>
    </nav>
  );
}
import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function Auth({ onLogin }) {
  const [tab, setTab] = useState("prijava");
  const [loginData, setLoginData] = useState({ email: "", lozinka: "" });
  const [registerData, setRegisterData] = useState({
    ime: "",
    prezime: "",
    email: "",
    lozinka: "",
    brojTelefona: "",
    drzavaId: "",
    tipDokumenta: "",
    brojDokumenta: "",
  });
  const [drzave, setDrzave] = useState([]);
  const [greska, setGreska] = useState("");
  const [poruka, setPoruka] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get("verified");
    if (verified === "true") {
      setPoruka("Email je uspešno potvrđen. Sada možete da se prijavite.");
      setTab("prijava");
    } else if (verified === "expired") {
      setGreska("Link za verifikaciju je istekao. Unesite email i zatražite novi link.");
      setTab("prijava");
    } else if (verified === "false") {
      setGreska("Link za verifikaciju nije ispravan.");
      setTab("prijava");
    }

    if (verified) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    fetch(`${API}/api/drzave`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setDrzave(data))
      .catch(() => setGreska("Greška pri učitavanju liste država"));
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setGreska("");
    setPoruka("");
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      if (!res.ok) {
        const tekst = await res.text();
        setGreska(tekst || "Pogrešan email ili lozinka");
        return;
      }
      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("uloga", data.uloga);
      localStorage.setItem("ime", data.ime);
      onLogin(data);
    } catch {
      setGreska("Greška pri povezivanju sa serverom");
    }
  }

  async function ponovoPosaljiVerifikaciju() {
    setGreska("");
    setPoruka("");
    if (!loginData.email) {
      setGreska("Unesite email na koji želite novi verifikacioni link");
      return;
    }
    try {
      const res = await fetch(`${API}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginData.email }),
      });
      const tekst = await res.text();
      if (!res.ok) {
        setGreska(tekst || "Novi verifikacioni link nije mogao biti poslat");
        return;
      }
      setPoruka(tekst);
    } catch {
      setGreska("Greška pri povezivanju sa serverom");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setGreska("");
    setPoruka("");

    if (!registerData.drzavaId) {
      setGreska("Molimo izaberite državu");
      return;
    }
    if (!registerData.tipDokumenta || !registerData.brojDokumenta) {
      setGreska("Tip i broj dokumenta su obavezni");
      return;
    }
    if (!/^\d{9}$/.test(registerData.brojDokumenta)) {
      setGreska("Broj dokumenta mora imati tačno 9 cifara");
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...registerData,
          drzavaId: Number(registerData.drzavaId),
        }),
      });

      const tekst = await res.text();
      if (!res.ok) {
        setGreska(tekst || "Greška pri registraciji");
        return;
      }

      setPoruka(tekst || "Registracija je uspešna. Potvrdite email, pa se prijavite.");
      setLoginData({ email: registerData.email, lozinka: "" });
      setRegisterData({
        ime: "",
        prezime: "",
        email: "",
        lozinka: "",
        brojTelefona: "",
        drzavaId: "",
        tipDokumenta: "",
        brojDokumenta: "",
      });
      setTab("prijava");
    } catch {
      setGreska("Greška pri povezivanju sa serverom");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-800">Azure Hotel</h1>
          <p className="text-slate-400 text-base mt-1">Sistem za rezervacije</p>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
          <button
            onClick={() => {
              setTab("prijava");
              setGreska("");
              setPoruka("");
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "prijava"
                ? "bg-white text-blue-800 shadow"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Prijava
          </button>
          <button
            onClick={() => {
              setTab("registracija");
              setGreska("");
              setPoruka("");
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "registracija"
                ? "bg-white text-blue-800 shadow"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Registracija
          </button>
        </div>

        {poruka && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
            {poruka}
          </div>
        )}

        {greska && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {greska}
          </div>
        )}

        {tab === "prijava" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="vas@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Lozinka</label>
              <input
                type="password"
                value={loginData.lozinka}
                onChange={(e) => setLoginData({ ...loginData, lozinka: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              Prijavi se
            </button>
            <button
              type="button"
              onClick={ponovoPosaljiVerifikaciju}
              className="w-full text-blue-700 hover:text-blue-900 text-sm font-medium py-1.5"
            >
              Pošalji ponovo verifikacioni link
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Ime</label>
                <input
                  type="text"
                  value={registerData.ime}
                  onChange={(e) => setRegisterData({ ...registerData, ime: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Prezime</label>
                <input
                  type="text"
                  value={registerData.prezime}
                  onChange={(e) => setRegisterData({ ...registerData, prezime: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Lozinka</label>
              <input
                type="password"
                value={registerData.lozinka}
                onChange={(e) => setRegisterData({ ...registerData, lozinka: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Broj telefona</label>
              <input
                type="text"
                value={registerData.brojTelefona}
                onChange={(e) => setRegisterData({ ...registerData, brojTelefona: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                pattern="[0-9+ ]{6,20}"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Tip dokumenta</label>
              <select
                value={registerData.tipDokumenta}
                onChange={(e) => setRegisterData({ ...registerData, tipDokumenta: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Odaberite tip dokumenta</option>
                <option value="LICNA_KARTA">Lična karta</option>
                <option value="PASOS">Pasoš</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Broj dokumenta</label>
              <input
                type="text"
                value={registerData.brojDokumenta}
                onChange={(e) => setRegisterData({ ...registerData, brojDokumenta: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="9 cifara"
                pattern="[0-9]{9}"
                maxLength={9}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Država</label>
              <select
                value={registerData.drzavaId}
                onChange={(e) => setRegisterData({ ...registerData, drzavaId: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                required
              >
                <option value="" disabled>Izaberite državu</option>
                {drzave.map((d) => (
                  <option key={d.id} value={d.id}>{d.naziv}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              Registruj se
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

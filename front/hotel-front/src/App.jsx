import { useState } from "react";
import Auth from "./components/Auth";
import Navbar from "./components/Navbar";
import Admin from "./components/Admin";
import Gost from "./components/Gost";
import Zaposleni from "./components/Zaposleni";

function tokenJeVazeci(token) {
  try {
    const deo = token.split(".")[1];
    const base64 = deo.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return payload.exp && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default function App() {
  const [korisnik, setKorisnik] = useState(() => {
    const token = localStorage.getItem("token");
    const uloga = localStorage.getItem("uloga");
    const ime = localStorage.getItem("ime");

    if (token && uloga && tokenJeVazeci(token)) {
      return { token, uloga, ime };
    }

    localStorage.removeItem("token");
    localStorage.removeItem("uloga");
    localStorage.removeItem("ime");
    return null;
  });

  function handleLogin(data) {
    setKorisnik(data);
  }

  function handleLogout() {
    localStorage.clear();
    setKorisnik(null);
  }

  if (!korisnik) return <Auth onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar korisnik={korisnik} onLogout={handleLogout} />
      <main className="p-8">
        {korisnik.uloga === "ADMIN" && <Admin />}
        {korisnik.uloga === "ZAPOSLENI" && <Zaposleni />}
        {korisnik.uloga === "GOST" && <Gost />}
      </main>
    </div>
  );
}

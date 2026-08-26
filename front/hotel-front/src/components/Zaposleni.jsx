import { useState, useEffect } from "react";
import { formatRsd, normalizujZaPretragu, prikazNaziva } from "../utils/format";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

function authHeader() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`
  };
}

const statusBoja = {
  NA_CEKANJU: "bg-yellow-100 text-yellow-700",
  POTVRDJENA: "bg-green-100 text-green-700",
  OTKAZANA: "bg-red-100 text-red-700",
  ODBIJENA: "bg-red-100 text-red-700",
  ZAVRSENA: "bg-slate-100 text-slate-600"
};

const statusNaziv = {
  NA_CEKANJU: "Na čekanju",
  POTVRDJENA: "Potvrđena",
  OTKAZANA: "Otkazana",
  ODBIJENA: "Odbijena",
  ZAVRSENA: "Završena"
};

export default function Zaposleni() {
  const [rezervacije, setRezervacije] = useState([]);
  const [racunModal, setRacunModal] = useState(null);
  const [pretraga, setPretraga] = useState("");
  const [preuzimanjePdf, setPreuzimanjePdf] = useState(false);
  const [usluge, setUsluge] = useState([]);
  const [greska, setGreska] = useState("");
  const [strana, setStrana] = useState(0);
  const [ukupnoStrana, setUkupnoStrana] = useState(0);
  const [ukupnoElemenata, setUkupnoElemenata] = useState(0);
  const velicinaStrane = 8;
  const danas = new Date().toISOString().split("T")[0];

  useEffect(() => {
    ucitajUsluge();
  }, []);

  useEffect(() => {
    const cekanje = pretraga.trim() ? 250 : 0;
    const timer = setTimeout(() => ucitajRezervacije(), cekanje);
    return () => clearTimeout(timer);
  }, [strana, pretraga]);

  async function ucitajRezervacijeStranicu(brojStrane) {
    const res = await fetch(
      `${API}/api/rezervacije/paginirano?page=${brojStrane}&size=${velicinaStrane}`,
      { headers: authHeader() }
    );
    if (!res.ok) {
      const poruka = await res.text();
      throw new Error(poruka || "Greška pri učitavanju rezervacija");
    }
    return res.json();
  }

  async function ucitajRezervacije() {
    setGreska("");
    try {
      const globalnaPretraga = pretraga.trim().length > 0;
      const prva = await ucitajRezervacijeStranicu(globalnaPretraga ? 0 : strana);

      let sadrzaj = prva.content || [];
      if (globalnaPretraga && (prva.totalPages || 0) > 1) {
        const ostaleStrane = await Promise.all(
          Array.from({ length: prva.totalPages - 1 }, (_, i) => ucitajRezervacijeStranicu(i + 1))
        );
        sadrzaj = [
          ...sadrzaj,
          ...ostaleStrane.flatMap((stranica) => stranica.content || []),
        ];
      }

      setRezervacije(sadrzaj);
      setUkupnoStrana(prva.totalPages || 0);
      setUkupnoElemenata(prva.totalElements || 0);
    } catch (e) {
      setRezervacije([]);
      setUkupnoStrana(0);
      setUkupnoElemenata(0);
      setGreska(e.message || "Greška pri učitavanju rezervacija");
    }
  }

  async function ucitajUsluge() {
    const res = await fetch(`${API}/api/usluge`, { headers: authHeader() });
    if (res.ok) setUsluge(await res.json());
  }

  function nazivUsluge(id) {
    return prikazNaziva(usluge.find(u => u.id === Number(id))?.naziv) || "Nepoznato";
  }

  async function preuzmiPdf(racunId) {
    setPreuzimanjePdf(true);
    try {
      const res = await fetch(`${API}/api/racuni/${racunId}/pdf`, { headers: authHeader() });
      if (!res.ok) {
        const poruka = await res.text();
        alert(poruka || "Greška pri preuzimanju PDF-a");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `racun-${racunId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Greška pri preuzimanju PDF-a");
    } finally {
      setPreuzimanjePdf(false);
    }
  }

  async function promeniStatus(id, status) {
    setGreska("");
    const res = await fetch(`${API}/api/rezervacije/${id}/status`, {
      method: "PUT",
      headers: authHeader(),
      body: JSON.stringify({ status })
    });

    if (!res.ok) {
      const poruka = await res.text();
      setGreska(poruka || "Status nije moguće promeniti");
      return;
    }

    ucitajRezervacije();
  }

  async function prikaziRacun(rezervacijaId) {
    const res = await fetch(`${API}/api/racuni/rezervacija/${rezervacijaId}`, {
      headers: authHeader()
    });
    if (res.ok) {
      const data = await res.json();
      setRacunModal(data);
    } else {
      const poruka = await res.text();
      setGreska(poruka || "Račun nije dostupan");
    }
  }

  const filtrirane = rezervacije.filter(r => {
    const uslugeTekst = r.usluge
      ? Object.keys(r.usluge).map((id) => nazivUsluge(id)).join(" ")
      : "";
    const tekst = normalizujZaPretragu(
      `${JSON.stringify(r)} ${uslugeTekst} ${statusNaziv[r.status] || ""}`
    );
    return tekst.includes(normalizujZaPretragu(pretraga));
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-blue-900">Rezervacije</h2>
        <input
          type="text"
          placeholder="Pretraži rezervacije..."
          value={pretraga}
          onChange={e => { setPretraga(e.target.value); setStrana(0); }}
          className="border border-slate-200 rounded-lg px-4 py-2 text-base w-72 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {greska && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
          {greska}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filtrirane.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-base">Nema rezervacija</p>
          </div>
        ) : (
          <table className="w-full text-base">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-6 py-4 text-slate-500 font-semibold">Gost</th>
                <th className="text-left px-6 py-4 text-slate-500 font-semibold">Soba</th>
                <th className="text-left px-6 py-4 text-slate-500 font-semibold">Prijava</th>
                <th className="text-left px-6 py-4 text-slate-500 font-semibold">Odjava</th>
                <th className="text-left px-6 py-4 text-slate-500 font-semibold">Usluge</th>
                <th className="text-left px-6 py-4 text-slate-500 font-semibold">Status</th>
                <th className="text-left px-6 py-4 text-slate-500 font-semibold">Akcije</th>
              </tr>
            </thead>
            <tbody>
              {filtrirane.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  <td className="px-6 py-5 text-slate-700">
                    {r.gost?.ime} {r.gost?.prezime}
                  </td>
                  <td className="px-6 py-5 text-slate-700">Soba {r.soba?.brojSobe}</td>
                  <td className="px-6 py-5 text-slate-700">{r.datumPrijave}</td>
                  <td className="px-6 py-5 text-slate-700">{r.datumOdjave}</td>
                  <td className="px-6 py-5 text-slate-700">
                    {r.usluge && Object.keys(r.usluge).length > 0
                      ? Object.entries(r.usluge).map(([id, kol]) => `${nazivUsluge(id)} x${kol}`).join(", ")
                      : <span className="text-slate-400">—</span>
                    }
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusBoja[r.status]}`}>
                      {statusNaziv[r.status]}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-2 flex-wrap">
                      {r.status === "NA_CEKANJU" && (
                        <>
                          <button
                            onClick={() => promeniStatus(r.id, "POTVRDJENA")}
                            className="text-green-600 hover:text-green-800 text-sm font-medium px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-50 transition-colors"
                          >
                            Potvrdi
                          </button>
                          <button
                            onClick={() => promeniStatus(r.id, "ODBIJENA")}
                            className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                          >
                            Odbij
                          </button>
                        </>
                      )}
                      {r.status === "POTVRDJENA" && (
                        <button
                          onClick={() => promeniStatus(r.id, "ZAVRSENA")}
                          disabled={r.datumOdjave > danas}
                          title={r.datumOdjave > danas ? "Rezervacija se može završiti na datum odjave ili kasnije" : "Završi rezervaciju"}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Završi
                        </button>
                      )}
                      {r.status === "ZAVRSENA" && (
                        <button
                          onClick={() => prikaziRacun(r.id)}
                          className="text-slate-600 hover:text-slate-800 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          Račun
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {ukupnoStrana > 1 && !pretraga && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setStrana(p => Math.max(0, p - 1))}
            disabled={strana === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prethodna
          </button>
          <span className="text-sm text-slate-500 px-2">
            Strana {strana + 1} od {ukupnoStrana} · ukupno {ukupnoElemenata}
          </span>
          <button
            onClick={() => setStrana(p => Math.min(ukupnoStrana - 1, p + 1))}
            disabled={strana >= ukupnoStrana - 1}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sledeća
          </button>
        </div>
      )}

      {racunModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div id="racun-za-stampu" className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-blue-900">Azure Hotel</h2>
                <p className="text-sm text-slate-400">Račun br. {racunModal.id}</p>
              </div>
              <p className="text-sm text-slate-400">Datum: {racunModal.datumIzdavanja}</p>
            </div>

            <div className="border-t border-slate-100 pt-4 mb-4">
              <p className="text-sm text-slate-500 mb-1">Gost</p>
              <p className="text-base font-medium text-slate-700">
                {racunModal.rezervacija?.gost?.ime} {racunModal.rezervacija?.gost?.prezime}
              </p>
              <p className="text-sm text-slate-400">{racunModal.rezervacija?.gost?.email}</p>
            </div>

            <div className="space-y-2 mb-6">
              {racunModal.stavke?.map((s, i) => (
                <div key={i} className="flex justify-between text-base text-slate-700 py-2 border-b border-slate-100">
                  <span>{prikazNaziva(s.naziv)} x{s.kolicina}</span>
                  <span>{formatRsd(s.cenaPoJedinici * s.kolicina)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold text-blue-900 text-lg mb-8">
              <span>Ukupno</span>
              <span>{formatRsd(racunModal.ukupanIznos)}</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => preuzmiPdf(racunModal.id)}
                disabled={preuzimanjePdf}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-lg text-base font-medium transition-colors disabled:opacity-60"
              >
                {preuzimanjePdf ? "Preuzimanje..." : "Preuzmi PDF"}
              </button>
              <button
                onClick={() => setRacunModal(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-lg text-base font-medium transition-colors"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

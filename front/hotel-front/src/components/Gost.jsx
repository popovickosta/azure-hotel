import { useState, useEffect } from "react";
import { formatRsd, prikazNaziva } from "../utils/format";

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

const kreveti = {
  JEDNOKREVETNA: 1,
  DVOKREVETNA: 2,
  TROKREVETNA: 3,
  APARTMAN: 2
};

const obroiKeywords = ["doručak", "rucak", "ručak", "vecera", "večera", "dorucak"];

function jeObrok(naziv) {
  return obroiKeywords.some(k => naziv.toLowerCase().includes(k));
}

export default function Gost() {
  const danasnjiDatum = new Date().toISOString().split("T")[0];
  const [sekcija, setSekcija] = useState("sobe");
  const [sobe, setSobe] = useState([]);
  const [usluge, setUsluge] = useState([]);
  const [rezervacije, setRezervacije] = useState([]);
  const [modalOtvoren, setModalOtvoren] = useState(false);
  const [odabranaSoba, setOdabranaSoba] = useState(null);
  const [odabraneUsluge, setOdabraneUsluge] = useState({});
  const [datumPrijave, setDatumPrijave] = useState("");
  const [datumOdjave, setDatumOdjave] = useState("");
  const [racunModal, setRacunModal] = useState(null);
  const [filterTip, setFilterTip] = useState("SVE");
  const [greska, setGreska] = useState("");
  const [preuzimanjePdf, setPreuzimanjePdf] = useState(false);
  const [rezervacijaStrana, setRezervacijaStrana] = useState(0);
  const [ukupnoRezervacijaStrana, setUkupnoRezervacijaStrana] = useState(0);
  const [ukupnoRezervacija, setUkupnoRezervacija] = useState(0);

  const [strana, setStrana] = useState(1);
  const sobaPoStrani = 6;

  useEffect(() => {
    ucitajSobe();
    ucitajUsluge();
  }, []);

  useEffect(() => {
    ucitajRezervacije();
  }, [rezervacijaStrana]);

  async function ucitajSobe() {
    const res = await fetch(`${API}/api/sobe`, { headers: authHeader() });
    const data = await res.json();
    setSobe(data);
  }

  async function ucitajUsluge() {
    const res = await fetch(`${API}/api/usluge`, { headers: authHeader() });
    const data = await res.json();
    setUsluge(data);
  }

  async function ucitajRezervacije() {
    const res = await fetch(
      `${API}/api/rezervacije/moje/paginirano?page=${rezervacijaStrana}&size=6`,
      { headers: authHeader() }
    );
    if (res.ok) {
      const data = await res.json();
      setRezervacije(data.content || []);
      setUkupnoRezervacijaStrana(data.totalPages || 0);
      setUkupnoRezervacija(data.totalElements || 0);
    }
  }

  function brojNoci() {
    if (!datumPrijave || !datumOdjave) return 0;
    const od = new Date(datumPrijave);
    const do_ = new Date(datumOdjave);
    return Math.max(0, Math.round((do_ - od) / (1000 * 60 * 60 * 24)));
  }

  function defaultKolicina(usluga) {
    if (!odabranaSoba) return 1;
    const noci = brojNoci();
    if (jeObrok(usluga.naziv)) {
      return kreveti[odabranaSoba.tipSobe] * noci;
    }
    return 1;
  }

  function toggleUsluga(usluga, checked) {
    if (checked) {
      setOdabraneUsluge(prev => ({
        ...prev,
        [usluga.id]: defaultKolicina(usluga)
      }));
    } else {
      setOdabraneUsluge(prev => {
        const novo = { ...prev };
        delete novo[usluga.id];
        return novo;
      });
    }
  }

  function promeniKolicinu(uslugaId, delta) {
    setOdabraneUsluge(prev => {
      const novaKol = Math.max(1, (prev[uslugaId] || 1) + delta);
      return { ...prev, [uslugaId]: novaKol };
    });
  }

  async function napraviRezervaciju() {
    setGreska("");
    if (!datumPrijave || !datumOdjave) {
      setGreska("Unesite datume");
      return;
    }
    if (brojNoci() <= 0) {
      setGreska("Datum odjave mora biti nakon datuma prijave");
      return;
    }

    const telo = {
      datumPrijave,
      datumOdjave,
      soba: { id: odabranaSoba.id },
      usluge: odabraneUsluge
    };

    const res = await fetch(`${API}/api/rezervacije`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(telo)
    });

    if (!res.ok) {
      const poruka = await res.text();
      setGreska(poruka || "Rezervaciju nije moguće napraviti");
      return;
    }

    setModalOtvoren(false);
    setOdabranaSoba(null);
    setOdabraneUsluge({});
    setDatumPrijave("");
    setDatumOdjave("");
    if (rezervacijaStrana !== 0) {
      setRezervacijaStrana(0);
    } else {
      ucitajRezervacije();
    }
    setSekcija("rezervacije");
  }

  async function otkaziRezervaciju(id) {
    if (!confirm("Da li sigurno želite da otkažete rezervaciju?")) return;
    setGreska("");
    const res = await fetch(`${API}/api/rezervacije/${id}/otkazi`, {
      method: "PUT",
      headers: authHeader()
    });
    if (!res.ok) {
      const poruka = await res.text();
      setGreska(poruka || "Rezervaciju nije moguće otkazati");
      return;
    }
    if (rezervacijaStrana !== 0) {
      setRezervacijaStrana(0);
    } else {
      ucitajRezervacije();
    }
  }

  async function prikaziRacun(rezervacijaId) {
    setGreska("");
    const res = await fetch(`${API}/api/racuni/rezervacija/${rezervacijaId}`, { headers: authHeader() });
    if (!res.ok) {
      const poruka = await res.text();
      setGreska(poruka || "Račun nije moguće prikazati");
      return;
    }
    const data = await res.json();
    setRacunModal(data);
  }

  async function preuzmiPdf(racunId) {
    setPreuzimanjePdf(true);
    try {
      const res = await fetch(`${API}/api/racuni/${racunId}/pdf`, { headers: authHeader() });
      if (!res.ok) {
        setGreska("Greška pri preuzimanju PDF-a");
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
      setGreska("Greška pri preuzimanju PDF-a");
    } finally {
      setPreuzimanjePdf(false);
    }
  }

  const filtriraneSobe = filterTip === "SVE" ? sobe : sobe.filter(s => s.tipSobe === filterTip);
  const ukupnoStrana = Math.ceil(filtriraneSobe.length / sobaPoStrani);
  const sobeZaPrikaz = filtriraneSobe.slice((strana - 1) * sobaPoStrani, strana * sobaPoStrani);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-2 mb-6">
        {[
          { key: "sobe", naziv: "Sobe" },
          { key: "usluge", naziv: "Usluge" },
          { key: "rezervacije", naziv: "Moje rezervacije" }
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setSekcija(s.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${sekcija === s.key
              ? "bg-blue-700 text-white shadow"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
          >
            {s.naziv}
          </button>
        ))}
      </div>

      {greska && !modalOtvoren && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
          {greska}
        </div>
      )}

      {sekcija === "sobe" && (
        <>
          <div className="flex gap-3 mb-6">
            {["SVE", "JEDNOKREVETNA", "DVOKREVETNA", "TROKREVETNA", "APARTMAN"].map(tip => (
              <button
                key={tip}
                onClick={() => { setFilterTip(tip); setStrana(1); }}
                className={`px-6 py-3 rounded-lg text-base font-medium transition-all ${filterTip === tip
                  ? "bg-blue-700 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
              >
                {tip === "SVE" ? "Sve" : tip.charAt(0) + tip.slice(1).toLowerCase().replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sobeZaPrikaz.map(soba => (
              <div key={soba.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col justify-between min-h-56">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-blue-900 text-3xl mb-2">Soba {soba.brojSobe}</h3>
                      <span className="text-base text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        {soba.tipSobe.charAt(0) + soba.tipSobe.slice(1).toLowerCase().replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-700 font-bold text-3xl">{formatRsd(soba.cenaPoNoci).replace(" RSD", "")}</p>
                      <p className="text-sm text-slate-400">RSD / noć</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setOdabranaSoba(soba); setModalOtvoren(true); }}
                  className="w-full mt-6 bg-blue-700 hover:bg-blue-800 text-white text-base py-3 rounded-xl transition-colors font-medium"
                >
                  Rezerviši
                </button>
              </div>
            ))}
          </div>

          {ukupnoStrana > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setStrana(p => Math.max(1, p - 1))}
                disabled={strana === 1}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prethodna
              </button>
              {Array.from({ length: ukupnoStrana }, (_, i) => i + 1).map(broj => (
                <button
                  key={broj}
                  onClick={() => setStrana(broj)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${strana === broj
                    ? "bg-blue-700 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  {broj}
                </button>
              ))}
              <button
                onClick={() => setStrana(p => Math.min(ukupnoStrana, p + 1))}
                disabled={strana === ukupnoStrana}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sledeća
              </button>
            </div>
          )}
        </>
      )}

      {sekcija === "usluge" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usluge.map(u => (
            <div key={u.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <h3 className="font-bold text-blue-900 text-xl mb-2">{prikazNaziva(u.naziv)}</h3>
              <p className="text-blue-700 font-semibold text-lg">{formatRsd(u.cena)}</p>
              <p className="text-slate-400 text-xs mt-1">po jedinici</p>
            </div>
          ))}
        </div>
      )}

      {sekcija === "rezervacije" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {rezervacije.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
                <p className="text-base">Nemate rezervacija</p>
            </div>
          ) : (
            <table className="w-full text-base">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-4 text-slate-500 font-semibold">Soba</th>
                  <th className="text-left px-6 py-4 text-slate-500 font-semibold">Datum prijave</th>
                  <th className="text-left px-6 py-4 text-slate-500 font-semibold">Datum odjave</th>
                  <th className="text-left px-6 py-4 text-slate-500 font-semibold">Status</th>
                  <th className="text-left px-6 py-4 text-slate-500 font-semibold">Akcije</th>
                </tr>
              </thead>
              <tbody>
                {rezervacije.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-6 py-5 text-slate-700">Soba {r.soba?.brojSobe}</td>
                    <td className="px-6 py-5 text-slate-700">{r.datumPrijave}</td>
                    <td className="px-6 py-5 text-slate-700">{r.datumOdjave}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusBoja[r.status]}`}>
                        {statusNaziv[r.status]}
                      </span>
                    </td>
                    <td className="px-6 py-5 flex gap-2">
                      {r.status === "NA_CEKANJU" && (
                        <button
                          onClick={() => otkaziRezervaciju(r.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                        >
                          Otkaži
                        </button>
                      )}
                      {r.status === "ZAVRSENA" && (
                        <button
                          onClick={() => prikaziRacun(r.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                        >
                          Prikaži račun
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {sekcija === "rezervacije" && ukupnoRezervacijaStrana > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setRezervacijaStrana((p) => Math.max(0, p - 1))}
            disabled={rezervacijaStrana === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prethodna
          </button>
          <span className="text-sm text-slate-500 px-2">
            Strana {rezervacijaStrana + 1} od {ukupnoRezervacijaStrana} · ukupno {ukupnoRezervacija}
          </span>
          <button
            onClick={() => setRezervacijaStrana((p) => Math.min(ukupnoRezervacijaStrana - 1, p + 1))}
            disabled={rezervacijaStrana >= ukupnoRezervacijaStrana - 1}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sledeća
          </button>
        </div>
      )}

      {modalOtvoren && odabranaSoba && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold text-blue-900 mb-1">Rezervacija</h2>
            <p className="text-slate-500 text-sm mb-6">
              Soba {odabranaSoba.brojSobe} — {formatRsd(odabranaSoba.cenaPoNoci)}/noć
              · {kreveti[odabranaSoba.tipSobe]} {kreveti[odabranaSoba.tipSobe] === 1 ? "krevet" : "kreveta"}
            </p>

            {greska && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{greska}</div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Datum prijave</label>
                  <input
                    type="date"
                    value={datumPrijave}
                    min={danasnjiDatum}
                    onChange={e => {
                      setDatumPrijave(e.target.value);
                      setDatumOdjave("");
                      setOdabraneUsluge({});
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Datum odjave</label>
                  <input
                    type="date"
                    value={datumOdjave}
                    min={datumPrijave}
                    disabled={!datumPrijave}
                    onChange={e => { setDatumOdjave(e.target.value); setOdabraneUsluge({}); }}
                    className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${!datumPrijave ? "bg-slate-50 cursor-not-allowed text-slate-400" : ""
                      }`}
                  />
                </div>
              </div>

              {brojNoci() > 0 && (
                <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                  Trajanje: {brojNoci()} {brojNoci() === 1 ? "noć" : "noći"}
                </p>
              )}

              <div>
                <label className="block text-xs text-slate-500 mb-2">Dodatne usluge</label>
                <div className="space-y-2">
                  {usluge.map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={!!odabraneUsluge[u.id]}
                        onChange={e => toggleUsluga(u, e.target.checked)}
                        className="accent-blue-600"
                      />
                      <span className="text-sm text-slate-700 flex-1">{prikazNaziva(u.naziv)}</span>
                      <span className="text-xs text-slate-400">{formatRsd(u.cena)}</span>
                      {odabraneUsluge[u.id] && (
                        <div className="flex items-center gap-2 ml-2">
                          <button
                            onClick={() => promeniKolicinu(u.id, -1)}
                            className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center"
                          >
                            −
                          </button>
                          <span className="text-sm font-medium w-6 text-center">{odabraneUsluge[u.id]}</span>
                          <button
                            onClick={() => promeniKolicinu(u.id, 1)}
                            className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={napraviRezervaciju}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Potvrdi rezervaciju
                </button>
                <button
                  onClick={() => { setModalOtvoren(false); setOdabranaSoba(null); setOdabraneUsluge({}); setGreska(""); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Otkaži
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {racunModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-lg font-semibold text-blue-900 mb-1">Račun</h2>
            <p className="text-slate-400 text-xs mb-6">Datum izdavanja: {racunModal.datumIzdavanja}</p>
            <div className="space-y-2 mb-6">
              {racunModal.stavke?.map((s, i) => (
                <div key={i} className="flex justify-between text-sm text-slate-700 py-2 border-b border-slate-100">
                  <span>{prikazNaziva(s.naziv)} x{s.kolicina}</span>
                  <span>{formatRsd(s.cenaPoJedinici * s.kolicina)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-semibold text-blue-900 text-base mb-6">
              <span>Ukupno</span>
              <span>{formatRsd(racunModal.ukupanIznos)}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => preuzmiPdf(racunModal.id)}
                disabled={preuzimanjePdf}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
              >
                {preuzimanjePdf ? "Preuzimanje..." : "Preuzmi PDF"}
              </button>
              <button
                onClick={() => setRacunModal(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-lg text-sm font-medium transition-colors"
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
import { useState, useEffect } from "react";
import { formatRsd, normalizujZaPretragu, prikazNaziva, normalizujTekst } from "../utils/format";
import RegexPomoc from "./RegexPomoc";
import IstaknutoPoklapanje from "./IstaknutoPoklapanje";

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

const primeriRegexaRezervacija = [
  {
    polje: "Gost",
    izraz: "[A-Z][a-z]* [A-Z][a-z]*",
  },
  {
    polje: "Email",
    izraz: "[a-z.]+@[a-z]+[.][a-z]+",
  },
  {
    polje: "Prijava",
    izraz: "202[0-9]-[0-9]{2}-[0-9]{2}",
  },
  {
    polje: "Status",
    izraz: "Potvrdjena|Zavrsena",
  },
];

export default function Zaposleni() {
  const [rezervacije, setRezervacije] = useState([]);
  const [racunModal, setRacunModal] = useState(null);
  const [pretraga, setPretraga] = useState("");
  const [nacinPretrage, setNacinPretrage] = useState("obicna");
  const [poljePretrage, setPoljePretrage] = useState("sva");
  const [razlikujVelikaIMalaSlova, setRazlikujVelikaIMalaSlova] = useState(false);
  const [izabraniStatusiKriterijuma, setIzabraniStatusiKriterijuma] = useState([]);
  const [izabraneGodineKriterijuma, setIzabraneGodineKriterijuma] = useState([]);
  const [izabraniDomeniKriterijuma, setIzabraniDomeniKriterijuma] = useState([]);
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
    const aktivnaPretraga = nacinPretrage === "kriterijumi" || pretraga.trim();
    const cekanje = aktivnaPretraga ? 250 : 0;
    const timer = setTimeout(() => ucitajRezervacije(), cekanje);
    return () => clearTimeout(timer);
  }, [strana, pretraga, nacinPretrage]);

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
      const globalnaPretraga = nacinPretrage === "kriterijumi" || pretraga.trim().length > 0;
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

  const poljaPretrage = ["Gost", "Email", "Broj sobe", "Prijava", "Odjava", "Usluge", "Status"];

  function izdvojiGodinu(datum) {
    const tekst = String(datum || "");
    return tekst.length >= 4 ? tekst.substring(0, 4) : "";
  }

  function izdvojiDomen(email) {
    const delovi = String(email || "").split("@");
    return delovi.length === 2 ? delovi[1].trim() : "";
  }

  const godineKriterijuma = [...new Set(
    rezervacije.map((r) => izdvojiGodinu(r.datumPrijave)).filter(Boolean)
  )].sort();

  const domeniKriterijuma = [...new Set(
    rezervacije.map((r) => izdvojiDomen(r.gost?.email)).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  const statusiKriterijuma = [...new Set(
    rezervacije.map((r) => r.status).filter(Boolean)
  )].sort((a, b) =>
    (statusNaziv[a] || a).localeCompare(statusNaziv[b] || b, "sr")
  );

  function promeniStatusKriterijuma(status) {
    setIzabraniStatusiKriterijuma((trenutniStatusi) =>
      trenutniStatusi.includes(status)
        ? trenutniStatusi.filter((s) => s !== status)
        : [...trenutniStatusi, status]
    );
    setStrana(0);
  }

  function promeniGodinuKriterijuma(godina) {
    setIzabraneGodineKriterijuma((trenutneGodine) =>
      trenutneGodine.includes(godina)
        ? trenutneGodine.filter((g) => g !== godina)
        : [...trenutneGodine, godina]
    );
    setStrana(0);
  }

  function promeniDomenKriterijuma(domen) {
    setIzabraniDomeniKriterijuma((trenutniDomeni) =>
      trenutniDomeni.includes(domen)
        ? trenutniDomeni.filter((d) => d !== domen)
        : [...trenutniDomeni, domen]
    );
    setStrana(0);
  }

  function resetujKriterijume() {
    setIzabraniStatusiKriterijuma([]);
    setIzabraneGodineKriterijuma([]);
    setIzabraniDomeniKriterijuma([]);
    setStrana(0);
  }

  function pripremiDomenZaRegex(domen) {
    return domen.replaceAll(".", "[.]");
  }

  function napraviRegexZaStatuse() {
    const izabraniStatusi = izabraniStatusiKriterijuma.filter((status) =>
      statusiKriterijuma.includes(status)
    );

    if (izabraniStatusi.length === 0) return null;

    const nazivi = izabraniStatusi.map((status) =>
      normalizujTekst(statusNaziv[status] || status)
    ).sort((a, b) => b.length - a.length);

    return new RegExp(nazivi.join("|"));
  }

  function napraviRegexZaGodine() {
    const izabraneGodine = izabraneGodineKriterijuma.filter((godina) =>
      godineKriterijuma.includes(godina)
    );

    if (izabraneGodine.length === 0) return null;
    return new RegExp(izabraneGodine.join("|"));
  }

  function napraviRegexZaDomene() {
    const izabraniDomeni = izabraniDomeniKriterijuma.filter((domen) =>
      domeniKriterijuma.includes(domen)
    );

    if (izabraniDomeni.length === 0) return null;

    const domeni = izabraniDomeni
      .map((domen) => pripremiDomenZaRegex(normalizujTekst(domen)))
      .sort((a, b) => b.length - a.length)
      .join("|");
    return new RegExp(domeni);
  }

  function potpunoOdgovara(regularniIzraz, vrednost) {
    if (!regularniIzraz) return true;

    const tekst = String(vrednost ?? "");
    const poklapanje = tekst.match(regularniIzraz);
    return poklapanje !== null && poklapanje[0] === tekst;
  }

  const regexStatusa = napraviRegexZaStatuse();
  const regexGodine = napraviRegexZaGodine();
  const regexDomena = napraviRegexZaDomene();

  function odgovaraKriterijumima(r) {
    const status = normalizujTekst(statusNaziv[r.status] || "");
    if (!potpunoOdgovara(regexStatusa, status)) {
      return false;
    }

    const godina = izdvojiGodinu(r.datumPrijave);
    if (!potpunoOdgovara(regexGodine, godina)) {
      return false;
    }

    const domen = normalizujTekst(izdvojiDomen(r.gost?.email));
    if (!potpunoOdgovara(regexDomena, domen)) {
      return false;
    }

    return true;
  }

  function vrednostPolja(r, polje) {
    if (polje === "Gost") return `${r.gost?.ime || ""} ${r.gost?.prezime || ""}`.trim();
    if (polje === "Email") return r.gost?.email || "";
    if (polje === "Broj sobe") return String(r.soba?.brojSobe ?? "");
    if (polje === "Prijava") return r.datumPrijave || "";
    if (polje === "Odjava") return r.datumOdjave || "";
    if (polje === "Usluge") {
      return r.usluge
        ? Object.keys(r.usluge).map((id) => nazivUsluge(id)).join(" ")
        : "";
    }
    if (polje === "Status") return statusNaziv[r.status] || r.status || "";
    return "";
  }

  let regularniIzraz = null;
  let greskaRegularnogIzraza = "";

  if (nacinPretrage === "regex" && pretraga.trim()) {
    try {
      const opcije = razlikujVelikaIMalaSlova ? "" : "i";
      regularniIzraz = new RegExp(normalizujTekst(pretraga), opcije);
    } catch {
      greskaRegularnogIzraza = "Regularni izraz nije ispravan.";
    }
  }

  function odgovaraRegularnomIzrazu(vrednost) {
    if (!regularniIzraz) return false;

    const tekst = normalizujTekst(vrednost);
    return regularniIzraz.test(tekst);
  }

  function trebaIstaciRegex(polje) {
    return nacinPretrage === "regex" &&
      (poljePretrage === "sva" || poljePretrage === polje);
  }

  const filtrirane = rezervacije.filter((r) => {
    if (nacinPretrage === "kriterijumi") {
      return odgovaraKriterijumima(r);
    }

    if (!pretraga.trim()) return true;

    const izabranaPolja = poljePretrage === "sva" ? poljaPretrage : [poljePretrage];
    const vrednosti = izabranaPolja.map((polje) => String(vrednostPolja(r, polje) ?? ""));

    if (nacinPretrage === "regex") {
      return vrednosti.some((vrednost) => odgovaraRegularnomIzrazu(vrednost));
    }

    const trazeno = normalizujZaPretragu(pretraga);

    if (poljePretrage === "sva") {
      const uslugeTekst = r.usluge
        ? Object.keys(r.usluge).map((id) => nazivUsluge(id)).join(" ")
        : "";
      const tekst = normalizujZaPretragu(
        `${JSON.stringify(r)} ${uslugeTekst} ${statusNaziv[r.status] || ""}`
      );
      return tekst.includes(trazeno);
    }

    return vrednosti.some((vrednost) =>
      normalizujZaPretragu(vrednost).includes(trazeno)
    );
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Rezervacije</h2>

        <div className="flex flex-wrap items-start gap-2">
          <select
            value={nacinPretrage}
            onChange={(e) => {
              setNacinPretrage(e.target.value);
              setPretraga("");
              setPoljePretrage("sva");
              setStrana(0);
            }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="obicna">Obična pretraga</option>
            <option value="kriterijumi">Pretraga po kriterijumima</option>
            <option value="regex">Direktna regex pretraga</option>
          </select>

          {nacinPretrage !== "kriterijumi" && (
            <>
              <select
                value={poljePretrage}
                onChange={(e) => { setPoljePretrage(e.target.value); setStrana(0); }}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="sva">Sva polja</option>
                {poljaPretrage.map((polje) => (
                  <option key={polje} value={polje}>{polje}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder={nacinPretrage === "regex" ? "Unesite regularni izraz..." : "Pretraži rezervacije..."}
                value={pretraga}
                onChange={(e) => { setPretraga(e.target.value); setStrana(0); }}
                className={`border rounded-lg px-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 ${
                  greskaRegularnogIzraza
                    ? "border-red-300 focus:ring-red-300"
                    : "border-slate-200 focus:ring-blue-400"
                }`}
              />

              {nacinPretrage === "regex" && (
                <RegexPomoc
                  izraz={pretraga}
                  greska={greskaRegularnogIzraza}
                  brojRezultata={filtrirane.length}
                  ukupanBroj={rezervacije.length}
                  poljePretrage={poljePretrage}
                  primeri={primeriRegexaRezervacija}
                  razlikujVelikaIMalaSlova={razlikujVelikaIMalaSlova}
                  onPromeniRazlikovanje={setRazlikujVelikaIMalaSlova}
                  onIzaberiPrimer={(primer) => {
                    setPretraga(primer.izraz);
                    setPoljePretrage(primer.polje);
                    setStrana(0);
                  }}
                />
              )}
            </>
          )}
        </div>

        {nacinPretrage === "kriterijumi" && (
          <div className="mt-3 border border-slate-200 rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-600 mb-4">
              Izaberite kriterijume. Ako izaberete više grupa, rezervacija mora da ispuni sve izabrane kriterijume.
            </p>

            <div className="grid md:grid-cols-3 gap-5">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Status rezervacije</p>
                <div className="flex flex-wrap gap-3">
                  {statusiKriterijuma.map((status) => (
                    <label key={status} className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={izabraniStatusiKriterijuma.includes(status)}
                        onChange={() => promeniStatusKriterijuma(status)}
                      />
                      {statusNaziv[status] || status}
                    </label>
                  ))}
                  {statusiKriterijuma.length === 0 && (
                    <span className="text-sm text-slate-400">Nema dostupnih statusa.</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Godina rezervacije</p>
                <div className="flex flex-wrap gap-3">
                  {godineKriterijuma.map((godina) => (
                    <label key={godina} className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={izabraneGodineKriterijuma.includes(godina)}
                        onChange={() => promeniGodinuKriterijuma(godina)}
                      />
                      {godina}
                    </label>
                  ))}
                  {godineKriterijuma.length === 0 && (
                    <span className="text-sm text-slate-400">Nema dostupnih godina.</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Email domen gosta</p>
                <div className="flex flex-wrap gap-3">
                  {domeniKriterijuma.map((domen) => (
                    <label key={domen} className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={izabraniDomeniKriterijuma.includes(domen)}
                        onChange={() => promeniDomenKriterijuma(domen)}
                      />
                      {domen}
                    </label>
                  ))}
                  {domeniKriterijuma.length === 0 && (
                    <span className="text-sm text-slate-400">Nema dostupnih domena.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200">
              <button type="button" onClick={resetujKriterijume} className="text-blue-600 hover:text-blue-800 mt-2 font-sans">
                Poništi kriterijume
              </button>
            </div>
          </div>
        )}

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
                    <div>
                      <IstaknutoPoklapanje
                        vrednost={`${r.gost?.ime || ""} ${r.gost?.prezime || ""}`.trim()}
                        regularniIzraz={regularniIzraz}
                        aktivno={trebaIstaciRegex("Gost")}
                      />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      <IstaknutoPoklapanje
                        vrednost={r.gost?.email || ""}
                        regularniIzraz={regularniIzraz}
                        aktivno={trebaIstaciRegex("Email")}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-700">
                    Soba{" "}
                    <IstaknutoPoklapanje
                      vrednost={r.soba?.brojSobe}
                      regularniIzraz={regularniIzraz}
                      aktivno={trebaIstaciRegex("Broj sobe")}
                    />
                  </td>
                  <td className="px-6 py-5 text-slate-700">
                    <IstaknutoPoklapanje
                      vrednost={r.datumPrijave}
                      regularniIzraz={regularniIzraz}
                      aktivno={trebaIstaciRegex("Prijava")}
                    />
                  </td>
                  <td className="px-6 py-5 text-slate-700">
                    <IstaknutoPoklapanje
                      vrednost={r.datumOdjave}
                      regularniIzraz={regularniIzraz}
                      aktivno={trebaIstaciRegex("Odjava")}
                    />
                  </td>
                  <td className="px-6 py-5 text-slate-700">
                    {r.usluge && Object.keys(r.usluge).length > 0
                      ? (
                        <IstaknutoPoklapanje
                          vrednost={Object.entries(r.usluge)
                            .map(([id, kol]) => `${nazivUsluge(id)} x${kol}`)
                            .join(", ")}
                          regularniIzraz={regularniIzraz}
                          aktivno={trebaIstaciRegex("Usluge")}
                        />
                      )
                      : <span className="text-slate-400">—</span>
                    }
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusBoja[r.status]}`}>
                      <IstaknutoPoklapanje
                        vrednost={statusNaziv[r.status]}
                        regularniIzraz={regularniIzraz}
                        aktivno={trebaIstaciRegex("Status")}
                      />
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

      {ukupnoStrana > 1 && nacinPretrage !== "kriterijumi" && !pretraga && (
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

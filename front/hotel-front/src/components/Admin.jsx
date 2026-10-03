import { useState, useEffect } from "react";
import { formatRsd, normalizujZaPretragu, prikazNaziva, normalizujTekst } from "../utils/format";
import RegexPomoc from "./RegexPomoc";
import IstaknutoPoklapanje from "./IstaknutoPoklapanje";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

function authHeader() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

const primeriRegexaPoSekciji = {
  zaposleni: [
    {
      polje: "Ime",
      izraz: "[A-Z][a-z]*",
    },
    {
      polje: "Email",
      izraz: "[a-z.]+@[a-z]+[.][a-z]+",
    },
    {
      polje: "Broj ugovora",
      izraz: "[1-9][0-9]*",
    },
  ],
  gosti: [
    {
      polje: "Ime",
      izraz: "A.*l",
    },
    {
      polje: "Email",
      izraz: "[a-z.]+@[a-z]+[.][a-z]+",
    },
    {
      polje: "Dokument",
      izraz: "(LK|PS): [0-9]+",
    },
  ],
  sobe: [
    {
      polje: "Broj sobe",
      izraz: "[1-9][0-9]*",
    },
    {
      polje: "Tip sobe",
      izraz: "Jednokrevetna|Dvokrevetna|Apartman",
    },
    {
      polje: "Cena po noći",
      izraz: "[1-9][0-9]*",
    },
  ],
  usluge: [
    {
      polje: "Naziv",
      izraz: "[A-Z][a-z]*",
    },
    {
      polje: "Naziv",
      izraz: "Spa|Dorucak|Prevoz",
    },
    {
      polje: "Cena",
      izraz: "[1-9][0-9]*",
    },
  ],
  drzave: [
    {
      polje: "Naziv",
      izraz: "[A-Z][a-z]*",
    },
    {
      polje: "Naziv",
      izraz: "S.*a",
    },
    {
      polje: "Naziv",
      izraz: "Srbija|Spanija",
    },
  ],
};

export default function Admin() {
  const [sekcija, setSekcija] = useState("zaposleni");
  const [podaci, setPodaci] = useState([]);
  const [pretraga, setPretraga] = useState("");
  const [nacinPretrage, setNacinPretrage] = useState("obicna");
  const [poljePretrage, setPoljePretrage] = useState("sva");
  const [razlikujVelikaIMalaSlova, setRazlikujVelikaIMalaSlova] = useState(false);
  const [izabraniDomeni, setIzabraniDomeni] = useState([]);
  const [izabraniSpratovi, setIzabraniSpratovi] = useState([]);
  const [izabraniTipoviSoba, setIzabraniTipoviSoba] = useState([]);
  const [izabranaPocetnaSlova, setIzabranaPocetnaSlova] = useState([]);
  const [modalOtvoren, setModalOtvoren] = useState(false);
  const [trenutniRed, setTrenutniRed] = useState(null);
  const [greska, setGreska] = useState("");
  const [drzave, setDrzave] = useState([]);
  const [modalGreska, setModalGreska] = useState("");
  const [strana, setStrana] = useState(0);
  const [ukupnoStrana, setUkupnoStrana] = useState(0);
  const [ukupnoElemenata, setUkupnoElemenata] = useState(0);
  const velicinaStrane = 8;

  const endpointi = {
    zaposleni: "/api/zaposleni",
    gosti: "/api/gosti",
    sobe: "/api/sobe",
    usluge: "/api/usluge",
    drzave: "/api/drzave",
  };

  const naziviSekcija = {
    zaposleni: "Zaposleni",
    gosti: "Gosti",
    sobe: "Sobe",
    usluge: "Usluge",
    drzave: "Države",
  };

  const naziviForme = {
    zaposleni: "zaposlenog",
    gosti: "gosta",
    sobe: "sobu",
    usluge: "uslugu",
    drzave: "državu",
  };

  useEffect(() => {
    ucitajDrzave();
  }, []);

  useEffect(() => {
    const cekanje = pretraga.trim() ? 250 : 0;
    const timer = setTimeout(() => ucitajPodatke(), cekanje);
    return () => clearTimeout(timer);
  }, [sekcija, strana, pretraga, nacinPretrage]);

  async function ucitajDrzave() {
    try {
      const res = await fetch(`${API}/api/drzave`, { headers: authHeader() });
      const data = await res.json();
      setDrzave(data);
    } catch {
      console.log("Greška pri učitavanju država");
    }
  }

  async function ucitajStranicu(brojStrane) {
    const res = await fetch(
      `${API}${endpointi[sekcija]}/paginirano?page=${brojStrane}&size=${velicinaStrane}`,
      { headers: authHeader() }
    );
    if (!res.ok) {
      const poruka = await res.text();
      throw new Error(poruka || "Greška pri učitavanju podataka");
    }
    return res.json();
  }

  async function ucitajPodatke() {
    try {
      setGreska("");
      const globalnaPretraga = nacinPretrage === "kriterijumi" || pretraga.trim().length > 0;
      const prva = await ucitajStranicu(globalnaPretraga ? 0 : strana);

      let sadrzaj = prva.content || [];
      if (globalnaPretraga && (prva.totalPages || 0) > 1) {
        const ostaleStrane = await Promise.all(
          Array.from({ length: prva.totalPages - 1 }, (_, i) => ucitajStranicu(i + 1))
        );
        sadrzaj = [
          ...sadrzaj,
          ...ostaleStrane.flatMap((stranica) => stranica.content || []),
        ];
      }

      setPodaci(sadrzaj);
      setUkupnoStrana(prva.totalPages || 0);
      setUkupnoElemenata(prva.totalElements || 0);
    } catch (e) {
      setPodaci([]);
      setUkupnoStrana(0);
      setUkupnoElemenata(0);
      setGreska(e.message || "Greška pri učitavanju podataka");
    }
  }

  async function obrisi(id) {
    if (!confirm("Da li sigurno želite da obrišete?")) return;

    try {
      const res = await fetch(`${API}${endpointi[sekcija]}/${id}`, {
        method: "DELETE",
        headers: authHeader(),
      });

      if (!res.ok) {
        const poruka = await res.text();
        alert(poruka || "Podatak se ne može obrisati.");
        return;
      }

      await ucitajPodatke();
      if (sekcija === "drzave") await ucitajDrzave();
    } catch {
      alert("Greška pri brisanju podataka.");
    }
  }

  async function obrisiUslugu(id) {
    if (!confirm("Da li sigurno želite da obrišete?")) return;
    const res = await fetch(`${API}/api/usluge/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    });

    if (!res.ok) {
      const poruka = await res.text();
      alert(poruka || "Usluga se ne može obrisati.");
      return;
    }

    ucitajPodatke(); // osveži listu
  }

  async function obrisiSobu(id) {
    if (!confirm("Da li sigurno želite da obrišete?")) return;
    const res = await fetch(`${API}/api/sobe/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    });

    if (!res.ok) {
      const poruka = await res.text();
      alert(poruka || "Soba se ne može obrisati.");
      return;
    }

    ucitajPodatke(); // osveži listu
  }

  async function obrisiGosta(id) {
    if (!confirm("Da li sigurno želite da obrišete?")) return;
    const res = await fetch(`${API}/api/gosti/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    });

    if (!res.ok) {
      const poruka = await res.text();
      alert(poruka || "Gost se ne može obrisati.");
      return;
    }

    ucitajPodatke(); // osveži listu
  }

  function obrisiRed(id) {
    if (sekcija === "usluge") return obrisiUslugu(id);
    if (sekcija === "sobe") return obrisiSobu(id);
    if (sekcija === "gosti") return obrisiGosta(id);
    return obrisi(id);
  }

  async function sacuvaj(e) {
    e.preventDefault();
    const forma = e.target;
    let telo = {};

    if (sekcija === "zaposleni") {
      telo = {
        ime: forma.ime.value,
        prezime: forma.prezime.value,
        email: forma.email.value,
        lozinka: forma.lozinka?.value || null,
        brojUgovora: forma.brojUgovora.value,
      };
    } else if (sekcija === "gosti") {
      if (sekcija === "gosti" && !forma.drzavaId.value) {
        setModalGreska("Izaberite državu.");
        return;
      }
      if (sekcija === "gosti" && !forma.tipDokumenta.value) {
        setModalGreska("Izaberite tip dokumenta.");
        return;
      }
      telo = {
        ime: forma.ime.value,
        prezime: forma.prezime.value,
        email: forma.email.value,
        lozinka: forma.lozinka?.value || null,
        brojTelefona: forma.brojTelefona.value,
        drzava: { id: parseInt(forma.drzavaId.value) },
        tipDokumenta: forma.tipDokumenta.value || null,
        brojDokumenta: forma.brojDokumenta.value || null,
      };
    } else if (sekcija === "sobe") {
      telo = {
        brojSobe: forma.brojSobe.value,
        tipSobe: forma.tipSobe.value,
        cenaPoNoci: parseFloat(forma.cenaPoNoci.value),
      };
    } else if (sekcija === "usluge") {
      telo = {
        naziv: forma.naziv.value,
        cena: parseFloat(forma.cena.value),
      };
    } else if (sekcija === "drzave") {
      telo = {
        naziv: forma.naziv.value,
      };
    }

    const url = trenutniRed
      ? `${API}${endpointi[sekcija]}/${trenutniRed.id}`
      : `${API}${endpointi[sekcija]}`;
    const metod = trenutniRed ? "PUT" : "POST";

    const res = await fetch(url, {
      method: metod,
      headers: authHeader(),
      body: JSON.stringify(telo),
    });

    if (!res.ok) {
      const tekst = await res.text();
      setModalGreska(tekst || "Greška pri čuvanju");
      return;
    }

    setModalGreska("");
    setModalOtvoren(false);
    setTrenutniRed(null);
    ucitajPodatke();
    if (sekcija === "drzave") ucitajDrzave();
  }

  const kolonePo = {
    zaposleni: ["Ime", "Prezime", "Email", "Broj ugovora"],
    gosti: ["Ime", "Prezime", "Email", "Broj telefona", "Država", "Dokument"],
    sobe: ["Broj sobe", "Tip sobe", "Cena po noći"],
    usluge: ["Naziv", "Cena"],
    drzave: ["Naziv"],
  };

  function izdvojiDomen(email) {
    const delovi = String(email || "").split("@");
    return delovi.length === 2 ? delovi[1].trim() : "";
  }

  function izdvojiSprat(brojSobe) {
    const tekst = String(brojSobe ?? "").trim();
    if (tekst.length < 3 || !Number.isInteger(Number(tekst))) return null;

    const sprat = Number(tekst.slice(0, -2));
    return Number.isInteger(sprat) ? sprat : null;
  }

  function izdvojiPocetnoSlovo(naziv) {
    const tekst = normalizujTekst(prikazNaziva(naziv) || "").trim();
    return tekst ? tekst.charAt(0).toUpperCase() : "";
  }

  function prikaziTipSobe(tipSobe) {
    const reci = String(tipSobe || "").toLowerCase().split("_");
    if (reci.length === 0 || !reci[0]) return "";

    reci[0] = reci[0].charAt(0).toUpperCase() + reci[0].slice(1);
    return reci.join(" ");
  }

  const domeniKriterijuma = (sekcija === "zaposleni" || sekcija === "gosti")
    ? [...new Set(podaci.map((item) => izdvojiDomen(item.email)).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b))
    : [];

  const spratoviKriterijuma = sekcija === "sobe"
    ? [...new Set(
        podaci
          .map((soba) => izdvojiSprat(soba.brojSobe))
          .filter((sprat) => sprat !== null)
      )].sort((a, b) => a - b)
    : [];

  const tipoviSobaKriterijuma = sekcija === "sobe"
    ? [...new Set(podaci.map((soba) => soba.tipSobe).filter(Boolean))]
        .sort((a, b) => prikaziTipSobe(a).localeCompare(prikaziTipSobe(b), "sr"))
    : [];

  const slovaKriterijuma = sekcija === "drzave"
    ? [...new Set(podaci.map((item) => izdvojiPocetnoSlovo(item.naziv)).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, "sr"))
    : [];

  function promeniDomenKriterijuma(domen) {
    setIzabraniDomeni((trenutniDomeni) =>
      trenutniDomeni.includes(domen)
        ? trenutniDomeni.filter((d) => d !== domen)
        : [...trenutniDomeni, domen]
    );
    setStrana(0);
  }

  function promeniSpratKriterijuma(sprat) {
    setIzabraniSpratovi((trenutniSpratovi) =>
      trenutniSpratovi.includes(sprat)
        ? trenutniSpratovi.filter((s) => s !== sprat)
        : [...trenutniSpratovi, sprat]
    );
    setStrana(0);
  }

  function promeniTipSobeKriterijuma(tipSobe) {
    setIzabraniTipoviSoba((trenutniTipovi) =>
      trenutniTipovi.includes(tipSobe)
        ? trenutniTipovi.filter((tip) => tip !== tipSobe)
        : [...trenutniTipovi, tipSobe]
    );
    setStrana(0);
  }

  function promeniPocetnoSlovoKriterijuma(slovo) {
    setIzabranaPocetnaSlova((trenutnaSlova) =>
      trenutnaSlova.includes(slovo)
        ? trenutnaSlova.filter((pocetnoSlovo) => pocetnoSlovo !== slovo)
        : [...trenutnaSlova, slovo]
    );
    setStrana(0);
  }

  function resetujKriterijume() {
    setIzabraniDomeni([]);
    setIzabraniSpratovi([]);
    setIzabraniTipoviSoba([]);
    setIzabranaPocetnaSlova([]);
    setStrana(0);
  }

  function pripremiDomenZaRegex(domen) {
    return domen.replaceAll(".", "[.]");
  }

  function napraviRegexZaEmailDomene() {
    if (nacinPretrage !== "kriterijumi") return null;
    if (sekcija !== "zaposleni" && sekcija !== "gosti") return null;

    const postojeciDomeni = izabraniDomeni.filter((domen) =>
      domeniKriterijuma.includes(domen)
    );
    if (postojeciDomeni.length === 0) return null;

    const domeni = postojeciDomeni
      .map((domen) => pripremiDomenZaRegex(normalizujTekst(domen)))
      .sort((a, b) => b.length - a.length)
      .join("|");
    return new RegExp(domeni);
  }

  function napraviRegexZaSpratove() {
    const postojeciSpratovi = izabraniSpratovi.filter((sprat) =>
      spratoviKriterijuma.includes(sprat)
    );
    if (postojeciSpratovi.length === 0) return null;

    const spratovi = postojeciSpratovi
      .map(String)
      .sort((a, b) => b.length - a.length)
      .join("|");
    return new RegExp(spratovi);
  }

  function napraviRegexZaTipoveSoba() {
    const postojeciTipovi = izabraniTipoviSoba.filter((tipSobe) =>
      tipoviSobaKriterijuma.includes(tipSobe)
    );
    if (postojeciTipovi.length === 0) return null;

    const tipovi = postojeciTipovi
      .map(normalizujTekst)
      .sort((a, b) => b.length - a.length)
      .join("|");
    return new RegExp(tipovi);
  }

  function napraviRegexZaPocetnaSlova() {
    const postojecaSlova = izabranaPocetnaSlova.filter((slovo) =>
      slovaKriterijuma.includes(slovo)
    );
    if (postojecaSlova.length === 0) return null;

    return new RegExp(postojecaSlova.join("|"));
  }

  function potpunoOdgovara(regularniIzraz, vrednost) {
    if (!regularniIzraz) return true;

    const tekst = String(vrednost ?? "");
    const poklapanje = tekst.match(regularniIzraz);
    return poklapanje !== null && poklapanje[0] === tekst;
  }

  const regexDomena = napraviRegexZaEmailDomene();
  const regexSpratova = napraviRegexZaSpratove();
  const regexTipovaSoba = napraviRegexZaTipoveSoba();
  const regexPocetnihSlova = napraviRegexZaPocetnaSlova();

  function odgovaraKriterijumima(item) {
    if (sekcija === "zaposleni" || sekcija === "gosti") {
      const domen = normalizujTekst(izdvojiDomen(item.email));
      return potpunoOdgovara(regexDomena, domen);
    }

    if (sekcija === "sobe") {
      const sprat = izdvojiSprat(item.brojSobe);
      if (regexSpratova && (sprat === null || !potpunoOdgovara(regexSpratova, sprat))) {
        return false;
      }

      const tipSobe = normalizujTekst(item.tipSobe);
      return potpunoOdgovara(regexTipovaSoba, tipSobe);
    }

    if (sekcija === "drzave") {
      const pocetnoSlovo = izdvojiPocetnoSlovo(item.naziv);
      return potpunoOdgovara(regexPocetnihSlova, pocetnoSlovo);
    }

    return true;
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

  const filtrirano = podaci.filter((item) => {
    if (nacinPretrage === "kriterijumi") {
      return odgovaraKriterijumima(item);
    }

    if (!pretraga.trim()) return true;

    const koloneZaPretragu =
      poljePretrage === "sva" ? kolonePo[sekcija] : [poljePretrage];

    const vrednosti = koloneZaPretragu.map((kolona) =>
      String(vrednostCelije(item, sekcija, kolona) ?? "")
    );

    if (nacinPretrage === "regex") {
      return vrednosti.some((vrednost) => odgovaraRegularnomIzrazu(vrednost));
    }

    const trazeno = normalizujZaPretragu(pretraga);

    if (poljePretrage === "sva") {
      return normalizujZaPretragu(JSON.stringify(item)).includes(trazeno);
    }

    return vrednosti.some((vrednost) =>
      normalizujZaPretragu(vrednost).includes(trazeno)
    );
  });

  function vrednostCelije(item, sekcija, kolona) {
    if (sekcija === "zaposleni") {
      if (kolona === "Ime") return item.ime;
      if (kolona === "Prezime") return item.prezime;
      if (kolona === "Email") return item.email;
      if (kolona === "Broj ugovora") return item.brojUgovora;
    } else if (sekcija === "gosti") {
      if (kolona === "Ime") return item.ime;
      if (kolona === "Prezime") return item.prezime;
      if (kolona === "Email") return item.email;
      if (kolona === "Broj telefona") return item.brojTelefona;
      if (kolona === "Država") return prikazNaziva(item.drzava?.naziv) || "-";
      if (kolona === "Dokument")
        return item.brojDokumenta
          ? `${item.tipDokumenta === "LICNA_KARTA" ? "LK" : "PŠ"}: ${item.brojDokumenta}`
          : "-";
    } else if (sekcija === "sobe") {
      if (kolona === "Broj sobe") return item.brojSobe;
      if (kolona === "Tip sobe") return prikaziTipSobe(item.tipSobe);
      if (kolona === "Cena po noći") return formatRsd(item.cenaPoNoci);
    } else if (sekcija === "usluge") {
      if (kolona === "Naziv") return prikazNaziva(item.naziv);
      if (kolona === "Cena") return formatRsd(item.cena);
    } else if (sekcija === "drzave") {
      if (kolona === "Naziv") return prikazNaziva(item.naziv);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-2 mb-6">
        {["zaposleni", "gosti", "sobe", "usluge", "drzave"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setSekcija(s);
              if (s === "usluge" && nacinPretrage === "kriterijumi") {
                setNacinPretrage("obicna");
              }
              setPretraga("");
              setPoljePretrage("sva");
              resetujKriterijume();
              setStrana(0);
            }}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              sekcija === s
                ? "bg-blue-700 text-white shadow"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            {naziviSekcija[s]}
          </button>
        ))}
      </div>

      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
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
              {sekcija !== "usluge" && (
                <option value="kriterijumi">Pretraga po kriterijumima</option>
              )}
              <option value="regex">Direktna regex pretraga</option>
            </select>

            {nacinPretrage !== "kriterijumi" && (
              <>
                <select
                  value={poljePretrage}
                  onChange={(e) => {
                    setPoljePretrage(e.target.value);
                    setStrana(0);
                  }}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="sva">Sva polja</option>
                  {kolonePo[sekcija].map((kolona) => (
                    <option key={kolona} value={kolona}>
                      {kolona}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder={nacinPretrage === "regex" ? "Unesite regularni izraz..." : "Pretraži..."}
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
                    brojRezultata={filtrirano.length}
                    ukupanBroj={podaci.length}
                    poljePretrage={poljePretrage}
                    primeri={primeriRegexaPoSekciji[sekcija]}
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
            <div className="mt-3 border border-slate-200 rounded-xl bg-slate-50 p-4 max-w-4xl">
              {(sekcija === "zaposleni" || sekcija === "gosti") && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Email domeni</p>
                  <div className="flex flex-wrap gap-3">
                    {domeniKriterijuma.map((domen) => (
                      <label key={domen} className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={izabraniDomeni.includes(domen)}
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
              )}

              {sekcija === "sobe" && (
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Sprat</p>
                    <div className="flex flex-wrap gap-3">
                      {spratoviKriterijuma.map((sprat) => (
                        <label key={sprat} className="flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={izabraniSpratovi.includes(sprat)}
                            onChange={() => promeniSpratKriterijuma(sprat)}
                          />
                          {sprat}
                        </label>
                      ))}
                      {spratoviKriterijuma.length === 0 && (
                        <span className="text-sm text-slate-400">Nema dostupnih spratova.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Tip sobe</p>
                    <div className="flex flex-wrap gap-3">
                      {tipoviSobaKriterijuma.map((tipSobe) => (
                        <label key={tipSobe} className="flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={izabraniTipoviSoba.includes(tipSobe)}
                            onChange={() => promeniTipSobeKriterijuma(tipSobe)}
                          />
                          {prikaziTipSobe(tipSobe)}
                        </label>
                      ))}
                      {tipoviSobaKriterijuma.length === 0 && (
                        <span className="text-sm text-slate-400">Nema dostupnih tipova soba.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {sekcija === "drzave" && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Početno slovo</p>
                  <div className="flex flex-wrap gap-3">
                    {slovaKriterijuma.map((slovo) => (
                      <label key={slovo} className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={izabranaPocetnaSlova.includes(slovo)}
                          onChange={() => promeniPocetnoSlovoKriterijuma(slovo)}
                        />
                        {slovo}
                      </label>
                    ))}
                    {slovaKriterijuma.length === 0 && (
                      <span className="text-sm text-slate-400">Nema dostupnih početnih slova.</span>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={resetujKriterijume} className="text-xs text-blue-600 hover:text-blue-800">
                  Poništi kriterijume
                </button>
              </div>
            </div>
          )}

        </div>
        <button
          onClick={() => {
            setTrenutniRed(null);
            setModalGreska("");
            setModalOtvoren(true);
          }}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          + Dodaj
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {greska && <p className="text-red-500 text-sm p-4">{greska}</p>}
        {filtrirano.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-base">Nema podataka</p>
          </div>
        ) : (
          <table className="w-full text-base">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {kolonePo[sekcija].map((k) => (
                  <th
                    key={k}
                    className="text-left px-6 py-4 text-slate-500 font-semibold"
                  >
                    {k}
                  </th>
                ))}
                <th className="text-left px-6 py-4 text-slate-500 font-semibold">
                  Akcije
                </th>
              </tr>
            </thead>
            <tbody>
              {filtrirano.map((item, i) => (
                <tr
                  key={item.id}
                  className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                >
                  {kolonePo[sekcija].map((k) => (
                    <td key={k} className="px-6 py-5 text-slate-700">
                      <IstaknutoPoklapanje
                        vrednost={vrednostCelije(item, sekcija, k)}
                        regularniIzraz={regularniIzraz}
                        aktivno={trebaIstaciRegex(k)}
                      />
                    </td>
                  ))}
                  <td className="px-6 py-5 flex gap-2">
                    <button
                      onClick={() => {
                        setTrenutniRed(item);
                        setModalGreska("");
                        setModalOtvoren(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                    >
                      Izmeni
                    </button>
                    <button
                      onClick={() => obrisiRed(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                    >
                      Obriši
                    </button>
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
            onClick={() => setStrana((p) => Math.max(0, p - 1))}
            disabled={strana === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prethodna
          </button>
          <span className="text-sm text-slate-500 px-2">
            Strana {strana + 1} od {ukupnoStrana} · ukupno {ukupnoElemenata}
          </span>
          <button
            onClick={() => setStrana((p) => Math.min(ukupnoStrana - 1, p + 1))}
            disabled={strana >= ukupnoStrana - 1}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sledeća
          </button>
        </div>
      )}


      {modalOtvoren && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-lg font-semibold text-blue-900 mb-6">
              {trenutniRed ? "Izmeni" : "Dodaj"} {naziviForme[sekcija]}
            </h2>
            {modalGreska && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                {modalGreska}
              </div>
            )}
            <form onSubmit={sacuvaj} className="space-y-4">
              {(sekcija === "zaposleni" || sekcija === "gosti") && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Ime
                      </label>
                      <input
                        name="ime"
                        defaultValue={trenutniRed?.ime}
                        required
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Prezime
                      </label>
                      <input
                        name="prezime"
                        defaultValue={trenutniRed?.prezime}
                        required
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      defaultValue={trenutniRed?.email}
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </>
              )}

              {sekcija === "zaposleni" && (
                <>
                  {!trenutniRed && (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Lozinka
                      </label>
                      <input
                        name="lozinka"
                        type="password"
                        required
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Broj ugovora
                    </label>
                    <input
                      name="brojUgovora"
                      defaultValue={trenutniRed?.brojUgovora}
                      required
                      pattern="UG-[0-9]{3}"
                      title="Broj ugovora mora biti u formatu UG-001"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </>
              )}

              {sekcija === "gosti" && (
                <>
                  {!trenutniRed && (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Lozinka
                      </label>
                      <input
                        name="lozinka"
                        type="password"
                        required
                        minLength={6}
                        title="Lozinka mora imati najmanje 6 karaktera"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Broj telefona
                    </label>
                    <input
                      name="brojTelefona"
                      required
                      pattern="[0-9+ ]{6,20}"
                      defaultValue={trenutniRed?.brojTelefona}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Država
                    </label>
                    <select
                      name="drzavaId"
                      defaultValue={trenutniRed?.drzava?.id || ""}
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    >
                      <option value="" disabled>
                        Izaberite državu
                      </option>

                      {drzave.map((d) => (
                        <option key={d.id} value={d.id}>
                          {prikazNaziva(d.naziv)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Tip dokumenta
                    </label>
                    <select
                      name="tipDokumenta"
                      defaultValue={trenutniRed?.tipDokumenta || ""}
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Odaberite tip dokumenta</option>
                      <option value="LICNA_KARTA">Lična karta</option>
                      <option value="PASOS">Pasoš</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Broj dokumenta
                    </label>
                    <input
                      name="brojDokumenta"
                      defaultValue={trenutniRed?.brojDokumenta || ""}
                      pattern="[0-9]{9}"
                      maxLength={9}
                      required
                      title="Broj dokumenta mora sadržati tačno 9 cifara."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Broj lične karte ili pasoša"
                    />
                  </div>
                </>
              )}

              {sekcija === "sobe" && (
                <>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Broj sobe
                    </label>
                    <input
                      name="brojSobe"
                      defaultValue={trenutniRed?.brojSobe}
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Tip sobe
                    </label>
                    <select
                      name="tipSobe"
                      defaultValue={trenutniRed?.tipSobe}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="JEDNOKREVETNA">Jednokrevetna</option>
                      <option value="DVOKREVETNA">Dvokrevetna</option>
                      <option value="TROKREVETNA">Trokrevetna</option>
                      <option value="APARTMAN">Apartman</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Cena po noći (RSD)
                    </label>
                    <input
                      name="cenaPoNoci"
                      type="number"
                      min="0.01"
                      step="0.01"
                      defaultValue={trenutniRed?.cenaPoNoci}
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </>
              )}

              {sekcija === "usluge" && (
                <>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Naziv
                    </label>
                    <input
                      name="naziv"
                      defaultValue={prikazNaziva(trenutniRed?.naziv)}
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Cena (RSD)
                    </label>
                    <input
                      name="cena"
                      type="number"
                      min="0.01"
                      step="0.01"
                      defaultValue={trenutniRed?.cena}
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </>
              )}

              {sekcija === "drzave" && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Naziv države
                  </label>
                  <input
                    name="naziv"
                    defaultValue={prikazNaziva(trenutniRed?.naziv)}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Sačuvaj
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalOtvoren(false);
                    setTrenutniRed(null);
                    setModalGreska("");
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Otkaži
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

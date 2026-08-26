import { useState, useEffect } from "react";
import { formatRsd, normalizujZaPretragu, prikazNaziva } from "../utils/format";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

function authHeader() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

export default function Admin() {
  const [sekcija, setSekcija] = useState("zaposleni");
  const [podaci, setPodaci] = useState([]);
  const [pretraga, setPretraga] = useState("");
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
  }, [sekcija, strana, pretraga]);

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
      const globalnaPretraga = pretraga.trim().length > 0;
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

  const filtrirano = podaci.filter((item) => {
    const tekst = normalizujZaPretragu(JSON.stringify(item));
    return tekst.includes(normalizujZaPretragu(pretraga));
  });

  const kolonePo = {
    zaposleni: ["Ime", "Prezime", "Email", "Broj ugovora"],
    gosti: ["Ime", "Prezime", "Email", "Broj telefona", "Država", "Dokument"],
    sobe: ["Broj sobe", "Tip sobe", "Cena po noći"],
    usluge: ["Naziv", "Cena"],
    drzave: ["Naziv"],
  };

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
      if (kolona === "Tip sobe") return item.tipSobe;
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
              setPretraga("");
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

      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Pretraži..."
          value={pretraga}
          onChange={(e) => { setPretraga(e.target.value); setStrana(0); }}
          className="border border-slate-200 rounded-lg px-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={() => {
            setTrenutniRed(null);
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
                      {vrednostCelije(item, sekcija, k)}
                    </td>
                  ))}
                  <td className="px-6 py-5 flex gap-2">
                    <button
                      onClick={() => {
                        setTrenutniRed(item);
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

      {ukupnoStrana > 1 && !pretraga && (
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

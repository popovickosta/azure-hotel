import { normalizujTekst } from "../utils/format";

function pripremiTekstSaPozicijama(vrednost) {
  const originalniTekst = String(vrednost ?? "");
  let normalizovaniTekst = "";
  const pocetnePozicije = [];
  const krajnjePozicije = [];
  let originalnaPozicija = 0;

  for (const znak of originalniTekst) {
    const normalizovaniZnak = normalizujTekst(znak);

    for (let i = 0; i < normalizovaniZnak.length; i += 1) {
      pocetnePozicije.push(originalnaPozicija);
      krajnjePozicije.push(originalnaPozicija + znak.length);
    }

    normalizovaniTekst += normalizovaniZnak;
    originalnaPozicija += znak.length;
  }

  return {
    originalniTekst,
    normalizovaniTekst,
    pocetnePozicije,
    krajnjePozicije,
  };
}

export default function IstaknutoPoklapanje({
  vrednost,
  regularniIzraz,
  aktivno,
}) {
  const pripremljeno = pripremiTekstSaPozicijama(vrednost);

  if (!aktivno || !regularniIzraz) {
    return pripremljeno.originalniTekst;
  }

  const poklapanje = pripremljeno.normalizovaniTekst.match(regularniIzraz);
  if (!poklapanje || poklapanje.index === undefined || poklapanje[0].length === 0) {
    return pripremljeno.originalniTekst;
  }

  const pocetak = pripremljeno.pocetnePozicije[poklapanje.index];
  const poslednjiIndeks = poklapanje.index + poklapanje[0].length - 1;
  const kraj = pripremljeno.krajnjePozicije[poslednjiIndeks];

  return (
    <>
      {pripremljeno.originalniTekst.slice(0, pocetak)}
      <mark className="rounded bg-amber-200 px-0.5 text-inherit">
        {pripremljeno.originalniTekst.slice(pocetak, kraj)}
      </mark>
      {pripremljeno.originalniTekst.slice(kraj)}
    </>
  );
}

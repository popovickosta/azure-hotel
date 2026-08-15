const brojFormat = new Intl.NumberFormat("sr-RS", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatRsd(vrednost) {
  const broj = Number(vrednost ?? 0);
  return `${brojFormat.format(Number.isFinite(broj) ? broj : 0)} RSD`;
}

export function normalizujZaPretragu(vrednost) {
  return String(vrednost ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
}

const standardniNazivi = {
  dorucak: "Doručak",
  rucak: "Ručak",
  vecera: "Večera",
  "pranje vesa": "Pranje veša",
  nemacka: "Nemačka",
};

export function prikazNaziva(naziv) {
  if (!naziv) return naziv;
  const kljuc = normalizujZaPretragu(naziv).trim();
  return standardniNazivi[kljuc] || naziv;
}

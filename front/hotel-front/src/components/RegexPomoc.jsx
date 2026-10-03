export default function RegexPomoc({
  izraz,
  greska,
  brojRezultata,
  ukupanBroj,
  poljePretrage,
  primeri,
  razlikujVelikaIMalaSlova,
  onPromeniRazlikovanje,
  onIzaberiPrimer,
}) {
  const izrazJeUnet = izraz.trim().length > 0;
  const opisPretrage =
    poljePretrage === "sva"
      ? "Pretražuju se sva prikazana polja."
      : `Pretražuje se polje „${poljePretrage}“.`;

  return (
    <>
      <details className="relative">
        <summary
          title="Kliknite za pomoć i primere regularnih izraza"
          className="flex cursor-pointer select-none items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:border-blue-400 hover:bg-blue-100"
          style={{ listStyle: "none" }}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
            ?
          </span>
          Pomoć za unos
        </summary>

        <div className="absolute right-0 z-30 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-lg">
          <p className="font-medium text-slate-800">Posebni znakovi</p>
          <div className="mt-2 grid grid-cols-[3.5rem_1fr] gap-y-1.5">
            <code className="font-semibold text-blue-700">.</code>
            <span>bilo koji znak</span>
            <code className="font-semibold text-blue-700">.*</code>
            <span>bilo koji broj znakova</span>
            <code className="font-semibold text-blue-700">.+</code>
            <span>jedan ili više proizvoljnih znakova</span>
            <code className="font-semibold text-blue-700">[a-z]</code>
            <span>malo slovo</span>
            <code className="font-semibold text-blue-700">[0-9]</code>
            <span>cifra</span>
            <code className="font-semibold text-blue-700">+</code>
            <span>jedno ili više ponavljanja</span>
            <code className="font-semibold text-blue-700">*</code>
            <span>nula ili više ponavljanja</span>
            <code className="font-semibold text-blue-700">|</code>
            <span>ili</span>
          </div>

          <p className="mb-2 mt-4 font-medium text-slate-800">Primeri za ovu tabelu</p>
          <div className="space-y-1.5">
            {primeri.map((primer) => (
              <button
                key={`${primer.polje}-${primer.izraz}`}
                type="button"
                onClick={() => onIzaberiPrimer(primer)}
                className="grid w-full grid-cols-[6.5rem_1fr] items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="text-xs text-slate-500">
                  {primer.polje}:
                </span>
                <code className="break-all font-semibold text-blue-700">{primer.izraz}</code>
              </button>
            ))}
          </div>
        </div>
      </details>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={razlikujVelikaIMalaSlova}
          onChange={(e) => onPromeniRazlikovanje(e.target.checked)}
        />
        Razlikuj velika i mala slova
      </label>

      {izrazJeUnet && (
        <div
          aria-live="polite"
          className={`mt-1 w-full max-w-3xl basis-full rounded-lg border px-3 py-2 text-sm ${
            greska
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          <p className="font-medium">
            {greska
              ? greska
              : `Izraz je ispravan. Pronađeno je ${brojRezultata} od ${ukupanBroj} zapisa.`}
          </p>
          {!greska && (
            <p className="mt-1 text-xs">
              {opisPretrage} Velika i mala slova se {razlikujVelikaIMalaSlova ? "razlikuju" : "ne razlikuju"}.
            </p>
          )}
        </div>
      )}
    </>
  );
}

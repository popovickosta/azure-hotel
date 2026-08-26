package rezervacijasmestaja.izdavanjeracuna.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class RacunDTO {
    private Long id;
    private LocalDate datumIzdavanja;
    private BigDecimal ukupanIznos;
    private RezervacijaDTO rezervacija;
    private List<StavkaRacunaDTO> stavke;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getDatumIzdavanja() { return datumIzdavanja; }
    public void setDatumIzdavanja(LocalDate datumIzdavanja) { this.datumIzdavanja = datumIzdavanja; }

    public BigDecimal getUkupanIznos() { return ukupanIznos; }
    public void setUkupanIznos(BigDecimal ukupanIznos) { this.ukupanIznos = ukupanIznos; }

    public RezervacijaDTO getRezervacija() { return rezervacija; }
    public void setRezervacija(RezervacijaDTO rezervacija) { this.rezervacija = rezervacija; }

    public List<StavkaRacunaDTO> getStavke() { return stavke; }
    public void setStavke(List<StavkaRacunaDTO> stavke) { this.stavke = stavke; }
}
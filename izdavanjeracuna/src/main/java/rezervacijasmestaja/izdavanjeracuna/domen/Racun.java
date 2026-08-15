package rezervacijasmestaja.izdavanjeracuna.domen;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "racun")
public class Racun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "datum_izdavanja", nullable = false)
    private LocalDate datumIzdavanja;

    @Column(name = "ukupan_iznos", nullable = false)
    private BigDecimal ukupanIznos;

    @OneToOne
    @JoinColumn(name = "rezervacija_id", nullable = false, unique = true)
    private Rezervacija rezervacija;

    @OneToMany(mappedBy = "racun", cascade = CascadeType.ALL)
    private List<StavkaRacuna> stavke;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getDatumIzdavanja() { return datumIzdavanja; }
    public void setDatumIzdavanja(LocalDate datumIzdavanja) { this.datumIzdavanja = datumIzdavanja; }

    public BigDecimal getUkupanIznos() { return ukupanIznos; }
    public void setUkupanIznos(BigDecimal ukupanIznos) { this.ukupanIznos = ukupanIznos; }

    public Rezervacija getRezervacija() { return rezervacija; }
    public void setRezervacija(Rezervacija rezervacija) { this.rezervacija = rezervacija; }

    public List<StavkaRacuna> getStavke() { return stavke; }
    public void setStavke(List<StavkaRacuna> stavke) { this.stavke = stavke; }
}
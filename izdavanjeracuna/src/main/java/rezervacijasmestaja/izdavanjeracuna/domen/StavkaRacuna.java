package rezervacijasmestaja.izdavanjeracuna.domen;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "stavka_racuna")
public class StavkaRacuna {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String naziv;

    @Column(nullable = false)
    private int kolicina;

    @Column(name = "cena_po_jedinici", nullable = false)
    private BigDecimal cenaPoJedinici;

    @ManyToOne
    @JoinColumn(name = "racun_id", nullable = false)
    private Racun racun;

    @ManyToOne
    @JoinColumn(name = "usluga_id")
    private UslugaSobe usluga;

    public UslugaSobe getUsluga() {
        return usluga;
    }

    public void setUsluga(UslugaSobe usluga) {
        this.usluga = usluga;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNaziv() {
        return naziv;
    }

    public void setNaziv(String naziv) {
        this.naziv = naziv;
    }

    public int getKolicina() {
        return kolicina;
    }

    public void setKolicina(int kolicina) {
        this.kolicina = kolicina;
    }

    public BigDecimal getCenaPoJedinici() {
        return cenaPoJedinici;
    }

    public void setCenaPoJedinici(BigDecimal cenaPoJedinici) {
        this.cenaPoJedinici = cenaPoJedinici;
    }

    public Racun getRacun() {
        return racun;
    }

    public void setRacun(Racun racun) {
        this.racun = racun;
    }
}

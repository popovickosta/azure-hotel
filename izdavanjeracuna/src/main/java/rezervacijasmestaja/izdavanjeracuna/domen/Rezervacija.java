package rezervacijasmestaja.izdavanjeracuna.domen;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@Entity
@Table(name = "rezervacija")
public class Rezervacija {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "datum_prijave", nullable = false)
    private LocalDate datumPrijave;

    @Column(name = "datum_odjave", nullable = false)
    private LocalDate datumOdjave;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusRezervacije status;

    @ManyToOne
    @JoinColumn(name = "gost_id", nullable = false)
    private Gost gost;

    @ManyToOne
    @JoinColumn(name = "soba_id", nullable = false)
    private Soba soba;

    @Column(name = "cena_sobe_po_noci")
    private BigDecimal cenaSobePoNoci;

    @ElementCollection
    @CollectionTable(
            name = "rezervacija_usluge",
            joinColumns = @JoinColumn(name = "rezervacija_id")
    )
    @MapKeyJoinColumn(name = "usluga_id")
    @Column(name = "kolicina", nullable = false)
    private Map<UslugaSobe, Integer> usluge;

    @ElementCollection
    @CollectionTable(
            name = "rezervacija_usluge_cene",
            joinColumns = @JoinColumn(name = "rezervacija_id")
    )
    @MapKeyColumn(name = "usluga_id")
    @Column(name = "cena_po_jedinici")
    private Map<Long, BigDecimal> ceneUsluga;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getDatumPrijave() { return datumPrijave; }
    public void setDatumPrijave(LocalDate datumPrijave) { this.datumPrijave = datumPrijave; }

    public LocalDate getDatumOdjave() { return datumOdjave; }
    public void setDatumOdjave(LocalDate datumOdjave) { this.datumOdjave = datumOdjave; }

    public StatusRezervacije getStatus() { return status; }
    public void setStatus(StatusRezervacije status) { this.status = status; }

    public Gost getGost() { return gost; }
    public void setGost(Gost gost) { this.gost = gost; }

    public Soba getSoba() { return soba; }
    public void setSoba(Soba soba) { this.soba = soba; }

    public BigDecimal getCenaSobePoNoci() { return cenaSobePoNoci; }
    public void setCenaSobePoNoci(BigDecimal cenaSobePoNoci) { this.cenaSobePoNoci = cenaSobePoNoci; }

    public Map<UslugaSobe, Integer> getUsluge() { return usluge; }
    public void setUsluge(Map<UslugaSobe, Integer> usluge) { this.usluge = usluge; }

    public Map<Long, BigDecimal> getCeneUsluga() { return ceneUsluga; }
    public void setCeneUsluga(Map<Long, BigDecimal> ceneUsluga) { this.ceneUsluga = ceneUsluga; }
}

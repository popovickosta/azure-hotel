package rezervacijasmestaja.izdavanjeracuna.domen;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "soba")
public class Soba {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "broj_sobe", nullable = false, unique = true)
    private String brojSobe;

    @Column(nullable = false)
    private BigDecimal cenaPoNoci;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipSobe tipSobe;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBrojSobe() { return brojSobe; }
    public void setBrojSobe(String brojSobe) { this.brojSobe = brojSobe; }

    public BigDecimal getCenaPoNoci() { return cenaPoNoci; }
    public void setCenaPoNoci(BigDecimal cenaPoNoci) { this.cenaPoNoci = cenaPoNoci; }

    public TipSobe getTipSobe() { return tipSobe; }
    public void setTipSobe(TipSobe tipSobe) { this.tipSobe = tipSobe; }
}
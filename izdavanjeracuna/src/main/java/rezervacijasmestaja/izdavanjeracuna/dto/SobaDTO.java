package rezervacijasmestaja.izdavanjeracuna.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import rezervacijasmestaja.izdavanjeracuna.domen.TipSobe;

public class SobaDTO {
    private Long id;

    @NotBlank(message = "Broj sobe je obavezan")
    private String brojSobe;

    @NotNull(message = "Tip sobe je obavezan")
    private TipSobe tipSobe;

    @NotNull(message = "Cena po noći je obavezna")
    @DecimalMin(value = "0.01", message = "Cena po noći mora biti veća od 0")
    private BigDecimal cenaPoNoci;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBrojSobe() { return brojSobe; }
    public void setBrojSobe(String brojSobe) { this.brojSobe = brojSobe; }

    public TipSobe getTipSobe() { return tipSobe; }
    public void setTipSobe(TipSobe tipSobe) { this.tipSobe = tipSobe; }

    public BigDecimal getCenaPoNoci() { return cenaPoNoci; }
    public void setCenaPoNoci(BigDecimal cenaPoNoci) { this.cenaPoNoci = cenaPoNoci; }
}

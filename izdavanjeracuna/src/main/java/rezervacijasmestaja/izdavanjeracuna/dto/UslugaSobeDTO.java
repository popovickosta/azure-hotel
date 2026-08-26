package rezervacijasmestaja.izdavanjeracuna.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class UslugaSobeDTO {
    private Long id;

    @NotBlank(message = "Naziv usluge je obavezan")
    private String naziv;

    @NotNull(message = "Cena usluge je obavezna")
    @DecimalMin(value = "0.01", message = "Cena mora biti veća od 0")
    private BigDecimal cena;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNaziv() { return naziv; }
    public void setNaziv(String naziv) { this.naziv = naziv; }

    public BigDecimal getCena() { return cena; }
    public void setCena(BigDecimal cena) { this.cena = cena; }
}

package rezervacijasmestaja.izdavanjeracuna.dto;

import java.math.BigDecimal;

public class StavkaRacunaDTO {

    private Long id;
    private String naziv;
    private int kolicina;
    private BigDecimal cenaPoJedinici;
    private Long uslugaId;

    public Long getUslugaId() {
        return uslugaId;
    }

    public void setUslugaId(Long uslugaId) {
        this.uslugaId = uslugaId;
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
}

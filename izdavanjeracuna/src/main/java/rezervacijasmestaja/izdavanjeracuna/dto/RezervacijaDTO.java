package rezervacijasmestaja.izdavanjeracuna.dto;

import java.time.LocalDate;
import java.util.Map;

public class RezervacijaDTO {

    private Long id;
    private LocalDate datumPrijave;
    private LocalDate datumOdjave;
    private String status;
    private GostDTO gost;
    private SobaDTO soba;
    private Map<Long, Integer> usluge; 

    public Map<Long, Integer> getUsluge() {
        return usluge;
    }

    public void setUsluge(Map<Long, Integer> usluge) {
        this.usluge = usluge;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getDatumPrijave() {
        return datumPrijave;
    }

    public void setDatumPrijave(LocalDate datumPrijave) {
        this.datumPrijave = datumPrijave;
    }

    public LocalDate getDatumOdjave() {
        return datumOdjave;
    }

    public void setDatumOdjave(LocalDate datumOdjave) {
        this.datumOdjave = datumOdjave;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public GostDTO getGost() {
        return gost;
    }

    public void setGost(GostDTO gost) {
        this.gost = gost;
    }

    public SobaDTO getSoba() {
        return soba;
    }

    public void setSoba(SobaDTO soba) {
        this.soba = soba;
    }

    
}

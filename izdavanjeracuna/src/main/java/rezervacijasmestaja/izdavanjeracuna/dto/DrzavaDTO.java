package rezervacijasmestaja.izdavanjeracuna.dto;

import jakarta.validation.constraints.NotBlank;

public class DrzavaDTO {
    private Long id;

    @NotBlank(message = "Naziv države je obavezan")
    private String naziv;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNaziv() { return naziv; }
    public void setNaziv(String naziv) { this.naziv = naziv; }
}

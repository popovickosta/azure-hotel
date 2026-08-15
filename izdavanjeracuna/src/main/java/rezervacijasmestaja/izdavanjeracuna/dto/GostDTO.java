package rezervacijasmestaja.izdavanjeracuna.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class GostDTO {

    private Long id;

    @NotBlank(message = "Ime je obavezno")
    private String ime;

    @NotBlank(message = "Prezime je obavezno")
    private String prezime;

    @NotBlank(message = "Email je obavezan")
    @Email(message = "Email nije u ispravnom formatu")
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Size(min = 6, message = "Lozinka mora imati najmanje 6 karaktera")
    private String lozinka;

    @NotBlank(message = "Broj telefona je obavezan")
    @Pattern(regexp = "[0-9+ ]{6,20}", message = "Broj telefona nije u ispravnom formatu")
    private String brojTelefona;

    @NotNull(message = "Država je obavezna")
    private DrzavaDTO drzava;

    @NotBlank(message = "Tip dokumenta je obavezan")
    private String tipDokumenta;

    @NotBlank(message = "Broj dokumenta je obavezan")
    @Pattern(regexp = "\\d{9}", message = "Broj dokumenta mora imati tačno 9 cifara")
    private String brojDokumenta;

    public String getTipDokumenta() { return tipDokumenta; }
    public void setTipDokumenta(String tipDokumenta) { this.tipDokumenta = tipDokumenta; }

    public String getBrojDokumenta() { return brojDokumenta; }
    public void setBrojDokumenta(String brojDokumenta) { this.brojDokumenta = brojDokumenta; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getIme() { return ime; }
    public void setIme(String ime) { this.ime = ime; }

    public String getPrezime() { return prezime; }
    public void setPrezime(String prezime) { this.prezime = prezime; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getLozinka() { return lozinka; }
    public void setLozinka(String lozinka) { this.lozinka = lozinka; }

    public String getBrojTelefona() { return brojTelefona; }
    public void setBrojTelefona(String brojTelefona) { this.brojTelefona = brojTelefona; }

    public DrzavaDTO getDrzava() { return drzava; }
    public void setDrzava(DrzavaDTO drzava) { this.drzava = drzava; }
}

package rezervacijasmestaja.izdavanjeracuna.dto;

public class AuthResponseDTO {
    private String token;
    private String uloga;
    private String ime;
    private String prezime;

    public AuthResponseDTO(String token, String uloga, String ime, String prezime) {
        this.token = token;
        this.uloga = uloga;
        this.ime = ime;
        this.prezime = prezime;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getUloga() { return uloga; }
    public void setUloga(String uloga) { this.uloga = uloga; }

    public String getIme() { return ime; }
    public void setIme(String ime) { this.ime = ime; }

    public String getPrezime() { return prezime; }
    public void setPrezime(String prezime) { this.prezime = prezime; }
}
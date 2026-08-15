package rezervacijasmestaja.izdavanjeracuna.domen;

import jakarta.persistence.*;

@Entity
@Table(name = "zaposleni")
public class Zaposleni extends Korisnik {

    @Column(name = "broj_ugovora", unique = true)
    private String brojUgovora;

    public String getBrojUgovora() { return brojUgovora; }
    public void setBrojUgovora(String brojUgovora) { this.brojUgovora = brojUgovora; }
}
package rezervacijasmestaja.izdavanjeracuna.domen;

import jakarta.persistence.*;

@Entity
@Table(name = "gost")
public class Gost extends Korisnik {

    @Column(name = "broj_telefona")
    private String brojTelefona;

    @ManyToOne
    @JoinColumn(name = "drzava_id")
    private Drzava drzava;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "tip_dokumenta")
    private TipDokumenta tipDokumenta;

    @Column(name = "broj_dokumenta")
    private String brojDokumenta;

    public TipDokumenta getTipDokumenta() { return tipDokumenta; }
    public void setTipDokumenta(TipDokumenta tipDokumenta) { this.tipDokumenta = tipDokumenta; }

    public String getBrojDokumenta() { return brojDokumenta; }
    public void setBrojDokumenta(String brojDokumenta) { this.brojDokumenta = brojDokumenta; }
    

    public String getBrojTelefona() { return brojTelefona; }
    public void setBrojTelefona(String brojTelefona) { this.brojTelefona = brojTelefona; }

    public Drzava getDrzava() { return drzava; }
    public void setDrzava(Drzava drzava) { this.drzava = drzava; }
}
package rezervacijasmestaja.izdavanjeracuna.mapper;

import org.springframework.stereotype.Component;
import rezervacijasmestaja.izdavanjeracuna.domen.Drzava;
import rezervacijasmestaja.izdavanjeracuna.dto.DrzavaDTO;

@Component
public class DrzavaMapper implements Mapper<Drzava, DrzavaDTO> {

    @Override
    public DrzavaDTO toDTO(Drzava drzava) {
        DrzavaDTO dto = new DrzavaDTO();
        dto.setId(drzava.getId());
        dto.setNaziv(drzava.getNaziv());
        return dto;
    }

    @Override
    public Drzava toEntity(DrzavaDTO dto) {
        Drzava drzava = new Drzava();
        drzava.setId(dto.getId());
        drzava.setNaziv(dto.getNaziv());
        return drzava;
    }
}
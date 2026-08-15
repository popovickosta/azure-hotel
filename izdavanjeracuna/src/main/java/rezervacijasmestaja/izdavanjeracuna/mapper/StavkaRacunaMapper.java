package rezervacijasmestaja.izdavanjeracuna.mapper;

import org.springframework.stereotype.Component;
import rezervacijasmestaja.izdavanjeracuna.domen.StavkaRacuna;
import rezervacijasmestaja.izdavanjeracuna.dto.StavkaRacunaDTO;

@Component
public class StavkaRacunaMapper implements Mapper<StavkaRacuna, StavkaRacunaDTO> {

    @Override
    public StavkaRacunaDTO toDTO(StavkaRacuna stavka) {
        StavkaRacunaDTO dto = new StavkaRacunaDTO();
        dto.setId(stavka.getId());
        dto.setNaziv(stavka.getNaziv());
        dto.setKolicina(stavka.getKolicina());
        dto.setCenaPoJedinici(stavka.getCenaPoJedinici());
        dto.setUslugaId(stavka.getUsluga() != null ? stavka.getUsluga().getId() : null);
        return dto;
    }

    @Override
    public StavkaRacuna toEntity(StavkaRacunaDTO dto) {
        StavkaRacuna stavka = new StavkaRacuna();
        stavka.setId(dto.getId());
        stavka.setNaziv(dto.getNaziv());
        stavka.setKolicina(dto.getKolicina());
        stavka.setCenaPoJedinici(dto.getCenaPoJedinici());
        return stavka;
    }
}
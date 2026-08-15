package rezervacijasmestaja.izdavanjeracuna.mapper;

import org.springframework.stereotype.Component;
import rezervacijasmestaja.izdavanjeracuna.domen.UslugaSobe;
import rezervacijasmestaja.izdavanjeracuna.dto.UslugaSobeDTO;

@Component
public class UslugaSobeMapper implements Mapper<UslugaSobe, UslugaSobeDTO> {

    @Override
    public UslugaSobeDTO toDTO(UslugaSobe usluga) {
        UslugaSobeDTO dto = new UslugaSobeDTO();
        dto.setId(usluga.getId());
        dto.setNaziv(usluga.getNaziv());
        dto.setCena(usluga.getCena());
        return dto;
    }

    @Override
    public UslugaSobe toEntity(UslugaSobeDTO dto) {
        UslugaSobe usluga = new UslugaSobe();
        usluga.setId(dto.getId());
        usluga.setNaziv(dto.getNaziv());
        usluga.setCena(dto.getCena());
        return usluga;
    }
}
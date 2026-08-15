package rezervacijasmestaja.izdavanjeracuna.mapper;

import org.springframework.stereotype.Component;
import rezervacijasmestaja.izdavanjeracuna.domen.Soba;
import rezervacijasmestaja.izdavanjeracuna.dto.SobaDTO;

@Component
public class SobaMapper implements Mapper<Soba, SobaDTO> {

    @Override
    public SobaDTO toDTO(Soba soba) {
        SobaDTO dto = new SobaDTO();
        dto.setId(soba.getId());
        dto.setBrojSobe(soba.getBrojSobe());
        dto.setTipSobe(soba.getTipSobe());
        dto.setCenaPoNoci(soba.getCenaPoNoci());
        return dto;
    }

    @Override
    public Soba toEntity(SobaDTO dto) {
        Soba soba = new Soba();
        soba.setId(dto.getId());
        soba.setBrojSobe(dto.getBrojSobe());
        soba.setTipSobe(dto.getTipSobe());
        soba.setCenaPoNoci(dto.getCenaPoNoci());
        return soba;
    }
}
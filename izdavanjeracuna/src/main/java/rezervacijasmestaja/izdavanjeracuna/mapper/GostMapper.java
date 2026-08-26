package rezervacijasmestaja.izdavanjeracuna.mapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import rezervacijasmestaja.izdavanjeracuna.domen.Gost;
import rezervacijasmestaja.izdavanjeracuna.domen.TipDokumenta;
import rezervacijasmestaja.izdavanjeracuna.dto.GostDTO;

@Component
public class GostMapper implements Mapper<Gost, GostDTO> {

    @Autowired
    private DrzavaMapper drzavaMapper;

    @Override
    public GostDTO toDTO(Gost gost) {
        GostDTO dto = new GostDTO();
        dto.setId(gost.getId());
        dto.setIme(gost.getIme());
        dto.setPrezime(gost.getPrezime());
        dto.setEmail(gost.getEmail());
        dto.setBrojTelefona(gost.getBrojTelefona());
        if (gost.getDrzava() != null) {
            dto.setDrzava(drzavaMapper.toDTO(gost.getDrzava()));
        }
        dto.setTipDokumenta(gost.getTipDokumenta() != null ? gost.getTipDokumenta().name() : null);
        dto.setBrojDokumenta(gost.getBrojDokumenta());
        return dto;
    }

    @Override
    public Gost toEntity(GostDTO dto) {
        Gost gost = new Gost();
        gost.setId(dto.getId());
        gost.setIme(dto.getIme());
        gost.setPrezime(dto.getPrezime());
        gost.setEmail(dto.getEmail());
        gost.setBrojTelefona(dto.getBrojTelefona());
        if (dto.getTipDokumenta() != null) {
        gost.setTipDokumenta(TipDokumenta.valueOf(dto.getTipDokumenta()));
        }
        gost.setBrojDokumenta(dto.getBrojDokumenta());
        if (dto.getDrzava() != null) {
            gost.setDrzava(drzavaMapper.toEntity(dto.getDrzava()));
        }
        
        return gost;
    }
}
package rezervacijasmestaja.izdavanjeracuna.mapper;

import org.springframework.stereotype.Component;
import rezervacijasmestaja.izdavanjeracuna.domen.Zaposleni;
import rezervacijasmestaja.izdavanjeracuna.dto.ZaposleniDTO;

@Component
public class ZaposleniMapper implements Mapper<Zaposleni, ZaposleniDTO> {

    @Override
    public ZaposleniDTO toDTO(Zaposleni zaposleni) {
        ZaposleniDTO dto = new ZaposleniDTO();
        dto.setId(zaposleni.getId());
        dto.setIme(zaposleni.getIme());
        dto.setPrezime(zaposleni.getPrezime());
        dto.setEmail(zaposleni.getEmail());
        dto.setBrojUgovora(zaposleni.getBrojUgovora());
        return dto;
    }

    @Override
    public Zaposleni toEntity(ZaposleniDTO dto) {
        Zaposleni zaposleni = new Zaposleni();
        zaposleni.setId(dto.getId());
        zaposleni.setIme(dto.getIme());
        zaposleni.setPrezime(dto.getPrezime());
        zaposleni.setEmail(dto.getEmail());
        zaposleni.setBrojUgovora(dto.getBrojUgovora());
        return zaposleni;
    }
}
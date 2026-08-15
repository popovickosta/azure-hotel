package rezervacijasmestaja.izdavanjeracuna.mapper;

import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import rezervacijasmestaja.izdavanjeracuna.domen.Racun;
import rezervacijasmestaja.izdavanjeracuna.dto.RacunDTO;

@Component
public class RacunMapper implements Mapper<Racun, RacunDTO> {

    @Autowired
    private RezervacijaMapper rezervacijaMapper;

    @Autowired
    private StavkaRacunaMapper stavkaRacunaMapper;

    @Override
    public RacunDTO toDTO(Racun racun) {
        RacunDTO dto = new RacunDTO();
        dto.setId(racun.getId());
        dto.setDatumIzdavanja(racun.getDatumIzdavanja());
        dto.setUkupanIznos(racun.getUkupanIznos());
        dto.setRezervacija(rezervacijaMapper.toDTO(racun.getRezervacija()));
        if (racun.getStavke() != null) {
            dto.setStavke(racun.getStavke().stream()
                    .map(stavkaRacunaMapper::toDTO)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    @Override
    public Racun toEntity(RacunDTO dto) {
        Racun racun = new Racun();
        racun.setId(dto.getId());
        racun.setDatumIzdavanja(dto.getDatumIzdavanja());
        racun.setUkupanIznos(dto.getUkupanIznos());
        if (dto.getRezervacija() != null) {
            racun.setRezervacija(rezervacijaMapper.toEntity(dto.getRezervacija()));
        }
        if (dto.getStavke() != null) {
            racun.setStavke(dto.getStavke().stream()
                    .map(stavkaRacunaMapper::toEntity)
                    .collect(Collectors.toList()));
        }
        return racun;
    }
}
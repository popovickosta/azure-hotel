package rezervacijasmestaja.izdavanjeracuna.mapper;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import rezervacijasmestaja.izdavanjeracuna.domen.Rezervacija;
import rezervacijasmestaja.izdavanjeracuna.domen.StatusRezervacije;
import rezervacijasmestaja.izdavanjeracuna.domen.UslugaSobe;
import rezervacijasmestaja.izdavanjeracuna.dto.RezervacijaDTO;
import rezervacijasmestaja.izdavanjeracuna.repository.UslugaSobeRepository;

@Component
public class RezervacijaMapper implements Mapper<Rezervacija, RezervacijaDTO> {

    @Autowired
    private GostMapper gostMapper;

    @Autowired
    private SobaMapper sobaMapper;

    @Autowired
    private UslugaSobeMapper uslugaSobeMapper;

    @Autowired
    private UslugaSobeRepository uslugaSobeRepository;

    @Override
    public RezervacijaDTO toDTO(Rezervacija rezervacija) {
        RezervacijaDTO dto = new RezervacijaDTO();
        dto.setId(rezervacija.getId());
        dto.setDatumPrijave(rezervacija.getDatumPrijave());
        dto.setDatumOdjave(rezervacija.getDatumOdjave());
        dto.setStatus(rezervacija.getStatus().name());
        dto.setGost(gostMapper.toDTO(rezervacija.getGost()));
        dto.setSoba(sobaMapper.toDTO(rezervacija.getSoba()));
        if (rezervacija.getUsluge() != null) {
            Map<Long, Integer> usluge = rezervacija.getUsluge().entrySet().stream()
                    .collect(Collectors.toMap(e -> e.getKey().getId(), Map.Entry::getValue));
            dto.setUsluge(usluge);
        }
        return dto;
    }

    @Override
    public Rezervacija toEntity(RezervacijaDTO dto) {
        Rezervacija rezervacija = new Rezervacija();
        rezervacija.setId(dto.getId());
        rezervacija.setDatumPrijave(dto.getDatumPrijave());
        rezervacija.setDatumOdjave(dto.getDatumOdjave());
        rezervacija.setStatus(StatusRezervacije.valueOf(dto.getStatus()));
        if (dto.getGost() != null) {
            rezervacija.setGost(gostMapper.toEntity(dto.getGost()));
        }
        if (dto.getSoba() != null) {
            rezervacija.setSoba(sobaMapper.toEntity(dto.getSoba()));
        }
        if (dto.getUsluge() != null) {
            Map<UslugaSobe, Integer> usluge = new HashMap<>();
            for (Map.Entry<Long, Integer> e : dto.getUsluge().entrySet()) {
                UslugaSobe usluga = uslugaSobeRepository.findById(e.getKey())
                        .orElseThrow(() -> new RuntimeException("Usluga nije pronađena"));
                usluge.put(usluga, e.getValue());
            }
            rezervacija.setUsluge(usluge);
        }
        return rezervacija;
    }
}

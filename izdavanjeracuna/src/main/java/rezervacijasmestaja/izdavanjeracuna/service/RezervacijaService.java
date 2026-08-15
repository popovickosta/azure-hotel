package rezervacijasmestaja.izdavanjeracuna.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rezervacijasmestaja.izdavanjeracuna.domen.Gost;
import rezervacijasmestaja.izdavanjeracuna.domen.Rezervacija;
import rezervacijasmestaja.izdavanjeracuna.domen.Soba;
import rezervacijasmestaja.izdavanjeracuna.domen.StatusRezervacije;
import rezervacijasmestaja.izdavanjeracuna.domen.UslugaSobe;
import rezervacijasmestaja.izdavanjeracuna.dto.PageResponseDTO;
import rezervacijasmestaja.izdavanjeracuna.dto.RezervacijaDTO;
import rezervacijasmestaja.izdavanjeracuna.mapper.RezervacijaMapper;
import rezervacijasmestaja.izdavanjeracuna.repository.GostRepository;
import rezervacijasmestaja.izdavanjeracuna.repository.RezervacijaRepository;
import rezervacijasmestaja.izdavanjeracuna.repository.SobaRepository;
import rezervacijasmestaja.izdavanjeracuna.repository.UslugaSobeRepository;

@Service
public class RezervacijaService implements GenericService<RezervacijaDTO> {

    @Autowired
    private RezervacijaRepository rezervacijaRepository;

    @Autowired
    private RezervacijaMapper rezervacijaMapper;

    @Autowired
    private GostRepository gostRepository;

    @Autowired
    private SobaRepository sobaRepository;

    @Autowired
    private UslugaSobeRepository uslugaSobeRepository;

    @Autowired
    private RacunService racunService;

    @Override
    public List<RezervacijaDTO> findAll() {
        return rezervacijaRepository.findAll(Sort.by(Sort.Direction.DESC, "datumPrijave", "id"))
                .stream()
                .map(rezervacijaMapper::toDTO)
                .collect(Collectors.toList());
    }

    public PageResponseDTO<RezervacijaDTO> findPage(int page, int size) {
        Page<RezervacijaDTO> rezultat = rezervacijaRepository
                .findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "datumPrijave", "id")))
                .map(rezervacijaMapper::toDTO);
        return PageResponseDTO.from(rezultat);
    }

    @Override
    public RezervacijaDTO findById(Long id) {
        Rezervacija rezervacija = rezervacijaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rezervacija nije pronađena"));
        return rezervacijaMapper.toDTO(rezervacija);
    }

    @Override
    public RezervacijaDTO save(RezervacijaDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        Gost gost = gostRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Gost nije pronađen"));

        validirajRezervaciju(dto);

        Soba soba = sobaRepository.findById(dto.getSoba().getId())
                .orElseThrow(() -> new RuntimeException("Soba nije pronađena"));

        if (!isSobaslobodna(soba.getId(), dto.getDatumPrijave(), dto.getDatumOdjave())) {
            throw new RuntimeException("Soba nije slobodna u odabranom periodu");
        }

        Map<UslugaSobe, Integer> usluge = ucitajUsluge(dto.getUsluge());

        Rezervacija rezervacija = new Rezervacija();
        rezervacija.setDatumPrijave(dto.getDatumPrijave());
        rezervacija.setDatumOdjave(dto.getDatumOdjave());
        rezervacija.setStatus(StatusRezervacije.NA_CEKANJU);
        rezervacija.setGost(gost);
        rezervacija.setSoba(soba);
        rezervacija.setUsluge(usluge);
        sacuvajCeneRezervacije(rezervacija, soba, usluge);

        return rezervacijaMapper.toDTO(rezervacijaRepository.save(rezervacija));
    }

    @Override
    public RezervacijaDTO update(Long id, RezervacijaDTO dto) {
        Rezervacija postojeca = rezervacijaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rezervacija nije pronađena"));

        if (postojeca.getStatus() == StatusRezervacije.ZAVRSENA
                || postojeca.getStatus() == StatusRezervacije.OTKAZANA
                || postojeca.getStatus() == StatusRezervacije.ODBIJENA) {
            throw new RuntimeException("Završena, otkazana ili odbijena rezervacija se ne može menjati");
        }

        validirajRezervaciju(dto);
        Soba soba = sobaRepository.findById(dto.getSoba().getId())
                .orElseThrow(() -> new RuntimeException("Soba nije pronađena"));

        if (!rezervacijaRepository.findZauzetaSobaZaIzmenu(
                id, soba.getId(), dto.getDatumPrijave(), dto.getDatumOdjave()).isEmpty()) {
            throw new RuntimeException("Soba nije slobodna u odabranom periodu");
        }

        Map<UslugaSobe, Integer> usluge = ucitajUsluge(dto.getUsluge());

        postojeca.setDatumPrijave(dto.getDatumPrijave());
        postojeca.setDatumOdjave(dto.getDatumOdjave());
        postojeca.setSoba(soba);
        postojeca.setUsluge(usluge);
        sacuvajCeneRezervacije(postojeca, soba, usluge);

        return rezervacijaMapper.toDTO(rezervacijaRepository.save(postojeca));
    }

    @Override
    public void delete(Long id) {
        Rezervacija rezervacija = rezervacijaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rezervacija nije pronađena"));
        if (rezervacija.getStatus() == StatusRezervacije.ZAVRSENA) {
            throw new RuntimeException("Završena rezervacija se ne može obrisati");
        }
        rezervacijaRepository.deleteById(id);
    }

    public List<RezervacijaDTO> findByGost(String email) {
        return rezervacijaRepository.findByGostEmail(email)
                .stream()
                .map(rezervacijaMapper::toDTO)
                .collect(Collectors.toList());
    }

    public PageResponseDTO<RezervacijaDTO> findByGostPage(String email, int page, int size) {
        Page<RezervacijaDTO> rezultat = rezervacijaRepository
                .findByGostEmail(email, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "datumPrijave", "id")))
                .map(rezervacijaMapper::toDTO);
        return PageResponseDTO.from(rezultat);
    }

    public boolean isSobaslobodna(Long sobaId, LocalDate datumPrijave, LocalDate datumOdjave) {
        validirajDatume(datumPrijave, datumOdjave);
        if (!sobaRepository.existsById(sobaId)) {
            throw new RuntimeException("Soba nije pronađena");
        }
        return rezervacijaRepository.findZauzetaSoba(sobaId, datumPrijave, datumOdjave).isEmpty();
    }

    public RezervacijaDTO otkaziRezervacijuGosta(Long id, String email) {
        Rezervacija rezervacija = rezervacijaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rezervacija nije pronađena"));

        if (!rezervacija.getGost().getEmail().equalsIgnoreCase(email)) {
            throw new org.springframework.security.access.AccessDeniedException("Nemate pravo da otkažete ovu rezervaciju");
        }

        if (rezervacija.getStatus() != StatusRezervacije.NA_CEKANJU) {
            throw new RuntimeException("Gost može da otkaže samo rezervaciju koja je na čekanju");
        }

        rezervacija.setStatus(StatusRezervacije.OTKAZANA);
        return rezervacijaMapper.toDTO(rezervacijaRepository.save(rezervacija));
    }

    @Transactional
    public RezervacijaDTO promeniStatus(Long id, String status) {
        Rezervacija rezervacija = rezervacijaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rezervacija nije pronađena"));

        StatusRezervacije noviStatus;
        try {
            noviStatus = StatusRezervacije.valueOf(status);
        } catch (Exception e) {
            throw new RuntimeException("Nepoznat status rezervacije");
        }

        proveriPrelazStatusa(rezervacija, noviStatus);

        if (noviStatus == StatusRezervacije.ZAVRSENA
                && rezervacija.getDatumOdjave().isAfter(LocalDate.now())) {
            throw new RuntimeException("Rezervacija se ne može završiti pre datuma odjave");
        }

        rezervacija.setStatus(noviStatus);
        Rezervacija sacuvana = rezervacijaRepository.save(rezervacija);

        if (noviStatus == StatusRezervacije.ZAVRSENA) {
            racunService.generisiRacun(id);
        }

        return rezervacijaMapper.toDTO(sacuvana);
    }

    private void proveriPrelazStatusa(Rezervacija rezervacija, StatusRezervacije noviStatus) {
        StatusRezervacije trenutni = rezervacija.getStatus();

        boolean dozvoljen = (trenutni == StatusRezervacije.NA_CEKANJU
                && (noviStatus == StatusRezervacije.POTVRDJENA || noviStatus == StatusRezervacije.ODBIJENA))
                || (trenutni == StatusRezervacije.POTVRDJENA
                && (noviStatus == StatusRezervacije.ZAVRSENA || noviStatus == StatusRezervacije.OTKAZANA));

        if (!dozvoljen) {
            throw new RuntimeException("Nedozvoljen prelaz statusa: " + trenutni + " -> " + noviStatus);
        }
    }

    private void validirajRezervaciju(RezervacijaDTO dto) {
        if (dto == null || dto.getSoba() == null || dto.getSoba().getId() == null) {
            throw new RuntimeException("Soba je obavezna");
        }
        validirajDatume(dto.getDatumPrijave(), dto.getDatumOdjave());

        if (dto.getUsluge() != null) {
            for (Map.Entry<Long, Integer> entry : dto.getUsluge().entrySet()) {
                if (entry.getKey() == null) {
                    throw new RuntimeException("Usluga nije ispravna");
                }
                if (entry.getValue() == null || entry.getValue() < 1) {
                    throw new RuntimeException("Količina usluge mora biti najmanje 1");
                }
            }
        }
    }

    private void validirajDatume(LocalDate datumPrijave, LocalDate datumOdjave) {
        if (datumPrijave == null || datumOdjave == null) {
            throw new RuntimeException("Datum prijave i datum odjave su obavezni");
        }
        if (datumPrijave.isBefore(LocalDate.now())) {
            throw new RuntimeException("Datum prijave ne može biti u prošlosti");
        }
        if (!datumOdjave.isAfter(datumPrijave)) {
            throw new RuntimeException("Datum odjave mora biti posle datuma prijave");
        }
    }

    private Map<UslugaSobe, Integer> ucitajUsluge(Map<Long, Integer> dtoUsluge) {
        Map<UslugaSobe, Integer> usluge = new HashMap<>();
        if (dtoUsluge == null) {
            return usluge;
        }

        for (Map.Entry<Long, Integer> entry : dtoUsluge.entrySet()) {
            UslugaSobe usluga = uslugaSobeRepository.findById(entry.getKey())
                    .orElseThrow(() -> new RuntimeException("Usluga nije pronađena"));
            usluge.put(usluga, entry.getValue());
        }
        return usluge;
    }

    private void sacuvajCeneRezervacije(Rezervacija rezervacija, Soba soba, Map<UslugaSobe, Integer> usluge) {
        rezervacija.setCenaSobePoNoci(soba.getCenaPoNoci());
        Map<Long, BigDecimal> ceneUsluga = new HashMap<>();
        for (UslugaSobe usluga : usluge.keySet()) {
            ceneUsluga.put(usluga.getId(), usluga.getCena());
        }
        rezervacija.setCeneUsluga(ceneUsluga);
    }

    @Scheduled(cron = "0 0 11 * * *")
    @Transactional
    public void automatskiZavrsiRezervacije() {
        LocalDate danas = LocalDate.now();
        List<Rezervacija> rezervacije = rezervacijaRepository
                .findByStatusAndDatumOdjaveLessThanEqual(StatusRezervacije.POTVRDJENA, danas);

        for (Rezervacija rezervacija : rezervacije) {
            promeniStatus(rezervacija.getId(), StatusRezervacije.ZAVRSENA.name());
        }
    }
}

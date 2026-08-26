package rezervacijasmestaja.izdavanjeracuna.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rezervacijasmestaja.izdavanjeracuna.domen.Racun;
import rezervacijasmestaja.izdavanjeracuna.domen.Rezervacija;
import rezervacijasmestaja.izdavanjeracuna.domen.StatusRezervacije;
import rezervacijasmestaja.izdavanjeracuna.domen.StavkaRacuna;
import rezervacijasmestaja.izdavanjeracuna.domen.UslugaSobe;
import rezervacijasmestaja.izdavanjeracuna.dto.PageResponseDTO;
import rezervacijasmestaja.izdavanjeracuna.dto.RacunDTO;
import rezervacijasmestaja.izdavanjeracuna.mapper.RacunMapper;
import rezervacijasmestaja.izdavanjeracuna.repository.RacunRepository;
import rezervacijasmestaja.izdavanjeracuna.repository.RezervacijaRepository;

@Service
public class RacunService implements GenericService<RacunDTO> {

    @Autowired
    private RacunRepository racunRepository;

    @Autowired
    private RezervacijaRepository rezervacijaRepository;

    @Autowired
    private RacunMapper racunMapper;

    @Override
    public List<RacunDTO> findAll() {
        return racunRepository.findAll(Sort.by(Sort.Direction.DESC, "datumIzdavanja", "id"))
                .stream()
                .map(racunMapper::toDTO)
                .collect(Collectors.toList());
    }

    public PageResponseDTO<RacunDTO> findPage(int page, int size) {
        Page<RacunDTO> rezultat = racunRepository
                .findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "datumIzdavanja", "id")))
                .map(racunMapper::toDTO);
        return PageResponseDTO.from(rezultat);
    }

    @Override
    public RacunDTO findById(Long id) {
        Racun racun = racunRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Račun nije pronađen"));
        return racunMapper.toDTO(racun);
    }

    @Override
    public RacunDTO save(RacunDTO dto) {
        Racun racun = racunMapper.toEntity(dto);
        return racunMapper.toDTO(racunRepository.save(racun));
    }

    @Override
    public RacunDTO update(Long id, RacunDTO dto) {
        racunRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Račun nije pronađen"));
        Racun racun = racunMapper.toEntity(dto);
        racun.setId(id);
        return racunMapper.toDTO(racunRepository.save(racun));
    }

    @Override
    public void delete(Long id) {
        racunRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Račun nije pronađen"));
        racunRepository.deleteById(id);
    }

    @Transactional
    public RacunDTO generisiRacun(Long rezervacijaId) {
        Rezervacija rezervacija = rezervacijaRepository.findById(rezervacijaId)
                .orElseThrow(() -> new RuntimeException("Rezervacija nije pronađena"));

        if (rezervacija.getStatus() != StatusRezervacije.ZAVRSENA) {
            throw new RuntimeException("Račun se može generisati samo za završenu rezervaciju");
        }

        var postojeci = racunRepository.findByRezervacijaId(rezervacijaId);
        if (postojeci.isPresent()) {
            return racunMapper.toDTO(postojeci.get());
        }

        long brojNoci = ChronoUnit.DAYS.between(
                rezervacija.getDatumPrijave(),
                rezervacija.getDatumOdjave()
        );

        if (brojNoci <= 0) {
            throw new RuntimeException("Neispravan broj noći za obračun računa");
        }

        List<StavkaRacuna> stavke = new ArrayList<>();

        StavkaRacuna stavkaSobe = new StavkaRacuna();
        stavkaSobe.setNaziv("Soba " + rezervacija.getSoba().getBrojSobe());
        stavkaSobe.setKolicina((int) brojNoci);
        BigDecimal cenaSobe = rezervacija.getCenaSobePoNoci() != null
                ? rezervacija.getCenaSobePoNoci()
                : rezervacija.getSoba().getCenaPoNoci();
        stavkaSobe.setCenaPoJedinici(cenaSobe);
        stavke.add(stavkaSobe);

        if (rezervacija.getUsluge() != null) {
            for (Map.Entry<UslugaSobe, Integer> entry : rezervacija.getUsluge().entrySet()) {
                UslugaSobe usluga = entry.getKey();
                Integer kolicina = entry.getValue();
                if (kolicina == null || kolicina < 1) {
                    throw new RuntimeException("Neispravna količina usluge na rezervaciji");
                }

                BigDecimal cenaUsluge = usluga.getCena();
                if (rezervacija.getCeneUsluga() != null
                        && rezervacija.getCeneUsluga().get(usluga.getId()) != null) {
                    cenaUsluge = rezervacija.getCeneUsluga().get(usluga.getId());
                }

                StavkaRacuna stavkaUsluge = new StavkaRacuna();
                stavkaUsluge.setNaziv(usluga.getNaziv());
                stavkaUsluge.setKolicina(kolicina);
                stavkaUsluge.setCenaPoJedinici(cenaUsluge);
                stavkaUsluge.setUsluga(usluga);
                stavke.add(stavkaUsluge);
            }
        }

        BigDecimal ukupanIznos = stavke.stream()
                .map(s -> s.getCenaPoJedinici().multiply(BigDecimal.valueOf(s.getKolicina())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Racun racun = new Racun();
        racun.setDatumIzdavanja(LocalDate.now());
        racun.setRezervacija(rezervacija);
        racun.setUkupanIznos(ukupanIznos);
        racun.setStavke(stavke);

        stavke.forEach(s -> s.setRacun(racun));

        return racunMapper.toDTO(racunRepository.save(racun));
    }

    public RacunDTO findByRezervacijaZaKorisnika(Long rezervacijaId, Authentication auth) {
        Racun racun = racunRepository.findByRezervacijaId(rezervacijaId)
                .orElseThrow(() -> new RuntimeException("Račun za ovu rezervaciju ne postoji"));
        proveriPristup(racun, auth);
        return racunMapper.toDTO(racun);
    }

    public void proveriPristupRacunu(Long racunId, Authentication auth) {
        Racun racun = racunRepository.findById(racunId)
                .orElseThrow(() -> new RuntimeException("Račun nije pronađen"));
        proveriPristup(racun, auth);
    }

    private void proveriPristup(Racun racun, Authentication auth) {
        boolean jeGost = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_GOST"));

        if (jeGost && !racun.getRezervacija().getGost().getEmail().equalsIgnoreCase(auth.getName())) {
            throw new AccessDeniedException("Nemate pravo pristupa ovom računu");
        }
    }
}

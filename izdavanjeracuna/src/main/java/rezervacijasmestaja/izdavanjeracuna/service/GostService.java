package rezervacijasmestaja.izdavanjeracuna.service;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import rezervacijasmestaja.izdavanjeracuna.domen.Drzava;
import rezervacijasmestaja.izdavanjeracuna.domen.Gost;
import rezervacijasmestaja.izdavanjeracuna.domen.TipDokumenta;
import rezervacijasmestaja.izdavanjeracuna.dto.GostDTO;
import rezervacijasmestaja.izdavanjeracuna.dto.PageResponseDTO;
import rezervacijasmestaja.izdavanjeracuna.mapper.GostMapper;
import rezervacijasmestaja.izdavanjeracuna.repository.DrzavaRepository;
import rezervacijasmestaja.izdavanjeracuna.repository.GostRepository;
import rezervacijasmestaja.izdavanjeracuna.repository.KorisnikRepository;
import rezervacijasmestaja.izdavanjeracuna.repository.RezervacijaRepository;

@Service
public class GostService implements GenericService<GostDTO> {

    @Autowired
    private GostRepository gostRepository;

    @Autowired
    private GostMapper gostMapper;

    @Autowired
    private DrzavaRepository drzavaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private KorisnikRepository korisnikRepository;

    @Autowired
    private RezervacijaRepository rezervacijaRepository;

    @Override
    public void delete(Long id) {
        gostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gost nije pronađen"));

        if (rezervacijaRepository.existsByGostId(id)) {
            throw new RuntimeException("Gost se ne može obrisati jer je vezan za postojeću rezervaciju.");
        }

        gostRepository.deleteById(id);
    }

    @Override
    public List<GostDTO> findAll() {
        return gostRepository.findAllByOrderByPrezimeAscImeAsc()
                .stream()
                .map(gostMapper::toDTO)
                .collect(Collectors.toList());
    }

    public PageResponseDTO<GostDTO> findPage(int page, int size) {
        Page<GostDTO> rezultat = gostRepository
                .findAll(PageRequest.of(page, size, Sort.by("prezime").ascending().and(Sort.by("ime").ascending())))
                .map(gostMapper::toDTO);
        return PageResponseDTO.from(rezultat);
    }

    @Override
    public GostDTO findById(Long id) {
        Gost gost = gostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gost nije pronađen"));
        return gostMapper.toDTO(gost);
    }

    @Override
    public GostDTO save(GostDTO dto) {
        if (dto.getLozinka() == null || dto.getLozinka().isBlank()) {
            throw new RuntimeException("Lozinka je obavezna za novog gosta");
        }

        String email = dto.getEmail().trim().toLowerCase();
        if (korisnikRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Korisnik sa ovim emailom već postoji");
        }

        TipDokumenta tipDokumenta = parsirajTipDokumenta(dto.getTipDokumenta());
        if (gostRepository.existsByTipDokumentaAndBrojDokumenta(tipDokumenta, dto.getBrojDokumenta())) {
            throw new RuntimeException("Gost sa ovim dokumentom već postoji.");
        }

        if (dto.getDrzava() == null || dto.getDrzava().getId() == null) {
            throw new RuntimeException("Država je obavezna");
        }

        Gost gost = gostMapper.toEntity(dto);
        gost.setEmail(email);
        gost.setLozinka(passwordEncoder.encode(dto.getLozinka()));
        gost.setVerifikovan(true);

        Drzava drzava = drzavaRepository.findById(dto.getDrzava().getId())
                .orElseThrow(() -> new RuntimeException("Država nije pronađena"));
        gost.setDrzava(drzava);

        return gostMapper.toDTO(gostRepository.save(gost));
    }

    @Override
    public GostDTO update(Long id, GostDTO dto) {
        Gost postojeci = gostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gost nije pronađen"));

        String email = dto.getEmail().trim().toLowerCase();
        korisnikRepository.findByEmail(email).ifPresent(korisnik -> {
            if (!korisnik.getId().equals(id)) {
                throw new RuntimeException("Korisnik sa ovim emailom već postoji");
            }
        });

        TipDokumenta noviTip = parsirajTipDokumenta(dto.getTipDokumenta());
        boolean promenjeno = !noviTip.equals(postojeci.getTipDokumenta())
                || !dto.getBrojDokumenta().equals(postojeci.getBrojDokumenta());

        if (promenjeno && gostRepository.existsByTipDokumentaAndBrojDokumenta(noviTip, dto.getBrojDokumenta())) {
            throw new RuntimeException("Gost sa ovim dokumentom već postoji.");
        }

        if (dto.getDrzava() == null || dto.getDrzava().getId() == null) {
            throw new RuntimeException("Država je obavezna");
        }

        Drzava drzava = drzavaRepository.findById(dto.getDrzava().getId())
                .orElseThrow(() -> new RuntimeException("Država nije pronađena"));

        postojeci.setIme(dto.getIme());
        postojeci.setPrezime(dto.getPrezime());
        postojeci.setEmail(email);
        postojeci.setBrojTelefona(dto.getBrojTelefona());
        postojeci.setDrzava(drzava);
        postojeci.setTipDokumenta(noviTip);
        postojeci.setBrojDokumenta(dto.getBrojDokumenta());

        return gostMapper.toDTO(gostRepository.save(postojeci));
    }

    private TipDokumenta parsirajTipDokumenta(String tip) {
        try {
            return TipDokumenta.valueOf(tip);
        } catch (Exception e) {
            throw new RuntimeException("Nepoznat tip dokumenta");
        }
    }
}

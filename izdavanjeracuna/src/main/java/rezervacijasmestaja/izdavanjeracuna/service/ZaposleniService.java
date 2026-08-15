package rezervacijasmestaja.izdavanjeracuna.service;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import rezervacijasmestaja.izdavanjeracuna.domen.Zaposleni;
import rezervacijasmestaja.izdavanjeracuna.dto.PageResponseDTO;
import rezervacijasmestaja.izdavanjeracuna.dto.ZaposleniDTO;
import rezervacijasmestaja.izdavanjeracuna.mapper.ZaposleniMapper;
import rezervacijasmestaja.izdavanjeracuna.repository.KorisnikRepository;
import rezervacijasmestaja.izdavanjeracuna.repository.ZaposleniRepository;

@Service
public class ZaposleniService implements GenericService<ZaposleniDTO> {

    @Autowired
    private ZaposleniRepository zaposleniRepository;

    @Autowired
    private ZaposleniMapper zaposleniMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private KorisnikRepository korisnikRepository;

    @Override
    public List<ZaposleniDTO> findAll() {
        return zaposleniRepository.findAllByOrderByPrezimeAscImeAsc()
                .stream()
                .map(zaposleniMapper::toDTO)
                .collect(Collectors.toList());
    }

    public PageResponseDTO<ZaposleniDTO> findPage(int page, int size) {
        Page<ZaposleniDTO> rezultat = zaposleniRepository
                .findAll(PageRequest.of(page, size, Sort.by("prezime").ascending().and(Sort.by("ime").ascending())))
                .map(zaposleniMapper::toDTO);
        return PageResponseDTO.from(rezultat);
    }

    @Override
    public ZaposleniDTO findById(Long id) {
        Zaposleni zaposleni = zaposleniRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Zaposleni nije pronađen"));
        return zaposleniMapper.toDTO(zaposleni);
    }

    @Override
    public ZaposleniDTO save(ZaposleniDTO dto) {
        if (dto.getLozinka() == null || dto.getLozinka().isBlank()) {
            throw new RuntimeException("Lozinka je obavezna za novog zaposlenog");
        }
        String email = dto.getEmail().trim().toLowerCase();
        if (korisnikRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Korisnik sa ovim emailom već postoji");
        }
        if (zaposleniRepository.findByBrojUgovora(dto.getBrojUgovora()).isPresent()) {
            throw new RuntimeException("Zaposleni sa ovim brojem ugovora već postoji");
        }

        Zaposleni zaposleni = zaposleniMapper.toEntity(dto);
        zaposleni.setEmail(email);
        zaposleni.setLozinka(passwordEncoder.encode(dto.getLozinka()));
        zaposleni.setVerifikovan(true);
        return zaposleniMapper.toDTO(zaposleniRepository.save(zaposleni));
    }

    @Override
    public ZaposleniDTO update(Long id, ZaposleniDTO dto) {
        Zaposleni postojeci = zaposleniRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Zaposleni nije pronađen"));

        String email = dto.getEmail().trim().toLowerCase();
        korisnikRepository.findByEmail(email).ifPresent(korisnik -> {
            if (!korisnik.getId().equals(id)) {
                throw new RuntimeException("Korisnik sa ovim emailom već postoji");
            }
        });

        if (!dto.getBrojUgovora().equals(postojeci.getBrojUgovora())
                && zaposleniRepository.findByBrojUgovora(dto.getBrojUgovora()).isPresent()) {
            throw new RuntimeException("Zaposleni sa ovim brojem ugovora već postoji");
        }

        postojeci.setIme(dto.getIme());
        postojeci.setPrezime(dto.getPrezime());
        postojeci.setEmail(email);
        postojeci.setBrojUgovora(dto.getBrojUgovora());
        if (dto.getLozinka() != null && !dto.getLozinka().isBlank()) {
            postojeci.setLozinka(passwordEncoder.encode(dto.getLozinka()));
        }
        return zaposleniMapper.toDTO(zaposleniRepository.save(postojeci));
    }

    @Override
    public void delete(Long id) {
        zaposleniRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Zaposleni nije pronađen"));
        zaposleniRepository.deleteById(id);
    }
}

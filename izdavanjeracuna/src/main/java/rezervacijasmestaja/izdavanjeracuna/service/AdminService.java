package rezervacijasmestaja.izdavanjeracuna.service;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import rezervacijasmestaja.izdavanjeracuna.domen.Admin;
import rezervacijasmestaja.izdavanjeracuna.dto.AdminDTO;
import rezervacijasmestaja.izdavanjeracuna.mapper.AdminMapper;
import rezervacijasmestaja.izdavanjeracuna.repository.AdminRepository;
import rezervacijasmestaja.izdavanjeracuna.repository.KorisnikRepository;

@Service
public class AdminService implements GenericService<AdminDTO> {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private AdminMapper adminMapper;

    @Autowired
    private KorisnikRepository korisnikRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public List<AdminDTO> findAll() {
        return adminRepository.findAll()
                .stream()
                .map(adminMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public AdminDTO findById(Long id) {
        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin nije pronađen"));
        return adminMapper.toDTO(admin);
    }

    @Override
    public AdminDTO save(AdminDTO dto) {
        if (dto.getLozinka() == null || dto.getLozinka().isBlank()) {
            throw new RuntimeException("Lozinka je obavezna za novog administratora");
        }
        String email = dto.getEmail().trim().toLowerCase();
        if (korisnikRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Korisnik sa ovim emailom već postoji");
        }

        Admin admin = adminMapper.toEntity(dto);
        admin.setEmail(email);
        admin.setLozinka(passwordEncoder.encode(dto.getLozinka()));
        admin.setVerifikovan(true);
        return adminMapper.toDTO(adminRepository.save(admin));
    }

    @Override
    public AdminDTO update(Long id, AdminDTO dto) {
        Admin postojeci = adminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin nije pronađen"));

        String email = dto.getEmail().trim().toLowerCase();
        korisnikRepository.findByEmail(email).ifPresent(korisnik -> {
            if (!korisnik.getId().equals(id)) {
                throw new RuntimeException("Korisnik sa ovim emailom već postoji");
            }
        });

        postojeci.setIme(dto.getIme());
        postojeci.setPrezime(dto.getPrezime());
        postojeci.setEmail(email);
        if (dto.getLozinka() != null && !dto.getLozinka().isBlank()) {
            postojeci.setLozinka(passwordEncoder.encode(dto.getLozinka()));
        }
        return adminMapper.toDTO(adminRepository.save(postojeci));
    }

    @Override
    public void delete(Long id) {
        adminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin nije pronađen"));
        adminRepository.deleteById(id);
    }
}

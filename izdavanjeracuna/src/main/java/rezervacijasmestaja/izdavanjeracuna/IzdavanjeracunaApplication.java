package rezervacijasmestaja.izdavanjeracuna;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;
import rezervacijasmestaja.izdavanjeracuna.domen.Admin;
import rezervacijasmestaja.izdavanjeracuna.repository.AdminRepository;
import rezervacijasmestaja.izdavanjeracuna.repository.KorisnikRepository;

@SpringBootApplication
@EnableScheduling
public class IzdavanjeracunaApplication {

    @Autowired
    private KorisnikRepository korisnikRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public static void main(String[] args) {
        SpringApplication.run(IzdavanjeracunaApplication.class, args);
    }

    @PostConstruct
    public void init() {
        if (korisnikRepository.findByEmail("admin@gmail.com").isEmpty()) {
            Admin admin = new Admin();
            admin.setIme("Admin");
            admin.setPrezime("Admin");
            admin.setEmail("admin@gmail.com");
            admin.setLozinka(passwordEncoder.encode("admin123"));
            admin.setVerifikovan(true);
            adminRepository.save(admin);
        }
    }
}

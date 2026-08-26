package rezervacijasmestaja.izdavanjeracuna.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import rezervacijasmestaja.izdavanjeracuna.domen.Korisnik;

@Repository
public interface KorisnikRepository extends JpaRepository<Korisnik, Long> {
    Optional<Korisnik> findByEmail(String email);
    Optional<Korisnik> findByVerificationToken(String verificationToken);
}

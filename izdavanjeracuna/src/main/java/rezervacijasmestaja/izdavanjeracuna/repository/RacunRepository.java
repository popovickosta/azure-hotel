package rezervacijasmestaja.izdavanjeracuna.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import rezervacijasmestaja.izdavanjeracuna.domen.Racun;

@Repository
public interface RacunRepository extends JpaRepository<Racun, Long> {
    Optional<Racun> findByRezervacijaId(Long rezervacijaId);
}
package rezervacijasmestaja.izdavanjeracuna.repository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import rezervacijasmestaja.izdavanjeracuna.domen.Zaposleni;
@Repository
public interface ZaposleniRepository extends JpaRepository<Zaposleni, Long> {
    Optional<Zaposleni> findByBrojUgovora(String brojUgovora);
    List<Zaposleni> findAllByOrderByPrezimeAscImeAsc();
}
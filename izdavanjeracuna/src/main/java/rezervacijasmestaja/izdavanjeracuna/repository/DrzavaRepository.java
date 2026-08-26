package rezervacijasmestaja.izdavanjeracuna.repository;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import rezervacijasmestaja.izdavanjeracuna.domen.Drzava;
@Repository
public interface DrzavaRepository extends JpaRepository<Drzava, Long> {
    Optional<Drzava> findByNaziv(String naziv);
}
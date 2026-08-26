package rezervacijasmestaja.izdavanjeracuna.repository;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import rezervacijasmestaja.izdavanjeracuna.domen.UslugaSobe;
@Repository
public interface UslugaSobeRepository extends JpaRepository<UslugaSobe, Long> {
    Optional<UslugaSobe> findByNaziv(String naziv);
}
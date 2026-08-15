package rezervacijasmestaja.izdavanjeracuna.repository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import rezervacijasmestaja.izdavanjeracuna.domen.Soba;
@Repository
public interface SobaRepository extends JpaRepository<Soba, Long> {
    Optional<Soba> findByBrojSobe(String brojSobe);
    List<Soba> findAllByOrderByBrojSobeAsc();
}
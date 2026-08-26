package rezervacijasmestaja.izdavanjeracuna.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import rezervacijasmestaja.izdavanjeracuna.domen.Gost;
import rezervacijasmestaja.izdavanjeracuna.domen.TipDokumenta;

@Repository
public interface GostRepository extends JpaRepository<Gost, Long> {

    List<Gost> findAllByOrderByPrezimeAscImeAsc();

    Optional<Gost> findByEmail(String email);

    boolean existsByTipDokumentaAndBrojDokumenta(TipDokumenta tipDokumenta, String brojDokumenta);

    boolean existsByDrzavaId(Long drzavaId);
}

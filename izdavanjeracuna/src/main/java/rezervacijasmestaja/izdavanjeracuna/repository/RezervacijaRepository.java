package rezervacijasmestaja.izdavanjeracuna.repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import rezervacijasmestaja.izdavanjeracuna.domen.Rezervacija;
import rezervacijasmestaja.izdavanjeracuna.domen.StatusRezervacije;

@Repository
public interface RezervacijaRepository extends JpaRepository<Rezervacija, Long> {

    @Query("SELECT r FROM Rezervacija r WHERE r.gost.email = :email")
    List<Rezervacija> findByGostEmail(@Param("email") String email);

    @Query("SELECT r FROM Rezervacija r WHERE r.gost.email = :email")
    Page<Rezervacija> findByGostEmail(@Param("email") String email, Pageable pageable);

    @Query("SELECT r FROM Rezervacija r WHERE r.soba.id = :sobaId AND r.status NOT IN ('OTKAZANA', 'ODBIJENA') AND r.datumPrijave < :datumOdjave AND r.datumOdjave > :datumPrijave")
    List<Rezervacija> findZauzetaSoba(
            @Param("sobaId") Long sobaId,
            @Param("datumPrijave") LocalDate datumPrijave,
            @Param("datumOdjave") LocalDate datumOdjave);

    @Query("SELECT r FROM Rezervacija r WHERE r.id != :rezervacijaId AND r.soba.id = :sobaId AND r.status NOT IN ('OTKAZANA', 'ODBIJENA') AND r.datumPrijave < :datumOdjave AND r.datumOdjave > :datumPrijave")
    List<Rezervacija> findZauzetaSobaZaIzmenu(
            @Param("rezervacijaId") Long rezervacijaId,
            @Param("sobaId") Long sobaId,
            @Param("datumPrijave") LocalDate datumPrijave,
            @Param("datumOdjave") LocalDate datumOdjave);

    @Query("SELECT COUNT(r) > 0 FROM Rezervacija r JOIN r.usluge u WHERE KEY(u).id = :uslugaId")
    boolean postojiRezervacijaSaUslugom(@Param("uslugaId") Long uslugaId);

    List<Rezervacija> findByStatusAndDatumOdjaveLessThanEqual(StatusRezervacije status, LocalDate datumOdjave);

    boolean existsBySobaId(Long sobaId);
    boolean existsByGostId(Long gostId);
}

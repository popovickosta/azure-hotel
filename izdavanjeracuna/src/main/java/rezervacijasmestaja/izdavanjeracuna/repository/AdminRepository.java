package rezervacijasmestaja.izdavanjeracuna.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import rezervacijasmestaja.izdavanjeracuna.domen.Admin;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {
}
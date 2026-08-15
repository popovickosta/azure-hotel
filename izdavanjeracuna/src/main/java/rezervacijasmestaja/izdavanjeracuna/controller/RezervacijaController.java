package rezervacijasmestaja.izdavanjeracuna.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import rezervacijasmestaja.izdavanjeracuna.dto.PageResponseDTO;
import rezervacijasmestaja.izdavanjeracuna.dto.RezervacijaDTO;
import rezervacijasmestaja.izdavanjeracuna.service.RezervacijaService;

@RestController
@RequestMapping("/api/rezervacije")
public class RezervacijaController {

    @Autowired
    private RezervacijaService rezervacijaService;

    @GetMapping
    public ResponseEntity<List<RezervacijaDTO>> findAll() {
        return ResponseEntity.ok(rezervacijaService.findAll());
    }

    @GetMapping("/paginirano")
    public ResponseEntity<PageResponseDTO<RezervacijaDTO>> findPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size) {
        return ResponseEntity.ok(rezervacijaService.findPage(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RezervacijaDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(rezervacijaService.findById(id));
    }

    @PostMapping
    public ResponseEntity<RezervacijaDTO> save(@RequestBody RezervacijaDTO dto) {
        return ResponseEntity.ok(rezervacijaService.save(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RezervacijaDTO> update(@PathVariable Long id, @RequestBody RezervacijaDTO dto) {
        return ResponseEntity.ok(rezervacijaService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        rezervacijaService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/moje")
    public ResponseEntity<List<RezervacijaDTO>> mojeRezervacije(Authentication auth) {
        return ResponseEntity.ok(rezervacijaService.findByGost(auth.getName()));
    }

    @GetMapping("/moje/paginirano")
    public ResponseEntity<PageResponseDTO<RezervacijaDTO>> mojeRezervacijePaginirano(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size) {
        return ResponseEntity.ok(rezervacijaService.findByGostPage(auth.getName(), page, size));
    }

    @GetMapping("/slobodna")
    public ResponseEntity<Boolean> proveriSlobodan(
            @RequestParam Long sobaId,
            @RequestParam String datumPrijave,
            @RequestParam String datumOdjave) {
        return ResponseEntity.ok(rezervacijaService.isSobaslobodna(
                sobaId,
                LocalDate.parse(datumPrijave),
                LocalDate.parse(datumOdjave)
        ));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<RezervacijaDTO> promeniStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> telo) {
        return ResponseEntity.ok(rezervacijaService.promeniStatus(id, telo.get("status")));
    }

    @PutMapping("/{id}/otkazi")
    public ResponseEntity<RezervacijaDTO> otkaziRezervacijuGosta(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(rezervacijaService.otkaziRezervacijuGosta(id, auth.getName()));
    }
}

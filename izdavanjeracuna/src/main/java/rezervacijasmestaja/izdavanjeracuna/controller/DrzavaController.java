package rezervacijasmestaja.izdavanjeracuna.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import rezervacijasmestaja.izdavanjeracuna.dto.DrzavaDTO;
import rezervacijasmestaja.izdavanjeracuna.dto.PageResponseDTO;
import rezervacijasmestaja.izdavanjeracuna.service.DrzavaService;

@RestController
@RequestMapping("/api/drzave")
public class DrzavaController {

    @Autowired
    private DrzavaService drzavaService;

    @GetMapping
    public ResponseEntity<List<DrzavaDTO>> findAll() {
        return ResponseEntity.ok(drzavaService.findAll());
    }

    @GetMapping("/paginirano")
    public ResponseEntity<PageResponseDTO<DrzavaDTO>> findPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size) {
        return ResponseEntity.ok(drzavaService.findPage(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DrzavaDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(drzavaService.findById(id));
    }

    @PostMapping
    public ResponseEntity<DrzavaDTO> save(@Valid @RequestBody DrzavaDTO dto) {
        return ResponseEntity.ok(drzavaService.save(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DrzavaDTO> update(@PathVariable Long id, @Valid @RequestBody DrzavaDTO dto) {
        return ResponseEntity.ok(drzavaService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        drzavaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

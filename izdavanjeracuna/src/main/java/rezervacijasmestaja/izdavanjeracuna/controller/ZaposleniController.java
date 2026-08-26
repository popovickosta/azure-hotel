package rezervacijasmestaja.izdavanjeracuna.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import rezervacijasmestaja.izdavanjeracuna.dto.PageResponseDTO;
import rezervacijasmestaja.izdavanjeracuna.dto.ZaposleniDTO;
import rezervacijasmestaja.izdavanjeracuna.service.ZaposleniService;

@RestController
@RequestMapping("/api/zaposleni")
public class ZaposleniController {

    @Autowired
    private ZaposleniService zaposleniService;

    @GetMapping
    public ResponseEntity<List<ZaposleniDTO>> findAll() {
        return ResponseEntity.ok(zaposleniService.findAll());
    }

    @GetMapping("/paginirano")
    public ResponseEntity<PageResponseDTO<ZaposleniDTO>> findPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size) {
        return ResponseEntity.ok(zaposleniService.findPage(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ZaposleniDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(zaposleniService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ZaposleniDTO> save(@Valid @RequestBody ZaposleniDTO dto) {
        return ResponseEntity.ok(zaposleniService.save(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ZaposleniDTO> update(@PathVariable Long id, @Valid @RequestBody ZaposleniDTO dto) {
        return ResponseEntity.ok(zaposleniService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        zaposleniService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

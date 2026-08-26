package rezervacijasmestaja.izdavanjeracuna.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import rezervacijasmestaja.izdavanjeracuna.dto.PageResponseDTO;
import rezervacijasmestaja.izdavanjeracuna.dto.SobaDTO;
import rezervacijasmestaja.izdavanjeracuna.service.SobaService;

@RestController
@RequestMapping("/api/sobe")
public class SobaController {

    @Autowired
    private SobaService sobaService;

    @GetMapping
    public ResponseEntity<List<SobaDTO>> findAll() {
        return ResponseEntity.ok(sobaService.findAll());
    }

    @GetMapping("/paginirano")
    public ResponseEntity<PageResponseDTO<SobaDTO>> findPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size) {
        return ResponseEntity.ok(sobaService.findPage(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SobaDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(sobaService.findById(id));
    }

    @PostMapping
    public ResponseEntity<SobaDTO> save(@Valid @RequestBody SobaDTO dto) {
        return ResponseEntity.ok(sobaService.save(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SobaDTO> update(@PathVariable Long id, @Valid @RequestBody SobaDTO dto) {
        return ResponseEntity.ok(sobaService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        sobaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

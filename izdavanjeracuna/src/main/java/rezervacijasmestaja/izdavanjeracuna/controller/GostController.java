package rezervacijasmestaja.izdavanjeracuna.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import rezervacijasmestaja.izdavanjeracuna.dto.GostDTO;
import rezervacijasmestaja.izdavanjeracuna.dto.PageResponseDTO;
import rezervacijasmestaja.izdavanjeracuna.service.GostService;

@RestController
@RequestMapping("/api/gosti")
public class GostController {

    @Autowired
    private GostService gostService;

    @GetMapping
    public ResponseEntity<List<GostDTO>> findAll() {
        return ResponseEntity.ok(gostService.findAll());
    }

    @GetMapping("/paginirano")
    public ResponseEntity<PageResponseDTO<GostDTO>> findPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size) {
        return ResponseEntity.ok(gostService.findPage(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GostDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(gostService.findById(id));
    }

    @PostMapping
    public ResponseEntity<GostDTO> save(@Valid @RequestBody GostDTO dto) {
        return ResponseEntity.ok(gostService.save(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GostDTO> update(@PathVariable Long id, @Valid @RequestBody GostDTO dto) {
        return ResponseEntity.ok(gostService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        gostService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

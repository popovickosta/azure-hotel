package rezervacijasmestaja.izdavanjeracuna.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import rezervacijasmestaja.izdavanjeracuna.dto.PageResponseDTO;
import rezervacijasmestaja.izdavanjeracuna.dto.UslugaSobeDTO;
import rezervacijasmestaja.izdavanjeracuna.service.UslugaSobeService;

@RestController
@RequestMapping("/api/usluge")
public class UslugaSobeController {

    @Autowired
    private UslugaSobeService uslugaSobeService;

    @GetMapping
    public ResponseEntity<List<UslugaSobeDTO>> findAll() {
        return ResponseEntity.ok(uslugaSobeService.findAll());
    }

    @GetMapping("/paginirano")
    public ResponseEntity<PageResponseDTO<UslugaSobeDTO>> findPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size) {
        return ResponseEntity.ok(uslugaSobeService.findPage(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UslugaSobeDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(uslugaSobeService.findById(id));
    }

    @PostMapping
    public ResponseEntity<UslugaSobeDTO> save(@Valid @RequestBody UslugaSobeDTO dto) {
        return ResponseEntity.ok(uslugaSobeService.save(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UslugaSobeDTO> update(@PathVariable Long id, @Valid @RequestBody UslugaSobeDTO dto) {
        return ResponseEntity.ok(uslugaSobeService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        uslugaSobeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

package rezervacijasmestaja.izdavanjeracuna.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import rezervacijasmestaja.izdavanjeracuna.dto.AdminDTO;
import rezervacijasmestaja.izdavanjeracuna.service.AdminService;

@RestController
@RequestMapping("/api/admini")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping
    public ResponseEntity<List<AdminDTO>> findAll() {
        return ResponseEntity.ok(adminService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.findById(id));
    }

    @PostMapping
    public ResponseEntity<AdminDTO> save(@Valid @RequestBody AdminDTO dto) {
        return ResponseEntity.ok(adminService.save(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminDTO> update(@PathVariable Long id, @Valid @RequestBody AdminDTO dto) {
        return ResponseEntity.ok(adminService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        adminService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

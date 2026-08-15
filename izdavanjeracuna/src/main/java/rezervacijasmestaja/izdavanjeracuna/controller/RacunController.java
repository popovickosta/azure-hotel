package rezervacijasmestaja.izdavanjeracuna.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import rezervacijasmestaja.izdavanjeracuna.dto.PageResponseDTO;
import rezervacijasmestaja.izdavanjeracuna.dto.RacunDTO;
import rezervacijasmestaja.izdavanjeracuna.service.RacunPdfService;
import rezervacijasmestaja.izdavanjeracuna.service.RacunService;

@RestController
@RequestMapping("/api/racuni")
public class RacunController {

    @Autowired
    private RacunService racunService;

    @Autowired
    private RacunPdfService racunPdfService;

    @GetMapping
    public ResponseEntity<List<RacunDTO>> findAll() {
        return ResponseEntity.ok(racunService.findAll());
    }

    @GetMapping("/paginirano")
    public ResponseEntity<PageResponseDTO<RacunDTO>> findPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(racunService.findPage(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RacunDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(racunService.findById(id));
    }

    @PostMapping("/generisi/{rezervacijaId}")
    public ResponseEntity<RacunDTO> generisiRacun(@PathVariable Long rezervacijaId) {
        return ResponseEntity.ok(racunService.generisiRacun(rezervacijaId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        racunService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/rezervacija/{rezervacijaId}")
    public ResponseEntity<RacunDTO> findByRezervacija(
            @PathVariable Long rezervacijaId,
            Authentication auth) {
        return ResponseEntity.ok(racunService.findByRezervacijaZaKorisnika(rezervacijaId, auth));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> preuzmiPdf(@PathVariable Long id, Authentication auth) {
        racunService.proveriPristupRacunu(id, auth);
        byte[] pdf = racunPdfService.generisiPdf(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "racun-" + id + ".pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdf);
    }
}

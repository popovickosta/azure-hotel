package rezervacijasmestaja.izdavanjeracuna.controller;

import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import rezervacijasmestaja.izdavanjeracuna.domen.*;
import rezervacijasmestaja.izdavanjeracuna.dto.*;
import rezervacijasmestaja.izdavanjeracuna.repository.*;
import rezervacijasmestaja.izdavanjeracuna.security.JwtUtil;
import rezervacijasmestaja.izdavanjeracuna.service.EmailService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private KorisnikRepository korisnikRepository;

    @Autowired
    private GostRepository gostRepository;

    @Autowired
    private DrzavaRepository drzavaRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDTO dto) {
        String email = dto.getEmail().trim().toLowerCase();
        Korisnik korisnik = korisnikRepository.findByEmail(email).orElse(null);

        if (korisnik == null || !passwordEncoder.matches(dto.getLozinka(), korisnik.getLozinka())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Pogrešan email ili lozinka");
        }

        if (!korisnik.isVerifikovan()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Nalog nije verifikovan. Potvrdite email preko linka koji vam je poslat.");
        }

        String uloga;
        if (korisnik instanceof Admin) {
            uloga = "ADMIN";
        } else if (korisnik instanceof Zaposleni) {
            uloga = "ZAPOSLENI";
        } else {
            uloga = "GOST";
        }

        String token = jwtUtil.generateToken(korisnik.getEmail(), uloga);
        return ResponseEntity.ok(new AuthResponseDTO(token, uloga, korisnik.getIme(), korisnik.getPrezime()));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterDTO dto) {

        String email = dto.getEmail().trim().toLowerCase();
        if (korisnikRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("Email već postoji");
        }

        TipDokumenta tipDokumenta;
        try {
            tipDokumenta = TipDokumenta.valueOf(dto.getTipDokumenta());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Nepoznat tip dokumenta");
        }

        if (gostRepository.existsByTipDokumentaAndBrojDokumenta(tipDokumenta, dto.getBrojDokumenta())) {
            return ResponseEntity.badRequest().body("Gost sa ovim dokumentom već postoji.");
        }

        Drzava drzava = drzavaRepository.findById(dto.getDrzavaId())
                .orElseThrow(() -> new RuntimeException("Država nije pronađena"));

        Gost gost = new Gost();
        gost.setIme(dto.getIme().trim());
        gost.setPrezime(dto.getPrezime().trim());
        gost.setEmail(email);
        gost.setLozinka(passwordEncoder.encode(dto.getLozinka()));
        gost.setBrojTelefona(dto.getBrojTelefona().trim());
        gost.setTipDokumenta(tipDokumenta);
        gost.setBrojDokumenta(dto.getBrojDokumenta());
        gost.setDrzava(drzava);
        gost.setVerifikovan(false);
        gost.setVerificationToken(UUID.randomUUID().toString());
        gost.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24));

        gostRepository.save(gost);

        try {
            emailService.posaljiVerifikacioniEmail(
                    gost.getEmail(),
                    gost.getIme(),
                    gost.getVerificationToken());
        } catch (RuntimeException e) {
            gostRepository.delete(gost);
            throw new RuntimeException("Registracija nije završena jer verifikacioni email nije mogao biti poslat. Pokušajte ponovo.");
        }

        return ResponseEntity.ok("Registracija je uspešna. Potvrdite email, pa se prijavite.");
    }


    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@Valid @RequestBody ResendVerificationDTO dto) {
        String email = dto.getEmail().trim().toLowerCase();
        Korisnik korisnik = korisnikRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Korisnik nije pronađen"));

        if (korisnik.isVerifikovan()) {
            return ResponseEntity.badRequest().body("Nalog je već verifikovan");
        }

        String noviToken = UUID.randomUUID().toString();
        try {
            emailService.posaljiVerifikacioniEmail(korisnik.getEmail(), korisnik.getIme(), noviToken);
        } catch (RuntimeException e) {
            throw new RuntimeException("Verifikacioni email nije mogao biti poslat. Pokušajte ponovo.");
        }

        korisnik.setVerificationToken(noviToken);
        korisnik.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24));
        korisnikRepository.save(korisnik);

        return ResponseEntity.ok("Novi verifikacioni link je poslat.");
    }

    @GetMapping("/verify")
    public ResponseEntity<Void> verify(@RequestParam String token) {
        Korisnik korisnik = korisnikRepository.findByVerificationToken(token).orElse(null);

        if (korisnik == null) {
            return redirectNaFrontend("false");
        }

        if (korisnik.getVerificationTokenExpiresAt() == null
                || korisnik.getVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            return redirectNaFrontend("expired");
        }

        korisnik.setVerifikovan(true);
        korisnik.setVerificationToken(null);
        korisnik.setVerificationTokenExpiresAt(null);
        korisnikRepository.save(korisnik);

        return redirectNaFrontend("true");
    }

    private ResponseEntity<Void> redirectNaFrontend(String status) {
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(frontendUrl + "/?verified=" + status))
                .build();
    }
}

package rezervacijasmestaja.izdavanjeracuna.service;

import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import rezervacijasmestaja.izdavanjeracuna.domen.Gost;
import rezervacijasmestaja.izdavanjeracuna.domen.Rezervacija;
import rezervacijasmestaja.izdavanjeracuna.domen.StatusRezervacije;
import rezervacijasmestaja.izdavanjeracuna.mapper.RezervacijaMapper;
import rezervacijasmestaja.izdavanjeracuna.repository.GostRepository;
import rezervacijasmestaja.izdavanjeracuna.repository.RezervacijaRepository;
import rezervacijasmestaja.izdavanjeracuna.repository.SobaRepository;
import rezervacijasmestaja.izdavanjeracuna.repository.UslugaSobeRepository;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RezervacijaServiceTest {

    @Mock private RezervacijaRepository rezervacijaRepository;
    @Mock private RezervacijaMapper rezervacijaMapper;
    @Mock private GostRepository gostRepository;
    @Mock private SobaRepository sobaRepository;
    @Mock private UslugaSobeRepository uslugaSobeRepository;
    @Mock private RacunService racunService;

    @InjectMocks
    private RezervacijaService rezervacijaService;

    @Test
    void neDozvoljavaZavrsetakPreDatumaOdjave() {
        Rezervacija rezervacija = new Rezervacija();
        rezervacija.setId(1L);
        rezervacija.setStatus(StatusRezervacije.POTVRDJENA);
        rezervacija.setDatumOdjave(LocalDate.now().plusDays(1));
        when(rezervacijaRepository.findById(1L)).thenReturn(Optional.of(rezervacija));

        RuntimeException greska = assertThrows(RuntimeException.class,
                () -> rezervacijaService.promeniStatus(1L, "ZAVRSENA"));

        assertTrue(greska.getMessage().contains("pre datuma odjave"));
    }

    @Test
    void gostNeMozeDaOtkazeTudjuRezervaciju() {
        Gost gost = new Gost();
        gost.setEmail("vlasnik@gmail.com");

        Rezervacija rezervacija = new Rezervacija();
        rezervacija.setId(5L);
        rezervacija.setGost(gost);
        rezervacija.setStatus(StatusRezervacije.NA_CEKANJU);
        when(rezervacijaRepository.findById(5L)).thenReturn(Optional.of(rezervacija));

        assertThrows(AccessDeniedException.class,
                () -> rezervacijaService.otkaziRezervacijuGosta(5L, "drugi@gmail.com"));
    }
}

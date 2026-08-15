package rezervacijasmestaja.izdavanjeracuna.service;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import rezervacijasmestaja.izdavanjeracuna.domen.Rezervacija;
import rezervacijasmestaja.izdavanjeracuna.domen.StatusRezervacije;
import rezervacijasmestaja.izdavanjeracuna.mapper.RacunMapper;
import rezervacijasmestaja.izdavanjeracuna.repository.RacunRepository;
import rezervacijasmestaja.izdavanjeracuna.repository.RezervacijaRepository;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class RacunServiceTest {

    @Mock private RacunRepository racunRepository;
    @Mock private RezervacijaRepository rezervacijaRepository;
    @Mock private RacunMapper racunMapper;

    @InjectMocks
    private RacunService racunService;

    @Test
    void racunSeNeGeneriseDokRezervacijaNijeZavrsena() {
        Rezervacija rezervacija = new Rezervacija();
        rezervacija.setId(1L);
        rezervacija.setStatus(StatusRezervacije.POTVRDJENA);
        when(rezervacijaRepository.findById(1L)).thenReturn(Optional.of(rezervacija));

        RuntimeException greska = assertThrows(RuntimeException.class,
                () -> racunService.generisiRacun(1L));

        assertTrue(greska.getMessage().contains("samo za završenu rezervaciju"));
        verify(racunRepository, never()).save(any());
    }
}

package rezervacijasmestaja.izdavanjeracuna.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import rezervacijasmestaja.izdavanjeracuna.domen.UslugaSobe;
import rezervacijasmestaja.izdavanjeracuna.dto.PageResponseDTO;
import rezervacijasmestaja.izdavanjeracuna.dto.UslugaSobeDTO;
import rezervacijasmestaja.izdavanjeracuna.mapper.UslugaSobeMapper;
import rezervacijasmestaja.izdavanjeracuna.repository.RezervacijaRepository;
import rezervacijasmestaja.izdavanjeracuna.repository.UslugaSobeRepository;

@Service
public class UslugaSobeService implements GenericService<UslugaSobeDTO> {

    @Autowired
    private UslugaSobeRepository uslugaSobeRepository;

    @Autowired
    private UslugaSobeMapper uslugaSobeMapper;

    @Autowired
    private RezervacijaRepository rezervacijaRepository;

    @Override
    public List<UslugaSobeDTO> findAll() {
        return uslugaSobeRepository.findAll(Sort.by("naziv").ascending())
                .stream()
                .map(uslugaSobeMapper::toDTO)
                .collect(Collectors.toList());
    }

    public PageResponseDTO<UslugaSobeDTO> findPage(int page, int size) {
        Page<UslugaSobeDTO> rezultat = uslugaSobeRepository
                .findAll(PageRequest.of(page, size, Sort.by("naziv").ascending()))
                .map(uslugaSobeMapper::toDTO);
        return PageResponseDTO.from(rezultat);
    }

    @Override
    public UslugaSobeDTO findById(Long id) {
        UslugaSobe usluga = uslugaSobeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usluga nije pronađena"));
        return uslugaSobeMapper.toDTO(usluga);
    }

    @Override
    public UslugaSobeDTO save(UslugaSobeDTO dto) {
        if (dto.getCena() == null || dto.getCena().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Cena mora biti veća od 0");
        }
        if (uslugaSobeRepository.findByNaziv(dto.getNaziv()).isPresent()) {
            throw new RuntimeException("Usluga sa ovim nazivom već postoji");
        }
        UslugaSobe usluga = uslugaSobeMapper.toEntity(dto);
        return uslugaSobeMapper.toDTO(uslugaSobeRepository.save(usluga));
    }

    @Override
    public UslugaSobeDTO update(Long id, UslugaSobeDTO dto) {
        UslugaSobe postojeca = uslugaSobeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usluga nije pronađena"));

        if (dto.getCena() == null || dto.getCena().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Cena mora biti veća od 0");
        }

        if (!dto.getNaziv().equals(postojeca.getNaziv())
                && uslugaSobeRepository.findByNaziv(dto.getNaziv()).isPresent()) {
            throw new RuntimeException("Usluga sa ovim nazivom već postoji");
        }

        postojeca.setNaziv(dto.getNaziv());
        postojeca.setCena(dto.getCena());
        return uslugaSobeMapper.toDTO(uslugaSobeRepository.save(postojeca));
    }

    @Override
    public void delete(Long id) {
        uslugaSobeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usluga nije pronađena"));

        if (rezervacijaRepository.postojiRezervacijaSaUslugom(id)) {
            throw new RuntimeException("Usluga se ne može obrisati jer je vezana za postojeću rezervaciju.");
        }

        uslugaSobeRepository.deleteById(id);
    }
}

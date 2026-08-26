package rezervacijasmestaja.izdavanjeracuna.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import rezervacijasmestaja.izdavanjeracuna.domen.Soba;
import rezervacijasmestaja.izdavanjeracuna.dto.PageResponseDTO;
import rezervacijasmestaja.izdavanjeracuna.dto.SobaDTO;
import rezervacijasmestaja.izdavanjeracuna.mapper.SobaMapper;
import rezervacijasmestaja.izdavanjeracuna.repository.RezervacijaRepository;
import rezervacijasmestaja.izdavanjeracuna.repository.SobaRepository;

@Service
public class SobaService implements GenericService<SobaDTO> {

    @Autowired
    private SobaRepository sobaRepository;

    @Autowired
    private SobaMapper sobaMapper;

    @Autowired
    private RezervacijaRepository rezervacijaRepository;

    @Override
    public void delete(Long id) {
        sobaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Soba nije pronađena"));

        if (rezervacijaRepository.existsBySobaId(id)) {
            throw new RuntimeException("Soba se ne može obrisati jer je vezana za postojeću rezervaciju.");
        }

        sobaRepository.deleteById(id);
    }

    @Override
    public List<SobaDTO> findAll() {
        return sobaRepository.findAllByOrderByBrojSobeAsc()
                .stream()
                .map(sobaMapper::toDTO)
                .collect(Collectors.toList());
    }

    public PageResponseDTO<SobaDTO> findPage(int page, int size) {
        Page<SobaDTO> rezultat = sobaRepository
                .findAll(PageRequest.of(page, size, Sort.by("brojSobe").ascending()))
                .map(sobaMapper::toDTO);
        return PageResponseDTO.from(rezultat);
    }

    @Override
    public SobaDTO findById(Long id) {
        Soba soba = sobaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Soba nije pronađena"));
        return sobaMapper.toDTO(soba);
    }

    @Override
    public SobaDTO save(SobaDTO dto) {
        if (dto.getCenaPoNoci() == null || dto.getCenaPoNoci().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Cena po noći mora biti veća od 0");
        }
        if (sobaRepository.findByBrojSobe(dto.getBrojSobe()).isPresent()) {
            throw new RuntimeException("Soba sa ovim brojem već postoji");
        }
        Soba soba = sobaMapper.toEntity(dto);
        return sobaMapper.toDTO(sobaRepository.save(soba));
    }

    @Override
    public SobaDTO update(Long id, SobaDTO dto) {
        Soba postojeca = sobaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Soba nije pronađena"));

        if (dto.getCenaPoNoci() == null || dto.getCenaPoNoci().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Cena po noći mora biti veća od 0");
        }

        if (!dto.getBrojSobe().equals(postojeca.getBrojSobe())
                && sobaRepository.findByBrojSobe(dto.getBrojSobe()).isPresent()) {
            throw new RuntimeException("Soba sa ovim brojem već postoji");
        }

        postojeca.setBrojSobe(dto.getBrojSobe());
        postojeca.setTipSobe(dto.getTipSobe());
        postojeca.setCenaPoNoci(dto.getCenaPoNoci());
        return sobaMapper.toDTO(sobaRepository.save(postojeca));
    }
}

package rezervacijasmestaja.izdavanjeracuna.service;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import rezervacijasmestaja.izdavanjeracuna.domen.Drzava;
import rezervacijasmestaja.izdavanjeracuna.dto.DrzavaDTO;
import rezervacijasmestaja.izdavanjeracuna.dto.PageResponseDTO;
import rezervacijasmestaja.izdavanjeracuna.mapper.DrzavaMapper;
import rezervacijasmestaja.izdavanjeracuna.repository.DrzavaRepository;
import rezervacijasmestaja.izdavanjeracuna.repository.GostRepository;

@Service
public class DrzavaService implements GenericService<DrzavaDTO> {

    @Autowired
    private DrzavaRepository drzavaRepository;

    @Autowired
    private DrzavaMapper drzavaMapper;

    @Autowired
    private GostRepository gostRepository;

    @Override
    public List<DrzavaDTO> findAll() {
        return drzavaRepository.findAll(Sort.by("naziv").ascending())
                .stream()
                .map(drzavaMapper::toDTO)
                .collect(Collectors.toList());
    }

    public PageResponseDTO<DrzavaDTO> findPage(int page, int size) {
        Page<DrzavaDTO> rezultat = drzavaRepository
                .findAll(PageRequest.of(page, size, Sort.by("naziv").ascending()))
                .map(drzavaMapper::toDTO);
        return PageResponseDTO.from(rezultat);
    }

    @Override
    public DrzavaDTO findById(Long id) {
        Drzava drzava = drzavaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Država nije pronađena"));
        return drzavaMapper.toDTO(drzava);
    }

    @Override
    public DrzavaDTO save(DrzavaDTO dto) {
        if (drzavaRepository.findByNaziv(dto.getNaziv()).isPresent()) {
            throw new RuntimeException("Država sa ovim nazivom već postoji");
        }
        Drzava drzava = drzavaMapper.toEntity(dto);
        return drzavaMapper.toDTO(drzavaRepository.save(drzava));
    }

    @Override
    public DrzavaDTO update(Long id, DrzavaDTO dto) {
        Drzava postojeca = drzavaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Država nije pronađena"));

        if (!dto.getNaziv().equals(postojeca.getNaziv())
                && drzavaRepository.findByNaziv(dto.getNaziv()).isPresent()) {
            throw new RuntimeException("Država sa ovim nazivom već postoji");
        }

        postojeca.setNaziv(dto.getNaziv());
        return drzavaMapper.toDTO(drzavaRepository.save(postojeca));
    }

    @Override
    public void delete(Long id) {
        drzavaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Država nije pronađena"));

        if (gostRepository.existsByDrzavaId(id)) {
            throw new RuntimeException(
                    "Država se ne može obrisati jer je povezana sa postojećim gostom.");
        }

        drzavaRepository.deleteById(id);
    }
}

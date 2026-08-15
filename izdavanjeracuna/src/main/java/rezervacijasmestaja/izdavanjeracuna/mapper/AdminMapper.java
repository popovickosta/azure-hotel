package rezervacijasmestaja.izdavanjeracuna.mapper;

import org.springframework.stereotype.Component;
import rezervacijasmestaja.izdavanjeracuna.domen.Admin;
import rezervacijasmestaja.izdavanjeracuna.dto.AdminDTO;

@Component
public class AdminMapper implements Mapper<Admin, AdminDTO> {

    @Override
    public AdminDTO toDTO(Admin admin) {
        AdminDTO dto = new AdminDTO();
        dto.setId(admin.getId());
        dto.setIme(admin.getIme());
        dto.setPrezime(admin.getPrezime());
        dto.setEmail(admin.getEmail());
        return dto;
    }

    @Override
    public Admin toEntity(AdminDTO dto) {
        Admin admin = new Admin();
        admin.setId(dto.getId());
        admin.setIme(dto.getIme());
        admin.setPrezime(dto.getPrezime());
        admin.setEmail(dto.getEmail());
        return admin;
    }
}
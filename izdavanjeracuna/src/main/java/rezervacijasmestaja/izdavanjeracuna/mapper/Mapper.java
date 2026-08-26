/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package rezervacijasmestaja.izdavanjeracuna.mapper;

/**
 *
 * @author hallo
 */
public interface Mapper<E, D> {
    D toDTO(E entity);
    E toEntity(D dto);

}

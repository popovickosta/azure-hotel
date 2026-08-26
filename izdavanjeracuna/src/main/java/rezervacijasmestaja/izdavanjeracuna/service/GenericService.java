/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package rezervacijasmestaja.izdavanjeracuna.service;

import java.util.List;

public interface GenericService<T> {
    List<T> findAll();
    T findById(Long id);
    T save(T dto);
    T update(Long id, T dto);
    void delete(Long id);
}

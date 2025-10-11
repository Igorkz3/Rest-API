package ru.kata.spring.boot_security.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ru.kata.spring.boot_security.demo.model.Role;
import ru.kata.spring.boot_security.demo.repository.RoleRepository;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class RoleService {
    private final RoleRepository roleRepository;

    @Autowired
    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public List<Role> findAll() { return roleRepository.findAll(); }
    public Role findByName(String name) { return roleRepository.findByName(name); }
    public Set<Role> findByIds(Set<Long> ids) { return new HashSet<>(roleRepository.findAllById(ids)); }
    public Role save(Role role) { return roleRepository.save(role); }
}

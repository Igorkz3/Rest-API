package ru.kata.spring.boot_security.demo.configs;


import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import ru.kata.spring.boot_security.demo.model.Role;
import ru.kata.spring.boot_security.demo.model.User;
import ru.kata.spring.boot_security.demo.service.RoleService;
import ru.kata.spring.boot_security.demo.service.UserService;

import java.util.HashSet;
import java.util.Set;

@Component
public class DataLoader implements CommandLineRunner {

    private final UserService userService;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;

    public DataLoader(UserService userService, RoleService roleService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.roleService = roleService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {

        Role adminRole = new Role("ROLE_ADMIN");
        Role userRole = new Role("ROLE_USER");

        roleService.save(adminRole);
        roleService.save(userRole);

        User admin = new User();
        admin.setFirstName("Bob");
        admin.setLastName("Ninten");
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin"));

        Set<Role> adminRoles = new HashSet<>();
        adminRoles.add(adminRole);
        adminRoles.add(userRole);
        admin.setRoles(adminRoles);

        userService.saveUser(admin);

        User user = new User();
        user.setFirstName("Dan");
        user.setLastName("Danov");
        user.setUsername("user");
        user.setPassword(passwordEncoder.encode("user"));

        Set<Role> userRoles = new HashSet<>();
        userRoles.add(userRole);
        user.setRoles(userRoles);

        userService.saveUser(user);
    }
}
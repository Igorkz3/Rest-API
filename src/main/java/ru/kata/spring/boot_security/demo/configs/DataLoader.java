package ru.kata.spring.boot_security.demo.configs;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import ru.kata.spring.boot_security.demo.model.Role;
import ru.kata.spring.boot_security.demo.model.User;
import ru.kata.spring.boot_security.demo.service.RoleService;
import ru.kata.spring.boot_security.demo.service.UserService;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class DataLoader implements CommandLineRunner {

    private final UserService userService;
    private final RoleService roleService;

    public DataLoader(UserService userService, RoleService roleService) {
        this.userService = userService;
        this.roleService = roleService;
    }

    @Override
    public void run(String... args) throws Exception {

        List<Role> existingRoles = roleService.findAll();

        Role adminRole = existingRoles.stream()
                .filter(role -> "ROLE_ADMIN".equals(role.getName()))
                .findFirst()
                .orElse(null);

        Role userRole = existingRoles.stream()
                .filter(role -> "ROLE_USER".equals(role.getName()))
                .findFirst()
                .orElse(null);

        if (adminRole == null) {
            adminRole = new Role("ROLE_ADMIN");
            adminRole = roleService.save(adminRole);
        }

        if (userRole == null) {
            userRole = new Role("ROLE_USER");
            userRole = roleService.save(userRole);
        }

        User admin = userService.findByUsername("admin@mail.ru");
        if (admin == null) {
            admin = new User();
            admin.setFirstName("admin");
            admin.setLastName("admin");
            admin.setAge(35);
            admin.setUsername("admin@mail.ru");
            admin.setPassword("admin");

            Set<Role> adminRoles = new HashSet<>();
            adminRoles.add(adminRole);
            adminRoles.add(userRole);
            admin.setRoles(adminRoles);

            userService.saveUser(admin);
        }

        User regularUser = userService.findByUsername("user@mail.ru");
        if (regularUser == null) {
            regularUser = new User();
            regularUser.setFirstName("user");
            regularUser.setLastName("user");
            regularUser.setAge(30);
            regularUser.setUsername("user@mail.ru");
            regularUser.setPassword("user");

            Set<Role> userRoles = new HashSet<>();
            userRoles.add(userRole);
            regularUser.setRoles(userRoles);

            userService.saveUser(regularUser);

        }
    }
}
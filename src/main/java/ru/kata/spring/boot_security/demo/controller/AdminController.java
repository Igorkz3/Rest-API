package ru.kata.spring.boot_security.demo.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import ru.kata.spring.boot_security.demo.model.Role;
import ru.kata.spring.boot_security.demo.model.User;
import ru.kata.spring.boot_security.demo.service.RoleService;
import ru.kata.spring.boot_security.demo.service.UserService;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/admin")
public class AdminController {

    private final UserService userService;
    private final RoleService roleService;

    @Autowired
    public AdminController(UserService userService, RoleService roleService) {
        this.userService = userService;
        this.roleService = roleService;
    }

    @GetMapping("/users")
    public String findAll(Model model) {
        List<User> users = userService.findAll();
        model.addAttribute("users", users);
        return "user-list";
    }

    @GetMapping("/user-create")
    public String createUserForm(Model model) {
        model.addAttribute("user", new User());
        model.addAttribute("allRoles", roleService.findAll());
        return "user-create";
    }

    @PostMapping("/user-create")
    public String createUser(@Valid User user, BindingResult result,
                             @RequestParam("roles") Set<Long> roleIds, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("user", user);
            model.addAttribute("allRoles", roleService.findAll());
            return "user-create";
        }
        User existingUser = userService.findByUsername(user.getUsername());
        if (existingUser != null) {
            model.addAttribute("user", user);
            model.addAttribute("allRoles", roleService.findAll());
            model.addAttribute("emailError", "User with this email already exists");
            return "user-create";
        }

        Set<Role> roles = roleService.findByIds(roleIds);
        user.setRoles(roles);
        userService.saveUser(user);
        return "redirect:/admin/users";
    }

    @GetMapping("/user-delete/{id}")
    public String deleteUserForm(@PathVariable("id") Long id, Model model) {
        User user = userService.findById(id);
        model.addAttribute("user", user);
        return "user-delete";
    }

    @PostMapping("/user-delete/{id}")
    public String deleteUser(@PathVariable("id") Long id) {
        userService.deleteById(id);
        return "redirect:/admin/users";
    }

    @GetMapping("/user-update/{id}")
    public String updateUserForm(@PathVariable("id") Long id, Model model) {
        User user = userService.findById(id);
        model.addAttribute("user", user);
        model.addAttribute("allRoles", roleService.findAll());
        return "user-update";
    }

    @PostMapping("/user-update")
    public String updateUser(@Valid User user, BindingResult result,
                             @RequestParam("roles") Set<Long> roleIds, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("user", user);
            model.addAttribute("allRoles", roleService.findAll());
            return "user-update";
        }
        User existingUser = userService.findByUsername(user.getUsername());
        if (existingUser != null && !existingUser.getId().equals(user.getId())) {
            model.addAttribute("user", user);
            model.addAttribute("allRoles", roleService.findAll());
            model.addAttribute("emailError", "User with this email already exists");
            return "user-update";
        }

        Set<Role> roles = roleService.findByIds(roleIds);
        user.setRoles(roles);
        userService.saveUser(user);
        return "redirect:/admin/users";
    }
    @GetMapping("/users/search")
    public String searchUsers(@RequestParam("keyword") String keyword, Model model) {
        List<User> users = userService.findAll().stream()
                .filter(user -> user.getFirstName().toLowerCase().contains(keyword.toLowerCase()) ||
                        user.getLastName().toLowerCase().contains(keyword.toLowerCase()) ||
                        user.getUsername().toLowerCase().contains(keyword.toLowerCase()))
                .collect(Collectors.toList());
        model.addAttribute("users", users);
        model.addAttribute("keyword", keyword);
        return "user-list";
    }
}
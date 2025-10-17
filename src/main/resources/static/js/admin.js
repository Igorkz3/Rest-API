class UserManager {
    constructor() {
        this.users = [];
        this.roles = [];
        this.currentEditingUser = null;
        this.currentSearchKeyword = '';
        this.init();
    }

    async init() {
        await this.loadRoles();
        await this.loadUsers();
        this.setupEventListeners();
        this.hideLoading();
    }

    async fetchWithAuth(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        };

        const mergedOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, mergedOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            this.showAlert('Error: ' + error.message, 'danger');
            throw error;
        }
    }

    async loadUsers() {
        this.showLoading();
        try {
            this.users = await this.fetchWithAuth('/api/admin/users');
            this.renderUsersTable();
        } catch (error) {
            this.showAlert('Error loading users: ' + error.message, 'danger');
        } finally {
            this.hideLoading();
        }
    }

    async loadRoles() {
        try {
            this.roles = await this.fetchWithAuth('/api/admin/roles');
        } catch (error) {
            this.showAlert('Error loading roles: ' + error.message, 'danger');
        }
    }

    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        const noUsersMessage = document.getElementById('noUsersMessage');

        if (!tbody) {
            console.error('Table body element not found');
            return;
        }

        tbody.innerHTML = '';

        if (this.users.length === 0) {
            if (tbody.style) tbody.style.display = 'none';
            if (noUsersMessage) noUsersMessage.style.display = 'block';
            return;
        }

        if (tbody.style) tbody.style.display = 'table-row-group';
        if (noUsersMessage) noUsersMessage.style.display = 'none';

        this.users.forEach(user => {
            const row = this.createUserRow(user);
            tbody.appendChild(row);
        });
    }

    createUserRow(user) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.firstName}</td>
            <td>${user.lastName}</td>
            <td>${user.age}</td>
            <td>${user.username}</td>
            <td>${user.roles ? user.roles.map(role => role.name.replace('ROLE_', '')).join(', ') : ''}</td>
            <td>
                <button type="button" class="btn btn-warning btn-sm edit-btn" data-user-id="${user.id}">
                    Edit
                </button>
            </td>
            <td>
                <button type="button" class="btn btn-danger btn-sm delete-btn" data-user-id="${user.id}">
                    Delete
                </button>
            </td>
        `;

        row.querySelector('.edit-btn').addEventListener('click', () => this.openEditModal(user.id));
        row.querySelector('.delete-btn').addEventListener('click', () => this.openDeleteModal(user));

        return row;
    }

    setupEventListeners() {

        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.openAddModal());
        }

        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }


        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }

        const clearSearch = document.getElementById('clearSearch');
        if (clearSearch) {
            clearSearch.addEventListener('click', () => this.clearSearch());
        }

        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
        }

        const userModal = document.getElementById('userModal');
        if (userModal) {
            userModal.addEventListener('hidden.bs.modal', () => this.resetForm());
        }
    }

    openAddModal() {
        this.currentEditingUser = null;
        this.showModal('Add New User', 'Add User');
        this.populateRoles();
        this.setPasswordRequired(true);
    }

    async openEditModal(userId) {
        try {
            const user = await this.fetchWithAuth(`/api/admin/users/${userId}`);
            this.currentEditingUser = user;
            this.showModal('Edit User', 'Update User');
            this.populateForm(user);
            this.populateRoles();
            this.setPasswordRequired(false);
        } catch (error) {
            this.showAlert('Error loading user data: ' + error.message, 'danger');
        }
    }

    openDeleteModal(user) {
        this.currentEditingUser = user;
        const deleteUserName = document.getElementById('deleteUserName');
        if (deleteUserName) {
            deleteUserName.textContent = `${user.firstName} ${user.lastName} (${user.username})`;
        }
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    }

    async confirmDelete() {
        if (!this.currentEditingUser) return;

        try {
            await this.fetchWithAuth(`/api/admin/users/${this.currentEditingUser.id}`, {
                method: 'DELETE'
            });

            const modalElement = document.getElementById('deleteModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }

            await this.loadUsers();
            this.showAlert('User successfully deleted!', 'success');
        } catch (error) {
            this.showAlert('Error deleting user: ' + error.message, 'danger');
        }
    }

    showModal(title, submitText) {
        const modalTitle = document.getElementById('modalTitle');
        const modalSubmitBtn = document.getElementById('modalSubmitBtn');

        if (modalTitle) modalTitle.textContent = title;
        if (modalSubmitBtn) modalSubmitBtn.textContent = submitText;

        this.resetValidation();
        const modalElement = document.getElementById('userModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    }

    populateForm(user) {
        this.setFieldValue('userId', user.id || '');
        this.setFieldValue('firstName', user.firstName || '');
        this.setFieldValue('lastName', user.lastName || '');
        this.setFieldValue('age', user.age || '');
        this.setFieldValue('username', user.username || '');
        this.setFieldValue('password', '');

        const roleCheckboxes = document.querySelectorAll('input[name="roles"]');
        roleCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        if (user.roles) {
            user.roles.forEach(userRole => {
                const checkbox = document.querySelector(`input[name="roles"][value="${userRole.id}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
    }

    setFieldValue(fieldId, value) {
        const element = document.getElementById(fieldId);
        if (element) {
            element.value = value;
        }
    }

    populateRoles() {
        const rolesContainer = document.getElementById('rolesContainer');
        if (!rolesContainer) return;

        rolesContainer.innerHTML = '';

        this.roles.forEach(role => {
            const div = document.createElement('div');
            div.className = 'form-check';
            div.innerHTML = `
                <input class="form-check-input" type="checkbox" name="roles" 
                       value="${role.id}" id="role${role.id}">
                <label class="form-check-label" for="role${role.id}">
                    ${role.name.replace('ROLE_', '')}
                </label>
            `;
            rolesContainer.appendChild(div);
        });
    }

    setPasswordRequired(required) {
        const passwordInput = document.getElementById('password');
        const passwordRequired = document.getElementById('passwordRequired');
        const passwordHelp = document.getElementById('passwordHelp');

        if (passwordInput) {
            passwordInput.required = required;
        }
        if (passwordRequired) {
            passwordRequired.style.display = required ? 'inline' : 'none';
        }
        if (passwordHelp) {
            passwordHelp.textContent = required
                ? 'Password is required for new users'
                : 'Leave empty to keep current password';
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        const formData = this.getFormData();

        try {
            if (this.currentEditingUser) {
                await this.updateUser(formData);
            } else {
                await this.createUser(formData);
            }

            this.hideModal();
            await this.loadUsers();
            this.showAlert('User successfully saved!', 'success');
        } catch (error) {
            this.showAlert('Error saving user: ' + error.message, 'danger');
        }
    }

    validateForm() {
        let isValid = true;
        this.resetValidation();


        const requiredFields = ['firstName', 'lastName', 'age', 'username'];
        requiredFields.forEach(field => {
            const element = document.getElementById(field);
            if (element && !element.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            }
        });


        const selectedRoles = document.querySelectorAll('input[name="roles"]:checked');
        if (selectedRoles.length === 0) {
            this.showFieldError('roles', 'At least one role must be selected');
            isValid = false;
        }


        if (!this.currentEditingUser) {
            const passwordInput = document.getElementById('password');
            if (passwordInput && !passwordInput.value) {
                this.showFieldError('password', 'Password is required for new users');
                isValid = false;
            }
        }

        return isValid;
    }

    resetValidation() {
        const fields = ['firstName', 'lastName', 'age', 'username', 'password', 'roles'];
        fields.forEach(field => {
            this.hideFieldError(field);
        });
    }

    showFieldError(field, message) {
        const element = document.getElementById(field);
        const errorElement = document.getElementById(field + 'Error');

        if (element && errorElement) {
            element.classList.add('is-invalid');
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    hideFieldError(field) {
        const element = document.getElementById(field);
        const errorElement = document.getElementById(field + 'Error');

        if (element && errorElement) {
            element.classList.remove('is-invalid');
            errorElement.style.display = 'none';
        }
    }

    getFormData() {
        const formData = {
            firstName: this.getFieldValue('firstName'),
            lastName: this.getFieldValue('lastName'),
            age: parseInt(this.getFieldValue('age')),
            username: this.getFieldValue('username'),
            roles: []
        };

        const password = this.getFieldValue('password');
        if (password) {
            formData.password = password;
        }

        const selectedRoles = document.querySelectorAll('input[name="roles"]:checked');
        selectedRoles.forEach(checkbox => {
            const roleId = parseInt(checkbox.value);
            const role = this.roles.find(r => r.id === roleId);
            if (role) {
                formData.roles.push(role);
            }
        });

        return formData;
    }

    getFieldValue(fieldId) {
        const element = document.getElementById(fieldId);
        return element ? element.value.trim() : '';
    }

    async createUser(userData) {
        return this.fetchWithAuth('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async updateUser(userData) {
        userData.id = this.currentEditingUser.id;
        return this.fetchWithAuth(`/api/admin/users/${this.currentEditingUser.id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async handleSearch(e) {
        e.preventDefault();
        const searchKeyword = document.getElementById('searchKeyword');
        const keyword = searchKeyword ? searchKeyword.value.trim() : '';

        if (!keyword) {
            this.clearSearch();
            return;
        }

        this.currentSearchKeyword = keyword;
        await this.performSearch(keyword);
    }

    async performSearch(keyword) {
        this.showLoading();
        try {

            const filteredUsers = this.users.filter(user =>
                user.firstName.toLowerCase().includes(keyword.toLowerCase()) ||
                user.lastName.toLowerCase().includes(keyword.toLowerCase()) ||
                user.username.toLowerCase().includes(keyword.toLowerCase())
            );

            this.displaySearchResults(filteredUsers, keyword);
        } catch (error) {
            this.showAlert('Error searching users: ' + error.message, 'danger');
        } finally {
            this.hideLoading();
        }
    }

    displaySearchResults(users, keyword) {
        const tbody = document.getElementById('usersTableBody');
        const noUsersMessage = document.getElementById('noUsersMessage');
        const searchResults = document.getElementById('searchResults');
        const currentKeyword = document.getElementById('currentKeyword');

        if (!tbody) return;

        tbody.innerHTML = '';

        if (users.length === 0) {
            if (tbody.style) tbody.style.display = 'none';
            if (noUsersMessage) {
                noUsersMessage.style.display = 'block';
                noUsersMessage.innerHTML = `<p>No users found for "${keyword}"!</p>`;
            }
        } else {
            if (tbody.style) tbody.style.display = 'table-row-group';
            if (noUsersMessage) noUsersMessage.style.display = 'none';

            users.forEach(user => {
                const row = this.createUserRow(user);
                tbody.appendChild(row);
            });
        }

        if (currentKeyword) currentKeyword.textContent = keyword;
        if (searchResults) searchResults.style.display = 'block';
    }

    async clearSearch() {
        const searchKeyword = document.getElementById('searchKeyword');
        const searchResults = document.getElementById('searchResults');

        if (searchKeyword) searchKeyword.value = '';
        if (searchResults) searchResults.style.display = 'none';

        this.currentSearchKeyword = '';
        await this.loadUsers();
    }

    hideModal() {
        const modalElement = document.getElementById('userModal');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }
    }

    resetForm() {
        const userForm = document.getElementById('userForm');
        if (userForm) userForm.reset();

        this.currentEditingUser = null;
        this.resetValidation();
    }

    showLoading() {
        const loadingMessage = document.getElementById('loadingMessage');
        const tbody = document.getElementById('usersTableBody');
        const noUsersMessage = document.getElementById('noUsersMessage');

        if (loadingMessage) loadingMessage.style.display = 'block';
        if (tbody && tbody.style) tbody.style.display = 'none';
        if (noUsersMessage) noUsersMessage.style.display = 'none';
    }

    hideLoading() {
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) loadingMessage.style.display = 'none';
    }

    showAlert(message, type) {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        alertContainer.innerHTML = '';
        alertContainer.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new UserManager();
});
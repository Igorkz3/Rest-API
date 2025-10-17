class CurrentUserManager {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadCurrentUser();
    }

    async loadCurrentUser() {
        try {
            const user = await this.fetchWithAuth('/api/user/current');
            this.renderUserInfo(user);
        } catch (error) {
            this.showError('Error loading user data: ' + error.message);
        }
    }

    async fetchWithAuth(url) {
        const response = await fetch(url, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    renderUserInfo(user) {
        const userInfoDiv = document.getElementById('userInfo');
        if (userInfoDiv && user) {
            userInfoDiv.innerHTML = `
                <table class="table table-bordered">
                    <thead class="table-light">
                        <tr>
                            <th>ID</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Age</th>
                            <th>Email</th>
                            <th>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.firstName}</td>
                            <td>${user.lastName}</td>
                            <td>${user.age}</td>
                            <td>${user.username}</td>
                            <td>${user.roles ? user.roles.map(role => role.name.replace('ROLE_', '')).join(', ') : ''}</td>
                        </tr>
                    </tbody>
                </table>
            `;
        }
    }

    showError(message) {
        const alertContainer = document.getElementById('alertContainer');
        if (alertContainer) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger alert-dismissible fade show';
            alertDiv.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            alertContainer.appendChild(alertDiv);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CurrentUserManager();
});
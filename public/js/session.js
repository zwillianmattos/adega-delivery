const SessionManager = {
    getUserInfo() {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    },

    setUserInfo(info) {
        localStorage.setItem('userInfo', JSON.stringify(info));
        this.updateUIElements();
    },

    clearUserInfo() {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        this.updateUIElements();
    },

    setToken(token) {
        localStorage.setItem('token', token);
    },

    getToken() {
        return localStorage.getItem('token');
    },

    updateUIElements() {
        const userInfo = this.getUserInfo();
        const authText = document.getElementById('auth-text');
        const authTextMobile = document.getElementById('auth-text-mobile');
        const userInfoElement = document.getElementById('user-info');

        if (userInfo) {
            if (authText) authText.textContent = 'Minha Conta';
            if (authTextMobile) authTextMobile.textContent = 'Minha Conta';
            if (userInfoElement) userInfoElement.textContent = userInfo.phone || userInfo.email;
        } else {
            if (authText) authText.textContent = 'Entrar';
            if (authTextMobile) authTextMobile.textContent = 'Entrar';
            if (userInfoElement) userInfoElement.textContent = 'Faça login para continuar';
        }
    },

    isLoggedIn() {
        return !!this.getToken() && !!this.getUserInfo();
    }
};

// Atualizar UI quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    SessionManager.updateUIElements();
});
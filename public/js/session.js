class SessionManager {
    static AGE_VERIFIED_KEY = 'age_verified';
    static USER_INFO_KEY = 'user_info';
    static MIN_AGE = 18;

    // Verifica se o usuário já confirmou a idade
    static isAgeVerified() {
        return localStorage.getItem(this.AGE_VERIFIED_KEY) === 'true';
    }

    // Marca o usuário como verificado
    static setAgeVerified() {
        localStorage.setItem(this.AGE_VERIFIED_KEY, 'true');
    }

    // Salva as informações do usuário
    static saveUserInfo(userInfo) {
        localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(userInfo));
    }

    // Recupera as informações do usuário
    static getUserInfo() {
        const info = localStorage.getItem(this.USER_INFO_KEY);
        return info ? JSON.parse(info) : {};
    }

    // Limpa as informações do usuário
    static clearUserInfo() {
        localStorage.removeItem(this.USER_INFO_KEY);
    }

    // Verifica se a data fornecida indica idade maior que 18 anos
    static isOldEnough(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age >= this.MIN_AGE;
    }

    // Verifica a idade do usuário e retorna uma Promise
    static verifyAge(birthDate) {
        return new Promise((resolve, reject) => {
            if (!birthDate) {
                reject(new Error('Data de nascimento é obrigatória'));
                return;
            }

            if (this.isOldEnough(birthDate)) {
                this.setAgeVerified();
                resolve(true);
            } else {
                reject(new Error('Você precisa ter pelo menos 18 anos para acessar este site'));
            }
        });
    }

    // Verifica se o usuário está autenticado
    static isAuthenticated() {
        const userInfo = this.getUserInfo();
        return !!(userInfo.whatsapp && userInfo.cpf);
    }

    // Faz logout do usuário
    static logout() {
        this.clearUserInfo();
        window.location.reload();
    }

    // Redireciona para autenticação se necessário
    static checkAgeVerification() {
        if (!this.isAgeVerified()) {
            // Redireciona para a página de verificação de idade
            window.location.href = '/age-verification.html';
        }
    }
}

// Executa a verificação de idade quando o script é carregado
document.addEventListener('DOMContentLoaded', () => {
    // Só faz a verificação se não estiver na página de verificação de idade
    if (!window.location.pathname.includes('age-verification.html')) {
        SessionManager.checkAgeVerification();
    }
});
document.addEventListener('DOMContentLoaded', function() {
    // Se já estiver autenticado e com idade verificada, vai direto para home
    if (localStorage.getItem('age_verified') === 'true' && SessionManager.isLoggedIn()) {
        window.location.href = '/';
        return;
    }

    // Se tiver apenas idade verificada mas não estiver autenticado
    if (localStorage.getItem('age_verified') === 'true') {
        window.location.href = '/auth.html';
        return;
    }

    const verifyAgeButton = document.getElementById('verifyAge');
    verifyAgeButton.addEventListener('click', function() {
        const day = document.getElementById('birthDay').value;
        const month = document.getElementById('birthMonth').value;
        const year = document.getElementById('birthYear').value;

        if (!day || !month || !year) {
            M.toast({
                html: 'Por favor, preencha sua data de nascimento completa',
                classes: 'red'
            });
            return;
        }

        const birthDate = new Date(year, month - 1, day);
        const age = calculateAge(birthDate);

        if (age >= 18) {
            localStorage.setItem('age_verified', 'true');
            localStorage.setItem('birth_date', birthDate.toISOString());
            
            M.toast({
                html: 'Idade verificada com sucesso!',
                classes: 'green',
                displayLength: 1500
            });
            
            setTimeout(() => {
                // Se já estiver logado, vai para home
                if (localStorage.getItem('token')) {
                    window.location.href = '/';
                } else {
                    // Se não, vai para tela de auth
                    window.location.href = '/auth.html';
                }
            }, 1500);
        } else {
            M.toast({
                html: 'Você precisa ter 18 anos ou mais para acessar',
                classes: 'red'
            });
        }
    });
});

function calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
} 
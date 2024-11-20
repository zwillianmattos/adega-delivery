document.addEventListener('DOMContentLoaded', function() {
    const verifyButton = document.getElementById('verifyAge');
    const birthDateInput = document.getElementById('birthDate');

    // Se já estiver verificado, redireciona para a página principal
    if (SessionManager.isAgeVerified()) {
        window.location.href = '/';
        return;
    }

    // Define a data máxima como hoje
    const today = new Date();
    birthDateInput.max = today.toISOString().split('T')[0];

    // Define a data mínima como 120 anos atrás
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 120);
    birthDateInput.min = minDate.toISOString().split('T')[0];

    verifyButton.addEventListener('click', async () => {
        const birthDate = birthDateInput.value;

        if (!birthDate) {
            M.toast({html: 'Por favor, insira sua data de nascimento', classes: 'red'});
            return;
        }

        try {
            await SessionManager.verifyAge(birthDate);
            window.location.href = '/';
        } catch (error) {
            M.toast({html: error.message, classes: 'red'});
        }
    });
}); 
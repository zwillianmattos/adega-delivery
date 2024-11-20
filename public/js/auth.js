document.addEventListener('DOMContentLoaded', function() {
    // Inicializar componentes do Materialize
    M.Tabs.init(document.querySelectorAll('.tabs'));
    M.Modal.init(document.querySelectorAll('.modal'));
    M.updateTextFields();

    // Armazenar dados temporários do registro
    let tempRegistrationData = null;

    // Formulário de Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error);
            
            // Salvar token e dados do usuário
            localStorage.setItem('token', data.token);
            localStorage.setItem('userInfo', JSON.stringify(data.user));
            
            // Verificar se existe URL de redirecionamento
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect');
            
            M.toast({html: 'Login realizado com sucesso!', classes: 'green'});
            setTimeout(() => {
                window.location.href = redirectUrl || '/';
            }, 1500);
            
        } catch (error) {
            M.toast({html: error.message, classes: 'red'});
        }
    });

    // Formulário de Registro
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const phone = '+55' + document.getElementById('register-phone').value.replace(/\D/g, '');
        const cpf = document.getElementById('register-cpf').value.replace(/\D/g, '');
        const password = document.getElementById('register-password').value;
        const birthDate = document.getElementById('register-birthdate').value;

        try {
            // Verificar idade
            const age = calculateAge(birthDate);
            if (age < 18) {
                throw new Error('Você precisa ter 18 anos ou mais para se cadastrar');
            }

            // Primeiro, enviar código de verificação
            const verificationResponse = await fetch('/api/auth/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const verificationData = await verificationResponse.json();
            
            if (!verificationResponse.ok) throw new Error(verificationData.error);

            // Armazenar dados temporariamente
            tempRegistrationData = { name, email, phone, cpf, password, birthDate };
            
            // Mostrar modal de verificação
            showVerificationModal('register', email);
            M.toast({html: 'Código de verificação enviado para seu email!', classes: 'green'});
            
        } catch (error) {
            M.toast({html: error.message, classes: 'red'});
        }
    });

    // Verificação de código
    document.getElementById('verify-code-btn').addEventListener('click', async () => {
        const code = document.getElementById('verification-code').value;
        const email = localStorage.getItem('verification_email');
        const type = localStorage.getItem('verification_type');

        try {
            if (type === 'register' && tempRegistrationData) {
                // Verificar código e completar registro
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...tempRegistrationData,
                        verificationCode: code
                    })
                });

                const data = await response.json();
                
                if (!response.ok) throw new Error(data.error);
                
                // Limpar dados temporários
                tempRegistrationData = null;
                localStorage.removeItem('verification_email');
                localStorage.removeItem('verification_type');
                
                // Fechar modal
                const modal = M.Modal.getInstance(document.getElementById('verification-modal'));
                modal.close();
                
                // Salvar token e dados do usuário
                localStorage.setItem('token', data.token);
                localStorage.setItem('userInfo', JSON.stringify(data.user));
                
                M.toast({html: 'Cadastro realizado com sucesso!', classes: 'green'});
                setTimeout(() => window.location.href = '/', 1500);
            }
        } catch (error) {
            M.toast({html: error.message, classes: 'red'});
        }
    });

    // Reenviar código
    document.getElementById('resend-code-btn').addEventListener('click', async () => {
        const email = localStorage.getItem('verification_email');
        
        try {
            const response = await fetch('/api/auth/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error);
            
            M.toast({html: 'Novo código enviado com sucesso!', classes: 'green'});
            
        } catch (error) {
            M.toast({html: error.message, classes: 'red'});
        }
    });
});

function showVerificationModal(type, email) {
    localStorage.setItem('verification_type', type);
    localStorage.setItem('verification_email', email);
    
    const modal = M.Modal.getInstance(document.getElementById('verification-modal'));
    modal.open();
    
    document.getElementById('verification-code').value = '';
    M.updateTextFields();
}

function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
} 
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Salvar token no localStorage
            localStorage.setItem('adminToken', data.token);
            window.location.href = '/admin.html';
        } else {
            document.getElementById('error-message').textContent = data.message;
        }
    } catch (error) {
        document.getElementById('error-message').textContent = 'Erro ao fazer login';
    }
}

// Verificar se já está logado
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        window.location.href = '/admin.html';
    }
}); 
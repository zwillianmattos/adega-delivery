class PaymentManager {
    constructor() {
        // Referência ao carrinho
        this.cart = window.cart;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Adicionar o evento de busca de CEP
        const cepInput = document.getElementById('checkout-cep');
        cepInput.addEventListener('blur', () => this.searchCEP(cepInput.value));

        // Botão de finalizar no carrinho
        document.getElementById('checkout-btn').addEventListener('click', () => {
            this.showCheckoutModal();
        });

        // Botão de confirmar pedido
        document.getElementById('confirm-order-btn').addEventListener('click', async () => {
            const whatsapp = document.getElementById('checkout-whatsapp').value.replace(/\D/g, '');
            const cpf = document.getElementById('checkout-cpf').value.replace(/\D/g, '');
            const street = document.getElementById('checkout-street').value;
            const number = document.getElementById('checkout-number').value;
            const complement = document.getElementById('checkout-complement').value;
            const neighborhood = document.getElementById('checkout-neighborhood').value;
            const city = document.getElementById('checkout-city').value;
            const cep = document.getElementById('checkout-cep').value.replace(/\D/g, '');
            // Validação dos campos
            if (!whatsapp || !cpf || !street || !number || !neighborhood) {
                M.toast({html: 'Por favor, preencha todos os campos obrigatórios', classes: 'red'});
                return;
            }

            if (!/^\d{11}$/.test(whatsapp)) {
                M.toast({html: 'WhatsApp inválido', classes: 'red'});
                return;
            }

            if (!this.validateCPF(cpf)) {
                M.toast({html: 'CPF inválido', classes: 'red'});
                return;
            }

            const address = {
                street,
                number,
                complement,
                neighborhood,
                city,
                zipcode: cep
            };

            try {
                const orderData = {
                    whatsapp,
                    cpf,
                    items: this.cart.items,
                    total: this.cart.getTotal() + 5.00,
                    subtotal: this.cart.getTotal(),
                    deliveryFee: 5.00,
                    customer: {
                        address
                    }
                };

                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderData)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Erro ao criar pedido');
                }
                
                const order = await response.json();
                
                // Limpar carrinho
                this.cart.clear();
                
                // Fechar modal de checkout
                M.Modal.getInstance(document.getElementById('checkout-modal')).close();
                
                // Mostrar sucesso e redirecionar para acompanhamento
                M.toast({html: 'Pedido criado com sucesso!', classes: 'green'});
                window.location.href = `/tracking.html?order=${order.orderNumber}`;

            } catch (error) {
                console.error('Erro ao processar pedido:', error);
                M.toast({html: 'Erro ao processar pedido', classes: 'red'});
            }
        });
    }

    showCheckoutModal() {
        const total = document.getElementById('cart-total').textContent;
        const subtotal = document.getElementById('cart-subtotal').textContent;
        
        if (parseFloat(total) <= 0) {
            M.toast({html: 'Adicione itens ao carrinho primeiro', classes: 'red'});
            return;
        }

        // Atualizar valores no modal de checkout
        document.getElementById('checkout-total').textContent = total;
        document.getElementById('checkout-subtotal').textContent = subtotal;

        // Fechar modal do carrinho e abrir modal de checkout
        M.Modal.getInstance(document.getElementById('cart-modal')).close();
        M.Modal.getInstance(document.getElementById('checkout-modal')).open();
    }

    validateCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g,'');    
        if(cpf == '') return false;    
        if (cpf.length != 11 || 
            cpf == "00000000000" || 
            cpf == "11111111111" || 
            cpf == "22222222222" || 
            cpf == "33333333333" || 
            cpf == "44444444444" || 
            cpf == "55555555555" || 
            cpf == "66666666666" || 
            cpf == "77777777777" || 
            cpf == "88888888888" || 
            cpf == "99999999999")
                return false;        
        let add = 0;    
        for (let i=0; i < 9; i ++)        
            add += parseInt(cpf.charAt(i)) * (10 - i);    
        let rev = 11 - (add % 11);    
        if (rev == 10 || rev == 11)        
            rev = 0;    
        if (rev != parseInt(cpf.charAt(9)))        
            return false;        
        add = 0;    
        for (let i = 0; i < 10; i ++)        
            add += parseInt(cpf.charAt(i)) * (11 - i);    
        rev = 11 - (add % 11);    
        if (rev == 10 || rev == 11)    
            rev = 0;    
        if (rev != parseInt(cpf.charAt(10)))
            return false;        
        return true;
    }

    async searchCEP(cep) {
        // Remove tudo que não for número
        cep = cep.replace(/\D/g, '');

        if (cep.length !== 8) {
            M.toast({html: 'CEP inválido', classes: 'red'});
            return;
        }

        try {
            // Adiciona feedback visual durante a busca
            const streetInput = document.getElementById('checkout-street');
            const neighborhoodInput = document.getElementById('checkout-neighborhood');
            const cityInput = document.getElementById('checkout-city');
            
            streetInput.value = 'Buscando...';
            neighborhoodInput.value = 'Buscando...';
            M.updateTextFields(); // Atualiza os labels do Materialize

            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                throw new Error('CEP não encontrado');
            }

            // Preenche os campos com os dados retornados
            document.getElementById('checkout-street').value = data.logradouro;
            document.getElementById('checkout-neighborhood').value = data.bairro;
            document.getElementById('checkout-city').value = data.localidade;

            // Se o CEP for de fora de São Paulo
            if (data.localidade !== 'Agudos') {
                M.toast({html: 'Desculpe, não atendemos esta localidade', classes: 'red'});
                this.clearAddressFields();
                return;
            }

            // Se o logradouro vier vazio, deixa o campo editável
            if (!data.logradouro) {
                document.getElementById('checkout-street').removeAttribute('readonly');
            } else {
                document.getElementById('checkout-street').setAttribute('readonly', 'readonly');
            }

            // Foca no campo número após preenchimento
            document.getElementById('checkout-number').focus();

            M.updateTextFields(); // Atualiza os labels do Materialize

        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            M.toast({html: 'Erro ao buscar CEP', classes: 'red'});
            this.clearAddressFields();
        }
    }

    clearAddressFields() {
        document.getElementById('checkout-street').value = '';
        document.getElementById('checkout-neighborhood').value = '';
        document.getElementById('checkout-city').value = 'São Paulo';
        document.getElementById('checkout-street').removeAttribute('readonly');
        M.updateTextFields();
    }
}

function startPaymentTimer(pixCreationDate) {
    // Salva a data de criação no localStorage
    if (pixCreationDate) {
        localStorage.setItem('pixCreationDate', pixCreationDate);
    } else {
        // Tenta recuperar a data do localStorage
        pixCreationDate = localStorage.getItem('pixCreationDate');
        if (!pixCreationDate) {
            console.error('Data de criação do PIX não encontrada');
            return;
        }
    }

    const creationTime = new Date(pixCreationDate).getTime();
    const expirationTime = creationTime + (15 * 60 * 1000); // 15 minutos após a criação
    const now = new Date().getTime();

    // Verifica se já expirou
    if (now >= expirationTime) {
        document.getElementById('payment-timer').innerHTML = 'Tempo expirado';
        localStorage.removeItem('pixCreationDate'); // Limpa a data expirada
        return;
    }

    function updateTimer() {
        const currentTime = new Date().getTime();
        const timeLeft = expirationTime - currentTime;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            document.getElementById('payment-timer').innerHTML = 'Tempo expirado';
            localStorage.removeItem('pixCreationDate'); // Limpa a data expirada
            return;
        }

        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        document.getElementById('payment-timer').innerHTML = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
}

// Quando a página carregar, iniciar o timer se houver uma data salva
document.addEventListener('DOMContentLoaded', () => {
    const savedPixDate = localStorage.getItem('pixCreationDate');
    if (savedPixDate) {
        startPaymentTimer(null);
    }
});

// Inicializar o gerenciador de pagamento apenas após o carrinho estar disponível
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um momento para garantir que o cart foi inicializado
    setTimeout(() => {
        if (window.cart) {
            const paymentManager = new PaymentManager();
        } else {
            console.error('Carrinho não encontrado');
            M.toast({html: 'Erro ao inicializar o pagamento', classes: 'red'});
        }
    }, 100);
}); 
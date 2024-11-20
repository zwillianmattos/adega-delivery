class PaymentManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Botão de finalizar no carrinho
        document.getElementById('checkout-btn').addEventListener('click', () => {
            this.showCheckoutModal();
        });

        // Botão de confirmar pedido
        document.getElementById('confirm-order-btn').addEventListener('click', () => {
            this.handleOrderConfirmation();
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

    async handleOrderConfirmation() {
        const whatsapp = document.getElementById('checkout-whatsapp').value.replace(/\D/g, '');
        const cpf = document.getElementById('checkout-cpf').value.replace(/\D/g, '');

        // Validações
        if (!/^\d{11}$/.test(whatsapp)) {
            M.toast({html: 'WhatsApp inválido', classes: 'red'});
            return;
        }

        if (!this.validateCPF(cpf)) {
            M.toast({html: 'CPF inválido', classes: 'red'});
            return;
        }

        try {
            // Criar pedido - Corrigindo o formato dos dados
            const orderData = {
                whatsapp,
                cpf, // Adicionando CPF diretamente no objeto principal
                items: cart.map(item => ({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                total: parseFloat(document.getElementById('checkout-total').textContent),
                subtotal: parseFloat(document.getElementById('checkout-subtotal').textContent),
                deliveryFee: 5.00,
                status: 'pending',
                paymentStatus: 'pending'
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
            clearCart();
            
            // Fechar modal de checkout
            M.Modal.getInstance(document.getElementById('checkout-modal')).close();
            
            // Mostrar sucesso e redirecionar para acompanhamento
            M.toast({html: 'Pedido criado com sucesso!', classes: 'green'});
            window.location.href = `/tracking.html?order=${order.orderNumber}`;

        } catch (error) {
            console.error('Erro ao confirmar pedido:', error);
            M.toast({html: error.message || 'Erro ao criar pedido', classes: 'red'});
        }
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
}

// Inicializar o gerenciador de pagamento
document.addEventListener('DOMContentLoaded', () => {
    const paymentManager = new PaymentManager();
}); 
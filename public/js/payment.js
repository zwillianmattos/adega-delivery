window.openCheckoutModal = function() {
    const subtotal = window.cart?.getTotal() || 0;
    const deliveryFee = 5.00;
    const total = subtotal + deliveryFee;

    // Atualizar valores no modal
    document.getElementById('checkout-subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('checkout-total').textContent = total.toFixed(2);

    const modal = M.Modal.getInstance(document.getElementById('checkout-modal'));
    if (modal) {
        modal.open();
        // Garantir que os endereços sejam carregados
        setTimeout(() => {
            window.debugAddressManager();
        }, 100);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const checkoutModal = document.getElementById('checkout-modal');
    if (!checkoutModal) return;

    // Inicializar o modal com as opções corretas
    M.Modal.init(checkoutModal, {
        onOpenStart: function() {
            console.log('Modal de checkout abrindo...');
            AddressManager.loadAddresses();
        }
    });

    // Configurar o botão de confirmar pedido
    const confirmOrderBtn = document.getElementById('confirm-order-btn');
    if (confirmOrderBtn) {
        confirmOrderBtn.addEventListener('click', async function() {
            try {
                if (!SessionManager.isLoggedIn()) {
                    window.location.href = '/auth.html';
                    return;
                }

                // Verificar se está usando endereço salvo ou novo endereço
                const addressForm = document.getElementById('address-form');
                const addressSelection = document.getElementById('address-selection');
                let customerAddress;

                if (addressForm.style.display !== 'none') {
                    // Validar campos do formulário
                    const requiredFields = [
                        'checkout-whatsapp',
                        'checkout-cpf',
                        'checkout-cep',
                        'checkout-street',
                        'checkout-number',
                        'checkout-neighborhood',
                        'checkout-city'
                    ];

                    for (const fieldId of requiredFields) {
                        const field = document.getElementById(fieldId);
                        if (!field || !field.value.trim()) {
                            M.toast({html: 'Preencha todos os campos obrigatórios', classes: 'red'});
                            return;
                        }
                    }

                    // Criar objeto de endereço com dados do formulário
                    customerAddress = {
                        cep: document.getElementById('checkout-cep').value,
                        street: document.getElementById('checkout-street').value,
                        number: document.getElementById('checkout-number').value,
                        complement: document.getElementById('checkout-complement').value || '',
                        neighborhood: document.getElementById('checkout-neighborhood').value,
                        city: document.getElementById('checkout-city').value
                    };

                    // Se marcou para salvar endereço
                    if (document.getElementById('save-address').checked) {
                        try {
                            const response = await fetch('/api/addresses', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${SessionManager.getToken()}`
                                },
                                body: JSON.stringify(customerAddress)
                            });

                            if (!response.ok) throw new Error('Erro ao salvar endereço');
                            M.toast({html: 'Endereço salvo com sucesso', classes: 'green'});
                        } catch (error) {
                            console.error('Erro ao salvar endereço:', error);
                        }
                    }
                } else {
                    // Pegar endereço selecionado
                    const selectedAddress = document.querySelector('input[name="address"]:checked');
                    if (!selectedAddress) {
                        M.toast({html: 'Selecione um endereço de entrega', classes: 'red'});
                        return;
                    }
                    customerAddress = JSON.parse(selectedAddress.value);
                }

                // Preparar dados do pedido
                const userInfo = SessionManager.getUserInfo();
                const orderData = {
                    userId: userInfo.id,
                    orderNumber: generateOrderNumber(),
                    items: cart.items,
                    subtotal: cart.getTotal(),
                    deliveryFee: 5.00,
                    total: cart.getTotal() + 5.00,
                    status: 'PENDING',
                    customer: {
                        name: userInfo.name || '',
                        email: userInfo.email || '',
                        phone: document.getElementById('checkout-whatsapp').value,
                        cpf: document.getElementById('checkout-cpf').value,
                        address: customerAddress
                    }
                };

                // Enviar pedido
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SessionManager.getToken()}`
                    },
                    body: JSON.stringify(orderData)
                });

                if (!response.ok) throw new Error('Erro ao criar pedido');

                const order = await response.json();
                
                // Limpar carrinho e redirecionar
                cart.clear();
                M.Modal.getInstance(checkoutModal).close();
                window.location.href = `/tracking.html?order=${order.orderNumber}`;

            } catch (error) {
                console.error('Erro ao processar pedido:', error);
                M.toast({html: 'Erro ao processar pedido. Tente novamente.', classes: 'red'});
            }
        });
    }
});

function generateOrderNumber() {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${timestamp}${random}`;
}

function calculateSubtotal(cart) {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Mover para escopo global
window.openCheckoutModal = function() {
    const subtotal = cart.getTotal();
    const deliveryFee = 5.00;
    const total = subtotal + deliveryFee;

    // Atualizar valores no modal
    document.getElementById('checkout-subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('checkout-total').textContent = total.toFixed(2);

    const modal = M.Modal.getInstance(document.getElementById('checkout-modal'));
    modal.open();
} 
document.addEventListener('DOMContentLoaded', function() {
    const savedWhatsapp = localStorage.getItem('lastWhatsapp');
    if (savedWhatsapp) {
        document.getElementById('whatsapp').value = savedWhatsapp;
        M.updateTextFields();
        searchOrders();
    }
});

async function searchOrders() {
    const whatsappInput = document.getElementById('whatsapp');
    const whatsapp = whatsappInput.value.replace(/\D/g, '');

    if (!/^\d{11}$/.test(whatsapp)) {
        M.toast({html: 'WhatsApp inválido', classes: 'red'});
        return;
    }

    try {
        const response = await fetch(`/api/orders/whatsapp/${whatsapp}`);
        if (!response.ok) throw new Error('Pedidos não encontrados');
        
        const orders = await response.json();
        displayOrders(orders);
        
        localStorage.setItem('lastWhatsapp', whatsapp);
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        document.getElementById('orders-list').innerHTML = `
            <div class="center-align red-text">
                <i class="material-icons large">error</i>
                <h5>Nenhum pedido encontrado</h5>
                <p>Verifique o número e tente novamente</p>
            </div>
        `;
        document.getElementById('orders-list').style.display = 'block';
    }
}

function displayOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    ordersList.style.display = 'block';

    const statusMap = {
        pending: { text: 'Pendente', icon: 'hourglass_empty', color: 'orange' },
        confirmed: { text: 'Confirmado', icon: 'check_circle', color: 'green' },
        preparing: { text: 'Em Preparação', icon: 'local_shipping', color: 'blue' },
        delivering: { text: 'Em Entrega', icon: 'delivery_dining', color: 'purple' },
        delivered: { text: 'Entregue', icon: 'done_all', color: 'green' },
        cancelled: { text: 'Cancelado', icon: 'cancel', color: 'red' }
    };

    ordersList.innerHTML = `
        <div class="collection">
            ${orders.map(order => {
                const status = statusMap[order.status];
                const date = new Date(order.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                return `
                    <div class="collection-item">
                        <div class="order-header">
                            <span class="order-number">${order.orderNumber}</span>
                            <span class="order-date grey-text">${date}</span>
                        </div>
                        
                        <div class="order-status ${status.color}-text">
                            <i class="material-icons tiny">${status.icon}</i>
                            ${status.text}
                        </div>

                        <div class="order-items">
                            ${order.items.map(item => `
                                <div class="order-item">
                                    ${item.quantity}x ${item.name}
                                    <span class="right">R$ ${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>

                        <div class="order-total">
                            <div>Subtotal: R$ ${order.subtotal.toFixed(2)}</div>
                            <div>Taxa de entrega: R$ ${order.deliveryFee.toFixed(2)}</div>
                            <div class="total">Total: R$ ${order.total.toFixed(2)}</div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Adicionar evento de Enter no input
document.getElementById('whatsapp').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchOrders();
    }
}); 
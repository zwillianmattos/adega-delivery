function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin-login.html';
        return false;
    }
    return token;
}

async function loadOrders(status = 'all') {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`/api/admin/orders${status !== 'all' ? `?status=${status}` : ''}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin-login.html';
            return;
        }

        if (!response.ok) throw new Error('Erro ao carregar pedidos');
        const orders = await response.json();
        displayOrders(orders);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar pedidos');
    }
}

function displayOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '';

    orders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'order-card';
        orderElement.innerHTML = `
            <div class="order-header">
                <h3>Pedido ${order.orderNumber}</h3>
                <span class="order-date">${new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div class="order-details">
                <p><strong>Cliente CPF:</strong> ${order.cpf}</p>
                <p><strong>WhatsApp:</strong> ${order.whatsapp}</p>
                <p><strong>Endereço:</strong> ${order.customer?.address.street}, ${order.customer?.address.number}, ${order.customer?.address.neighborhood}, ${order.customer?.address.city}</p>
                <p><strong>Total:</strong> R$ ${order.total.toFixed(2)}</p>
                <p><strong>Status:</strong> 
                    <select class="status-select" onchange="updateOrderStatus('${order._id}', this.value)">
                        <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Em Preparação</option>
                        <option value="delivering" ${order.status === 'delivering' ? 'selected' : ''}>Em Entrega</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Concluído</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
                    </select>
                </p>
            </div>
            <div class="order-items">
                <h4>Itens do Pedido:</h4>
                <ul>
                    ${order.items.map(item => `
                        <li>${item.quantity}x ${item.name} - R$ ${(item.quantity * item.price).toFixed(2)}</li>
                    `).join('')}
                </ul>
            </div>
        `;
        ordersList.appendChild(orderElement);
    });
}

async function updateOrderStatus(orderId, newStatus) {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin-login.html';
            return;
        }

        if (!response.ok) throw new Error('Erro ao atualizar status');
        
        loadOrders(document.getElementById('order-status-filter').value);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao atualizar status do pedido');
    }
}

async function generateReport(period) {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`/api/reports/${period}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin-login.html';
            return;
        }

        if (!response.ok) throw new Error('Erro ao gerar relatório');
        const report = await response.json();
        displayReport(report, period);
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        alert('Erro ao gerar relatório');
    }
}

function displayReport(report, period) {
    const reportResults = document.getElementById('report-results');
    reportResults.innerHTML = `
        <h3>Relatório ${period === 'daily' ? 'Diário' : 
                       period === 'weekly' ? 'Semanal' : 'Mensal'}</h3>
        <p>Total de Pedidos: ${report.totalOrders}</p>
        <p>Faturamento: R$ ${report.totalRevenue.toFixed(2)}</p>
        <p>Ticket Médio: R$ ${report.averageTicket.toFixed(2)}</p>
        <p>Pedidos por Status:</p>
        <ul>
            ${Object.entries(report.ordersByStatus).map(([status, count]) => 
                `<li>${status}: ${count}</li>`
            ).join('')}
        </ul>
    `;
}

function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin-login.html';
}

// Event listener para o filtro de status
document.getElementById('order-status-filter').addEventListener('change', (e) => {
    loadOrders(e.target.value);
});

// Verifica autenticação no carregamento da página
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    loadOrders();
}); 
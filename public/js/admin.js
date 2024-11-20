document.addEventListener('DOMContentLoaded', function() {
    // Inicializa os filtros
    const statusFilter = document.getElementById('order-status-filter');
    statusFilter.addEventListener('change', loadOrders);

    loadDashboard();
    loadCharts();
    loadOrders();

    // Atualiza os pedidos a cada 30 segundos
    setInterval(loadOrders, 30000);
});

async function loadDashboard() {
    try {
        const response = await fetch('/api/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar dashboard');
        
        const data = await response.json();
        
        // Atualiza os cards do dashboard
        document.querySelector('[data-metric="orders"]').textContent = data.totalOrdersToday;
        document.querySelector('[data-metric="revenue"]').textContent = 
            `R$ ${data.totalRevenueToday.toFixed(2)}`;
        document.querySelector('[data-metric="ticket"]').textContent = 
            `R$ ${data.averageTicket.toFixed(2)}`;
        document.querySelector('[data-metric="completion"]').textContent = 
            `${data.completionRate.toFixed(1)}%`;
    } catch (error) {
        console.error('Erro:', error);
        M.toast({html: 'Erro ao carregar dados do dashboard'});
    }
}

async function loadCharts() {
    try {
        const response = await fetch('/api/admin/charts', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar gráficos');
        
        const data = await response.json();
        
        // Atualiza os gráficos com dados reais
        updateSalesChart(data.hourlyOrders);
        updateProductsChart(data.topProducts);
    } catch (error) {
        console.error('Erro:', error);
        M.toast({html: 'Erro ao carregar dados dos gráficos'});
    }
}

function updateSalesChart(hourlyData) {
    const hours = Array.from({length: 24}, (_, i) => `${i}h`);
    const salesData = Array.from({length: 24}, (_, i) => {
        const hourData = hourlyData.find(d => d._id === i);
        return hourData ? hourData.count : 0;
    });

    const salesCtx = document.getElementById('salesByHourChart').getContext('2d');
    new Chart(salesCtx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [{
                label: 'Vendas',
                data: salesData,
                borderColor: '#ea1d2c',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateProductsChart(productsData) {
    const productsCtx = document.getElementById('topProductsChart').getContext('2d');
    new Chart(productsCtx, {
        type: 'bar',
        data: {
            labels: productsData.map(p => p.name),
            datasets: [{
                label: 'Vendas',
                data: productsData.map(p => p.totalSold),
                backgroundColor: '#ea1d2c',
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

async function loadOrders() {
    try {
        const statusFilter = document.getElementById('order-status-filter');
        const status = statusFilter.value;
        
        let url = '/api/admin/orders';
        if (status && status !== 'all') {
            url += `?status=${status}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar pedidos');
        
        const orders = await response.json();
        
        if (orders.length === 0) {
            const ordersList = document.getElementById('orders-list');
            ordersList.innerHTML = `
                <div class="center-align" style="padding: 20px; color: #666;">
                    <i class="material-icons medium">info_outline</i>
                    <p>Nenhum pedido encontrado</p>
                </div>
            `;
            return;
        }

        displayOrders(orders);
    } catch (error) {
        console.error('Erro:', error);
        M.toast({html: 'Erro ao carregar pedidos'});
    }
}

function displayOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">#${order.orderNumber}</span>
                <span class="order-status status-${order.status.toLowerCase()}">${getStatusText(order.status)}</span>
            </div>
            <div class="order-customer">
                <i class="material-icons tiny">person</i>
                ${order.whatsapp || 'Cliente'}
            </div>
            <div class="order-address">
                <i class="material-icons tiny">location_on</i>
                ${formatAddress(order.customer?.address)}
            </div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div>${item.quantity}x ${item.name}</div>
                `).join('')}
            </div>
            <div class="order-total">
                Total: R$ ${order.total.toFixed(2)}
            </div>
            <div class="order-actions" style="margin-top: 12px;">
                ${getOrderActions(order.status, order._id)}
            </div>
        </div>
    `).join('');
}

function formatAddress(address) {
    if (!address) return 'Endereço não disponível';
    return `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''} - ${address.neighborhood}`;
}

function getStatusText(status) {
    const statusMap = {
        'PREPARING': 'Em Preparação',
        'DELIVERING': 'Em Entrega',
        'COMPLETED': 'Concluído',
        'CANCELLED': 'Cancelado'
    };
    return statusMap[status] || status;
}

function getOrderActions(status, orderId) {
    if (status === 'COMPLETED' || status === 'CANCELLED') return '';
    
    return `
        <button class="btn waves-effect waves-light btn-small" 
                onclick="updateOrderStatus('${orderId}', '${getNextStatus(status)}')">
            ${getNextStatusText(status)}
        </button>
    `;
}

function getNextStatus(currentStatus) {
    const statusFlow = {
        'PREPARING': 'DELIVERING',
        'DELIVERING': 'COMPLETED'
    };
    return statusFlow[currentStatus] || currentStatus;
}

function getNextStatusText(currentStatus) {
    const statusFlow = {
        'PREPARING': 'Enviar para Entrega',
        'DELIVERING': 'Concluir Entrega'
    };
    return statusFlow[currentStatus] || '';
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) throw new Error('Erro ao atualizar status');
        
        await loadOrders(); // Aguarda o carregamento dos pedidos
        M.toast({html: 'Status atualizado com sucesso'});
    } catch (error) {
        console.error('Erro:', error);
        M.toast({html: 'Erro ao atualizar status'});
    }
}

function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin-login.html';
}
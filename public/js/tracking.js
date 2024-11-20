class OrderTracker {
    constructor() {
        this.orderNumber = window.location.hash.replace('#', '');
        this.statusCheckInterval = null;
        this.paymentTimer = null;
        
        if (!this.orderNumber) {
            window.location.href = '/';
            return;
        }

        this.init();
    }

    async init() {
        try {
            await this.loadOrderDetails();
            this.startStatusCheck();
        } catch (error) {
            console.error('Erro ao inicializar tracking:', error);
            M.toast({html: 'Erro ao carregar pedido', classes: 'red'});
        }
    }

    async loadOrderDetails() {
        const response = await fetch(`/api/orders/${this.orderNumber}`);
        if (!response.ok) throw new Error('Pedido não encontrado');
        
        const order = await response.json();
        this.updateOrderDisplay(order);
        this.showAddressSection(order.customer.address);
        if (order.status === 'pending' && order.paymentStatus === 'pending' && !order.paymentId) {
            await this.loadPaymentDetails(order);
        } else if (order.paymentId) {
            await this.checkPaymentStatus(order);
        }
    }

    async loadPaymentDetails(order) {
        try {
            const response = await fetch(`/api/payment/generate-pix`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: order.orderNumber,
                    amount: order.total,
                    customer: {
                        whatsapp: order.whatsapp,
                        cpf: order.cpf
                    }
                })
            });

            if (!response.ok) throw new Error(`Erro ao gerar PIX: ${response.statusText}`);
            
            const paymentData = await response.json();
            this.showPaymentSection(paymentData, order.total);
            this.startPaymentTimer();
            
        } catch (error) {
            console.error('Erro ao carregar dados de pagamento:', error);
            M.toast({html: 'Erro ao gerar PIX', classes: 'red'});
        }
    }

    showAddressSection(address) {
        document.getElementById('address-section').style.display = 'block';

        document.getElementById('recipient-name').textContent = address.recipient;
        document.getElementById('street').textContent = address.street;
        document.getElementById('number').textContent = address.number;
        document.getElementById('complement').textContent = address.complement;
        document.getElementById('neighborhood').textContent = address.neighborhood;
        document.getElementById('city').textContent = address.city;
        document.getElementById('zipcode').textContent = address.zipcode;
    }

    async checkPaymentStatus(order) {
        try {
            const response = await fetch(`/api/payment/status/${order.paymentId}`);
            if (!response.ok) throw new Error('Erro ao verificar pagamento');
            
            const { status } = await response.json();

            if (status === 'pending') {
                if (order.paymentId) {
                    const paymentData = await this.getExistingPixData(order.paymentId);
                    this.showPaymentSection(paymentData, order.total);
                    this.startPaymentTimer();
                }
            } else if (status === 'paid') {
                document.getElementById('payment-section').style.display = 'none';
                if (!this.paymentConfirmedToastDisplayed) {
                    M.toast({html: 'Pagamento confirmado!', classes: 'green'});
                    this.paymentConfirmedToastDisplayed = true;
                }
            }
        } catch (error) {
            console.error('Erro ao verificar status:', error);
            M.toast({html: 'Erro ao verificar status do pagamento', classes: 'red'});
        }
    }

    async getExistingPixData(paymentId) {
        const response = await fetch(`/api/payment/pix-data/${paymentId}`);
        if (!response.ok) throw new Error('Erro ao recuperar dados do PIX');
        return await response.json();
    }

    updateOrderDisplay(order) {
        document.getElementById('order-number').textContent = order.orderNumber;
        document.getElementById('order-date').textContent = new Date(order.createdAt)
            .toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

        this.updateStatusTimeline(order.status);
        this.updateOrderItems(order);
    }

    updateStatusTimeline(status) {
        const timeline = document.getElementById('status-timeline');
        const statusSteps = [
            { key: 'pending', text: 'Pedido Realizado', icon: 'receipt' },
            { key: 'confirmed', text: 'Pedido Confirmado', icon: 'check_circle' },
            { key: 'preparing', text: 'Em Preparação', icon: 'local_shipping' },
            { key: 'delivering', text: 'Em Entrega', icon: 'delivery_dining' },
            { key: 'delivered', text: 'Entregue', icon: 'done_all' }
        ];

        const currentStep = statusSteps.findIndex(step => step.key === status);
        
        timeline.innerHTML = statusSteps.map((step, index) => `
            <div class="timeline-item ${index <= currentStep ? 'active' : ''}">
                <i class="material-icons">${step.icon}</i>
                <span>${step.text}</span>
            </div>
        `).join('');
    }

    updateOrderItems(order) {
        const itemsContainer = document.getElementById('order-items');
        itemsContainer.innerHTML = order.items.map(item => `
            <div class="order-item">
                <div class="item-quantity">${item.quantity}x</div>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">R$ ${(item.price * item.quantity).toFixed(2)}</div>
                </div>
            </div>
        `).join('');

        document.getElementById('order-subtotal').textContent = order.subtotal.toFixed(2);
        document.getElementById('order-delivery').textContent = order.deliveryFee.toFixed(2);
        document.getElementById('order-total').textContent = order.total.toFixed(2);
    }

    showPaymentSection(paymentData, total) {
        document.getElementById('payment-section').style.display = 'block';
        document.getElementById('payment-amount').textContent = total.toFixed(2);
        document.getElementById('pix-qrcode').src = `data:image/png;base64,${paymentData.qrCodeImage}`;
        document.getElementById('pix-code').value = paymentData.pixCopiaECola;
        M.textareaAutoResize(document.getElementById('pix-code'));
    }

    startPaymentTimer() {
        let timeLeft = 15 * 60; // 15 minutos
        const timerDisplay = document.getElementById('payment-timer');

        this.paymentTimer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                clearInterval(this.paymentTimer);
                window.location.reload(); // Recarrega para atualizar status
            }
            
            timeLeft--;
        }, 1000);
    }

    startStatusCheck() {
        this.statusCheckInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/orders/${this.orderNumber}`);
                if (!response.ok) throw new Error('Erro ao verificar status');
                
                const order = await response.json();
                this.updateOrderDisplay(order);

                if (order.paymentId) {
                    await this.checkPaymentStatus(order);
                }
                
                if (order.status !== 'pending' || order.paymentStatus === 'paid') {
                    document.getElementById('payment-section').style.display = 'none';
                    clearInterval(this.paymentTimer);
                }

            } catch (error) {
                console.error('Erro ao verificar status:', error);
            }
        }, 10000); // Verifica a cada 10 segundos
    }
}

function copyPixCode() {
    const pixCode = document.getElementById('pix-code');
    pixCode.select();
    document.execCommand('copy');
    M.toast({html: 'Código PIX copiado!', classes: 'green'});
}

// Inicializar o tracker quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new OrderTracker();
}); 
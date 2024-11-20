window.cart = {
    items: [],
    
    addItem(productId) {
        const product = products.find(p => p._id === productId);
        if (!product) {
            M.toast({html: 'Produto não encontrado', classes: 'red accent-2'});
            return;
        }

        try {
            const existingItem = this.items.find(item => item.productId === productId);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                this.items.push({
                    productId,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: 1
                });
            }
            this.updateDisplay();
            this.saveToLocalStorage();
            M.toast({html: 'Produto adicionado ao carrinho', classes: 'green'});
        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error);
            M.toast({html: 'Erro ao adicionar produto', classes: 'red accent-2'});
        }
    },

    updateQuantity(productId, change) {
        const item = this.items.find(item => item.productId === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeItem(productId);
            } else {
                this.updateDisplay();
                this.saveToLocalStorage();
            }
        }
    },

    removeItem(productId) {
        this.items = this.items.filter(item => item.productId !== productId);
        this.updateDisplay();
        this.saveToLocalStorage();
        M.toast({html: 'Produto removido do carrinho', classes: 'orange'});
    },

    clear() {
        this.items = [];
        this.updateDisplay();
        this.saveToLocalStorage();
    },

    getTotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    updateDisplay() {
        const cartCount = document.getElementById('cart-count');
        const totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalQuantity;

        const cartItems = document.getElementById('cart-items');
        const cartSubtotal = document.getElementById('cart-subtotal');
        const cartTotal = document.getElementById('cart-total');
        
        if (this.items.length === 0) {
            cartItems.innerHTML = `
                <div class="center-align grey-text" style="padding: 20px;">
                    <i class="material-icons large">shopping_cart</i>
                    <p>Seu carrinho está vazio</p>
                </div>
            `;
        } else {
            cartItems.innerHTML = this.items.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">R$ ${item.price.toFixed(2)}</div>
                        <div class="cart-item-quantity">
                            <button class="btn-flat waves-effect waves-red" onclick="cart.updateQuantity('${item.productId}', -1)">
                                <i class="material-icons">remove</i>
                            </button>
                            <span>${item.quantity}</span>
                            <button class="btn-flat waves-effect waves-green" onclick="cart.updateQuantity('${item.productId}', 1)">
                                <i class="material-icons">add</i>
                            </button>
                        </div>
                    </div>
                    <button class="btn-flat waves-effect waves-red" onclick="cart.removeItem('${item.productId}')">
                        <i class="material-icons">delete</i>
                    </button>
                </div>
            `).join('');
        }

        const subtotal = this.getTotal();
        const deliveryFee = 5.00;
        const total = subtotal + deliveryFee;

        cartSubtotal.textContent = subtotal.toFixed(2);
        cartTotal.textContent = total.toFixed(2);

        // Atualizar estado do botão de finalizar
        const checkoutBtn = document.getElementById('checkout-btn');
        checkoutBtn.disabled = this.items.length === 0;
    },

    saveToLocalStorage() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    },

    loadFromLocalStorage() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            this.items = JSON.parse(savedCart);
            this.updateDisplay();
        }
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    window.cart.loadFromLocalStorage();
});

// Atualizar as funções globais para usar o objeto cart
window.addToCart = (productId) => window.cart.addItem(productId);

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
}

document.querySelector('.cart-icon')?.addEventListener('click', toggleCart);

window.onclick = function(event) {
    const modal = document.getElementById('cart-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

window.clearCart = () => window.cart.clear();
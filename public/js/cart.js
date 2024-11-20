let cart = [];

function addToCart(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) {
        M.toast({html: 'Produto não encontrado', classes: 'red accent-2'});
        return;
    }

    try {
        const existingItem = cart.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                productId,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }
        updateCartDisplay();
        saveCartToLocalStorage();
        M.toast({html: 'Produto adicionado ao carrinho', classes: 'green'});
    } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
        M.toast({html: 'Erro ao adicionar produto', classes: 'red accent-2'});
    }
}

function updateCartDisplay() {
    const cartCount = document.getElementById('cart-count');
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalQuantity;

    const cartItems = document.getElementById('cart-items');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartTotal = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="center-align grey-text" style="padding: 20px;">
                <i class="material-icons large">shopping_cart</i>
                <p>Seu carrinho está vazio</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map(item => {
            console.log(item);
            return `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">R$ ${item.price.toFixed(2)}</div>
                    <div class="cart-item-quantity">
                        <button class="btn-flat waves-effect waves-red" onclick="updateQuantity('${item.productId}', -1)">
                            <i class="material-icons">remove</i>
                        </button>
                        <span>${item.quantity}</span>
                        <button class="btn-flat waves-effect waves-green" onclick="updateQuantity('${item.productId}', 1)">
                            <i class="material-icons">add</i>
                        </button>
                    </div>
                </div>
                <button class="btn-flat waves-effect waves-red" onclick="removeFromCart('${item.productId}')">
                    <i class="material-icons">delete</i>
                </button>
                </div>
            `
        }).join('');
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 5.00;
    const total = subtotal + deliveryFee;

    cartSubtotal.textContent = subtotal.toFixed(2);
    cartTotal.textContent = total.toFixed(2);

    // Atualizar estado do botão de finalizar
    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn.disabled = cart.length === 0;
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.productId === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartDisplay();
            saveCartToLocalStorage();
        }
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    updateCartDisplay();
    saveCartToLocalStorage();
    M.toast({html: 'Produto removido do carrinho', classes: 'orange'});
}

function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromLocalStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartDisplay();
    }
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
}

document.querySelector('.cart-icon').addEventListener('click', toggleCart);

window.onclick = function(event) {
    const modal = document.getElementById('cart-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

function clearCart() {
    cart = [];
    updateCartDisplay();
    saveCartToLocalStorage();
}

window.clearCart = clearCart;
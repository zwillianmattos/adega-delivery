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

async function checkout() {
    if (cart.length === 0) {
        M.toast({html: 'Adicione produtos ao carrinho primeiro', classes: 'red accent-2'});
        return;
    }

    const whatsapp = await showCheckoutModal();
    if (!whatsapp) return;

    try {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = 5.00;
        const total = subtotal + deliveryFee;

        const order = {
            whatsapp,
            items: cart.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            subtotal,
            deliveryFee,
            total
        };

        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(order)
        });

        if (!response.ok) throw new Error('Erro ao criar pedido');
        
        const newOrder = await response.json();
        
        cart = [];
        updateCartDisplay();
        saveCartToLocalStorage();
        
        const cartModal = M.Modal.getInstance(document.getElementById('cart-modal'));
        cartModal.close();

        showOrderSuccessModal(newOrder.orderNumber);

    } catch (error) {
        console.error('Erro ao finalizar pedido:', error);
        M.toast({html: 'Erro ao finalizar pedido', classes: 'red accent-2'});
    }
}

function showCheckoutModal() {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h4>Finalizar Pedido</h4>
                <div class="row">
                    <form class="col s12">
                        <div class="row">
                            <div class="input-field col s12">
                                <i class="material-icons prefix">phone</i>
                                <input id="whatsapp" type="tel" class="validate" pattern="[0-9]{11}" required>
                                <label for="whatsapp">WhatsApp (apenas números)</label>
                                <span class="helper-text">Exemplo: 11999999999</span>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-close waves-effect waves-red btn-flat">Cancelar</button>
                <button id="confirm-whatsapp" class="waves-effect waves-green btn red accent-2">Confirmar</button>
            </div>
        `;

        document.body.appendChild(modal);
        const modalInstance = M.Modal.init(modal);
        modalInstance.open();

        const confirmBtn = modal.querySelector('#confirm-whatsapp');
        const whatsappInput = modal.querySelector('#whatsapp');

        confirmBtn.addEventListener('click', () => {
            if (whatsappInput.checkValidity()) {
                const whatsapp = whatsappInput.value;
                modalInstance.close();
                setTimeout(() => {
                    modal.remove();
                    resolve(whatsapp);
                }, 300);
            } else {
                M.toast({html: 'WhatsApp inválido', classes: 'red accent-2'});
            }
        });

        modal.querySelector('.modal-close').addEventListener('click', () => {
            setTimeout(() => {
                modal.remove();
                resolve(null);
            }, 300);
        });
    });
}

function showOrderSuccessModal(orderNumber) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content center-align">
            <i class="material-icons large green-text">check_circle</i>
            <h4>Pedido Realizado!</h4>
            <p>Seu número de pedido é: <strong>${orderNumber}</strong></p>
            <p>Use este número para acompanhar seu pedido.</p>
            <div class="row">
                <a href="/tracking.html?order=${orderNumber}" class="btn waves-effect waves-light red accent-2">
                    Acompanhar Pedido
                </a>
            </div>
        </div>
        <div class="modal-footer">
            <button class="modal-close waves-effect waves-green btn-flat">Fechar</button>
        </div>
    `;

    document.body.appendChild(modal);
    const modalInstance = M.Modal.init(modal);
    modalInstance.open();

    modal.querySelector('.modal-close').addEventListener('click', () => {
        setTimeout(() => modal.remove(), 300);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    loadCartFromLocalStorage();
    
    document.getElementById('checkout-btn').addEventListener('click', checkout);
});

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
let products = [];

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
        displayProducts();
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        M.toast({html: 'Erro ao carregar produtos', classes: 'red accent-2'});
    }
}

function displayProducts() {
    const productsGrid = document.getElementById('products-grid');
    productsGrid.innerHTML = '';

    products.forEach(product => {
        const col = document.createElement('div');
        col.className = 'col s12 m6 l4';
        col.innerHTML = `
            <div class="card product-card">
                <div class="card-image">
                    <img src="${product.image}" alt="${product.name}">
                    <button class="btn-floating halfway-fab waves-effect waves-light red accent-2" 
                            onclick="addToCart('${product._id}')">
                        <i class="material-icons">add</i>
                    </button>
                </div>
                <div class="card-content">
                    <h6 class="product-title truncate">${product.name}</h6>
                    <p class="product-description grey-text">${product.description || 'Sem descrição disponível'}</p>
                    <div class="product-footer">
                        <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                        <div class="chip">${product.category}</div>
                    </div>
                </div>
            </div>
        `;
        productsGrid.appendChild(col);
    });
}

function filterByCategory(category) {
    const chips = document.querySelectorAll('.category-chip');
    chips.forEach(chip => chip.classList.remove('active'));
    event.target.classList.add('active');

    const productsGrid = document.getElementById('products-grid');
    productsGrid.classList.add('fade-out');

    setTimeout(() => {
        if (category === 'Todos') {
            displayProducts();
        } else {
            const filtered = products.filter(p => p.category === category);
            const productsGrid = document.getElementById('products-grid');
            productsGrid.innerHTML = '';

            if (filtered.length === 0) {
                productsGrid.innerHTML = `
                    <div class="col s12 center-align">
                        <h5 class="grey-text">Nenhum produto encontrado nesta categoria</h5>
                    </div>
                `;
            } else {
                filtered.forEach(product => {
                    const col = document.createElement('div');
                    col.className = 'col s12 m6 l4';
                    col.innerHTML = `
                        <div class="card product-card">
                            <div class="card-image">
                                <img src="${product.image}" alt="${product.name}">
                                <button class="btn-floating halfway-fab waves-effect waves-light red accent-2" 
                                        onclick="addToCart('${product._id}')">
                                    <i class="material-icons">add</i>
                                </button>
                            </div>
                            <div class="card-content">
                                <h6 class="product-title truncate">${product.name}</h6>
                                <p class="product-description grey-text">${product.description || 'Sem descrição disponível'}</p>
                                <div class="product-footer">
                                    <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                                    <div class="chip">${product.category}</div>
                                </div>
                            </div>
                        </div>
                    `;
                    productsGrid.appendChild(col);
                });
            }
        }
        productsGrid.classList.remove('fade-out');
    }, 300);
}

document.addEventListener('DOMContentLoaded', function() {
    const modals = document.querySelectorAll('.modal');
    M.Modal.init(modals, {
        dismissible: true,
        inDuration: 300,
        outDuration: 200
    });
    
    const categoryChips = document.querySelectorAll('.category-chip');
    categoryChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            filterByCategory(chip.textContent);
        });
    });
    
    loadProducts();
}); 
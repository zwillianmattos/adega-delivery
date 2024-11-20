const AddressManager = {
    async loadAddresses() {
        if (!SessionManager.isLoggedIn()) {
            console.log('Usuário não está logado');
            return;
        }

        try {
            console.log('Carregando endereços...');
            const response = await fetch('/api/addresses', {
                headers: {
                    'Authorization': `Bearer ${SessionManager.getToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao carregar endereços: ${response.status}`);
            }
            
            const addresses = await response.json();
            console.log('Endereços carregados:', addresses);
            
            // Gerenciar visibilidade dos elementos
            const addressSelection = document.getElementById('address-selection');
            const addressForm = document.getElementById('address-form');
            const newAddressBtn = document.getElementById('new-address-btn');
            const savedAddressesContainer = document.getElementById('saved-addresses');
            const backToListBtn = document.getElementById('back-to-addresses');
            
            if (!savedAddressesContainer) {
                console.error('Elemento saved-addresses não encontrado');
                return;
            }

            // Exibir endereços
            this.displayAddresses(addresses);
            
            if (addresses && addresses.length > 0) {
                // Se tem endereços salvos, mostrar seleção e botão de novo endereço
                if (addressSelection) addressSelection.style.display = 'block';
                if (addressForm) addressForm.style.display = 'none';
                if (newAddressBtn) newAddressBtn.style.display = 'block';
                if (backToListBtn) backToListBtn.style.display = 'none';
            } else {
                // Se não tem endereços, mostrar apenas o formulário
                if (addressSelection) addressSelection.style.display = 'none';
                if (addressForm) addressForm.style.display = 'block';
                if (newAddressBtn) newAddressBtn.style.display = 'none';
                if (backToListBtn) backToListBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Erro ao carregar endereços:', error);
            M.toast({html: 'Erro ao carregar endereços', classes: 'red'});
            this.showNewAddressForm();
        }
    },

    displayAddresses(addresses) {
        const container = document.getElementById('saved-addresses');
        if (!container) {
            console.error('Elemento saved-addresses não encontrado em displayAddresses');
            return;
        }

        if (!addresses || addresses.length === 0) {
            container.innerHTML = `
                <div class="center-align grey-text">
                    <i class="material-icons medium">location_off</i>
                    <p>Nenhum endereço salvo</p>
                </div>
            `;
            this.showNewAddressForm(); // Mostrar formulário se não houver endereços
            return;
        }

        container.innerHTML = `
            <div class="addresses-list">
                ${addresses.map((address, index) => `
                    <div class="address-card">
                        <label>
                            <input name="address" type="radio" value='${JSON.stringify(address)}' ${index === 0 ? 'checked' : ''} />
                            <span class="address-details">
                                <i class="material-icons tiny">location_on</i>
                                ${address.street}, ${address.number}
                                ${address.complement ? `<br>Complemento: ${address.complement}` : ''}
                                <br>
                                ${address.neighborhood} - ${address.city}
                                <br>
                                CEP: ${address.cep}
                            </span>
                        </label>
                        <button class="btn-flat waves-effect waves-red" onclick="AddressManager.deleteAddress('${address._id}')">
                            <i class="material-icons tiny">delete</i>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        // Inicializar os radio buttons do Materialize
        M.FormSelect.init(document.querySelectorAll('select'));
    },

    showNewAddressForm() {
        const addressSelection = document.getElementById('address-selection');
        const addressForm = document.getElementById('address-form');
        const backToListBtn = document.getElementById('back-to-addresses');
        
        if (addressSelection && addressForm) {
            addressSelection.style.display = 'none';
            addressForm.style.display = 'block';
            if (backToListBtn) {
                backToListBtn.style.display = 'block';
            }
        }
    },

    showAddressList() {
        const addressSelection = document.getElementById('address-selection');
        const addressForm = document.getElementById('address-form');
        const backToListBtn = document.getElementById('back-to-addresses');
        
        if (addressSelection && addressForm) {
            addressSelection.style.display = 'block';
            addressForm.style.display = 'none';
            if (backToListBtn) {
                backToListBtn.style.display = 'none';
            }
        }
    },

    async deleteAddress(addressId) {
        try {
            const response = await fetch(`/api/addresses/${addressId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${SessionManager.getToken()}`
                }
            });

            if (!response.ok) throw new Error('Erro ao excluir endereço');
            
            M.toast({html: 'Endereço excluído com sucesso', classes: 'green'});
            this.loadAddresses(); // Recarregar lista
        } catch (error) {
            console.error('Erro ao excluir endereço:', error);
            M.toast({html: 'Erro ao excluir endereço', classes: 'red'});
        }
    },

    async searchCEP(cep) {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            
            if (data.erro) {
                throw new Error('CEP não encontrado');
            }

            // Preencher campos do endereço
            document.getElementById('checkout-street').value = data.logradouro;
            document.getElementById('checkout-neighborhood').value = data.bairro;
            document.getElementById('checkout-city').value = data.localidade;
            
            // Focar no campo número
            document.getElementById('checkout-number').focus();
            
            M.updateTextFields();
            
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            M.toast({html: 'CEP não encontrado', classes: 'red'});
        }
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando AddressManager...');
    
    // Inicializar ao abrir o modal de checkout
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) {
        // Usar o evento correto do Materialize
        M.Modal.init(checkoutModal, {
            complete: function() {
                console.log('Modal de checkout carregado, carregando endereços...');
            }
        });

        window.debugAddressManager();
    }

    // Listener para o campo de CEP
    const cepInput = document.getElementById('checkout-cep');
    if (cepInput) {
        cepInput.addEventListener('blur', function() {
            const cep = this.value.replace(/\D/g, '');
            if (cep.length === 8) {
                AddressManager.searchCEP(cep);
            }
        });
    }
});

// Exportar para o escopo global
window.AddressManager = AddressManager;

// Adicionar função para debug
window.debugAddressManager = function() {
    console.log('Tentando carregar endereços manualmente...');
    AddressManager.loadAddresses();
}; 
document.addEventListener('DOMContentLoaded', function() {
    // Remover o antigo onclick do showMyOrders no HTML
    const myOrdersLinks = document.querySelectorAll('[onclick="showMyOrders()"]');
    myOrdersLinks.forEach(link => {
        link.removeAttribute('onclick');
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (SessionManager.isLoggedIn()) {
                showMyOrders();
            } else {
                M.toast({html: 'Faça login para ver seus pedidos', classes: 'red'});
                SessionManager.redirectToAuth();
            }
        });
    });
}); 
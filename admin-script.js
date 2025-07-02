document.addEventListener('DOMContentLoaded', () => {
    const adminLoginSection = document.getElementById('admin-login-section');
    const adminDashboardSection = document.getElementById('admin-dashboard-section');

    const adminUsernameInput = document.getElementById('admin-username');
    const adminPasswordInput = document.getElementById('admin-password');
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const adminLoginMessage = document.getElementById('admin-login-message');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');

    const newPremiumUsernameInput = document.getElementById('new-premium-username');
    const newPremiumPasswordInput = document.getElementById('new-premium-password');
    const registerNewPremiumBtn = document.getElementById('register-new-premium-btn');
    const registerPremiumMessage = document.getElementById('register-premium-message');

    // --- Configurações de Acesso Admin (MUITO BÁSICAS E INSEGURAS PARA PRODUÇÃO REAL) ---
    // Em um sistema real, estas credenciais estariam no backend, ou você usaria um sistema de autenticação mais robusto.
    const ADMIN_USERNAME = 'gabriel_admin';
    const ADMIN_PASSWORD = 'senha_segura_admin'; 

    // URL DO SEU BACKEND PYTHON (MESMA DO script.js)
    const BACKEND_API_URL = 'https://controle-financeiro-n56whuf0g-gabriels-projects-e88afafe.vercel.app'; // <--- VERIFIQUE E MUDAR ISSO PARA A URL REAL DO SEU BACKEND!

    // --- Funções Auxiliares ---
    const showMessage = (element, msg, type = 'success') => {
        element.textContent = msg;
        element.className = `message ${type}`;
        element.classList.remove('hidden');
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message hidden';
        }, 3000);
    };

    const showAdminPanel = () => {
        adminLoginSection.classList.add('hidden');
        adminDashboardSection.classList.remove('hidden');
    };

    const showAdminLogin = () => {
        adminLoginSection.classList.remove('hidden');
        adminDashboardSection.classList.add('hidden');
        adminUsernameInput.value = '';
        adminPasswordInput.value = '';
        localStorage.removeItem('adminLoggedIn'); // Limpa o status de login
    };

    // --- Event Listeners ---

    // Login do Administrador (Frontend Simples)
    adminLoginBtn.addEventListener('click', () => {
        const username = adminUsernameInput.value.trim();
        const password = adminPasswordInput.value.trim();

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            localStorage.setItem('adminLoggedIn', 'true'); // Marca como logado no localStorage
            showAdminPanel();
            showMessage(adminLoginMessage, 'Login de Admin bem-sucedido!', 'success');
        } else {
            showMessage(adminLoginMessage, 'Usuário ou senha de admin incorretos.', 'error');
        }
    });

    // Logout do Administrador
    adminLogoutBtn.addEventListener('click', () => {
        showAdminLogin();
        showMessage(adminLoginMessage, 'Você saiu do painel admin.', 'info');
    });

    // Registrar Novo Usuário Premium
    registerNewPremiumBtn.addEventListener('click', async () => {
        const username = newPremiumUsernameInput.value.trim();
        const password = newPremiumPasswordInput.value.trim();

        if (!username || !password) {
            showMessage(registerPremiumMessage, 'Preencha usuário e senha para o novo cliente premium.', 'error');
            return;
        }

        try {
            const response = await fetch(BACKEND_API_URL + '/register_premium_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    // O is_premium é definido como True no backend para esta rota
                    // admin_secret_key: "SUA_CHAVE_SECRETA_ADMIN" // Se você decidir proteger a rota
                })
            });

            const data = await response.json();

            if (data.success) {
                showMessage(registerPremiumMessage, `Usuário '${username}' registrado como Premium com sucesso! Senha inicial: ${password}.`, 'success');
                newPremiumUsernameInput.value = '';
                newPremiumPasswordInput.value = '';
            } else {
                showMessage(registerPremiumMessage, data.message, 'error');
            }
        } catch (error) {
            console.error('Erro na requisição de registro de usuário premium:', error);
            showMessage(registerPremiumMessage, 'Erro de conexão com o backend. Verifique o servidor.', 'error');
        }
    });

    // --- Inicialização ---
    // Verifica se o admin já está logado (simples, via localStorage)
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        showAdminPanel();
    } else {
        showAdminLogin();
    }
});
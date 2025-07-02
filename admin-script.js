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
    const ADMIN_USERNAME = 'gabriel_admin';
    const ADMIN_PASSWORD = 'senha_segura_admin'; 

    // URL DO SEU BACKEND PYTHON (MESMA DO script.js)
    // <--- VERIFIQUE E MUDAR ISSO PARA A URL REAL DO SEU BACKEND!
    const BACKEND_API_URL = 'http://127.0.0.1:5000/api'; 

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
        localStorage.removeItem('adminLoggedIn');
    };

    // --- Event Listeners ---

    // Login do Administrador (Frontend Simples)
    adminLoginBtn.addEventListener('click', () => {
        const username = adminUsernameInput.value.trim();
        const password = adminPasswordInput.value.trim();

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            localStorage.setItem('adminLoggedIn', 'true');
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
                })
            });

            // Verifica se a resposta HTTP é OK (200-299). Se não for, lança um erro.
            if (!response.ok) {
                const errorText = await response.text(); // Tenta ler o texto do erro
                throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
            }

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
            // Mensagem mais específica para o usuário
            if (error.message.includes("Failed to fetch")) {
                 showMessage(registerPremiumMessage, 'Erro de conexão com o backend. O servidor pode estar offline ou a URL está incorreta.', 'error');
            } else {
                showMessage(registerPremiumMessage, `Erro ao tentar registrar: ${error.message}`, 'error');
            }
        }
    });

    // --- Inicialização ---
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        showAdminPanel();
    } else {
        showAdminLogin();
    }
});
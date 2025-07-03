document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos HTML ---
    const navHomeBtn = document.getElementById('nav-home');
    const navHistoryBtn = document.getElementById('nav-history');
    const navSettingsBtn = document.getElementById('nav-settings');

    const accessSection = document.getElementById('access-section');
    const settingsSection = document.getElementById('settings-section');
    const homeSection = document.getElementById('home-section');
    const historySection = document.getElementById('history-section');

    const accessCodeInput = document.getElementById('access-code');
    const loadDataBtn = document.getElementById('load-data-btn');
    const startNewBtn = document.getElementById('start-new-btn');
    const accessMessage = document.getElementById('access-message');
    const accessPremiumWhatsappBtn = document.getElementById('access-premium-whatsapp-btn');

    const premiumUsernameInput = document.getElementById('premium-username');
    const premiumPasswordInput = document.getElementById('premium-password');
    const loginPremiumBtn = document.getElementById('login-premium-btn');
    const premiumLoginMessage = document.getElementById('premium-login-message');

    const registerAccessCodeInput = document.getElementById('register-access-code');
    const cartaoViraDiaInput = document.getElementById('cartao-vira-dia');
    const faturaFechaDiaInput = document.getElementById('fatura-fecha-dia');
    const faturaVenceDiaInput = document.getElementById('fatura-vence-dia');
    const rendaMensalInput = document.getElementById('renda-mensal');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const settingsMessage = document.getElementById('settings-message');

    const summaryRenda = document.getElementById('summary-renda');
    const summaryGastos = document.getElementById('summary-gastos');
    const summaryRestante = document.getElementById('summary-restante');
    const summaryCartaoVira = document.getElementById('summary-cartao-vira');
    const summaryFaturaFecha = document.getElementById('summary-fatura-fecha');
    const summaryFaturaVence = document.getElementById('summary-fatura-vence');

    const categoryButtons = document.querySelectorAll('.category-btn');
    const expenseForm = document.getElementById('expense-form');
    const selectedCategoryName = document.getElementById('selected-category-name');
    const paymentMethodSelect = document.getElementById('payment-method');
    const parcelasGroup = document.getElementById('parcelas-group');
    const numParcelasInput = document.getElementById('num-parcelas');
    const productInputsContainer = document.getElementById('product-inputs');
    const addProductBtn = document.getElementById('add-product-btn');
    const saveExpenseBtn = document.getElementById('save-expense-btn');
    const homeMessage = document.getElementById('home-message');

    const historyList = document.getElementById('history-list');
    const noHistoryMessage = document.getElementById('no-history-message');

    // Elementos do Modal de Edição
    const editModal = document.getElementById('edit-modal');
    const closeModalBtn = editModal.querySelector('.close-button');
    const editExpenseIdInput = document.getElementById('edit-expense-id');
    const editCategoryInput = document.getElementById('edit-category');
    const editPaymentMethodSelect = document.getElementById('edit-payment-method');
    const editParcelasGroup = document.getElementById('edit-parcelas-group');
    const editNumParcelasInput = document.getElementById('edit-num-parcelas');
    const editProductInputsContainer = document.getElementById('edit-product-inputs');
    const addEditProductBtn = document.getElementById('add-edit-product-btn');
    const saveEditedExpenseBtn = document.getElementById('save-edited-expense-btn');


    // --- Variáveis de Dados ---
    let currentUserData = null; // Armazena dados do usuário (local ou premium)
    let currentAccessCode = null; // Código de acesso para usuários locais
    let currentUsername = null; // Nome de usuário para usuários premium (logado)

    // --- Configurações do Plano Premium (HARDCODED NO FRONTEND - INSEGURO) ---
    // ESTA LISTA DEVE SER GEREENCIADA NO PAINEL ADMIN E SALVA EM BANCO DE DADOS EM UM SISTEMA REAL.
    // Qualquer um pode ver estas credenciais inspecionando o código.
    const PREMIUM_USERS = {
        "Pedro123": "Pedro123", // Usuário de teste
        "cliente_premium": "senha_do_cliente",
        // Adicione mais usuários premium aqui manualmente, conforme necessário.
    };

    const PREMIUM_PRICE = "19,90";
    const WHATSAPP_PHONE = "551196693652"; // Seu número de WhatsApp


    // --- Funções Auxiliares ---

    // Mostra uma mensagem temporária
    const showMessage = (element, msg, type = 'success') => {
        element.textContent = msg;
        element.className = `message ${type}`;
        element.classList.remove('hidden');
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message hidden';
        }, 3000);
    };

    // Alterna a exibição das seções
    const showPage = (pageId) => {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');

        document.querySelectorAll('nav button').forEach(btn => {
            btn.classList.remove('active');
        });
        if (pageId === 'home-section') navHomeBtn.classList.add('active');
        if (pageId === 'history-section') navHistoryBtn.classList.add('active');
        if (pageId === 'settings-section') navSettingsBtn.classList.add('active');
    };

    // Formata valores monetários
    const formatCurrency = (value) => {
        return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
    };

    // Calcula a data de vencimento da parcela em um formato de objeto Date
    const calculateParcelaDueDate = (purchaseDate, faturaFechaDia, installmentNumber = 0) => {
        const pDate = new Date(purchaseDate);
        let dueDate = new Date(pDate);
        
        if (faturaFechaDia === undefined || faturaFechaDia === null) {
            // Se faturaFechaDia não estiver configurado, assume que a compra cai no mês atual.
        } else if (pDate.getDate() > faturaFechaDia) {
            dueDate.setMonth(pDate.getMonth() + 1);
        }
        
        dueDate.setMonth(dueDate.getMonth() + installmentNumber);
        
        const vencimentoDia = currentUserData.financialSettings?.faturaVenceDia || 1;
        dueDate.setDate(vencimentoDia);

        if (dueDate.getDate() !== vencimentoDia) {
            dueDate.setDate(0);
            dueDate.setDate(vencimentoDia);
        }

        return dueDate;
    };

    // Calcula e atualiza o resumo financeiro na tela Home
    const updateFinancialSummary = () => {
        if (!currentUserData || !currentUserData.financialSettings) {
            summaryRenda.textContent = formatCurrency(0);
            summaryGastos.textContent = formatCurrency(0);
            summaryRestante.textContent = formatCurrency(0);
            summaryRestante.className = 'positive';
            summaryCartaoVira.textContent = '--';
            summaryFaturaFecha.textContent = '--';
            summaryFaturaVence.textContent = '--';
            return;
        }

        const renda = currentUserData.financialSettings.rendaMensal || 0;
        let totalGastosMesAtual = 0;

        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();

        currentUserData.expenses.forEach(expense => {
            const expenseTotal = expense.products.reduce((sum, prod) => sum + prod.value, 0);
            const faturaFechaDia = currentUserData.financialSettings?.faturaFechaDia;

            if (expense.paymentMethod === 'Credito') {
                const valorPorParcela = expenseTotal / expense.numParcelas;
                for (let i = 0; i < expense.numParcelas; i++) {
                    const parcelaData = expense.installments ? expense.installments[i] : { paid: false };
                    const parcelaDueDate = calculateParcelaDueDate(expense.date, faturaFechaDia, i);
                    
                    if (parcelaDueDate.getMonth() === mesAtual && parcelaDueDate.getFullYear() === anoAtual && !parcelaData.paid) {
                        totalGastosMesAtual += valorPorParcela;
                    }
                }
            } else {
                const purchaseDate = new Date(expense.date);
                if (purchaseDate.getMonth() === mesAtual && purchaseDate.getFullYear() === anoAtual) {
                    totalGastosMesAtual += expenseTotal;
                }
            }
        });
        
        const restante = renda - totalGastosMesAtual;

        summaryRenda.textContent = formatCurrency(renda);
        summaryGastos.textContent = formatCurrency(totalGastosMesAtual);
        summaryRestante.textContent = formatCurrency(restante);
        summaryRestante.className = restante >= 0 ? 'positive' : 'negative';

        summaryCartaoVira.textContent = currentUserData.financialSettings.cartaoViraDia || '--';
        summaryFaturaFecha.textContent = currentUserData.financialSettings.faturaFechaDia || '--';
        summaryFaturaVence.textContent = currentUserData.financialSettings.faturaVenceDia || '--';
    };

    // Renderiza o histórico de gastos, agrupando por mês
    const renderHistory = () => {
        historyList.innerHTML = '';
        if (!currentUserData || !currentUserData.expenses || currentUserData.expenses.length === 0) {
            noHistoryMessage.classList.remove('hidden');
            return;
        } else {
            noHistoryMessage.classList.add('hidden');
        }

        const groupedExpenses = {};
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

        currentUserData.expenses.forEach(expense => {
            const faturaFechaDia = currentUserData.financialSettings?.faturaFechaDia;

            if (expense.paymentMethod === 'Credito' && expense.numParcelas > 1) {
                for (let i = 0; i < expense.numParcelas; i++) {
                    const parcelaDueDate = calculateParcelaDueDate(expense.date, faturaFechaDia, i);
                    const monthKey = `${parcelaDueDate.getFullYear()}-${parcelaDueDate.getMonth().toString().padStart(2, '0')}`;
                    const parcelaValue = expense.products.reduce((sum, prod) => sum + prod.value, 0) / expense.numParcelas;
                    
                    if (!groupedExpenses[monthKey]) {
                        groupedExpenses[monthKey] = {};
                    }
                    if (!groupedExpenses[monthKey][expense.category]) {
                        groupedExpenses[monthKey][expense.category] = [];
                    }

                    groupedExpenses[monthKey][expense.category].push({
                        type: 'parcela',
                        originalExpenseId: expense.id,
                        parcelaIndex: i,
                        category: expense.category,
                        paymentMethod: expense.paymentMethod,
                        value: parcelaValue,
                        isPaid: expense.installments ? expense.installments[i]?.paid : false,
                        originalPurchaseDate: expense.date,
                        parcelaDueDate: parcelaDueDate,
                        parcelaNumber: i + 1,
                        totalParcelas: expense.numParcelas,
                        products: expense.products
                    });
                }
            } else {
                const launchDate = expense.paymentMethod === 'Credito' 
                                   ? calculateParcelaDueDate(expense.date, faturaFechaDia, 0)
                                   : new Date(expense.date);

                const monthKey = `${launchDate.getFullYear()}-${launchDate.getMonth().toString().padStart(2, '0')}`;
                
                if (!groupedExpenses[monthKey]) {
                    groupedExpenses[monthKey] = {};
                }
                if (!groupedExpenses[monthKey][expense.category]) {
                    groupedExpenses[monthKey][expense.category] = [];
                }
                groupedExpenses[monthKey][expense.category].push({
                    type: 'gasto_avista',
                    originalExpenseId: expense.id,
                    category: expense.category,
                    paymentMethod: expense.paymentMethod,
                    value: expense.products.reduce((sum, prod) => sum + prod.value, 0),
                    originalPurchaseDate: expense.date,
                    launchDate: launchDate,
                    products: expense.products
                });
            }
        });

        const sortedMonthKeys = Object.keys(groupedExpenses).sort((a, b) => {
            return new Date(b).getTime() - new Date(a).getTime();
        });

        if (sortedMonthKeys.length === 0) {
             noHistoryMessage.classList.remove('hidden');
             return;
        }

        sortedMonthKeys.forEach(monthKey => {
            const [year, monthIndex] = monthKey.split('-').map(Number);
            const monthName = monthNames[monthIndex];

            const monthHeader = document.createElement('h3');
            monthHeader.classList.add('month-header');
            monthHeader.textContent = `${monthName} ${year}`;
            historyList.appendChild(monthHeader);

            const monthData = groupedExpenses[monthKey];
            const sortedCategories = Object.keys(monthData).sort();

            sortedCategories.forEach(categoryName => {
                const categorySection = document.createElement('div');
                categorySection.classList.add('category-section');

                const categoryHeader = document.createElement('h4');
                categoryHeader.classList.add('category-header');
                categoryHeader.textContent = categoryName;
                categorySection.appendChild(categoryHeader);

                const categoryExpenses = monthData[categoryName].sort((a, b) => {
                    const dateA = a.type === 'parcela' ? new Date(a.originalPurchaseDate) : new Date(a.originalPurchaseDate);
                    const dateB = b.type === 'parcela' ? new Date(b.originalPurchaseDate) : new Date(b.originalPurchaseDate);
                    return dateB.getTime() - dateA.getTime();
                });

                categoryExpenses.forEach(item => {
                    const expenseItemDiv = document.createElement('div');
                    expenseItemDiv.classList.add('expense-item-small');

                    const originalPurchaseDate = new Date(item.originalPurchaseDate).toLocaleString('pt-BR');

                    let itemDetails = '';
                    if (item.type === 'parcela') {
                        const checkboxId = `parcela-${item.originalExpenseId}-${item.parcelaIndex}`;
                        itemDetails = `
                            <p><strong>Item:</strong> ${item.products.map(p => p.name).join(', ')}</p>
                            <p><strong>Parcela:</strong> ${item.parcelaNumber}/${item.totalParcelas} (${formatCurrency(item.value)})</p>
                            <p><strong>Data da Compra:</strong> ${originalPurchaseDate}</p>
                            <label class="checkbox-container">
                                <input type="checkbox" id="${checkboxId}" data-expense-id="${item.originalExpenseId}" data-parcela-index="${item.parcelaIndex}" ${item.isPaid ? 'checked' : ''}>
                                <span class="checkmark"></span> Paga
                            </label>
                        `;
                    } else {
                        itemDetails = `
                            <p><strong>Item:</strong> ${item.products.map(p => p.name).join(', ')}</p>
                            <p><strong>Valor:</strong> ${formatCurrency(item.value)}</p>
                            <p><strong>Forma de Pgto:</strong> ${item.paymentMethod}</p>
                            <p><strong>Data da Compra:</strong> ${originalPurchaseDate}</p>
                        `;
                    }
                    expenseItemDiv.innerHTML = itemDetails;
                    categorySection.appendChild(expenseItemDiv);
                });
                historyList.appendChild(categorySection);
            });
        });
        
        addHistoryActionListeners();
        addParcelaPaidListeners();
    };

    // Adiciona listeners para os botões de editar e excluir no histórico
    const addHistoryActionListeners = () => {
        document.querySelectorAll('.expense-item-small').forEach(itemDiv => {
            if (itemDiv.dataset.listenerAdded) {
                const oldListener = itemDiv.__clickListener;
                if (oldListener) {
                    itemDiv.removeEventListener('click', oldListener);
                }
            }

            const originalExpenseId = itemDiv.querySelector('[data-expense-id]')?.dataset.expenseId || null;
            if (originalExpenseId) {
                const newListener = (event) => {
                    if (!event.target.closest('.checkbox-container')) {
                       openEditModal(parseInt(originalExpenseId));
                    }
                };
                itemDiv.addEventListener('click', newListener);
                itemDiv.dataset.listenerAdded = 'true';
                itemDiv.__clickListener = newListener;
            }
        });
    };

    // Adiciona listeners para os checkboxes de pagamento de parcela
    const addParcelaPaidListeners = () => {
        document.querySelectorAll('.checkbox-container input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.dataset.listenerAdded) {
                const oldListener = checkbox.__changeListener;
                if (oldListener) {
                    checkbox.removeEventListener('change', oldListener);
                }
            }

            const newListener = (e) => {
                const expenseId = parseInt(e.target.dataset.expenseId);
                const parcelaIndex = parseInt(e.target.dataset.parcelaIndex);
                markParcelaPaid(expenseId, parcelaIndex, e.target.checked);
            };
            checkbox.addEventListener('change', newListener);
            checkbox.dataset.listenerAdded = 'true';
            checkbox.__changeListener = newListener;
        });
    };

    // Marca uma parcela como paga/não paga
    const markParcelaPaid = (expenseId, parcelaIndex, isChecked) => {
        const expense = currentUserData.expenses.find(exp => exp.id === expenseId);
        if (expense && expense.installments && expense.installments[parcelaIndex]) {
            expense.installments[parcelaIndex].paid = isChecked;
            saveUserData(); // Salva a mudança no status da parcela
            updateFinancialSummary();
            renderHistory();
        }
    };


    // Abre o modal de edição com os dados do gasto
    const openEditModal = (expenseId) => {
        const expenseToEdit = currentUserData.expenses.find(exp => exp.id === expenseId);
        if (!expenseToEdit) {
            showMessage(homeMessage, 'Gasto não encontrado para edição.', 'error');
            return;
        }

        editExpenseIdInput.value = expenseId;
        editCategoryInput.value = expenseToEdit.category;
        editPaymentMethodSelect.value = expenseToEdit.paymentMethod || 'Outro';
        
        if (editPaymentMethodSelect.value === 'Credito') {
            editParcelasGroup.classList.remove('hidden');
            editNumParcelasInput.value = expenseToEdit.numParcelas || 1;
        } else {
            editParcelasGroup.classList.add('hidden');
            editNumParcelasInput.value = 1;
        }

        editProductInputsContainer.innerHTML = '';
        expenseToEdit.products.forEach((product) => {
            addProductInputToModal(product.name, product.value, true);
        });
        if (expenseToEdit.products.length === 0) {
            addProductInputToModal('', '', true);
        }

        editModal.classList.remove('hidden');
    };

    // Adiciona um campo de produto ao modal de edição
    const addProductInputToModal = (name = '', value = '', canRemove = true) => {
        const newProductInputGroup = document.createElement('div');
        newProductInputGroup.classList.add('product-input-group');
        newProductInputGroup.innerHTML = `
            <input type="text" class="product-name" placeholder="Nome do Produto" value="${name}" required>
            <input type="number" class="product-value" step="0.01" placeholder="Valor (R$)" value="${value}" required>
            ${canRemove ? '<button class="remove-product-btn">🗑️</button>' : ''}
        `;
        editProductInputsContainer.appendChild(newProductInputGroup);

        if (canRemove) {
            newProductInputGroup.querySelector('.remove-product-btn').addEventListener('click', (e) => {
                if (editProductInputsContainer.querySelectorAll('.product-input-group').length > 1) {
                    e.target.closest('.product-input-group').remove();
                } else {
                    showMessage(homeMessage, 'Você precisa de pelo menos um produto para o gasto.', 'error');
                }
            });
        }
    };

    // Salva as edições de um gasto
    const saveEditedExpense = () => {
        const expenseId = parseInt(editExpenseIdInput.value);
        const index = currentUserData.expenses.findIndex(exp => exp.id === expenseId);

        if (index === -1) {
            showMessage(homeMessage, 'Gasto não encontrado para edição.', 'error');
            return;
        }

        const updatedProducts = [];
        let isValid = true;
        editProductInputsContainer.querySelectorAll('.product-input-group').forEach(group => {
            const nameInput = group.querySelector('.product-name');
            const valueInput = group.querySelector('.product-value');

            const name = nameInput.value.trim();
            const value = parseFloat(valueInput.value);

            if (name === '' || isNaN(value) || value <= 0) {
                isValid = false;
                showMessage(homeMessage, 'Preencha todos os nomes e valores de produtos corretamente.', 'error');
                return;
            }
            updatedProducts.push({ name, value });
        });

        if (!isValid) return;
        if (updatedProducts.length === 0) {
            showMessage(homeMessage, 'Adicione pelo menos um produto para o gasto editado.', 'error');
            return;
        }

        const newPaymentMethod = editPaymentMethodSelect.value;
        const newNumParcelas = newPaymentMethod === 'Credito' ? parseInt(editNumParcelasInput.value) : 1;

        if (newPaymentMethod === 'Credito' && (isNaN(newNumParcelas) || newNumParcelas < 1)) {
             showMessage(homeMessage, 'Número de parcelas inválido.', 'error');
             return;
        }
        
        let newInstallments = [];
        if (newPaymentMethod === 'Credito' && newNumParcelas > 1) {
            const oldExpense = currentUserData.expenses[index];
            for (let i = 0; i < newNumParcelas; i++) {
                const oldInstallment = oldExpense.installments && oldExpense.installments[i];
                newInstallments.push({ paid: oldInstallment ? oldInstallment.paid : false });
            }
        }

        currentUserData.expenses[index].products = updatedProducts;
        currentUserData.expenses[index].paymentMethod = newPaymentMethod;
        currentUserData.expenses[index].numParcelas = newNumParcelas;
        currentUserData.expenses[index].installments = newInstallments;
        currentUserData.expenses[index].date = new Date().toISOString();

        saveUserData();
        updateFinancialSummary();
        renderHistory();
        editModal.classList.add('hidden');
        showMessage(homeMessage, 'Gasto atualizado com sucesso!', 'success');
    };

    // Deleta um gasto
    const deleteExpense = (expenseId) => {
        if (confirm('Tem certeza que deseja excluir este gasto?')) {
            currentUserData.expenses = currentUserData.expenses.filter(exp => exp.id !== expenseId);
            saveUserData();
            updateFinancialSummary();
            renderHistory();
            showMessage(homeMessage, 'Gasto excluído com sucesso!', 'success');
        }
    };


    // Salva os dados do usuário. Agora sempre no localStorage.
    const saveUserData = () => {
        // Se for um usuário premium, usa o username como chave para o localStorage
        const storageKey = currentUsername ? `premiumUserData_${currentUsername}` : `localUserData_${currentAccessCode}`;
        localStorage.setItem(storageKey, JSON.stringify(currentUserData));
        console.log(`Dados salvos no localStorage sob a chave: ${storageKey}`);
    };

    // Carrega os dados do usuário. Condicional para local ou premium (agora ambos via localStorage).
    const loadUserData = (type, identifier, password = null) => {
        let storageKey = '';
        let successMessageElement = accessMessage; // Padrão para mensagens de acesso local

        if (type === 'local') {
            storageKey = `localUserData_${identifier}`;
        } else if (type === 'premium' && PREMIUM_USERS[identifier] === password) { // Validação hardcoded
            storageKey = `premiumUserData_${identifier}`;
            successMessageElement = premiumLoginMessage; // Mensagem para login premium
            currentUsername = identifier; // Define o usuário premium logado
            currentAccessCode = null; // Limpa o acesso local se logou como premium
        } else { // Login premium falhou na validação
            showMessage(premiumLoginMessage, 'Usuário ou senha premium incorretos.', 'error');
            return;
        }

        const data = localStorage.getItem(storageKey);
        
        if (data) {
            currentUserData = JSON.parse(data);
            if (!currentUserData.expenses) { currentUserData.expenses = []; }
            if (!currentUserData.financialSettings) { currentUserData.financialSettings = {}; }
            currentUserData.expenses.forEach(expense => {
                if (expense.paymentMethod === 'Credito' && expense.numParcelas > 1 && (!expense.installments || expense.installments.length !== expense.numParcelas)) {
                    expense.installments = Array.from({ length: expense.numParcelas }, () => ({ paid: false }));
                } else if (expense.numParcelas === 1 && expense.installments) {
                    delete expense.installments;
                }
            });
            currentUserData.isPremium = (type === 'premium'); // Define o status premium com base no tipo de login

            if (type === 'local') {
                currentAccessCode = identifier;
                currentUsername = null;
            }

            showMessage(successMessageElement, `${type === 'premium' ? 'Login Premium' : 'Dados locais'} carregados com sucesso!`, 'success');
            setTimeout(() => {
                showPage('home-section');
                updateFinancialSummary();
                renderHistory();
            }, 500);
        } else {
            // Se não encontrou dados no localStorage, e for um login premium válido, cria um novo objeto de dados
            if (type === 'premium' && PREMIUM_USERS[identifier] === password) {
                 currentUserData = { financialSettings: {}, expenses: [], isPremium: true };
                 currentUsername = identifier;
                 currentAccessCode = null; // Limpa o acesso local se logou como premium
                 showMessage(premiumLoginMessage, `Login Premium efetuado! Criando novo controle para '${identifier}'...`, 'info');
                 setTimeout(() => {
                    showPage('home-section');
                    updateFinancialSummary();
                    renderHistory();
                }, 500);
            } else { // Não encontrou dados e não é um login premium
                showMessage(accessMessage, 'Código de acesso não encontrado. Crie um novo controle.', 'error');
                currentUserData = null;
                currentAccessCode = null;
                currentUsername = null;
            }
        }
    };


    // --- Event Listeners ---

    // Navegação
    navHomeBtn.addEventListener('click', () => {
        if (currentUserData) {
            showPage('home-section');
            updateFinancialSummary();
        } else {
            showMessage(accessMessage, 'Por favor, carregue um controle ou faça login para acessar.', 'error');
            showPage('access-section');
        }
    });
    navHistoryBtn.addEventListener('click', () => {
        if (currentUserData) {
            showPage('history-section');
            renderHistory();
        } else {
            showMessage(accessMessage, 'Por favor, carregue um controle ou faça login para acessar.', 'error');
            showPage('access-section');
        }
    });
    navSettingsBtn.addEventListener('click', () => {
        if (currentUserData) {
            registerAccessCodeInput.value = currentAccessCode || '';
            // Se for um usuário premium, este campo não é o principal para ele
            if (currentUsername) {
                 registerAccessCodeInput.disabled = true;
                 registerAccessCodeInput.placeholder = `Logado como Premium: ${currentUsername}`;
                 // Pode desabilitar o botão de salvar local para premium também
            } else {
                 registerAccessCodeInput.disabled = false;
                 registerAccessCodeInput.placeholder = "Ex: meucontrole123";
            }
            
            cartaoViraDiaInput.value = currentUserData.financialSettings?.cartaoViraDia || '';
            faturaFechaDiaInput.value = currentUserData.financialSettings?.faturaFechaDia || '';
            faturaVenceDiaInput.value = currentUserData.financialSettings?.faturaVenceDia || '';
            rendaMensalInput.value = currentUserData.financialSettings?.rendaMensal || '';
            showPage('settings-section');
        } else {
            showMessage(accessMessage, 'Por favor, carregue um controle ou faça login para acessar.', 'error');
            showPage('access-section');
        }
    });

    // Seção de Acesso
    loadDataBtn.addEventListener('click', () => {
        const code = accessCodeInput.value.trim();
        if (code) {
            loadUserData('local', code);
        } else {
            showMessage(accessMessage, 'Por favor, digite seu código de acesso.', 'error');
        }
    });

    startNewBtn.addEventListener('click', () => {
        registerAccessCodeInput.value = '';
        cartaoViraDiaInput.value = '';
        faturaFechaDiaInput.value = '';
        faturaVenceDiaInput.value = '';
        rendaMensalInput.value = '';
        currentUserData = { financialSettings: {}, expenses: [] };
        currentAccessCode = "novo_local_" + Date.now();
        currentUsername = null;
        showMessage(accessMessage, 'Novo controle local iniciado. Salve suas configurações!', 'info');
        showPage('settings-section');
    });

    // Ação do botão "Quero o Plano Premium!" (WhatsApp)
    accessPremiumWhatsappBtn.addEventListener('click', () => {
        const message = encodeURIComponent(`Olá, Gabriel! Tenho interesse no Plano Premium do Controle Financeiro por R$ ${PREMIUM_PRICE}.`);
        const whatsappLink = `https://wa.me/${WHATSAPP_PHONE}?text=${message}`;
        window.open(whatsappLink, '_blank');
    });

    // Ação do botão "Entrar (Plano Premium)"
    loginPremiumBtn.addEventListener('click', () => {
        const username = premiumUsernameInput.value.trim();
        const password = premiumPasswordInput.value.trim();

        if (!username || !password) {
            showMessage(premiumLoginMessage, 'Preencha usuário e senha premium.', 'error');
            return;
        }
        loadUserData('premium', username, password); // Chama loadUserData com tipo 'premium'
    });

    // Seção de Cadastro/Configurações (Salvar)
    saveSettingsBtn.addEventListener('click', () => {
        const code = registerAccessCodeInput.value.trim(); // Relevante apenas para usuários locais
        const viraDia = parseInt(cartaoViraDiaInput.value);
        const fechaDia = parseInt(faturaFechaDiaInput.value);
        const venceDia = parseInt(faturaVenceDiaInput.value);
        const renda = parseFloat(rendaMensalInput.value);

        if (!viraDia || !fechaDia || !venceDia || isNaN(renda) || renda <= 0) {
            showMessage(settingsMessage, 'Por favor, preencha todos os campos corretamente.', 'error');
            return;
        }

        currentUserData.financialSettings = {
            cartaoViraDia: viraDia,
            faturaFechaDia: fechaDia,
            faturaVenceDia: venceDia,
            rendaMensal: renda,
        };

        saveUserData(); // Salva os dados (agora a função saveUserData é condicional)

        showMessage(settingsMessage, 'Configurações salvas com sucesso!', 'success');
        setTimeout(() => {
            showPage('home-section');
            updateFinancialSummary();
        }, 500);
    });

    // Seção Home (Adicionar Gastos)
    categoryButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            if (!currentUserData) {
                showMessage(homeMessage, 'Faça login ou inicie um novo controle para adicionar gastos.', 'error');
                showPage('access-section');
                return;
            }

            selectedCategoryName.textContent = e.target.dataset.category;
            expenseForm.classList.remove('hidden');
            productInputsContainer.innerHTML = `
                <div class="product-input-group">
                    <input type="text" class="product-name" placeholder="Nome do Produto" required>
                    <input type="number" class="product-value" step="0.01" placeholder="Valor (R$)" required>
                    <button class="remove-product-btn">🗑️</button>
                </div>
            `;
            productInputsContainer.querySelector('.remove-product-btn').addEventListener('click', (ev) => {
                if (productInputsContainer.querySelectorAll('.product-input-group').length > 1) {
                    ev.target.closest('.product-input-group').remove();
                } else {
                    showMessage(homeMessage, 'Você precisa de pelo menos um produto para o gasto.', 'error');
                }
            });
            paymentMethodSelect.value = "Credito";
            parcelasGroup.classList.remove('hidden');
            numParcelasInput.value = 1;
        });
    });

    paymentMethodSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Credito') {
            parcelasGroup.classList.remove('hidden');
            numParcelasInput.value = 1;
        } else {
            parcelasGroup.classList.add('hidden');
            numParcelasInput.value = 1;
        }
    });

    addProductBtn.addEventListener('click', () => {
        const newProductInputGroup = document.createElement('div');
        newProductInputGroup.classList.add('product-input-group');
        newProductInputGroup.innerHTML = `
            <input type="text" class="product-name" placeholder="Nome do Produto" required>
            <input type="number" class="product-value" step="0.01" placeholder="Valor (R$)" required>
            <button class="remove-product-btn">🗑️</button>
        `;
        productInputsContainer.appendChild(newProductInputGroup);
        newProductInputGroup.querySelector('.remove-product-btn').addEventListener('click', (e) => {
             if (productInputsContainer.querySelectorAll('.product-input-group').length > 1) {
                e.target.closest('.product-input-group').remove();
            } else {
                showMessage(homeMessage, 'Você precisa de pelo menos um produto para o gasto.', 'error');
            }
        });
    });

    saveExpenseBtn.addEventListener('click', () => { // Removido 'async' pois não há mais 'await'
        if (!currentUserData) {
            showMessage(homeMessage, 'Erro: Nenhum usuário logado. Faça login ou inicie um controle.', 'error');
            showPage('access-section');
            return;
        }

        const category = selectedCategoryName.textContent;
        const paymentMethod = paymentMethodSelect.value;
        const numParcelas = paymentMethod === 'Credito' ? parseInt(numParcelasInput.value) : 1;
        
        const products = [];
        let isValid = true;

        productInputsContainer.querySelectorAll('.product-input-group').forEach(group => {
            const nameInput = group.querySelector('.product-name');
            const valueInput = group.querySelector('.product-value');

            const name = nameInput.value.trim();
            const value = parseFloat(valueInput.value);

            if (name === '' || isNaN(value) || value <= 0) {
                isValid = false;
                showMessage(homeMessage, 'Preencha todos os nomes e valores de produtos corretamente.', 'error');
                return;
            }
            products.push({ name, value });
        });

        if (!isValid) return;
        if (products.length === 0) {
            showMessage(homeMessage, 'Adicione pelo menos um produto.', 'error');
            return;
        }
        if (paymentMethod === 'Credito' && (isNaN(numParcelas) || numParcelas < 1)) {
             showMessage(homeMessage, 'Número de parcelas inválido.', 'error');
             return;
        }

        let installments = [];
        if (paymentMethod === 'Credito' && numParcelas > 0) {
            for (let i = 0; i < numParcelas; i++) {
                installments.push({ paid: false });
            }
        }

        const newExpense = {
            id: Date.now(),
            category: category,
            paymentMethod: paymentMethod,
            numParcelas: numParcelas,
            products: products,
            date: new Date().toISOString(),
            installments: installments
        };

        if (!currentUserData.expenses) {
            currentUserData.expenses = [];
        }
        currentUserData.expenses.push(newExpense);
        saveUserData(); // Não precisa de await aqui

        updateFinancialSummary();
        showMessage(homeMessage, 'Gasto registrado com sucesso!', 'success');
        expenseForm.classList.add('hidden');
        productInputsContainer.innerHTML = `
            <div class="product-input-group">
                <input type="text" class="product-name" placeholder="Nome do Produto" required>
                <input type="number" class="product-value" step="0.01" placeholder="Valor (R$)" required>
                <button class="remove-product-btn">🗑️</button>
            </div>
        `;
         productInputsContainer.querySelector('.remove-product-btn').addEventListener('click', (ev) => {
            if (productInputsContainer.querySelectorAll('.product-input-group').length > 1) {
                ev.target.closest('.product-input-group').remove();
            } else {
                showMessage(homeMessage, 'Você precisa de pelo menos um produto para o gasto.', 'error');
            }
        });
        paymentMethodSelect.value = "Credito";
        parcelasGroup.classList.remove('hidden');
        numParcelasInput.value = 1;
    });

    closeModalBtn.addEventListener('click', () => editModal.classList.add('hidden'));
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.classList.add('hidden');
        }
    });

    editPaymentMethodSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Credito') {
            editParcelasGroup.classList.remove('hidden');
            editNumParcelasInput.value = 1;
        } else {
            editParcelasGroup.classList.add('hidden');
            editNumParcelasInput.value = 1;
        }
    });

    addEditProductBtn.addEventListener('click', () => addProductInputToModal('', '', true));
    saveEditedExpenseBtn.addEventListener('click', saveEditedExpense);


    // --- Inicialização ---
    showPage('access-section');
});
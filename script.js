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


    // --- Variáveis de Dados (persistidas via localStorage) ---
    let currentUserData = null;
    let currentAccessCode = null;

    // --- Funções Auxiliares ---

    // Mostra uma mensagem temporária
    const showMessage = (element, msg, type = 'success') => {
        element.textContent = msg;
        element.className = `message ${type}`;
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message';
        }, 3000);
    };

    // Alterna a exibição das seções
    const showPage = (pageId) => {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');

        // Atualiza o estado ativo da navegação
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
        let dueDate = new Date(pDate); // Começa com a data da compra
        
        // Ajusta o mês de lançamento da primeira parcela
        // Se a compra foi feita DEPOIS do dia de FECHAMENTO DA FATURA do mês atual,
        // a primeira parcela (e as seguintes) começam no PRÓXIMO mês.
        if (pDate.getDate() > faturaFechaDia) {
            dueDate.setMonth(pDate.getMonth() + 1);
        }
        
        // Adiciona os meses das parcelas
        dueDate.setMonth(dueDate.getMonth() + installmentNumber);
        
        // Define o dia do vencimento da fatura
        const vencimentoDia = currentUserData.financialSettings?.faturaVenceDia || 1; // Pega o dia de vencimento das configs
        dueDate.setDate(vencimentoDia); // Define o dia da parcela para o dia do vencimento

        // Ajusta para meses com menos dias (ex: fevereiro)
        if (dueDate.getDate() !== vencimentoDia) {
            dueDate.setDate(0); // Volta para o último dia do mês anterior e tenta novamente
            dueDate.setDate(vencimentoDia); // Isso pode fazer com que caia no mês seguinte se o dia for maior que os dias do mês
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
                    const parcelaData = expense.installments[i];
                    const parcelaDueDate = calculateParcelaDueDate(expense.date, faturaFechaDia, i);
                    
                    if (parcelaDueDate.getMonth() === mesAtual && parcelaDueDate.getFullYear() === anoAtual && !parcelaData.paid) {
                        totalGastosMesAtual += valorPorParcela;
                    }
                }
            } else { // Débito, Dinheiro, Pix, Outro (sempre à vista, considera no mês da compra)
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

        // Estrutura para agrupar gastos por mês
        const groupedExpenses = {}; // { 'YYYY-MM': { 'Category': [expense, expense], ... } }
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

        currentUserData.expenses.forEach(expense => {
            const faturaFechaDia = currentUserData.financialSettings?.faturaFechaDia;

            if (expense.paymentMethod === 'Credito' && expense.numParcelas > 1) {
                // Para compras parceladas, criar uma entrada para cada parcela
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

                    // Cria um objeto "parcela" para ser exibido, referenciando o gasto original
                    groupedExpenses[monthKey][expense.category].push({
                        type: 'parcela',
                        originalExpenseId: expense.id,
                        parcelaIndex: i,
                        category: expense.category,
                        paymentMethod: expense.paymentMethod,
                        value: parcelaValue,
                        isPaid: expense.installments[i]?.paid || false,
                        originalPurchaseDate: expense.date, // Data da compra original
                        parcelaDueDate: parcelaDueDate, // Data de vencimento da parcela
                        parcelaNumber: i + 1,
                        totalParcelas: expense.numParcelas,
                        products: expense.products // Mantém os produtos originais para referência
                    });
                }
            } else { // Gastos à vista (Crédito à vista, Débito, Dinheiro, Pix)
                const launchDate = expense.paymentMethod === 'Credito' 
                                   ? calculateParcelaDueDate(expense.date, faturaFechaDia, 0) // Crédito à vista
                                   : new Date(expense.date); // Outros à vista

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

        // Ordenar os meses (chaves YYYY-MM) do mais recente para o mais antigo
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
            const sortedCategories = Object.keys(monthData).sort(); // Ordena categorias alfabeticamente

            sortedCategories.forEach(categoryName => {
                const categorySection = document.createElement('div');
                categorySection.classList.add('category-section');

                const categoryHeader = document.createElement('h4');
                categoryHeader.classList.add('category-header');
                categoryHeader.textContent = categoryName;
                categorySection.appendChild(categoryHeader);

                const categoryExpenses = monthData[categoryName].sort((a, b) => {
                    // Ordena os gastos/parcelas dentro da categoria pela data original da compra
                    const dateA = a.type === 'parcela' ? new Date(a.originalPurchaseDate) : new Date(a.originalPurchaseDate);
                    const dateB = b.type === 'parcela' ? new Date(b.originalPurchaseDate) : new Date(b.originalPurchaseDate);
                    return dateB.getTime() - dateA.getTime();
                });

                categoryExpenses.forEach(item => {
                    const expenseItemDiv = document.createElement('div');
                    expenseItemDiv.classList.add('expense-item-small'); // Uma classe para itens dentro do agrupamento

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
                    } else { // gasto_avista
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
        
        addHistoryActionListeners(); // Ainda precisamos dos botões de edição/exclusão da compra original
        addParcelaPaidListeners(); // Adiciona listeners para os checkboxes de pagamento
    };

    // Adiciona listeners para os botões de editar e excluir no histórico
    const addHistoryActionListeners = () => {
        // Agora, os botões de editar/excluir são para a COMPRA ORIGINAL, não para cada parcela.
        // Vamos colocá-los no cabeçalho do mês, ou em um resumo do gasto principal se preferir.
        // Por enquanto, vou manter a lógica de que o botão de edição/exclusão se refere ao gasto como um todo
        // e ele precisa ser encontrado pelo ID original do expense.
        // Se a lógica atual é que eles aparecem ao lado de cada item, então é preciso garantir que o ID se refira ao gasto original.

        // Para evitar duplicação dos botões se eles estiverem no item da parcela
        // vamos adicionar um único botão de editar/excluir para cada GASTO COMPLETO,
        // talvez no cabeçalho da categoria, ou em um resumo do gasto total no mês.
        // Por simplicidade, vou manter a lógica de que o botão edita o gasto original pelo ID,
        // mas é preciso que o elemento pai desses botões tenha o data-id correto.

        // Refatorando: Os botões de editar/excluir devem estar associados ao GASTO ORIGINAL (e não a cada parcela).
        // A exibição no histórico está por mês/categoria/item.
        // Vamos fazer com que um clique em um item de compra (parcelada ou à vista)
        // abra o modal de edição do GASTO ORIGINAL.

        // Removendo os botões de 'editar'/'excluir' de cada 'expense-item-small' no renderHistory
        // e adicionando-os na lógica do item principal no histórico, se necessário, ou apenas no modal de edição.
        // Para a clareza do pedido, vamos fazer com que o clique no item do histórico abra o modal de edição.

        // Não precisamos mais disso aqui se os botões são adicionados dinamicamente na função renderHistory
        // document.querySelectorAll('.edit-btn').forEach(button => {
        //     button.addEventListener('click', (e) => openEditModal(parseInt(e.target.dataset.id)));
        // });
        // document.querySelectorAll('.delete-btn').forEach(button => {
        //     button.addEventListener('click', (e) => deleteExpense(parseInt(e.target.dataset.id)));
        // });

        // Vamos adicionar um listener genérico nos 'expense-item-small' para abrir o modal de edição do gasto ORIGINAL
        document.querySelectorAll('.expense-item-small').forEach(itemDiv => {
            // Evita adicionar múltiplos listeners se a função for chamada várias vezes
            if (!itemDiv.dataset.listenerAdded) {
                const originalExpenseId = itemDiv.querySelector('[data-expense-id]')?.dataset.expenseId || null;
                if (originalExpenseId) {
                    itemDiv.addEventListener('click', () => {
                        // Não abre o modal se for um clique no checkbox
                        if (event.target.type !== 'checkbox' && event.target.tagName !== 'LABEL' && event.target.tagName !== 'SPAN') {
                           openEditModal(parseInt(originalExpenseId));
                        }
                    });
                     itemDiv.dataset.listenerAdded = 'true'; // Marca que o listener foi adicionado
                }
            }
        });
    };

    // Adiciona listeners para os checkboxes de pagamento de parcela
    const addParcelaPaidListeners = () => {
        document.querySelectorAll('.checkbox-container input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const expenseId = parseInt(e.target.dataset.expenseId);
                const parcelaIndex = parseInt(e.target.dataset.parcelaIndex);
                markParcelaPaid(expenseId, parcelaIndex, e.target.checked);
            });
        });
    };

    // Marca uma parcela como paga/não paga
    const markParcelaPaid = (expenseId, parcelaIndex, isChecked) => {
        const expense = currentUserData.expenses.find(exp => exp.id === expenseId);
        if (expense && expense.installments && expense.installments[parcelaIndex]) {
            expense.installments[parcelaIndex].paid = isChecked;
            saveUserData();
            updateFinancialSummary(); // Atualiza o resumo após marcar/desmarcar
            renderHistory(); // Re-renderiza o histórico para refletir a mudança
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
        
        // Lógica para mostrar/esconder campo de parcelas no modal de edição
        if (editPaymentMethodSelect.value === 'Credito') {
            editParcelasGroup.classList.remove('hidden');
            editNumParcelasInput.value = expenseToEdit.numParcelas || 1;
        } else {
            editParcelasGroup.classList.add('hidden');
            editNumParcelasInput.value = 1;
        }

        // Limpa e preenche os produtos no modal
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
            showMessage(homeMessage, 'Erro: Gasto a ser editado não encontrado.', 'error');
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
                showMessage(homeMessage, 'Preencha todos os nomes e valores de produtos corretamente no modal.', 'error');
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
        
        // Atualiza ou cria a estrutura de parcelas (para manter status de pago)
        let newInstallments = [];
        if (newPaymentMethod === 'Credito' && newNumParcelas > 1) {
            const oldExpense = currentUserData.expenses[index];
            for (let i = 0; i < newNumParcelas; i++) {
                // Tenta manter o status de pago de parcelas antigas, se existirem e couberem no novo número
                const oldInstallment = oldExpense.installments && oldExpense.installments[i];
                newInstallments.push({ paid: oldInstallment ? oldInstallment.paid : false });
            }
        }

        currentUserData.expenses[index].products = updatedProducts;
        currentUserData.expenses[index].paymentMethod = newPaymentMethod;
        currentUserData.expenses[index].numParcelas = newNumParcelas;
        currentUserData.expenses[index].installments = newInstallments; // Atualiza as parcelas
        currentUserData.expenses[index].date = new Date().toISOString(); // Atualiza a data para indicar edição

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


    // Salva os dados do usuário no localStorage
    const saveUserData = () => {
        if (currentAccessCode && currentUserData) {
            localStorage.setItem(`userData_${currentAccessCode}`, JSON.stringify(currentUserData));
        }
    };

    // Carrega os dados do usuário do localStorage
    const loadUserData = (accessCode) => {
        const data = localStorage.getItem(`userData_${accessCode}`);
        if (data) {
            currentUserData = JSON.parse(data);
            if (!currentUserData.expenses) {
                currentUserData.expenses = [];
            }
            if (!currentUserData.financialSettings) {
                currentUserData.financialSettings = {};
            }
            // Garante que cada gasto parcelado tenha a propriedade installments
            currentUserData.expenses.forEach(expense => {
                if (expense.paymentMethod === 'Credito' && expense.numParcelas > 1 && (!expense.installments || expense.installments.length !== expense.numParcelas)) {
                    // Se não tiver installments ou o número não bater, recria
                    expense.installments = Array.from({ length: expense.numParcelas }, () => ({ paid: false }));
                } else if (expense.numParcelas === 1 && expense.installments) {
                    // Para compras à vista, remove installments desnecessários
                    delete expense.installments;
                }
            });

            currentAccessCode = accessCode;
            showMessage(accessMessage, 'Dados carregados com sucesso!', 'success');
            setTimeout(() => {
                showPage('home-section');
                updateFinancialSummary();
                renderHistory();
            }, 500);
        } else {
            showMessage(accessMessage, 'Código de acesso não encontrado. Tente novamente ou crie um novo.', 'error');
            currentUserData = null;
            currentAccessCode = null;
        }
    };

    // --- Event Listeners ---

    // Navegação
    navHomeBtn.addEventListener('click', () => {
        if (currentUserData) {
            showPage('home-section');
            updateFinancialSummary();
        } else {
            showMessage(accessMessage, 'Por favor, carregue ou crie um controle primeiro.', 'error');
            showPage('access-section');
        }
    });
    navHistoryBtn.addEventListener('click', () => {
        if (currentUserData) {
            showPage('history-section');
            renderHistory();
        } else {
            showMessage(accessMessage, 'Por favor, carregue ou crie um controle primeiro.', 'error');
            showPage('access-section');
        }
    });
    navSettingsBtn.addEventListener('click', () => {
        if (currentUserData) {
            registerAccessCodeInput.value = currentAccessCode;
            cartaoViraDiaInput.value = currentUserData.financialSettings?.cartaoViraDia || '';
            faturaFechaDiaInput.value = currentUserData.financialSettings?.faturaFechaDia || '';
            faturaVenceDiaInput.value = currentUserData.financialSettings?.faturaVenceDia || '';
            rendaMensalInput.value = currentUserData.financialSettings?.rendaMensal || '';
            showPage('settings-section');
        } else {
            showMessage(accessMessage, 'Por favor, carregue ou crie um controle primeiro.', 'error');
            showPage('access-section');
        }
    });

    // Seção de Acesso
    loadDataBtn.addEventListener('click', () => {
        const code = accessCodeInput.value.trim();
        if (code) {
            loadUserData(code);
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
        currentAccessCode = null;
        showPage('settings-section');
    });

    // Seção de Cadastro/Configurações
    saveSettingsBtn.addEventListener('click', () => {
        const code = registerAccessCodeInput.value.trim();
        const viraDia = parseInt(cartaoViraDiaInput.value);
        const fechaDia = parseInt(faturaFechaDiaInput.value);
        const venceDia = parseInt(faturaVenceDiaInput.value);
        const renda = parseFloat(rendaMensalInput.value);

        if (!code || !viraDia || !fechaDia || !venceDia || isNaN(renda) || renda <= 0) {
            showMessage(settingsMessage, 'Por favor, preencha todos os campos corretamente.', 'error');
            return;
        }

        if (viraDia < 1 || viraDia > 31 || fechaDia < 1 || fechaDia > 31 || venceDia < 1 || venceDia > 31) {
             showMessage(settingsMessage, 'Os dias devem estar entre 1 e 31.', 'error');
             return;
        }

        if (!currentUserData || !currentAccessCode) {
            if (localStorage.getItem(`userData_${code}`)) {
                showMessage(settingsMessage, 'Este código de acesso já existe. Escolha outro ou use a opção "Carregar Meus Dados".', 'error');
                return;
            }
        }
        
        currentUserData = {
            financialSettings: {
                cartaoViraDia: viraDia,
                faturaFechaDia: fechaDia,
                faturaVenceDia: venceDia,
                rendaMensal: renda,
            },
            expenses: currentUserData ? currentUserData.expenses : []
        };
        currentAccessCode = code;
        saveUserData();
        showMessage(settingsMessage, 'Configurações salvas com sucesso!', 'success');
        setTimeout(() => {
            showPage('home-section');
            updateFinancialSummary();
        }, 500);
    });

    // Seção Home (Adicionar Gastos)
    categoryButtons.forEach(button => {
        button.addEventListener('click', (e) => {
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

    saveExpenseBtn.addEventListener('click', () => {
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

        if (currentUserData) {
            if (!currentUserData.expenses) {
                currentUserData.expenses = [];
            }
            currentUserData.expenses.push(newExpense);
            saveUserData();
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
        } else {
            showMessage(homeMessage, 'Erro: Nenhum dado de usuário carregado. Por favor, carregue ou crie um controle.', 'error');
            showPage('access-section');
        }
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
import { useLanguage } from './LanguageProvider'

const translations = {
  pt: {
    // Navigation
    'nav.home': 'Home',
    'nav.history': 'Histórico',
    'nav.goals': 'Metas',
    'nav.profile': 'Perfil',
    'nav.manageMoney': 'Gerencie seu dinheiro',
    'nav.description': 'Acompanhe gastos, metas e sua economia em um só lugar.',
    'nav.finleafTip': 'Dica do Finleaf',
    'nav.tipDescription': 'Use a aba Histórico para filtrar gastos por dia, semana ou mês e veja para onde seu dinheiro está indo.',
    'nav.dashboard': 'Painel',
    'nav.transactions': 'Transações',
    'nav.account': 'Conta',

    // Dashboard
    'dashboard.title': 'Painel',
    'dashboard.subtitle': 'Visão geral das suas finanças',
    'dashboard.available': 'Dinheiro disponível',
    'dashboard.spent': 'Total gasto',
    'dashboard.savings': 'Economia',
    'dashboard.categories': 'Gastos por categoria',
    'dashboard.categoriesDesc': 'Passe o mouse pelas cores para ver detalhes.',
    'dashboard.summary': 'Resumo',
    'dashboard.income': 'Receitas',
    'dashboard.expenses': 'Despesas',
    'dashboard.investments': 'Investimentos',
    'dashboard.trendUpLastMonth': '+12.5% no último mês',
    'dashboard.trendDownPreviousMonth': '-8.3% em relação ao mês anterior',
    'dashboard.savingsTrend': '+5.2% no último mês',
    'dashboard.recentHistory': 'Histórico recente',
    'dashboard.recentHistoryDesc': 'Acompanhe as últimas transações e edite ou remova quando precisar.',
    'dashboard.allExpenses': 'Todos os gastos',
    'dashboard.addExpense': '+ Adicionar movimento',
    'dashboard.selectCategory': 'Selecione uma categoria',
    'dashboard.ofTotal': 'do total',

    // History
    'history.title': 'Histórico',
    'history.subtitle': 'Todos os seus gastos',
    'history.filters': 'Filtros',
    'history.filtersDesc': 'Selecione o período para ver suas transações recentes.',
    'history.day': 'Dia',
    'history.week': 'Semana',
    'history.month': 'Mês',
    'history.transactions': 'Transações',
    'history.found': 'itens encontrados no período selecionado.',
    'history.lastDay': 'Último dia',
    'history.lastWeek': 'Última semana',
    'history.lastMonth': 'Último mês',
    'history.chooseDay': 'Escolha o dia',
    'history.chooseWeek': 'Escolha a semana',
    'history.chooseMonth': 'Escolha o mês',
    'history.export': 'Exportar',
    'history.save': 'Salvar',
    'history.cancel': 'Cancelar',
    'history.edit': 'Editar',
    'history.delete': 'Apagar',
    'history.csvMonth': 'Mês',
    'history.csvCategory': 'Categoria',
    'history.csvDate': 'Data',
    'history.csvAmount': 'Valor',
    'history.csvType': 'Tipo',
    'history.csvNotes': 'Notas',
    'history.csvExpense': 'Despesa',
    'history.csvIncome': 'Receita',
    'history.csvFilename': 'transacoes.csv',

    // Goals
    'goals.title': 'Metas',
    'goals.subtitle': 'Acompanhe seus objetivos financeiros',
    'goals.add': 'Adicionar nova meta',
    'goals.name': 'Nome da meta',
    'goals.target': 'Valor alvo',
    'goals.monthly': 'Contribuição mensal',
    'goals.deadline': 'Prazo',
    'goals.addGoal': 'Adicionar meta',
    'goals.adjust': 'Ajustar contribuição',
    'goals.active': 'Meta ativa',
    'goals.activeDesc': 'Adicione contribuições mensais ou retire quando precisar.',
    'goals.averageProgress': 'Progresso médio',
    'goals.deadlineLabel': 'Prazo',
    'goals.customAmount': 'Valor personalizado',
    'goals.addFunds': '+ Adicionar',
    'goals.withdrawFunds': '- Retirar',
    'goals.save': 'Salvar',
    'goals.cancel': 'Cancelar',
    'goals.edit': 'Editar',
    'goals.remove': 'Remover',
    'goals.createGoal': 'Criar meta',

    // Profile
    'profile.title': 'Perfil',
    'profile.subtitle': 'Ajustes de moeda e conta',
    'profile.personalize': 'Personalize seu perfil financeiro',
    'profile.name': 'Nome',
    'profile.currency': 'Moeda',
    'profile.dollar': 'Dólar',
    'profile.income': 'Renda mensal',
    'profile.payday': 'Dia de recebimento',
    'profile.bonus': 'Bônus de salário',
    'profile.addBonus': 'Adicionar bônus',
    'profile.bonusNote': 'Bônus de salário',
    'profile.investmentBase': 'Investimento mensal base',
    'profile.investmentBaseDesc': 'Lançado automaticamente no dia de recebimento.',
    'profile.investmentMovement': 'Movimento de investimento',
    'profile.addInvestment': 'Adicionar investimento',
    'profile.withdrawInvestment': 'Retirar investimento',
    'profile.investmentAddNote': 'Investimento adicional',
    'profile.investmentWithdrawNote': 'Retirada de investimento',
    'profile.newPassword': 'Nova senha',
    'profile.confirmPassword': 'Confirmar senha',
    'profile.save': 'Salvar alterações',
    'profile.language': 'Idioma',
    'profile.languageDesc': 'Escolha o idioma da aplicação.',
    'profile.auto': 'Automático (do navegador)',
    'profile.portuguese': 'Português',
    'profile.english': 'English',
    'profile.account': 'Conta',
    'profile.accountDesc': 'Gerencie sua conta e sessões.',
    'profile.monthlyPlan': 'Plano mensal',
    'profile.monthlyPlanDesc': 'Valores que se repetem automaticamente no dia de recebimento.',
    'profile.manualMovements': 'Movimentos pontuais',
    'profile.manualMovementsDesc': 'Adicione bônus ou ajustes de investimento quando eles acontecerem.',
    'profile.security': 'Segurança',
    'profile.logout': 'Fazer logout',
    'profile.loggingOut': 'A sair...',

    // Modals
    'modal.add': 'Adicionar Transação',
    'modal.edit': 'Editar Transação',
    'modal.category': 'Categoria',
    'modal.amount': 'Valor',
    'modal.date': 'Data',
    'modal.type': 'Tipo',
    'modal.comment': 'Comentário opcional',
    'modal.commentPlaceholder': 'Ex.: jantar com amigos, compra urgente...',
    'modal.expense': 'Despesa',
    'modal.income': 'Receita',
    'modal.cancel': 'Cancelar',
    'modal.save': 'Salvar',

    // Categories
    'categories.alimentacao': 'Alimentação',
    'categories.entretenimento': 'Entretenimento',
    'categories.saude': 'Saúde',
    'categories.educacao': 'Educação',
    'categories.contas': 'Contas',
    'categories.investimentos': 'Investimentos',
    'categories.renda': 'Renda',
    'categories.transporte': 'Transporte',
    'categories.outros': 'Outros',
    'dashboard.category.house': 'Casa',
    'dashboard.category.shopping': 'Compras',
    'dashboard.category.transport': 'Transporte',
    'dashboard.category.leisure': 'Lazer',
    'dashboard.category.houseDesc': 'Aluguel e contas essenciais',
    'dashboard.category.shoppingDesc': 'Supermercado, roupas e itens pessoais',
    'dashboard.category.transportDesc': 'Viagens, combustÃ­vel e apps de mobilidade',
    'dashboard.category.leisureDesc': 'Streaming, cinema e atividades sociais',

    // Messages
    'messages.passwordMismatch': 'As senhas não coincidem. Por favor, verifique.',
    'messages.success': 'Configurações atualizadas com sucesso!',
    'messages.logout': 'Logout realizado com sucesso!',
    'messages.invalidBonus': 'Informe um bônus maior que zero.',
    'messages.bonusAdded': 'Bônus adicionado como receita.',
    'messages.invalidInvestment': 'Informe um investimento maior que zero.',
    'messages.investmentAdded': 'Investimento adicionado ao histórico.',
    'messages.investmentWithdrawn': 'Retirada de investimento adicionada ao histórico.',
    'notes.goalContribution': 'Contribuição para meta',
    'notes.goalWithdrawal': 'Retirada da meta',
    'notes.monthlyInvestment': 'Investimento mensal base',
    'notes.investmentAdd': 'Investimento adicional',
    'notes.investmentWithdraw': 'Retirada de investimento',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.history': 'History',
    'nav.goals': 'Goals',
    'nav.profile': 'Profile',
    'nav.manageMoney': 'Manage your money',
    'nav.description': 'Track expenses, goals and your savings in one place.',
    'nav.finleafTip': 'Finleaf Tip',
    'nav.tipDescription': 'Use the History tab to filter expenses by day, week or month and see where your money is going.',
    'nav.dashboard': 'Dashboard',
    'nav.transactions': 'Transactions',
    'nav.account': 'Account',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Overview of your finances',
    'dashboard.available': 'Available money',
    'dashboard.spent': 'Total spent',
    'dashboard.savings': 'Savings',
    'dashboard.categories': 'Expenses by category',
    'dashboard.categoriesDesc': 'Hover over colors to see details.',
    'dashboard.summary': 'Summary',
    'dashboard.income': 'Income',
    'dashboard.expenses': 'Expenses',
    'dashboard.investments': 'Investments',
    'dashboard.trendUpLastMonth': '+12.5% last month',
    'dashboard.trendDownPreviousMonth': '-8.3% compared with previous month',
    'dashboard.savingsTrend': '+5.2% last month',
    'dashboard.recentHistory': 'Recent history',
    'dashboard.recentHistoryDesc': 'Track your latest transactions and edit or remove them when needed.',
    'dashboard.allExpenses': 'All expenses',
    'dashboard.addExpense': '+ Add movement',
    'dashboard.selectCategory': 'Select a category',
    'dashboard.ofTotal': 'of total',

    // History
    'history.title': 'History',
    'history.subtitle': 'All your expenses',
    'history.filters': 'Filters',
    'history.filtersDesc': 'Select the period to view your recent transactions.',
    'history.day': 'Day',
    'history.week': 'Week',
    'history.month': 'Month',
    'history.transactions': 'Transactions',
    'history.found': 'items found in the selected period.',
    'history.lastDay': 'Last day',
    'history.lastWeek': 'Last week',
    'history.lastMonth': 'Last month',
    'history.chooseDay': 'Choose day',
    'history.chooseWeek': 'Choose week',
    'history.chooseMonth': 'Choose month',
    'history.export': 'Export',
    'history.save': 'Save',
    'history.cancel': 'Cancel',
    'history.edit': 'Edit',
    'history.delete': 'Delete',
    'history.csvMonth': 'Month',
    'history.csvCategory': 'Category',
    'history.csvDate': 'Date',
    'history.csvAmount': 'Amount',
    'history.csvType': 'Type',
    'history.csvNotes': 'Notes',
    'history.csvExpense': 'Expense',
    'history.csvIncome': 'Income',
    'history.csvFilename': 'transactions.csv',

    // Goals
    'goals.title': 'Goals',
    'goals.subtitle': 'Track your financial goals',
    'goals.add': 'Add new goal',
    'goals.name': 'Goal name',
    'goals.target': 'Target amount',
    'goals.monthly': 'Monthly contribution',
    'goals.deadline': 'Deadline',
    'goals.addGoal': 'Add goal',
    'goals.adjust': 'Adjust contribution',
    'goals.active': 'Active goal',
    'goals.activeDesc': 'Add monthly contributions or withdraw funds when needed.',
    'goals.averageProgress': 'Average progress',
    'goals.deadlineLabel': 'Deadline',
    'goals.customAmount': 'Custom amount',
    'goals.addFunds': '+ Add',
    'goals.withdrawFunds': '- Withdraw',
    'goals.save': 'Save',
    'goals.cancel': 'Cancel',
    'goals.edit': 'Edit',
    'goals.remove': 'Remove',
    'goals.createGoal': 'Create goal',

    // Profile
    'profile.title': 'Profile',
    'profile.subtitle': 'Currency and account settings',
    'profile.personalize': 'Personalize your financial profile',
    'profile.name': 'Name',
    'profile.currency': 'Currency',
    'profile.dollar': 'Dollar',
    'profile.income': 'Monthly income',
    'profile.payday': 'Payday',
    'profile.bonus': 'Salary bonus',
    'profile.addBonus': 'Add bonus',
    'profile.bonusNote': 'Salary bonus',
    'profile.investmentBase': 'Base monthly investment',
    'profile.investmentBaseDesc': 'Added automatically on payday.',
    'profile.investmentMovement': 'Investment movement',
    'profile.addInvestment': 'Add investment',
    'profile.withdrawInvestment': 'Withdraw investment',
    'profile.investmentAddNote': 'Additional investment',
    'profile.investmentWithdrawNote': 'Investment withdrawal',
    'profile.newPassword': 'New password',
    'profile.confirmPassword': 'Confirm password',
    'profile.save': 'Save changes',
    'profile.language': 'Language',
    'profile.languageDesc': 'Choose the application language.',
    'profile.auto': 'Automatic (browser default)',
    'profile.portuguese': 'Portuguese',
    'profile.english': 'English',
    'profile.account': 'Account',
    'profile.accountDesc': 'Manage your account and sessions.',
    'profile.monthlyPlan': 'Monthly plan',
    'profile.monthlyPlanDesc': 'Values that repeat automatically on payday.',
    'profile.manualMovements': 'One-off movements',
    'profile.manualMovementsDesc': 'Add bonuses or investment adjustments when they happen.',
    'profile.security': 'Security',
    'profile.logout': 'Log out',
    'profile.loggingOut': 'Logging out...',

    // Modals
    'modal.add': 'Add Transaction',
    'modal.edit': 'Edit Transaction',
    'modal.category': 'Category',
    'modal.amount': 'Amount',
    'modal.date': 'Date',
    'modal.type': 'Type',
    'modal.comment': 'Optional comment',
    'modal.commentPlaceholder': 'E.g. dinner with friends, urgent purchase...',
    'modal.expense': 'Expense',
    'modal.income': 'Income',
    'modal.cancel': 'Cancel',
    'modal.save': 'Save',

    // Categories
    'categories.alimentacao': 'Food',
    'categories.entretenimento': 'Entertainment',
    'categories.saude': 'Health',
    'categories.educacao': 'Education',
    'categories.contas': 'Bills',
    'categories.investimentos': 'Investments',
    'categories.renda': 'Income',
    'categories.transporte': 'Transport',
    'categories.outros': 'Others',
    'dashboard.category.house': 'Home',
    'dashboard.category.shopping': 'Shopping',
    'dashboard.category.transport': 'Transport',
    'dashboard.category.leisure': 'Leisure',
    'dashboard.category.houseDesc': 'Rent and essential bills',
    'dashboard.category.shoppingDesc': 'Groceries, clothes and personal items',
    'dashboard.category.transportDesc': 'Trips, fuel and mobility apps',
    'dashboard.category.leisureDesc': 'Streaming, cinema and social activities',

    // Messages
    'messages.passwordMismatch': 'Passwords do not match. Please check.',
    'messages.success': 'Settings updated successfully!',
    'messages.logout': 'Logged out successfully!',
    'messages.invalidBonus': 'Enter a bonus greater than zero.',
    'messages.bonusAdded': 'Bonus added as income.',
    'messages.invalidInvestment': 'Enter an investment greater than zero.',
    'messages.investmentAdded': 'Investment added to history.',
    'messages.investmentWithdrawn': 'Investment withdrawal added to history.',
    'notes.goalContribution': 'Goal contribution',
    'notes.goalWithdrawal': 'Goal withdrawal',
    'notes.monthlyInvestment': 'Base monthly investment',
    'notes.investmentAdd': 'Additional investment',
    'notes.investmentWithdraw': 'Investment withdrawal',
  },
}

export function useTranslation() {
  const { currentLanguage } = useLanguage()

  const t = (key: string): string => {
    return translations[currentLanguage][key as keyof typeof translations.pt] || key
  }

  const translateNote = (note?: string): string | undefined => {
    if (!note) {
      return undefined
    }

    const contributionPrefix = 'Contribuição para meta: '
    const withdrawalPrefix = 'Retirada da meta: '
    const stableContributionPrefix = 'finleaf-goal-contribution:'
    const stableWithdrawalPrefix = 'finleaf-goal-withdrawal:'
    const monthlyInvestmentPrefix = 'finleaf-monthly-investment:'

    if (note.startsWith(contributionPrefix)) {
      return `${t('notes.goalContribution')}: ${note.slice(contributionPrefix.length)}`
    }

    if (note.startsWith(withdrawalPrefix)) {
      return `${t('notes.goalWithdrawal')}: ${note.slice(withdrawalPrefix.length)}`
    }

    if (note.startsWith(stableContributionPrefix)) {
      return `${t('notes.goalContribution')}: ${note.slice(stableContributionPrefix.length)}`
    }

    if (note.startsWith(stableWithdrawalPrefix)) {
      return `${t('notes.goalWithdrawal')}: ${note.slice(stableWithdrawalPrefix.length)}`
    }

    if (note.startsWith(monthlyInvestmentPrefix)) {
      return t('notes.monthlyInvestment')
    }

    if (note === 'finleaf-investment-add' || note === translations.pt['profile.investmentAddNote'] || note === translations.en['profile.investmentAddNote']) {
      return t('notes.investmentAdd')
    }

    if (note === 'finleaf-investment-withdraw' || note === translations.pt['profile.investmentWithdrawNote'] || note === translations.en['profile.investmentWithdrawNote']) {
      return t('notes.investmentWithdraw')
    }

    return note
  }

  return { t, translateNote }
}

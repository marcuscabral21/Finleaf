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
    'nav.tipDescription': 'Use a aba History para filtrar gastos por dia, semana ou mês e veja para onde seu dinheiro está indo.',
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
    'history.export': 'Exportar CSV',

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

    // Profile
    'profile.title': 'Perfil',
    'profile.subtitle': 'Ajustes de moeda e conta',
    'profile.personalize': 'Personalize seu perfil financeiro',
    'profile.currency': 'Moeda',
    'profile.income': 'Renda mensal',
    'profile.payday': 'Dia de recebimento',
    'profile.bonus': 'Bônus mensal',
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
    'profile.logout': 'Fazer logout',

    // Modals
    'modal.add': 'Adicionar Transação',
    'modal.edit': 'Editar Transação',
    'modal.category': 'Categoria',
    'modal.amount': 'Valor',
    'modal.date': 'Data',
    'modal.type': 'Tipo',
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
    'history.export': 'Export CSV',

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

    // Profile
    'profile.title': 'Profile',
    'profile.subtitle': 'Currency and account settings',
    'profile.personalize': 'Personalize your financial profile',
    'profile.currency': 'Currency',
    'profile.income': 'Monthly income',
    'profile.payday': 'Payday',
    'profile.bonus': 'Monthly bonus',
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
    'profile.logout': 'Log out',

    // Modals
    'modal.add': 'Add Transaction',
    'modal.edit': 'Edit Transaction',
    'modal.category': 'Category',
    'modal.amount': 'Amount',
    'modal.date': 'Date',
    'modal.type': 'Type',
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
  },
}

export function useTranslation() {
  const { currentLanguage } = useLanguage()

  const t = (key: string): string => {
    return translations[currentLanguage][key as keyof typeof translations.pt] || key
  }

  return { t }
}

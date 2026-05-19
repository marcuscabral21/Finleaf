import { useCallback } from 'react'
import { useLanguage } from './LanguageProvider'

const translations = {
  pt: {
    // Navigation
    'nav.home': 'Home',
    'nav.history': 'Histórico',
    'nav.goals': 'Metas',
    'nav.profile': 'Perfil',
    'nav.manageMoney': 'Gerencie o seu dinheiro',
    'nav.description': 'Acompanhe gastos, metas e a sua poupança num só lugar.',
    'nav.finleafTip': 'Dica do Finleaf',
    'nav.tipDescription': 'Use a aba Histórico para filtrar gastos por dia, semana ou mês e veja para onde o seu dinheiro está indo.',
    'nav.dashboard': 'Painel',
    'nav.transactions': 'Transações',
    'nav.account': 'Conta',

    // Dashboard
    'dashboard.title': 'Painel',
    'dashboard.subtitle': 'Visão geral das suas finanças',
    'dashboard.available': 'Dinheiro disponível',
    'dashboard.spent': 'Total gasto',
    'dashboard.savings': 'Poupança',
    'dashboard.categories': 'Gastos por categoria',
    'dashboard.categoriesDesc': 'Passe o mouse pelas cores para ver detalhes.',
    'dashboard.summary': 'Resumo',
    'dashboard.income': 'Receitas',
    'dashboard.expenses': 'Despesas',
    'dashboard.investments': 'Investimentos',
    'dashboard.trendUpLastMonth': '+12,5% no último mês',
    'dashboard.trendDownPreviousMonth': '-8,3% em relação ao mês anterior',
    'dashboard.savingsTrend': '+5,2% no último mês',
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
    'history.filtersDesc': 'Selecione o período para ver as suas transações recentes.',
    'history.day': 'Dia',
    'history.week': 'Semana',
    'history.month': 'Mês',
    'history.all': 'Geral',
    'history.allPeriod': 'Todas',
    'history.transactions': 'Transações',
    'history.found': 'itens encontrados no período selecionado.',
    'history.lastDay': 'Último dia',
    'history.lastWeek': 'Última semana',
    'history.lastMonth': 'Último mês',
    'history.chooseDay': 'Escolha o dia',
    'history.chooseWeek': 'Escolha a semana',
    'history.weekStart': 'Início',
    'history.weekEnd': 'Fim',
    'history.chooseMonth': 'Escolha o mês',
    'history.chooseAll': 'Ver todas as transações',
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
    'goals.subtitle': 'Acompanhe os seus objetivos financeiros',
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
    'profile.personalize': 'Personalize o seu perfil financeiro',
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
    'profile.english': 'Inglês',
    'profile.account': 'Conta',
    'profile.accountDesc': 'Gerencie a sua conta e sessões.',
    'profile.monthlyPlan': 'Plano mensal',
    'profile.monthlyPlanDesc': 'Valores que se repetem automaticamente no dia de recebimento.',
    'profile.manualMovements': 'Movimentos pontuais',
    'profile.manualMovementsDesc': 'Adicione bônus ou ajustes de investimento quando eles acontecerem.',
    'profile.security': 'Segurança',
    'profile.logout': 'Fazer logout',
    'profile.loggingOut': 'A sair...',

    // Auth
    'auth.createAccount': 'Criar conta',
    'auth.createAccountDesc': 'Comece a sua jornada com o Finleaf e acompanhe os seus hábitos financeiros desde já.',
    'auth.name': 'Nome',
    'auth.namePlaceholder': 'O seu nome',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.passwordPlaceholder': 'A sua password',
    'auth.hidePassword': 'Ocultar password',
    'auth.showPassword': 'Mostrar password',
    'auth.creating': 'A criar...',
    'auth.signUp': 'Registar',
    'auth.signIn': 'Entrar',
    'auth.signingIn': 'A entrar...',
    'auth.welcomeBack': 'Bem-vindo de volta',
    'auth.welcomeBackDesc': 'Se já tem uma conta, entre e continue a gerir as suas finanças.',
    'auth.signInDesc': 'Use as suas credenciais Supabase para aceder à conta e gerir o seu painel financeiro.',
    'auth.forgotPassword': 'Esqueceu-se da password?',
    'auth.noAccount': 'Ainda não tem conta?',
    'auth.noAccountDesc': 'Registe-se agora para começar a usar o Finleaf e manter a sua vida financeira organizada.',

    // Reset password
    'reset.title': 'Recuperar password',
    'reset.description': 'Use o link de recuperação enviado por email. Esta página conclui a reposição da password usando o link de recuperação do Supabase.',
    'reset.newPassword': 'Nova password',
    'reset.newPasswordPlaceholder': 'Nova password',
    'reset.confirmPassword': 'Confirmar password',
    'reset.confirmPasswordPlaceholder': 'Confirme a nova password',
    'reset.updating': 'A atualizar...',
    'reset.submit': 'Atualizar password',
    'reset.backToLogin': 'Voltar para o login',

    // Modals
    'modal.add': 'Adicionar transação',
    'modal.edit': 'Editar transação',
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
    'dashboard.category.transportDesc': 'Viagens, combustível e apps de mobilidade',
    'dashboard.category.leisureDesc': 'Streaming, cinema e atividades sociais',

    // Messages
    'messages.passwordMismatch': 'As passwords não coincidem. Por favor, verifique.',
    'messages.success': 'Configurações atualizadas com sucesso!',
    'messages.logout': 'Logout realizado com sucesso!',
    'messages.invalidBonus': 'Informe um bônus maior que zero.',
    'messages.bonusAdded': 'Bônus adicionado como receita.',
    'messages.invalidInvestment': 'Informe um investimento maior que zero.',
    'messages.investmentAdded': 'Investimento adicionado ao histórico.',
    'messages.investmentWithdrawn': 'Retirada de investimento adicionada ao histórico.',
    'messages.emailConfirmed': 'Email confirmado com sucesso! Entre com a sua password.',
    'messages.accountCreated': 'Conta criada com sucesso! Verifique o seu email para confirmar a conta antes de entrar.',
    'messages.emailNotConfirmed': 'Email não confirmado. Verifique a sua caixa de entrada e confirme a conta antes de entrar.',
    'messages.loginSuccess': 'Login realizado com sucesso! Bem-vindo(a) ao Finleaf.',
    'messages.emailRequiredForRecovery': 'Insira o seu email primeiro para enviarmos o link de recuperação.',
    'messages.tooManyRecoveryEmails': 'Muitos emails foram enviados recentemente. Aguarde alguns minutos e tente novamente.',
    'messages.recoveryEmailSent': 'Email de recuperação enviado. Verifique a sua caixa de entrada.',
    'messages.recoveryLinkDetected': 'Link de recuperação detectado. Defina a sua nova password abaixo.',
    'messages.recoveryLinkNeeded': 'Email de recuperação enviado. Clique no link do email para continuar.',
    'messages.resetRequiredFields': 'Preencha a nova password e a confirmação.',
    'messages.resetPasswordMismatch': 'As passwords não coincidem. Verifique e tente novamente.',
    'messages.passwordUpdated': 'Password atualizada com sucesso. A redirecionar para o login...',
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
    'history.all': 'All',
    'history.allPeriod': 'All time',
    'history.transactions': 'Transactions',
    'history.found': 'items found in the selected period.',
    'history.lastDay': 'Last day',
    'history.lastWeek': 'Last week',
    'history.lastMonth': 'Last month',
    'history.chooseDay': 'Choose day',
    'history.chooseWeek': 'Choose week',
    'history.weekStart': 'Start',
    'history.weekEnd': 'End',
    'history.chooseMonth': 'Choose month',
    'history.chooseAll': 'View all transactions',
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

    // Auth
    'auth.createAccount': 'Create account',
    'auth.createAccountDesc': 'Start your journey with Finleaf and track your financial habits right away.',
    'auth.name': 'Name',
    'auth.namePlaceholder': 'Your name',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.passwordPlaceholder': 'Your password',
    'auth.hidePassword': 'Hide password',
    'auth.showPassword': 'Show password',
    'auth.creating': 'Creating...',
    'auth.signUp': 'Sign up',
    'auth.signIn': 'Sign in',
    'auth.signingIn': 'Signing in...',
    'auth.welcomeBack': 'Welcome back',
    'auth.welcomeBackDesc': 'If you already have an account, just sign in and continue managing your finances.',
    'auth.signInDesc': 'Use your Supabase credentials to access your account and manage your finance dashboard.',
    'auth.forgotPassword': 'Forgot your password?',
    'auth.noAccount': "Don't have an account?",
    'auth.noAccountDesc': 'Sign up now to start using Finleaf and keep your financial life organized.',

    // Reset password
    'reset.title': 'Reset password',
    'reset.description': 'Use the recovery link sent by email. This page completes the password reset using the Supabase recovery link.',
    'reset.newPassword': 'New password',
    'reset.newPasswordPlaceholder': 'New password',
    'reset.confirmPassword': 'Confirm password',
    'reset.confirmPasswordPlaceholder': 'Confirm the new password',
    'reset.updating': 'Updating...',
    'reset.submit': 'Update password',
    'reset.backToLogin': 'Back to login',

    // Modals
    'modal.add': 'Add transaction',
    'modal.edit': 'Edit transaction',
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
    'categories.outros': 'Other',
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
    'messages.emailConfirmed': 'Email confirmed successfully! Sign in with your password.',
    'messages.accountCreated': 'Account created successfully! Check your email to confirm the account before signing in.',
    'messages.emailNotConfirmed': 'Email not confirmed. Check your inbox and confirm your account before signing in.',
    'messages.loginSuccess': 'Login successful! Welcome to Finleaf.',
    'messages.emailRequiredForRecovery': 'Enter your email first so we can send the recovery link.',
    'messages.tooManyRecoveryEmails': 'Too many emails were sent recently. Wait a few minutes and try again.',
    'messages.recoveryEmailSent': 'Recovery email sent. Check your inbox.',
    'messages.recoveryLinkDetected': 'Recovery link detected. Set your new password below.',
    'messages.recoveryLinkNeeded': 'Recovery email sent. Click the link in the email to continue.',
    'messages.resetRequiredFields': 'Fill in the new password and confirmation.',
    'messages.resetPasswordMismatch': 'Passwords do not match. Check them and try again.',
    'messages.passwordUpdated': 'Password updated successfully. Redirecting to login...',
    'notes.goalContribution': 'Goal contribution',
    'notes.goalWithdrawal': 'Goal withdrawal',
    'notes.monthlyInvestment': 'Base monthly investment',
    'notes.investmentAdd': 'Additional investment',
    'notes.investmentWithdraw': 'Investment withdrawal',
  },
}

export function useTranslation() {
  const { currentLanguage } = useLanguage()

  const t = useCallback((key: string): string => {
    return translations[currentLanguage][key as keyof typeof translations.pt] || key
  }, [currentLanguage])

  const translateNote = useCallback((note?: string): string | undefined => {
    if (!note) {
      return undefined
    }

    const contributionPrefix = 'Contribuição para meta: '
    const legacyContributionPrefix = 'ContribuiÃ§Ã£o para meta: '
    const withdrawalPrefix = 'Retirada da meta: '
    const stableContributionPrefix = 'finleaf-goal-contribution:'
    const stableWithdrawalPrefix = 'finleaf-goal-withdrawal:'
    const monthlyInvestmentPrefix = 'finleaf-monthly-investment:'

    if (note.startsWith(contributionPrefix)) {
      return `${t('notes.goalContribution')}: ${note.slice(contributionPrefix.length)}`
    }

    if (note.startsWith(legacyContributionPrefix)) {
      return `${t('notes.goalContribution')}: ${note.slice(legacyContributionPrefix.length)}`
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
  }, [t])

  return { t, translateNote, currentLanguage }
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { signOut } from "./auth/actions";
import { FinleafLogo } from "@/components/finleaf-logo";
import { createClient } from "@/lib/supabase/client";
import {
  cycleRange,
  dueFixedDatesFrom,
  fixedDueDateForPeriod,
  periodIncome,
  periodStartForDate,
  periodStartForOffset,
  previousDate,
} from "@/lib/finance-periods";
import { resolveDarkMode, type ThemePreference } from "@/lib/color-scheme";

type Category = { name: string; color: string };
type Expense = { id: string; description: string; amount: number; date: string; category: string; note: string; type: "expense" | "income" | "transfer"; recurring?: boolean; fixedId?: string; transferDirection?: "to-savings" | "from-savings" };
type Fixed = { id: string; description: string; amount: number; category: string; day: number; active: boolean; startDate?: string };
type Goal = { id: string; name: string; target: number; due: string; saved: number; moves?: { month: string; amount: number }[] };
type SavingsMove = { month: string; amount: number };
type FixedCharge = { fixedId: string; periodStart: string; date: string };
type Data = { income: number; incomeByPeriod?: Record<string, number>; payday: number; paydayOverrides?: Record<string, string>; categories: Category[]; expenses: Expense[]; fixed: Fixed[]; fixedCharges?: FixedCharge[]; goals: Goal[]; savings: number; savingsMoves?: SavingsMove[]; dark: boolean; theme: ThemePreference };

const initial: Data = {
  income: 0, payday: 25, savings: 0, dark: false, theme: "system",
  categories: [
    { name: "Alimentação", color: "#7a9c70" }, { name: "Compras", color: "#d7a16c" },
    { name: "Saúde", color: "#d17872" }, { name: "Entretenimento", color: "#8576b7" },
    { name: "Casa", color: "#5e9eaa" }, { name: "Transportes", color: "#d0b85b" },
    { name: "Subscrições", color: "#cf7da0" }, { name: "Educação", color: "#718ac1" },
    { name: "Lazer", color: "#6aa88e" }, { name: "Outros", color: "#9b9b91" },
  ], expenses: [], fixed: [], goals: [],
};

const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
  ?.trim()
  .replace(/^@/, "");
const telegramBotUrl = telegramBotUsername
  && /^[A-Za-z0-9_]{5,32}$/.test(telegramBotUsername)
  ? `https://t.me/${telegramBotUsername}`
  : null;

function subscribeToColorScheme(onChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getSystemDarkPreference() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function normalizeFinanceData(raw: unknown): Data {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Os dados financeiros guardados no Supabase não são válidos.");
  }
  const parsed = { ...initial, ...raw } as Data;
  const savedTheme = (raw as Record<string, unknown>).theme;
  const theme: ThemePreference = savedTheme === "light" || savedTheme === "dark"
    ? savedTheme
    : savedTheme === "system"
      ? "system"
      : parsed.dark
        ? "dark"
        : "system";
  const paydayOverrides = parsed.paydayOverrides ?? {};
  const validDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const timestamp = Date.parse(`${value}T00:00:00Z`);
    return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
  };
  if (
    !Number.isSafeInteger(parsed.income)
    || !Number.isInteger(parsed.payday)
    || parsed.payday < 1
    || parsed.payday > 31
    || !Number.isSafeInteger(parsed.savings)
    || typeof parsed.dark !== "boolean"
    || !Array.isArray(parsed.categories)
    || !Array.isArray(parsed.expenses)
    || !Array.isArray(parsed.fixed)
    || !Array.isArray(parsed.goals)
    || typeof paydayOverrides !== "object"
    || paydayOverrides === null
    || Array.isArray(paydayOverrides)
    || Object.entries(paydayOverrides).some(([period, date]) => (
      !/^\d{4}-\d{2}$/.test(period)
      || typeof date !== "string"
      || date.slice(0, 7) !== period
      || !validDate(date)
    ))
  ) {
    throw new Error("Os dados financeiros guardados no Supabase têm um formato inválido.");
  }
  return {
    ...parsed,
    theme,
    incomeByPeriod: parsed.incomeByPeriod ?? {},
    paydayOverrides,
    fixedCharges: parsed.fixedCharges ?? [],
    savingsMoves: parsed.savingsMoves ?? [],
  };
}

const monthKey = (date: string) => date.slice(0, 7);
const money = (cents: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);
const newId = () => Math.random().toString(36).slice(2, 10);
const monthName = (month: string) => new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" }).format(new Date(`${month}T12:00:00`));

function shortDate(date: string) {
  return new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`));
}

function Donut({
  values,
  categories,
  total,
  selectedCategory,
  onSelectCategory,
}: {
  values: Record<string, number>;
  categories: Category[];
  total: number;
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
}) {
  const slices = categories.map((c) => ({ ...c, value: values[c.name] || 0 })).filter((c) => c.value > 0);
  const circumference = 2 * Math.PI * 42;
  let offset = 0;
  const selectedValue = selectedCategory ? values[selectedCategory] || 0 : total;

  return (
    <div className="donut">
      <svg
        aria-label={`Despesas por categoria, total ${money(total)}`}
        className="donut-chart"
        role="group"
        viewBox="0 0 100 100"
      >
        <circle className="donut-track" cx="50" cy="50" r="42" />
        {total > 0 &&
          slices.map((slice) => {
            const length = (slice.value / total) * circumference;
            const dashOffset = offset;
            offset += length;

            return (
              <circle
                key={slice.name}
                className={selectedCategory === slice.name ? "selected-slice" : ""}
                cx="50"
                cy="50"
                r="42"
                stroke={slice.color}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-dashOffset}
                role="button"
                tabIndex={0}
                aria-label={`${slice.name}: ${money(slice.value)}`}
                aria-pressed={selectedCategory === slice.name}
                onClick={() => onSelectCategory(slice.name)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectCategory(slice.name);
                  }
                }}
              />
            );
          })}
      </svg>
      <div className="donut-hole">
        <b>{money(selectedValue)}</b>
        <span>{selectedCategory || "gasto total"}</span>
      </div>
    </div>
  );
}

export default function DashboardClient({
  userName,
  userEmail,
  todayDate,
  initialFinanceData,
  initialRevision,
}: {
  userName: string;
  userEmail: string;
  todayDate: string;
  initialFinanceData: unknown;
  initialRevision: number;
}) {
  const displayName = userName.trim() || "Utilizador";
  const avatarInitial = displayName.slice(0, 1).toUpperCase() || "U";
  const systemPrefersDark = useSyncExternalStore(
    subscribeToColorScheme,
    getSystemDarkPreference,
    () => false,
  );
  const supabase = useMemo(() => createClient(), []);
  const [data, setDataState] = useState(() => normalizeFinanceData(initialFinanceData));
  const isDark = resolveDarkMode(data.theme, systemPrefersDark);
  const [syncStatus, setSyncStatus] = useState<"saving" | "saved" | "error" | "conflict">("saving");
  const [greeting, setGreeting] = useState("Bom dia");
  const [notice, setNotice] = useState("");
  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  }, []);
  const revisionRef = useRef(initialRevision);
  const writeQueueRef = useRef(Promise.resolve());
  const saveSequenceRef = useRef(0);
  const saveData = useCallback((snapshot: Data) => {
    const sequence = ++saveSequenceRef.current;
    writeQueueRef.current = writeQueueRef.current.then(async () => {
      const { data: savedRevision, error } = await supabase.rpc(
        "save_user_finance_state",
        {
          p_data: snapshot,
          p_expected_revision: revisionRef.current,
        },
      );
      if (error) {
        if (sequence !== saveSequenceRef.current) return;
        const conflict = error.message.includes("FINANCE_STATE_CONFLICT");
        console.error("Não foi possível guardar os dados financeiros.", error);
        setSyncStatus(conflict ? "conflict" : "error");
        showNotice(conflict
          ? "Os dados foram alterados noutro dispositivo. Recarregue antes de continuar."
          : "Não foi possível guardar os dados. Verifique a ligação e tente novamente.");
        return;
      }

      const nextRevision = Number(savedRevision);
      if (!Number.isSafeInteger(nextRevision) || nextRevision <= revisionRef.current) {
        throw new Error("O Supabase devolveu uma revisão inválida dos dados financeiros.");
      }
      revisionRef.current = nextRevision;
      if (sequence === saveSequenceRef.current) setSyncStatus("saved");
    }).catch((error: unknown) => {
      if (sequence !== saveSequenceRef.current) return;
      console.error("Falha inesperada ao guardar os dados financeiros.", error);
      setSyncStatus("error");
      showNotice("Não foi possível guardar os dados. Tente novamente.");
    });
  }, [showNotice, supabase]);
  const setData = useCallback((update: React.SetStateAction<Data>) => {
    if (syncStatus === "conflict") {
      showNotice("Recarregue os dados antes de continuar a editar.");
      return;
    }
    setSyncStatus("saving");
    setDataState((current) => typeof update === "function" ? update(current) : update);
  }, [showNotice, syncStatus]);
  useEffect(() => {
    saveData(data);
  }, [data, saveData]);
  useEffect(() => {
    if (syncStatus !== "saving" && syncStatus !== "error") return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [syncStatus]);
  const [liveDate, setLiveDate] = useState(todayDate);
  useEffect(() => {
    const updateDate = () => {
      const current = new Date();
      const localDate = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
      setLiveDate(localDate);
      const hour = current.getHours();
      setGreeting(hour >= 5 && hour < 12 ? "Bom dia" : hour >= 12 && hour < 19 ? "Boa tarde" : "Boa noite");
    };

    updateDate();
    const interval = window.setInterval(updateDate, 60_000);
    return () => window.clearInterval(interval);
  }, [todayDate]);
  const effectiveToday = liveDate;
  const effectiveTimestamp = new Date(`${effectiveToday}T12:00:00`).getTime();
  const today = () => effectiveToday;
  const [monthOffset, setMonthOffset] = useState(0);
  const month = periodStartForOffset(effectiveToday, data.payday, monthOffset, data.paydayOverrides);
  const [tab, setTab] = useState("Visão geral");
  const [modal, setModal] = useState("");
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [editingFixed, setEditingFixed] = useState<Fixed | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const monthExpenses = useMemo(() => data.expenses.filter((e) => periodStartForDate(e.date, data.payday, data.paydayOverrides) === month), [data.expenses, data.payday, data.paydayOverrides, month]);
  const spending = monthExpenses.filter((e) => e.type === "expense").reduce((a, e) => a + e.amount, 0);
  const extras = monthExpenses.filter((e) => e.type === "income").reduce((a, e) => a + e.amount, 0);
  const fixedTotal = data.fixed.filter((fixed) => fixed.active).reduce((total, fixed) => total + fixed.amount, 0);
  const basePeriodIncome = periodIncome(data.income, data.incomeByPeriod, month);
  const income = basePeriodIncome + extras;
  const isSelectedPeriod = (move: SavingsMove) => move.month === month || move.month === monthKey(month);
  const monthSavings = data.goals.reduce((total, goal) => total + (goal.moves || []).filter(isSelectedPeriod).reduce((sum, move) => sum + move.amount, 0), 0)
    + (data.savingsMoves || []).filter(isSelectedPeriod).reduce((sum, move) => sum + move.amount, 0);
  const balance = income - spending - monthSavings;
  const byCategory = Object.fromEntries(data.categories.map((c) => [c.name, monthExpenses.filter((e) => e.category === c.name && e.type === "expense").reduce((a, e) => a + e.amount, 0)]));
  const cycleEnd = previousDate(periodStartForOffset(month, data.payday, 1, data.paydayOverrides));
  const currentCycleStart = periodStartForDate(effectiveToday, data.payday, data.paydayOverrides);
  const maxReceivedDate = month === currentCycleStart ? effectiveToday : cycleEnd;
  const defaultReceivedDate = month === currentCycleStart
    ? data.paydayOverrides?.[monthKey(month)] ?? effectiveToday
    : data.paydayOverrides?.[monthKey(month)] ?? month;
  const defaultCycleDate = effectiveToday < month ? month : effectiveToday > cycleEnd ? cycleEnd : effectiveToday;
  useEffect(() => {
    const processedCharges: FixedCharge[] = [];
    const newExpenses: Expense[] = [];

    for (const fixed of data.fixed) {
      if (!fixed.active) continue;

      const startDate = fixed.startDate ?? periodStartForDate(effectiveToday, data.payday, data.paydayOverrides);
      for (const date of dueFixedDatesFrom(startDate, fixed.day, data.payday, effectiveToday, data.paydayOverrides)) {
        const periodStart = periodStartForDate(date, data.payday, data.paydayOverrides);
        const alreadyProcessed = data.fixedCharges?.some(
          (charge) => charge.fixedId === fixed.id && charge.periodStart === periodStart,
        );
        if (alreadyProcessed) continue;

        const existingExpense = data.expenses.some((expense) => (
          periodStartForDate(expense.date, data.payday, data.paydayOverrides) === periodStart
          && (
            expense.fixedId === fixed.id
            || (!expense.fixedId && expense.recurring && expense.description === fixed.description)
          )
        ));
        processedCharges.push({ fixedId: fixed.id, periodStart, date });
        if (!existingExpense) {
          newExpenses.push({
            id: newId(),
            fixedId: fixed.id,
            description: fixed.description,
            amount: fixed.amount,
            date,
            category: fixed.category,
            note: "Gasto fixo lançado automaticamente",
            type: "expense",
            recurring: true,
          });
        }
      }
    }

    if (processedCharges.length === 0) return;
    const timer = window.setTimeout(() => {
      setData((current) => {
        const newCharges = processedCharges.filter(
          (charge) => !current.fixedCharges?.some(
            (saved) => saved.fixedId === charge.fixedId && saved.periodStart === charge.periodStart,
          ),
        );
        if (newCharges.length === 0) return current;

        const chargesToAdd = newExpenses.filter(
          (expense) => !current.expenses.some(
            (saved) => saved.fixedId === expense.fixedId
              && periodStartForDate(saved.date, current.payday, current.paydayOverrides)
                === periodStartForDate(expense.date, current.payday, current.paydayOverrides),
          ),
        );
        return {
          ...current,
          fixedCharges: [...(current.fixedCharges || []), ...newCharges],
          expenses: [...chargesToAdd, ...current.expenses],
        };
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [data.expenses, data.fixed, data.fixedCharges, data.payday, data.paydayOverrides, effectiveToday, setData]);
  const saveExpense = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const fd = new FormData(event.currentTarget); const amount = Math.round(Number(fd.get("amount")) * 100);
    const entry: Expense = { id: editing?.id || newId(), description: String(fd.get("description")).trim(), amount, date: String(fd.get("date")), category: String(fd.get("category")), note: String(fd.get("note") || ""), type: fd.get("type") === "income" ? "income" : "expense" };
    setData((d) => ({ ...d, expenses: editing ? d.expenses.map((e) => e.id === editing.id ? entry : e) : [entry, ...d.expenses] })); setModal(""); setEditing(null); showNotice(editing ? "Movimento atualizado." : "Movimento registado.");
  };
  const saveFixed = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const item: Fixed = {
      id: editingFixed?.id || newId(),
      description: String(fd.get("description")).trim(),
      amount: Math.round(Number(fd.get("amount")) * 100),
      category: String(fd.get("category")),
      day: Number(fd.get("day")),
      active: editingFixed?.active ?? true,
      startDate: today(),
    };
    setData((d) => ({
      ...d,
      fixed: editingFixed
        ? d.fixed.map((fixed) => fixed.id === editingFixed.id ? item : fixed)
        : [item, ...d.fixed],
    }));
    setModal("");
    setEditingFixed(null);
    showNotice(editingFixed ? "Gasto fixo atualizado." : "Gasto fixo criado.");
  };
  const saveIncome = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const amount = Math.round(Number(formData.get("amount")) * 100);
    const bonus = Math.round(Number(formData.get("extra")) * 100);
    const bonusDate = String(formData.get("date") || today());
    const receivedDate = String(formData.get("receivedDate") || "");

    if (receivedDate < month || receivedDate > maxReceivedDate) {
      showNotice(`A data de recebimento deve estar no ciclo ${cycleRange(month, data.payday, data.paydayOverrides)}.`);
      return;
    }

    const paydayOverrides = {
      ...data.paydayOverrides,
      [monthKey(receivedDate)]: receivedDate,
    };

    if (
      bonus > 0
      && periodStartForDate(bonusDate, data.payday, paydayOverrides) !== receivedDate
    ) {
      showNotice(`A data do rendimento extra deve estar no ciclo ${cycleRange(receivedDate, data.payday, paydayOverrides)}.`);
      return;
    }

    setData((current) => {
      const incomeByPeriod = { ...(current.incomeByPeriod || {}), [receivedDate]: amount };
      const expenses = current.expenses.filter((expense) => !(
        expense.category === "Outros"
        && expense.description === "Ajuste de rendimento"
        && periodStartForDate(expense.date, current.payday, paydayOverrides) === receivedDate
      ));

      return {
        ...current,
        paydayOverrides,
        incomeByPeriod,
        expenses: bonus > 0
          ? [{
            id: newId(),
            description: "Rendimento extra",
            amount: bonus,
            date: bonusDate,
            category: "Outros",
            note: "Rendimento extra do mês",
            type: "income" as const,
          }, ...expenses]
          : expenses,
      };
    });
    setModal("");
    showNotice("Rendimento e data de recebimento deste ciclo atualizados.");
  };
  const saveGoal = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const fd = new FormData(event.currentTarget); const item: Goal = { id: newId(), name: String(fd.get("name")), target: Math.round(Number(fd.get("target")) * 100), due: String(fd.get("due")), saved: 0 }; setData((d) => ({ ...d, goals: [item, ...d.goals] })); setModal(""); showNotice("Meta de poupança criada."); };
  const filtered = monthExpenses.filter((e) => (!filter || e.category === filter) && (!search || `${e.description} ${e.note}`.toLowerCase().includes(search.toLowerCase()))).sort((a,b) => b.date.localeCompare(a.date));
  const shiftMonth = (n: number) => setMonthOffset((offset) => Math.min(0, offset + n));
  const nav = ["Visão geral", "Movimentos", "Gastos fixos", "Poupança", "Histórico", "Definições"];
  const isCurrentCycle = () => {
    if (month === periodStartForDate(effectiveToday, data.payday, data.paydayOverrides)) return true;
    showNotice("Volte ao ciclo atual para registar uma transferência de poupança.");
    return false;
  };
  const transferCategory = data.categories.find((category) => category.name === "Outros")?.name
    || data.categories[0]?.name
    || "Outros";
  const addToGoal = (goal: Goal) => {
    if (!isCurrentCycle()) return;
    const raw = window.prompt(`Quanto quer transferir para “${goal.name}”? (€)`);
    if (!raw) return;
    const value = Math.round(Number(raw.replace(",", ".")) * 100);
    if (!Number.isFinite(value) || value <= 0 || value > balance) {
      showNotice("Indique um valor válido dentro do saldo disponível.");
      return;
    }
    setData((d) => ({
      ...d,
      goals: d.goals.map((item) => item.id === goal.id
        ? { ...item, saved: item.saved + value, moves: [...(item.moves || []), { month, amount: value }] }
        : item),
      expenses: [{
        id: newId(),
        description: `Depósito na meta: ${goal.name}`,
        amount: value,
        date: today(),
        category: transferCategory,
        note: "Transferência do saldo disponível para uma meta",
        type: "transfer",
        transferDirection: "to-savings",
      }, ...d.expenses],
    }));
    showNotice("Transferência para a meta concluída.");
  };
  const withdrawFromGoal = (goal: Goal) => {
    if (!isCurrentCycle()) return;
    const raw = window.prompt(`Quanto quer retirar de “${goal.name}”? (€)`);
    if (!raw) return;
    const value = Math.round(Number(raw.replace(",", ".")) * 100);
    if (!Number.isFinite(value) || value <= 0 || value > goal.saved) {
      showNotice("Indique um valor válido até ao saldo guardado nesta meta.");
      return;
    }
    setData((d) => ({
      ...d,
      goals: d.goals.map((item) => item.id === goal.id
        ? { ...item, saved: item.saved - value, moves: [...(item.moves || []), { month, amount: -value }] }
        : item),
      expenses: [{
        id: newId(),
        description: `Levantamento da meta: ${goal.name}`,
        amount: value,
        date: today(),
        category: transferCategory,
        note: "Dinheiro devolvido da meta ao saldo disponível",
        type: "transfer",
        transferDirection: "from-savings",
      }, ...d.expenses],
    }));
    showNotice("Montante devolvido ao saldo disponível.");
  };
  const addToCoffer = () => {
    if (!isCurrentCycle()) return;
    const raw = window.prompt("Montante a guardar no cofre sem objetivo (€)");
    if (!raw) return;
    const value = Math.round(Number(raw.replace(",", ".")) * 100);
    if (!Number.isFinite(value) || value <= 0 || value > balance) {
      showNotice("Indique um valor válido dentro do saldo disponível.");
      return;
    }
    setData((d) => ({
      ...d,
      savings: d.savings + value,
      savingsMoves: [...(d.savingsMoves || []), { month, amount: value }],
      expenses: [{
        id: newId(),
        description: "Depósito no cofre sem objetivo",
        amount: value,
        date: today(),
        category: transferCategory,
        note: "Transferência do saldo disponível para o cofre",
        type: "transfer",
        transferDirection: "to-savings",
      }, ...d.expenses],
    }));
    showNotice("Montante transferido para o cofre.");
  };
  const withdrawFromCoffer = () => {
    if (!isCurrentCycle()) return;
    const raw = window.prompt("Montante a retirar do cofre sem objetivo (€)");
    if (!raw) return;
    const value = Math.round(Number(raw.replace(",", ".")) * 100);
    if (!Number.isFinite(value) || value <= 0 || value > data.savings) {
      showNotice("Indique um valor válido até ao saldo disponível no cofre.");
      return;
    }
    setData((d) => ({
      ...d,
      savings: d.savings - value,
      savingsMoves: [...(d.savingsMoves || []), { month, amount: -value }],
      expenses: [{
        id: newId(),
        description: "Levantamento do cofre sem objetivo",
        amount: value,
        date: today(),
        category: transferCategory,
        note: "Dinheiro devolvido do cofre ao saldo disponível",
        type: "transfer",
        transferDirection: "from-savings",
      }, ...d.expenses],
    }));
    showNotice("Montante devolvido ao saldo disponível.");
  };

  return <main className={`app ${isDark ? "dark" : ""}`}>
    <aside className="sidebar"><Link className="brand" href="/"><FinleafLogo appearance={isDark ? "dark" : "light"} /><span className="brand-caption">FINANÇAS PESSOAIS</span></Link>
      <div className="nav-label">MENU PRINCIPAL</div><nav aria-label="Navegação principal">{nav.map((n, i) => <button key={n} className={`nav-item ${tab === n ? "selected" : ""}`} onClick={() => setTab(n)}><span className="nav-icon">{["◫","↕","↻","◉","▥","⚙"][i]}</span>{n}{n === "Movimentos" && <span className="nav-count">{monthExpenses.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon">✦</div><b>Um passo de cada vez.</b><p>Pequenos hábitos criam grandes mudanças.</p></div><div className="profile"><div className="avatar">{avatarInitial}</div><div><b>{displayName}</b><small>{userEmail}</small></div></div></div>
    </aside>
    <section className="main-area">
      <header className="topbar">
        <div><div className="breadcrumb">Finleaf <span>/</span> {tab}</div><h1>{tab === "Visão geral" ? `${greeting}, ${displayName}` : tab}</h1></div>
        <div className="header-actions">
          <div className={`sync-status ${syncStatus}`} role="status" aria-live="polite" aria-label={syncStatus === "saved" ? "Dados guardados" : syncStatus === "saving" ? "A guardar dados" : syncStatus === "conflict" ? "Conflito de dados" : "Falha ao guardar dados"} title={syncStatus === "saved" ? "Dados guardados" : syncStatus === "saving" ? "A guardar dados" : syncStatus === "conflict" ? "Conflito de dados" : "Falha ao guardar dados"}>
            <i aria-hidden="true">{syncStatus === "saved" ? "✓" : syncStatus === "saving" ? "↻" : "!"}</i>
            <span>{syncStatus === "saved" ? "Guardado" : syncStatus === "saving" ? "A guardar…" : syncStatus === "conflict" ? "Conflito" : "Falha ao guardar"}</span>
            {syncStatus === "error" && <button type="button" onClick={() => {setSyncStatus("saving");saveData(data)}}>Tentar novamente</button>}
            {syncStatus === "conflict" && <button type="button" onClick={() => window.location.reload()}>Recarregar</button>}
          </div>
          <button className="icon-button" title="Notificações" onClick={() => showNotice("Não há notificações novas.")}>♧</button>
          <form action={signOut}><button className="logout-button" type="submit">Terminar sessão</button></form>
        </div>
      </header>
      <div className="content">
      <div className="month-row"><div><span className="muted-label">O SEU MÊS</span><div className="month-select"><button onClick={() => shiftMonth(-1)} aria-label="Mês anterior">‹</button><b>{monthName(month)}</b><button onClick={() => shiftMonth(1)} aria-label="Mês seguinte" disabled={monthOffset >= 0}>›</button></div><small>Ciclo: {cycleRange(month, data.payday, data.paydayOverrides)}</small></div><div className="quick-actions"><button className="button button-light" onClick={() => { setEditing(null); setEditingFixed(null); setModal("expense"); }}>＋ Novo movimento</button><button className="button button-primary" onClick={() => {setEditingFixed(null);setModal("fixed")}}>＋ Gasto fixo</button></div></div>
      {(tab === "Visão geral" || tab === "Histórico") && <><section className="summary-grid">
        <article className="summary-card"><div className="summary-head"><span>Rendimento do ciclo</span><i className="summary-icon green">↗</i></div><strong>{money(income)}</strong><div className="summary-foot"><span>{data.incomeByPeriod?.[month] !== undefined ? "Valor ajustado" : `Padrão · dia ${data.payday}`}</span><button onClick={() => setModal("income")}>Ajustar</button></div></article>
        <article className="summary-card"><div className="summary-head"><span>Total gasto</span><i className="summary-icon orange">↙</i></div><strong>{money(spending)}</strong><div className="summary-foot"><span>{monthExpenses.filter(e=>e.type==="expense").length} despesas este mês</span><span className="neutral-pill">{income ? Math.round(spending/income*100) : 0}% do rendimento</span></div></article>
        <article className="summary-card"><div className="summary-head"><span>Gastos fixos</span><i className="summary-icon purple">↻</i></div><strong>{money(fixedTotal)}</strong><div className="summary-foot"><span>{data.fixed.filter(f=>f.active).length} pagamentos programados</span><span className="neutral-pill">Por data</span></div></article>
        <article className="summary-card balance-card"><div className="summary-head"><span>Saldo disponível</span><i className="summary-icon white">◎</i></div><strong>{money(balance)}</strong><div className="summary-foot"><span>Após despesas e poupança</span><span className="positive-pill">{balance < 0 ? "Acima do orçamento" : "Dentro do orçamento"}</span></div></article>
      </section>
      <div className="dashboard-grid"><section className="panel spending-panel"><div className="panel-heading"><div><h2>Despesas por categoria</h2><p>Selecione uma categoria para ver o valor exato gasto</p></div><button className="more-button" onClick={() => setTab("Movimentos")}>Ver movimentos ↗</button></div><div className="chart-layout"><Donut values={byCategory} categories={data.categories} total={spending} selectedCategory={selectedCategory} onSelectCategory={(category) => setSelectedCategory((selected) => selected === category ? null : category)}/><div className="legend">{data.categories.filter(c=>byCategory[c.name]>0).map(c=><button type="button" className={`legend-row ${selectedCategory===c.name?"selected":""}`} key={c.name} aria-pressed={selectedCategory===c.name} onClick={()=>setSelectedCategory((selected)=>selected===c.name?null:c.name)}><i style={{background:c.color}}/><span>{c.name}</span><b>{money(byCategory[c.name])}</b><small>{spending?Math.round(byCategory[c.name]/spending*100):0}%</small></button>)}{spending===0&&<p className="empty-copy">Registe despesas para ver a distribuição por categoria.</p>}</div></div><div className={`category-savings ${monthSavings < 0 ? "returned" : ""}`}><span className="category-savings-icon">✦</span><div className="category-savings-copy"><b>{monthSavings > 0 ? "Poupado neste ciclo" : monthSavings < 0 ? "Devolvido ao saldo" : "Poupança do mês"}</b><small>{monthSavings > 0 ? "Transferido para o cofre e metas" : monthSavings < 0 ? "Retirado do cofre e metas" : "Sem transferências neste ciclo"}</small></div><strong>{money(Math.abs(monthSavings))}</strong><button className="category-savings-link" onClick={() => setTab("Poupança")}>Ver poupança <span>↗</span></button></div></section>
       <section className="panel budget-panel"><div className="panel-heading"><div><h2>Resumo do orçamento</h2><p>Como está a correr o seu mês</p></div><span className="tiny-badge">{monthName(month).split(" ")[0]}</span></div><div className="budget-number"><strong>{money(Math.max(0,balance))}</strong><span>disponível</span></div><div className="progress-track"><div style={{width:`${Math.min(100,income?spending/income*100:0)}%`}}/></div><div className="budget-ends"><span>Gasto {money(spending)}</span><span>Orçamento {money(income)}</span></div><div className="budget-tip"><span>✦</span><p>{balance < 0 ? "O gasto ultrapassou o rendimento deste mês. Reveja os movimentos." : "Está a acompanhar bem as suas despesas. Continue assim!"}</p></div><button className="full-link" onClick={() => setTab("Histórico")}>Consultar histórico <span>→</span></button></section></div>
       <section className="panel recent-panel"><div className="panel-heading"><div><h2>Movimentos recentes</h2><p>As últimas operações registadas</p></div><button className="more-button" onClick={() => setTab("Movimentos")}>Ver todos ↗</button></div><ExpenseTable expenses={monthExpenses.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5)} categories={data.categories} onEdit={(e)=>{setEditing(e);setModal("expense")}} onDelete={(id)=>setData(d=>({...d,expenses:d.expenses.filter(e=>e.id!==id)}))}/></section>
      </>}
      {tab === "Movimentos" && <section className="panel list-panel"><div className="panel-heading"><div><h2>Todos os movimentos</h2><p>Consulte, filtre e atualize as suas despesas e entradas.</p></div><button className="button button-primary" onClick={()=>{setEditing(null);setModal("expense")}}>＋ Novo movimento</button></div><div className="filters"><input placeholder="Pesquisar descrição ou nota…" value={search} onChange={e=>setSearch(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="">Todas as categorias</option>{data.categories.map(c=><option key={c.name}>{c.name}</option>)}</select><button className="button button-light" onClick={()=>{const csv=["data,descricao,tipo,categoria,valor,nota",...filtered.map(e=>`${e.date},${e.description},${e.type},${e.category},${(e.amount/100).toFixed(2)},${e.note}`)].join("\n"); const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv"}));a.download=`finleaf-${month}.csv`;a.click();URL.revokeObjectURL(a.href);}}>Exportar CSV ↓</button></div><ExpenseTable expenses={filtered} categories={data.categories} onEdit={(e)=>{setEditing(e);setModal("expense")}} onDelete={(id)=>setData(d=>({...d,expenses:d.expenses.filter(e=>e.id!==id)}))}/></section>}
      {tab === "Gastos fixos" && <section className="panel list-panel"><div className="panel-heading"><div><h2>Gastos fixos</h2><p>A app lança os pagamentos na data indicada quando está aberta ou quando é reaberta depois do vencimento.</p></div><button className="button button-primary" onClick={()=>{setEditingFixed(null);setModal("fixed")}}>＋ Novo gasto fixo</button></div>{data.fixed.length===0?<Empty title="Ainda não tem gastos fixos" text="Adicione pagamentos como renda, internet ou ginásio." action={()=>{setEditingFixed(null);setModal("fixed")}}/>:<div className="fixed-list">{data.fixed.map(f=><div className="fixed-row" key={f.id}><div className="category-dot" style={{background:data.categories.find(c=>c.name===f.category)?.color}}/><div className="fixed-name"><b>{f.description}</b><span>{f.category} · Dia {f.day} de cada mês · cobrança no ciclo {shortDate(fixedDueDateForPeriod(month,f.day))}</span></div><b>{money(f.amount)}<small> / mês</small></b><span className={`state ${f.active?"active":"paused"}`}>{f.active?"Ativo":"Pausado"}</span><button className="text-button" onClick={()=>{setEditingFixed(f);setModal("fixed")}}>Editar</button><button className="text-button" onClick={()=>setData(d=>({...d,fixed:d.fixed.map(x=>x.id===f.id?{...x,active:!x.active,startDate:today()}:x)}))}>{f.active?"Pausar":"Retomar"}</button><button className="text-button danger-text" onClick={()=>setData(d=>({...d,fixed:d.fixed.filter(x=>x.id!==f.id)}))}>Terminar</button></div>)}</div>}</section>}
      {tab === "Poupança" && <><section className="summary-grid savings-summary"><article className="summary-card"><div className="summary-head"><span>Saldo do cofre</span><i className="summary-icon green">◉</i></div><strong>{money(data.savings+data.goals.reduce((a,g)=>a+g.saved,0))}</strong><div className="summary-foot"><span>Saldo total guardado</span><span className="neutral-pill">Cofre + metas</span></div></article><article className="summary-card"><div className="summary-head"><span>Metas ativas</span><i className="summary-icon purple">◎</i></div><strong>{data.goals.length}</strong><div className="summary-foot"><span>Objetivos em curso</span><button onClick={()=>setModal("goal")}>＋ Nova meta</button></div></article></section><section className="panel list-panel"><div className="panel-heading"><div><h2>As minhas metas</h2><p>Acompanhe o progresso e planeie a próxima conquista.</p></div><button className="button button-primary" onClick={()=>setModal("goal")}>＋ Criar meta</button></div>{data.goals.length===0?<Empty title="Ainda não criou metas" text="Defina um objetivo e veja quanto precisa de poupar por mês." action={()=>setModal("goal")}/>:<div className="goals-grid">{data.goals.map(g=>{const months=Math.max(1,Math.ceil((new Date(g.due).getTime()-effectiveTimestamp)/(30.44*86400000)));const pct=Math.min(100,Math.round(g.saved/g.target*100));return <article className="goal-card" key={g.id}><div className="goal-top"><span className="goal-symbol">✦</span><button className="text-button danger-text" onClick={()=>setData(d=>({...d,goals:d.goals.filter(x=>x.id!==g.id)}))}>Remover</button></div><h3>{g.name}</h3><p>Meta até {new Date(`${g.due}T12:00:00`).toLocaleDateString("pt-PT")}</p><div className="goal-values"><b>{money(g.saved)}</b><span>de {money(g.target)}</span></div><div className="progress-track"><div style={{width:`${pct}%`}}/></div><div className="goal-foot"><span>{pct}% alcançado</span><span>{money(Math.ceil(Math.max(0,g.target-g.saved)/months))}/mês para atingir</span></div><div className="goal-actions"><button className="button button-light" onClick={()=>addToGoal(g)}>＋ Guardar</button><button className="button button-light" onClick={()=>withdrawFromGoal(g)} disabled={g.saved<=0}>− Devolver ao saldo</button></div></article>})}</div>}</section><section className="panel list-panel"><div className="panel-heading"><div><h2>Cofre sem objetivo</h2><p>Guarde dinheiro sem o associar a uma meta.</p></div><span className="coffer-total">{money(data.savings)}</span></div><div className="quick-actions"><button className="button button-primary" onClick={addToCoffer}>＋ Adicionar dinheiro</button><button className="button button-light" onClick={withdrawFromCoffer} disabled={data.savings<=0}>− Devolver ao saldo</button></div></section></>}
      {tab === "Histórico" && <><section className="panel history-panel"><div className="panel-heading"><div><h2>Evolução mensal</h2><p>Despesas e rendimento nos últimos seis ciclos.</p></div><span className="tiny-badge">Últimos 6 ciclos</span></div><HistoryChart expenses={data.expenses} income={data.income} incomeByPeriod={data.incomeByPeriod} payday={data.payday} paydayOverrides={data.paydayOverrides} todayDate={effectiveToday}/></section><section className="panel list-panel"><div className="panel-heading"><div><h2>Resumo do mês selecionado</h2><p>{monthName(month)} · {cycleRange(month, data.payday, data.paydayOverrides)}</p></div></div><div className="history-stats"><div><span>Rendimento</span><b>{money(income)}</b></div><div><span>Despesas</span><b>{money(spending)}</b></div><div><span>Saldo final</span><b className={balance<0?"negative":""}>{money(balance)}</b></div></div><button className="button button-light" onClick={()=>shiftMonth(-1)}>← Mês anterior</button><button className="button button-light" onClick={()=>shiftMonth(1)} disabled={monthOffset >= 0}>Mês seguinte →</button></section></>}
      {tab === "Definições" && <section className="panel list-panel">
        <div className="panel-heading"><div><h2>Preferências</h2><p>Configure o seu rendimento, categorias e aparência.</p></div></div>
        <form className="settings-form" onSubmit={e=>{e.preventDefault();const fd=new FormData(e.currentTarget);setData(d=>({...d,income:Math.round(Number(fd.get("income"))*100),payday:Number(fd.get("payday"))}));showNotice("Preferências guardadas.")}}>
          <label>Rendimento padrão por ciclo (€)<input name="income" type="number" step="0.01" min="0" defaultValue={(data.income/100).toFixed(2)}/></label>
          <label>Dia de recebimento (início do ciclo)<input name="payday" type="number" min="1" max="31" defaultValue={data.payday}/></label>
          <p className="form-hint">O valor padrão aplica-se a todos os ciclos. Ajuste o rendimento de um ciclo específico no cartão de rendimento; os outros ciclos ficam iguais.</p>
          <p className="form-hint">O seu ciclo começa neste dia e termina na véspera do próximo recebimento.</p>
          <button className="button button-primary">Guardar rendimento</button>
        </form>
        <div className="settings-divider"/>
        <div className="panel-heading"><div><h2>Categorias</h2><p>Escolha uma cor ou adicione uma nova categoria.</p></div></div>
        <div className="category-settings">{data.categories.map(c=><label className="category-chip" key={c.name}><input type="color" value={c.color} onChange={e=>setData(d=>({...d,categories:d.categories.map(x=>x.name===c.name?{...x,color:e.target.value}:x)}))}/>{c.name}<button type="button" onClick={()=>setData(d=>({...d,categories:d.categories.filter(x=>x.name!==c.name)}))}>×</button></label>)}</div>
        <button className="button button-light" onClick={()=>{const name=window.prompt("Nome da nova categoria");if(name&&!data.categories.some(c=>c.name===name))setData(d=>({...d,categories:[...d.categories,{name,color:"#829a83"}]}))}}>＋ Adicionar categoria</button>
        <div className="settings-divider"/>
        <label className="toggle-row">Aparência
          <select
            value={data.theme}
            onChange={(event) => {
              const theme = event.target.value;
              if (theme === "system" || theme === "light" || theme === "dark") {
                setData((current) => ({
                  ...current,
                  theme,
                  dark: theme === "dark",
                }));
              }
            }}
          >
            <option value="system">Usar preferência do dispositivo</option>
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
          </select>
        </label>
        <div className="settings-divider"/>
        <div className="panel-heading">
          <div>
            <h2>Telegram</h2>
            <p>Associe esta conta Finleaf ao bot para registar despesas no Telegram.</p>
          </div>
        </div>
        <div className="data-note">
          {telegramBotUrl ? (
            <>
              <p>Abra o bot e envie /start. Depois, siga o link para iniciar sessão e confirmar a associação.</p>
              <a
                className="button button-primary"
                href={telegramBotUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir bot no Telegram ↗
              </a>
            </>
          ) : (
            <p>O bot ainda não está configurado neste site. Defina NEXT_PUBLIC_TELEGRAM_BOT_USERNAME com o nome público do bot e publique novamente.</p>
          )}
        </div>
        <div className="data-note"><b>Sincronização e privacidade</b><p>Os dados financeiros são guardados no Supabase como JSONB, numa linha protegida pelas políticas RLS da sua conta. O envio usa TLS e a encriptação em repouso é gerida pelo Supabase; a app não cifra cada campo. Os dados antigos deste navegador não foram importados nem apagados.</p></div>
      </section>}
      <footer className="footer">Feito para dar mais clareza ao seu dinheiro <span>·</span> Finleaf</footer>
    </div></section>
    {modal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget){setModal("");setEditing(null);setEditingFixed(null)}}}><section className="modal"><div className="modal-heading"><div><span className="muted-label">FINLEAF</span><h2>{modal==="expense"?(editing?"Editar movimento":"Novo movimento"):modal==="fixed"?(editingFixed?"Editar gasto fixo":"Novo gasto fixo"):modal==="goal"?"Nova meta de poupança":"Rendimento do ciclo"}</h2></div><button className="close-button" onClick={()=>{setModal("");setEditing(null);setEditingFixed(null)}}>×</button></div>
      {modal==="expense"&&<form onSubmit={saveExpense} className="modal-form"><label>Tipo de movimento<select name="type" defaultValue={editing?.type||"expense"}><option value="expense">Despesa</option><option value="income">Entrada ou reembolso</option></select></label><div className="form-row"><label>Valor (€)<input name="amount" type="number" step="0.01" min="0.01" required defaultValue={editing?(editing.amount/100).toFixed(2):""}/></label><label>Data<input name="date" type="date" required defaultValue={editing?.date||today()}/></label></div><label>Descrição<input name="description" placeholder="Ex.: Supermercado" required defaultValue={editing?.description||""}/></label><label>Categoria<select name="category" defaultValue={editing?.category||data.categories[0]?.name}>{data.categories.map(c=><option key={c.name}>{c.name}</option>)}</select></label><label>Nota (opcional)<textarea name="note" rows={2} placeholder="Adicione um detalhe" defaultValue={editing?.note||""}/></label><div className="modal-actions"><button type="button" className="button button-light" onClick={()=>{setModal("");setEditing(null)}}>Cancelar</button><button className="button button-primary">Guardar movimento</button></div></form>}
      {modal==="fixed"&&<form key={editingFixed?.id ?? "new-fixed"} onSubmit={saveFixed} className="modal-form"><label>Descrição<input name="description" placeholder="Ex.: Internet" required defaultValue={editingFixed?.description ?? ""}/></label><div className="form-row"><label>Valor mensal (€)<input name="amount" type="number" step="0.01" min="0.01" required defaultValue={editingFixed ? (editingFixed.amount/100).toFixed(2) : ""}/></label><label>Dia de cobrança<input name="day" type="number" min="1" max="31" defaultValue={editingFixed?.day ?? 1} required/></label></div><label>Categoria<select name="category" defaultValue={editingFixed?.category ?? data.categories[0]?.name}>{data.categories.map(c=><option key={c.name}>{c.name}</option>)}</select></label><p className="form-hint">A app regista o movimento na data indicada quando está aberta ou é reaberta após o vencimento. O valor reduz o saldo disponível. Os dias 29–31 ajustam-se ao último dia do mês quando necessário.</p><div className="modal-actions"><button type="button" className="button button-light" onClick={()=>{setModal("");setEditingFixed(null)}}>Cancelar</button><button className="button button-primary">{editingFixed?"Guardar alterações":"Criar gasto fixo"}</button></div></form>}
      {modal==="goal"&&<form onSubmit={saveGoal} className="modal-form"><label>Nome da meta<input name="name" placeholder="Ex.: Viagem de verão" required/></label><div className="form-row"><label>Valor alvo (€)<input name="target" type="number" step="0.01" min="0.01" required/></label><label>Data limite<input name="due" type="date" min={today()} required/></label></div><div className="modal-actions"><button type="button" className="button button-light" onClick={()=>setModal("")}>Cancelar</button><button className="button button-primary">Criar meta</button></div></form>}
      {modal==="income"&&<form className="modal-form" onSubmit={saveIncome}>
        <p className="form-hint">Ajuste o rendimento e a data real de recebimento deste ciclo. Os outros ciclos não serão alterados.</p>
        <label>Rendimento deste ciclo (€)<input name="amount" type="number" step="0.01" min="0" defaultValue={(basePeriodIncome/100).toFixed(2)} required/></label>
        <label>Data em que recebeu<input name="receivedDate" type="date" min={month} max={maxReceivedDate} defaultValue={defaultReceivedDate} required/></label>
        <label>Rendimento extra (€)<input name="extra" type="number" step="0.01" min="0" defaultValue="0"/></label>
        <label>Data do rendimento extra<input name="date" type="date" min={month} max={cycleEnd} defaultValue={defaultCycleDate} required/></label>
        <div className="modal-actions">
          <button type="button" className="button button-light" onClick={()=>{setData(d=>{const incomeByPeriod={...(d.incomeByPeriod||{})};delete incomeByPeriod[defaultReceivedDate];return {...d,incomeByPeriod}});setModal("");showNotice("Este ciclo voltou a usar o rendimento padrão.")}}>Usar padrão</button>
          <button type="button" className="button button-light" onClick={()=>setModal("")}>Cancelar</button>
          <button className="button button-primary">Guardar ciclo</button>
        </div>
      </form>}
    </section></div>}{notice&&<div className="toast">✓ {notice}</div>}
  </main>;
}

function Empty({ title, text, action }: { title: string; text: string; action: () => void }) { return <div className="empty-state"><span>✦</span><b>{title}</b><p>{text}</p><button className="button button-primary" onClick={action}>＋ Adicionar</button></div>; }
function ExpenseTable({ expenses, categories, onEdit, onDelete }: { expenses: Expense[]; categories: Category[]; onEdit: (e:Expense)=>void; onDelete:(id:string)=>void }) {
  return <div className="table-wrap"><table><thead><tr><th>DESCRIÇÃO</th><th>CATEGORIA</th><th>DATA</th><th>TIPO</th><th className="align-right">VALOR</th><th>AÇÕES</th></tr></thead><tbody>{expenses.map((expense) => {
    const isIncoming = expense.type === "income" || expense.transferDirection === "from-savings";
    const isTransfer = expense.type === "transfer";
    const categoryColor = categories.find((category) => category.name === expense.category)?.color || "#999";
    return <tr key={expense.id}>
      <td><div className="transaction-cell"><span className="transaction-icon" style={{color:categoryColor}}>{expense.type==="income"||expense.transferDirection==="from-savings"?"↗":"↘"}</span><div><b>{expense.description}</b>{expense.note&&<small>{expense.note}</small>}</div></div></td>
      <td><span className="category-label"><i style={{background:categoryColor}}/>{expense.category || "Sem categoria"}</span></td>
      <td>{new Date(`${expense.date}T12:00:00`).toLocaleDateString("pt-PT")}</td>
      <td><span className={`type-pill ${expense.type}`}>{expense.type==="income"?"Entrada":isTransfer?"Transferência":"Despesa"}</span></td>
      <td className={`align-right amount-cell ${isIncoming?"income-amount":""}`}>{isIncoming?"+":"−"}{money(expense.amount)}</td>
      <td>{isTransfer
        ? <span className="row-action-static">Transferência interna</span>
        : <div className="row-actions"><button className="edit-action" aria-label={`Editar ${expense.description}`} title={`Editar ${expense.description}`} onClick={()=>onEdit(expense)}>✎ Editar</button><button className="delete-action" aria-label={`Apagar ${expense.description}`} title={`Apagar ${expense.description}`} onClick={()=>onDelete(expense.id)}>× Apagar</button></div>}
      </td>
    </tr>;
  })}</tbody></table>{expenses.length===0&&<div className="empty-inline">Ainda não há movimentos para apresentar.</div>}</div>;
}
function HistoryChart({
  expenses,
  income,
  incomeByPeriod,
  payday,
  paydayOverrides,
  todayDate,
}: {
  expenses: Expense[];
  income: number;
  incomeByPeriod?: Record<string, number>;
  payday: number;
  paydayOverrides?: Record<string, string>;
  todayDate: string;
}) {
  const months = Array.from(
    { length: 6 },
    (_, index) => periodStartForOffset(todayDate, payday, index - 5, paydayOverrides),
  );
  const vals = months.map((month) => ({
    month,
    income: periodIncome(income, incomeByPeriod, month)
      + expenses.filter((expense) => (
        periodStartForDate(expense.date, payday, paydayOverrides) === month
        && expense.type === "income"
      )).reduce((total, expense) => total + expense.amount, 0),
    spent: expenses.filter((expense) => (
      periodStartForDate(expense.date, payday, paydayOverrides) === month
      && expense.type === "expense"
    )).reduce((total, expense) => total + expense.amount, 0),
  }));
  const max = Math.max(...vals.flatMap((value) => [value.income, value.spent]), 100);

  return <div className="history-chart"><div className="chart-y"><span>{money(max)}</span><span>{money(Math.round(max / 2))}</span><span>0 €</span></div><div className="chart-bars">{vals.map((value) => <div className="month-bars" key={value.month}><div className="bar-area"><div className={`bar spent ${value.spent > value.income ? "over" : ""}`} style={{ height: `${Math.max(2, value.spent / max * 100)}%` }} title={`Gasto ${money(value.spent)}`} /><div className="bar budget" style={{ height: `${Math.max(2, value.income / max * 100)}%` }} title={`Rendimento ${money(value.income)}`} /></div><span>{new Intl.DateTimeFormat("pt-PT", { month: "short" }).format(new Date(`${value.month}T12:00:00`))}</span></div>)}</div><div className="chart-legend"><span><i className="spent-key" />Gastos</span><span><i className="budget-key" />Rendimento</span></div></div>;
}

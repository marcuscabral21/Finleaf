"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { signOut } from "./auth/actions";
import { FinleafLogo } from "@/components/finleaf-logo";

type Category = { name: string; color: string };
type Expense = { id: string; description: string; amount: number; date: string; category: string; note: string; type: "expense" | "income"; recurring?: boolean };
type Fixed = { id: string; description: string; amount: number; category: string; day: number; active: boolean; next?: string };
type Goal = { id: string; name: string; target: number; due: string; saved: number; moves?: { month: string; amount: number }[] };
type Data = { income: number; payday: number; categories: Category[]; expenses: Expense[]; fixed: Fixed[]; goals: Goal[]; savings: number; dark: boolean };

const initial: Data = {
  income: 0, payday: 25, savings: 0, dark: false,
  categories: [
    { name: "Alimentação", color: "#7a9c70" }, { name: "Compras", color: "#d7a16c" },
    { name: "Saúde", color: "#d17872" }, { name: "Entretenimento", color: "#8576b7" },
    { name: "Casa", color: "#5e9eaa" }, { name: "Transportes", color: "#d0b85b" },
    { name: "Subscrições", color: "#cf7da0" }, { name: "Educação", color: "#718ac1" },
    { name: "Lazer", color: "#6aa88e" }, { name: "Outros", color: "#9b9b91" },
  ], expenses: [], fixed: [], goals: [],
};
const monthKey = (date: string) => date.slice(0, 7);
const money = (cents: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);
const newId = () => Math.random().toString(36).slice(2, 10);
const monthName = (month: string) => new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" }).format(new Date(`${month}-02T12:00:00`));
const getEmptySnapshot = () => "";

function Donut({ values, categories, total }: { values: Record<string, number>; categories: Category[]; total: number }) {
  const slices = categories.map((c) => ({ ...c, value: values[c.name] || 0 })).filter((c) => c.value > 0);
  const circumference = 2 * Math.PI * 42;
  let offset = 0;

  return (
    <div className="donut">
      <svg
        aria-label={`Despesas por categoria, total ${money(total)}`}
        className="donut-chart"
        role="img"
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
                cx="50"
                cy="50"
                r="42"
                stroke={slice.color}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-dashOffset}
              />
            );
          })}
      </svg>
      <div className="donut-hole">
        <b>{money(total)}</b>
        <span>gasto total</span>
      </div>
    </div>
  );
}

export default function DashboardClient({
  userEmail,
  userId,
  todayDate,
  currentTimestamp,
}: {
  userEmail: string;
  userId: string;
  todayDate: string;
  currentTimestamp: number;
}) {
  const displayName = userEmail.split("@")[0] || "Utilizador";
  const avatarInitial = displayName.slice(0, 1).toUpperCase() || "U";
  const storageKey = `finleaf-v1:${userId}`;
  const today = () => todayDate;
  const subscribe = useCallback((onStoreChange: () => void) => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) onStoreChange();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("finleaf-local-storage", onStoreChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("finleaf-local-storage", onStoreChange);
    };
  }, [storageKey]);
  const getSnapshot = useCallback(
    () => window.localStorage.getItem(storageKey) ?? "",
    [storageKey],
  );
  const storedData = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getEmptySnapshot,
  );
  const data = useMemo(
    () => storedData ? { ...initial, ...JSON.parse(storedData) } as Data : initial,
    [storedData],
  );
  const setData = (update: React.SetStateAction<Data>) => {
    const nextData = typeof update === "function" ? update(data) : update;
    window.localStorage.setItem(storageKey, JSON.stringify(nextData));
    window.dispatchEvent(new Event("finleaf-local-storage"));
  };
  const [month, setMonth] = useState(todayDate.slice(0, 7));
  const [tab, setTab] = useState("Visão geral");
  const [modal, setModal] = useState("");
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [notice, setNotice] = useState("");
  const monthExpenses = useMemo(() => data.expenses.filter((e) => monthKey(e.date) === month), [data.expenses, month]);
  const spending = monthExpenses.filter((e) => e.type === "expense").reduce((a, e) => a + e.amount, 0);
  const extras = monthExpenses.filter((e) => e.type === "income").reduce((a, e) => a + e.amount, 0);
  const fixedEntries = monthExpenses.filter((e) => e.type === "expense" && e.recurring);
  const fixedTotal = fixedEntries.length
    ? fixedEntries.reduce((a, e) => a + e.amount, 0)
    : data.fixed.filter((f) => f.active).reduce((a, f) => a + f.amount, 0);
  const income = data.income + extras;
  const monthSavings = data.goals.reduce((total, goal) => total + (goal.moves || []).filter((move) => move.month === month).reduce((sum, move) => sum + move.amount, 0), 0);
  const balance = income - spending - monthSavings;
  const byCategory = Object.fromEntries(data.categories.map((c) => [c.name, monthExpenses.filter((e) => e.category === c.name && e.type === "expense").reduce((a, e) => a + e.amount, 0)]));
  const showNotice = (s: string) => { setNotice(s); window.setTimeout(() => setNotice(""), 3000); };
  const saveExpense = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const fd = new FormData(event.currentTarget); const amount = Math.round(Number(fd.get("amount")) * 100);
    const entry: Expense = { id: editing?.id || newId(), description: String(fd.get("description")).trim(), amount, date: String(fd.get("date")), category: String(fd.get("category")), note: String(fd.get("note") || ""), type: fd.get("type") === "income" ? "income" : "expense" };
    setData((d) => ({ ...d, expenses: editing ? d.expenses.map((e) => e.id === editing.id ? entry : e) : [entry, ...d.expenses] })); setModal(""); setEditing(null); showNotice(editing ? "Movimento atualizado." : "Movimento registado.");
  };
  const saveFixed = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const fd = new FormData(event.currentTarget); const item: Fixed = { id: newId(), description: String(fd.get("description")), amount: Math.round(Number(fd.get("amount")) * 100), category: String(fd.get("category")), day: Number(fd.get("day")), active: true }; setData((d) => ({ ...d, fixed: [item, ...d.fixed] })); setModal(""); showNotice("Gasto fixo criado."); };
  const saveGoal = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const fd = new FormData(event.currentTarget); const item: Goal = { id: newId(), name: String(fd.get("name")), target: Math.round(Number(fd.get("target")) * 100), due: String(fd.get("due")), saved: 0 }; setData((d) => ({ ...d, goals: [item, ...d.goals] })); setModal(""); showNotice("Meta de poupança criada."); };
  const filtered = monthExpenses.filter((e) => (!filter || e.category === filter) && (!search || `${e.description} ${e.note}`.toLowerCase().includes(search.toLowerCase()))).sort((a,b) => b.date.localeCompare(a.date));
  const shiftMonth = (n: number) => { const dt = new Date(`${month}-02T12:00:00`); dt.setMonth(dt.getMonth() + n); setMonth(dt.toISOString().slice(0, 7)); };
  const nav = ["Visão geral", "Movimentos", "Gastos fixos", "Poupança", "Histórico", "Definições"];
  const createMonthlyFixed = () => { const due = data.fixed.filter((f) => f.active && !monthExpenses.some((e) => e.recurring && e.description === f.description)); if (!due.length) return showNotice("Os gastos fixos deste mês já foram lançados."); const created = due.map((f) => ({ id: newId(), description: f.description, amount: f.amount, date: `${month}-${String(Math.min(f.day, new Date(Number(month.slice(0,4)), Number(month.slice(5,7)), 0).getDate())).padStart(2,"0")}`, category: f.category, note: "Lançamento recorrente", type: "expense" as const, recurring: true })); setData((d) => ({ ...d, expenses: [...created, ...d.expenses] })); showNotice(`${created.length} gasto(s) fixo(s) lançado(s).`); };
  const addToGoal = (goal: Goal) => { const raw = window.prompt(`Quanto quer transferir para “${goal.name}”? (€)`); if (!raw) return; const value = Math.round(Number(raw.replace(",", ".")) * 100); if (!Number.isFinite(value) || value <= 0 || value > balance) return showNotice("Indique um valor válido dentro do saldo disponível."); setData((d) => ({ ...d, goals: d.goals.map((g) => g.id === goal.id ? { ...g, saved: g.saved + value, moves: [...(g.moves || []), { month, amount: value }] } : g) })); showNotice("Transferência para a meta concluída."); };

  return <main className={`app ${data.dark ? "dark" : ""}`}>
    <aside className="sidebar"><Link className="brand" href="/"><FinleafLogo appearance={data.dark ? "dark" : "light"} /><span className="brand-caption">FINANÇAS PESSOAIS</span></Link>
      <div className="nav-label">MENU PRINCIPAL</div><nav>{nav.map((n, i) => <button key={n} className={`nav-item ${tab === n ? "selected" : ""}`} onClick={() => setTab(n)}><span className="nav-icon">{["◫","↕","↻","◉","▥","⚙"][i]}</span>{n}{n === "Movimentos" && <span className="nav-count">{monthExpenses.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon">✦</div><b>Um passo de cada vez.</b><p>Pequenos hábitos criam grandes mudanças.</p></div><div className="profile"><div className="avatar">{avatarInitial}</div><div><b>{displayName}</b><small>{userEmail}</small></div></div></div>
    </aside>
    <section className="main-area"><header className="topbar"><div><div className="breadcrumb">Finleaf <span>/</span> {tab}</div><h1>{tab === "Visão geral" ? `Bom dia, ${displayName}` : tab}</h1></div><div className="header-actions"><button className="icon-button" title="Notificações" onClick={() => showNotice("Não há notificações novas.")}>♧</button><form action={signOut}><button className="logout-button" type="submit">Terminar sessão</button></form></div></header>
    <div className="content">
      <div className="month-row"><div><span className="muted-label">O SEU MÊS</span><div className="month-select"><button onClick={() => shiftMonth(-1)} aria-label="Mês anterior">‹</button><b>{monthName(month)}</b><button onClick={() => shiftMonth(1)} aria-label="Mês seguinte">›</button></div></div><div className="quick-actions"><button className="button button-light" onClick={() => { setEditing(null); setModal("expense"); }}>＋ Novo movimento</button><button className="button button-primary" onClick={() => setModal("fixed")}>＋ Gasto fixo</button></div></div>
      {(tab === "Visão geral" || tab === "Histórico") && <><section className="summary-grid">
        <article className="summary-card"><div className="summary-head"><span>Rendimento mensal</span><i className="summary-icon green">↗</i></div><strong>{money(income)}</strong><div className="summary-foot"><span>Recebimento dia {data.payday}</span><button onClick={() => setModal("income")}>Editar</button></div></article>
        <article className="summary-card"><div className="summary-head"><span>Total gasto</span><i className="summary-icon orange">↙</i></div><strong>{money(spending)}</strong><div className="summary-foot"><span>{monthExpenses.filter(e=>e.type==="expense").length} despesas este mês</span><span className="neutral-pill">{income ? Math.round(spending/income*100) : 0}% do rendimento</span></div></article>
        <article className="summary-card"><div className="summary-head"><span>Gastos fixos</span><i className="summary-icon purple">↻</i></div><strong>{money(fixedTotal)}</strong><div className="summary-foot"><span>{data.fixed.filter(f=>f.active).length} recorrências ativas</span><button onClick={createMonthlyFixed}>Lançar mês</button></div></article>
        <article className="summary-card balance-card"><div className="summary-head"><span>Saldo disponível</span><i className="summary-icon white">◎</i></div><strong>{money(balance)}</strong><div className="summary-foot"><span>Após despesas e poupança</span><span className="positive-pill">{balance < 0 ? "Acima do orçamento" : "Dentro do orçamento"}</span></div></article>
        <article className="summary-card"><div className="summary-head"><span>Poupança do mês</span><i className="summary-icon green">✦</i></div><strong>{money(monthSavings)}</strong><div className="summary-foot"><span>Transferido para metas</span><button onClick={() => setTab("Poupança")}>Ver metas</button></div></article>
      </section>
      <div className="dashboard-grid"><section className="panel spending-panel"><div className="panel-heading"><div><h2>Despesas por categoria</h2><p>Distribuição dos seus gastos neste mês</p></div><button className="more-button" onClick={() => setTab("Movimentos")}>Ver movimentos ↗</button></div><div className="chart-layout"><Donut values={byCategory} categories={data.categories} total={spending}/><div className="legend">{data.categories.filter(c=>byCategory[c.name]>0).slice(0,7).map(c=><div className="legend-row" key={c.name}><i style={{background:c.color}}/><span>{c.name}</span><b>{money(byCategory[c.name])}</b><small>{spending?Math.round(byCategory[c.name]/spending*100):0}%</small></div>)}{spending===0&&<p className="empty-copy">Registe despesas para ver a distribuição por categoria.</p>}</div></div></section>
       <section className="panel budget-panel"><div className="panel-heading"><div><h2>Resumo do orçamento</h2><p>Como está a correr o seu mês</p></div><span className="tiny-badge">{monthName(month).split(" ")[0]}</span></div><div className="budget-number"><strong>{money(Math.max(0,balance))}</strong><span>disponível</span></div><div className="progress-track"><div style={{width:`${Math.min(100,income?spending/income*100:0)}%`}}/></div><div className="budget-ends"><span>Gasto {money(spending)}</span><span>Orçamento {money(income)}</span></div><div className="budget-tip"><span>✦</span><p>{balance < 0 ? "O gasto ultrapassou o rendimento deste mês. Reveja os movimentos." : "Está a acompanhar bem as suas despesas. Continue assim!"}</p></div><button className="full-link" onClick={() => setTab("Histórico")}>Consultar histórico <span>→</span></button></section></div>
       <section className="panel recent-panel"><div className="panel-heading"><div><h2>Movimentos recentes</h2><p>As últimas operações registadas</p></div><button className="more-button" onClick={() => setTab("Movimentos")}>Ver todos ↗</button></div><ExpenseTable expenses={monthExpenses.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5)} categories={data.categories} onEdit={(e)=>{setEditing(e);setModal("expense")}} onDelete={(id)=>setData(d=>({...d,expenses:d.expenses.filter(e=>e.id!==id)}))}/></section>
      </>}
      {tab === "Movimentos" && <section className="panel list-panel"><div className="panel-heading"><div><h2>Todos os movimentos</h2><p>Consulte, filtre e atualize as suas despesas e entradas.</p></div><button className="button button-primary" onClick={()=>{setEditing(null);setModal("expense")}}>＋ Novo movimento</button></div><div className="filters"><input placeholder="Pesquisar descrição ou nota…" value={search} onChange={e=>setSearch(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="">Todas as categorias</option>{data.categories.map(c=><option key={c.name}>{c.name}</option>)}</select><button className="button button-light" onClick={()=>{const csv=["data,descricao,tipo,categoria,valor,nota",...filtered.map(e=>`${e.date},${e.description},${e.type},${e.category},${(e.amount/100).toFixed(2)},${e.note}`)].join("\n"); const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv"}));a.download=`finleaf-${month}.csv`;a.click();URL.revokeObjectURL(a.href);}}>Exportar CSV ↓</button></div><ExpenseTable expenses={filtered} categories={data.categories} onEdit={(e)=>{setEditing(e);setModal("expense")}} onDelete={(id)=>setData(d=>({...d,expenses:d.expenses.filter(e=>e.id!==id)}))}/></section>}
      {tab === "Gastos fixos" && <section className="panel list-panel"><div className="panel-heading"><div><h2>Gastos recorrentes</h2><p>Pagamentos regulares e respetivo dia de cobrança.</p></div><div className="quick-actions"><button className="button button-light" onClick={createMonthlyFixed}>Lançar os deste mês</button><button className="button button-primary" onClick={()=>setModal("fixed")}>＋ Novo gasto fixo</button></div></div>{data.fixed.length===0?<Empty title="Ainda não tem gastos fixos" text="Adicione pagamentos como renda, internet ou ginásio." action={()=>setModal("fixed")}/>:<div className="fixed-list">{data.fixed.map(f=><div className="fixed-row" key={f.id}><div className="category-dot" style={{background:data.categories.find(c=>c.name===f.category)?.color}}/><div className="fixed-name"><b>{f.description}</b><span>{f.category} · Cobrança dia {f.day}</span></div><b>{money(f.amount)}<small> / mês</small></b><span className={`state ${f.active?"active":"paused"}`}>{f.active?"Ativo":"Pausado"}</span><button className="text-button" onClick={()=>setData(d=>({...d,fixed:d.fixed.map(x=>x.id===f.id?{...x,active:!x.active}:x)}))}>{f.active?"Pausar":"Retomar"}</button><button className="text-button danger-text" onClick={()=>setData(d=>({...d,fixed:d.fixed.filter(x=>x.id!==f.id)}))}>Terminar</button></div>)}</div>}</section>}
      {tab === "Poupança" && <><section className="summary-grid savings-summary"><article className="summary-card"><div className="summary-head"><span>Saldo do cofre</span><i className="summary-icon green">◉</i></div><strong>{money(data.savings+data.goals.reduce((a,g)=>a+g.saved,0))}</strong><div className="summary-foot"><span>Poupança acumulada</span><button onClick={()=>{const v=window.prompt("Montante a guardar (€)");if(v){const n=Math.round(Number(v.replace(",","."))*100);if(n>0&&n<=balance){setData(d=>({...d,savings:d.savings+n}));showNotice("Montante enviado para o cofre.")}else showNotice("Montante inválido ou superior ao saldo disponível.")}}}>＋ Guardar</button></div></article><article className="summary-card"><div className="summary-head"><span>Metas ativas</span><i className="summary-icon purple">◎</i></div><strong>{data.goals.length}</strong><div className="summary-foot"><span>Objetivos em curso</span><button onClick={()=>setModal("goal")}>＋ Nova meta</button></div></article></section><section className="panel list-panel"><div className="panel-heading"><div><h2>As minhas metas</h2><p>Acompanhe o progresso e planeie a próxima conquista.</p></div><button className="button button-primary" onClick={()=>setModal("goal")}>＋ Criar meta</button></div>{data.goals.length===0?<Empty title="Ainda não criou metas" text="Defina um objetivo e veja quanto precisa de poupar por mês." action={()=>setModal("goal")}/>:<div className="goals-grid">{data.goals.map(g=>{const months=Math.max(1,Math.ceil((new Date(g.due).getTime()-currentTimestamp)/(30.44*86400000)));const pct=Math.min(100,Math.round(g.saved/g.target*100));return <article className="goal-card" key={g.id}><div className="goal-top"><span className="goal-symbol">✦</span><button className="text-button danger-text" onClick={()=>setData(d=>({...d,goals:d.goals.filter(x=>x.id!==g.id)}))}>Remover</button></div><h3>{g.name}</h3><p>Meta até {new Date(`${g.due}T12:00:00`).toLocaleDateString("pt-PT")}</p><div className="goal-values"><b>{money(g.saved)}</b><span>de {money(g.target)}</span></div><div className="progress-track"><div style={{width:`${pct}%`}}/></div><div className="goal-foot"><span>{pct}% alcançado</span><span>{money(Math.ceil(Math.max(0,g.target-g.saved)/months))}/mês para atingir</span></div><button className="button button-light full-button" onClick={()=>addToGoal(g)}>Transferir do saldo</button></article>})}</div>}</section><section className="panel list-panel"><div className="panel-heading"><div><h2>Cofre sem objetivo</h2><p>Dinheiro guardado sem uma meta específica.</p></div><span className="coffer-total">{money(data.savings)}</span></div><button className="button button-light" onClick={()=>{const v=window.prompt("Montante a retirar do cofre (€)");if(v){const n=Math.round(Number(v.replace(",","."))*100);if(n>0&&n<=data.savings){setData(d=>({...d,savings:d.savings-n}));showNotice("Levantamento registado.")}else showNotice("Montante inválido.")}}}>− Levantar do cofre</button></section></>}
      {tab === "Histórico" && <><section className="panel history-panel"><div className="panel-heading"><div><h2>Evolução mensal</h2><p>Despesas e rendimento nos últimos seis meses.</p></div><span className="tiny-badge">Últimos 6 meses</span></div><HistoryChart expenses={data.expenses} income={data.income}/></section><section className="panel list-panel"><div className="panel-heading"><div><h2>Resumo do mês selecionado</h2><p>{monthName(month)}</p></div></div><div className="history-stats"><div><span>Rendimento</span><b>{money(income)}</b></div><div><span>Despesas</span><b>{money(spending)}</b></div><div><span>Saldo final</span><b className={balance<0?"negative":""}>{money(balance)}</b></div></div><button className="button button-light" onClick={()=>shiftMonth(-1)}>← Mês anterior</button><button className="button button-light" onClick={()=>shiftMonth(1)}>Mês seguinte →</button></section></>}
      {tab === "Definições" && <section className="panel list-panel"><div className="panel-heading"><div><h2>Preferências</h2><p>Configure o seu rendimento, categorias e aparência.</p></div></div><form className="settings-form" onSubmit={e=>{e.preventDefault();const fd=new FormData(e.currentTarget);setData(d=>({...d,income:Math.round(Number(fd.get("income"))*100),payday:Number(fd.get("payday"))}));showNotice("Preferências guardadas.")}}><label>Rendimento mensal padrão (€)<input name="income" type="number" step="0.01" min="0" defaultValue={(data.income/100).toFixed(2)}/></label><label>Dia de recebimento<input name="payday" type="number" min="1" max="31" defaultValue={data.payday}/></label><button className="button button-primary">Guardar rendimento</button></form><div className="settings-divider"/><div className="panel-heading"><div><h2>Categorias</h2><p>Escolha uma cor ou adicione uma nova categoria.</p></div></div><div className="category-settings">{data.categories.map(c=><label className="category-chip" key={c.name}><input type="color" value={c.color} onChange={e=>setData(d=>({...d,categories:d.categories.map(x=>x.name===c.name?{...x,color:e.target.value}:x)}))}/>{c.name}<button type="button" onClick={()=>setData(d=>({...d,categories:d.categories.filter(x=>x.name!==c.name)}))}>×</button></label>)}</div><button className="button button-light" onClick={()=>{const name=window.prompt("Nome da nova categoria");if(name&&!data.categories.some(c=>c.name===name))setData(d=>({...d,categories:[...d.categories,{name,color:"#829a83"}]}))}}>＋ Adicionar categoria</button><div className="settings-divider"/><label className="toggle-row">Modo escuro <input type="checkbox" checked={data.dark} onChange={e=>setData(d=>({...d,dark:e.target.checked}))}/></label><div className="data-note"><b>Dados neste dispositivo</b><p>Os dados desta versão são guardados localmente neste navegador. Para sincronizar com outros dispositivos, ligue o projeto a um backend e configure a autenticação.</p></div></section>}
      <footer className="footer">Feito para dar mais clareza ao seu dinheiro <span>·</span> Finleaf</footer>
    </div></section>
    {modal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget){setModal("");setEditing(null)}}}><section className="modal"><div className="modal-heading"><div><span className="muted-label">FINLEAF</span><h2>{modal==="expense"?(editing?"Editar movimento":"Novo movimento"):modal==="fixed"?"Novo gasto fixo":modal==="goal"?"Nova meta de poupança":"Rendimento do mês"}</h2></div><button className="close-button" onClick={()=>{setModal("");setEditing(null)}}>×</button></div>
      {modal==="expense"&&<form onSubmit={saveExpense} className="modal-form"><label>Tipo de movimento<select name="type" defaultValue={editing?.type||"expense"}><option value="expense">Despesa</option><option value="income">Entrada ou reembolso</option></select></label><div className="form-row"><label>Valor (€)<input name="amount" type="number" step="0.01" min="0.01" required defaultValue={editing?(editing.amount/100).toFixed(2):""}/></label><label>Data<input name="date" type="date" required defaultValue={editing?.date||today()}/></label></div><label>Descrição<input name="description" placeholder="Ex.: Supermercado" required defaultValue={editing?.description||""}/></label><label>Categoria<select name="category" defaultValue={editing?.category||data.categories[0]?.name}>{data.categories.map(c=><option key={c.name}>{c.name}</option>)}</select></label><label>Nota (opcional)<textarea name="note" rows={2} placeholder="Adicione um detalhe" defaultValue={editing?.note||""}/></label><div className="modal-actions"><button type="button" className="button button-light" onClick={()=>{setModal("");setEditing(null)}}>Cancelar</button><button className="button button-primary">Guardar movimento</button></div></form>}
      {modal==="fixed"&&<form onSubmit={saveFixed} className="modal-form"><label>Descrição<input name="description" placeholder="Ex.: Internet" required/></label><div className="form-row"><label>Valor mensal (€)<input name="amount" type="number" step="0.01" min="0.01" required/></label><label>Dia de cobrança<input name="day" type="number" min="1" max="31" defaultValue="1" required/></label></div><label>Categoria<select name="category">{data.categories.map(c=><option key={c.name}>{c.name}</option>)}</select></label><p className="form-hint">Pode lançar os gastos fixos do mês na página inicial. Os dias 29–31 ajustam-se ao último dia de cada mês.</p><div className="modal-actions"><button type="button" className="button button-light" onClick={()=>setModal("")}>Cancelar</button><button className="button button-primary">Criar gasto fixo</button></div></form>}
      {modal==="goal"&&<form onSubmit={saveGoal} className="modal-form"><label>Nome da meta<input name="name" placeholder="Ex.: Viagem de verão" required/></label><div className="form-row"><label>Valor alvo (€)<input name="target" type="number" step="0.01" min="0.01" required/></label><label>Data limite<input name="due" type="date" min={today()} required/></label></div><div className="modal-actions"><button type="button" className="button button-light" onClick={()=>setModal("")}>Cancelar</button><button className="button button-primary">Criar meta</button></div></form>}
      {modal==="income"&&<form className="modal-form" onSubmit={e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const amount=Math.round(Number(fd.get("amount"))*100);const day=Number(fd.get("day"));const key=month;setData(d=>({...d,income:amount,payday:day,expenses:d.expenses.filter(x=>!(x.category==="Outros"&&x.description==="Ajuste de rendimento"&&monthKey(x.date)===key))}));const bonus=Math.round(Number(fd.get("extra"))*100);if(bonus>0)setData(d=>({...d,expenses:[{id:newId(),description:"Rendimento extra",amount:bonus,date:String(fd.get("date")||today()),category:"Outros",note:"Rendimento extra do mês",type:"income"},...d.expenses]}));setModal("");showNotice("Rendimento do mês atualizado.")}}><label>Ordenado deste mês (€)<input name="amount" type="number" step="0.01" min="0" defaultValue={(data.income/100).toFixed(2)} required/></label><div className="form-row"><label>Dia de recebimento<input name="day" type="number" min="1" max="31" defaultValue={data.payday}/></label><label>Rendimento extra (€)<input name="extra" type="number" step="0.01" min="0" defaultValue="0"/></label></div><label>Data do rendimento extra<input name="date" type="date" defaultValue={today()}/></label><div className="modal-actions"><button type="button" className="button button-light" onClick={()=>setModal("")}>Cancelar</button><button className="button button-primary">Guardar rendimento</button></div></form>}
    </section></div>}{notice&&<div className="toast">✓ {notice}</div>}
  </main>;
}

function Empty({ title, text, action }: { title: string; text: string; action: () => void }) { return <div className="empty-state"><span>✦</span><b>{title}</b><p>{text}</p><button className="button button-primary" onClick={action}>＋ Adicionar</button></div>; }
function ExpenseTable({ expenses, categories, onEdit, onDelete }: { expenses: Expense[]; categories: Category[]; onEdit: (e:Expense)=>void; onDelete:(id:string)=>void }) { return <div className="table-wrap"><table><thead><tr><th>DESCRIÇÃO</th><th>CATEGORIA</th><th>DATA</th><th>TIPO</th><th className="align-right">VALOR</th><th/></tr></thead><tbody>{expenses.map(e=><tr key={e.id}><td><div className="transaction-cell"><span className="transaction-icon" style={{color:categories.find(c=>c.name===e.category)?.color}}>{e.type==="income"?"↗":"↘"}</span><div><b>{e.description}</b>{e.note&&<small>{e.note}</small>}</div></div></td><td><span className="category-label"><i style={{background:categories.find(c=>c.name===e.category)?.color||"#999"}}/>{e.category}</span></td><td>{new Date(`${e.date}T12:00:00`).toLocaleDateString("pt-PT")}</td><td><span className={`type-pill ${e.type}`}>{e.type==="income"?"Entrada":"Despesa"}</span></td><td className={`align-right amount-cell ${e.type==="income"?"income-amount":""}`}>{e.type==="income"?"+":"−"}{money(e.amount)}</td><td><div className="row-actions"><button title="Editar" onClick={()=>onEdit(e)}>✎</button><button title="Apagar" onClick={()=>onDelete(e.id)}>×</button></div></td></tr>)}</tbody></table>{expenses.length===0&&<div className="empty-inline">Ainda não há movimentos para apresentar.</div>}</div>; }
function HistoryChart({ expenses, income }: {expenses:Expense[];income:number}) { const months=Array.from({length:6},(_,i)=>{const d=new Date();d.setDate(2);d.setMonth(d.getMonth()-5+i);return d.toISOString().slice(0,7)});const vals=months.map(m=>({month:m,spent:expenses.filter(e=>monthKey(e.date)===m&&e.type==="expense").reduce((a,e)=>a+e.amount,0)}));const max=Math.max(income,...vals.map(v=>v.spent),100);return <div className="history-chart"><div className="chart-y"><span>{money(max)}</span><span>{money(Math.round(max/2))}</span><span>0 €</span></div><div className="chart-bars">{vals.map(v=><div className="month-bars" key={v.month}><div className="bar-area"><div className={`bar spent ${v.spent>income?"over":""}`} style={{height:`${Math.max(2,v.spent/max*100)}%`}} title={`Gasto ${money(v.spent)}`}/><div className="bar budget" style={{height:`${Math.max(2,income/max*100)}%`}} title={`Rendimento ${money(income)}`}/></div><span>{new Intl.DateTimeFormat("pt-PT",{month:"short"}).format(new Date(`${v.month}-02T12:00:00`))}</span></div>)}</div><div className="chart-legend"><span><i className="spent-key"/>Gastos</span><span><i className="budget-key"/>Rendimento mensal</span></div></div>; }

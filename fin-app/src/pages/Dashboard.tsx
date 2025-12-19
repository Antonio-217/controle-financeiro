import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";

import { NewTransactionModal } from "@/components/dashboard/NewTransactionModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LogOut,
  TrendingUp,
  Wallet,
  ShoppingBag,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
  PieChart,
  List as ListIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

// --- Tipos ---
interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category_group: "needs" | "wants" | "savings";
  date: string;
  due_date?: string;
  status?: string;
  created_at: any;
}

const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

// --- Componentes visuais ---
// Card de Resumo (50/30/20)
function SummaryCard({ title, amount, meta, colorClass, icon: Icon }: any) {
  const percent = Math.min((amount / (meta || 1)) * 100, 100);
  const isOver = amount > meta && meta > 0;

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 flex flex-col justify-between min-h-[120px]">
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-xl ${colorClass} bg-opacity-10`}>
          <Icon className={`h-5 w-5 ${colorClass.replace("bg-", "text-")}`} />
        </div>
        <span className="text-xs font-medium text-zinc-400 bg-zinc-50 px-2 py-1 rounded-full">
          {Math.round(percent)}%
        </span>
      </div>
      <div>
        <p className="text-sm text-zinc-500 mb-1">{title}</p>
        <h3 className="text-lg font-bold text-zinc-800">
          {formatMoney(amount)}
        </h3>
        {/* Barra de Progresso */}
        <div className="w-full bg-zinc-100 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className={`h-full rounded-full ${isOver ? 'bg-red-500' : colorClass.replace("bg-", "bg-")}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Card de totais
function TotalCard({ title, value, type }: { title: string, value: number, type: 'income' | 'expense' | 'balance' }) {
  let color = 'text-zinc-800';

  if (type === 'income') color = 'text-emerald-600';
  if (type === 'expense') color = 'text-red-600';
  if (type === 'balance') color = value >= 0 ? 'text-zinc-900' : 'text-red-600';

  return (
    <div className="bg-white border border-zinc-100 p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center gap-1">
      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{title}</span>
      <span className={`text-xl sm:text-2xl font-bold ${color}`}>{formatMoney(value)}</span>
    </div>
  )
}

// Item da Lista
function TransactionItem({ transaction, onEdit, onDelete }: any) {
  const [isAlertOpen, setIsAlertOpen] = useState(false); // Controle do alerta de exclusão
  const isIncome = transaction.type === "income";
  const dateFormatted = new Date(transaction.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });

  // Lógica de Ícones e Cores
  let iconBg = "bg-zinc-100";
  let iconColor = "text-zinc-600";
  let Icon = Wallet;

  if (isIncome) {
    iconBg = "bg-emerald-100";
    iconColor = "text-emerald-600";
    Icon = ArrowUpRight;
  } else {
    switch (transaction.category_group) {
      case 'needs':
        iconBg = "bg-blue-50";
        iconColor = "text-blue-500";
        Icon = Wallet;
        break;
      case 'wants':
        iconBg = "bg-orange-50";
        iconColor = "text-orange-500";
        Icon = ShoppingBag;
        break;
      case 'savings':
        iconBg = "bg-emerald-50";
        iconColor = "text-emerald-500";
        Icon = TrendingUp;
        break;
      default:
        // Saída sem grupo
        iconBg = "bg-red-50";
        iconColor = "text-red-500";
        Icon = ArrowDownLeft;
        break;
    }
  }

  // Lógica para o texto da categoria
  const categoryLabel = () => {
    if (isIncome) return 'Receita';
    if (transaction.category_group === 'needs') return 'Necessidades';
    if (transaction.category_group === 'wants') return 'Estilo de vida';
    if (transaction.category_group === 'savings') return 'Futuro';
    return 'Despesa avulsa';
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-zinc-50 mb-3 hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-center gap-4">
          {/* Ícone */}
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>

          {/* Texto */}
          <div className="flex flex-col">
            <span className="font-semibold text-zinc-800 text-sm sm:text-base">
              {transaction.description}
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              {dateFormatted} • {categoryLabel()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Valor */}
          <span className={`font-bold text-sm sm:text-base ${isIncome ? 'text-emerald-600' : 'text-zinc-800'}`}>
            {isIncome ? '+ ' : '- '}
            {formatMoney(transaction.amount)}
          </span>

          {/* Menu dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-300 hover:text-zinc-600">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onEdit(transaction)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={() => setIsAlertOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Alerta de exclusão */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o lançamento
              <span className="font-bold text-zinc-900"> "{transaction.description}" </span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => onDelete(transaction.id)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Sim, excluir
            </AlertDialogAction>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// --- Componente principal ---
export function Dashboard() {
  const { user, logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [totals, setTotals] = useState({ needs: 0, wants: 0, savings: 0 });

  // Estados de Edição
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Navegação de Data
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Snapshot do Firebase
  useEffect(() => {
    if (!user?.groupId) return;
    setLoading(true);

    // Definir início e fim do mês para o filtro
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Início: primeiro dia do mês
    const startStr = new Date(year, month, 1).toISOString().split('T')[0];
    // Fim: último dia do mês
    const endStr = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const q = query(
      collection(db, "transactions"),
      where("group_id", "==", user.groupId),
      where("date", ">=", startStr),
      where("date", "<=", endStr),
      orderBy("date", "desc"),
      orderBy("created_at", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      setTransactions(data);
      calculateSummaries(data);
      checkNotifications(data);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar transações:", error);
      if (error.message.includes("indexes")) {
        toast.error("Configuração necessária: Verifique o console para criar o índice no Firebase.");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.groupId, currentDate]);

  function calculateSummaries(data: Transaction[]) {
    let totalIncome = 0;
    let totalExpense = 0;
    const currentTotals = { needs: 0, wants: 0, savings: 0 };

    data.forEach(t => {
      if (t.type === "income") {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
        if (currentTotals[t.category_group] !== undefined) {
          currentTotals[t.category_group] += t.amount;
        }
      }
    });
    setIncome(totalIncome);
    setExpense(totalExpense);
    setTotals(currentTotals);
  }

  // Sistema de Notificação de Vencimentos
  const checkNotifications = (data: Transaction[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dueCount = 0;

    data.forEach(t => {
      if (t.type === 'expense' && t.due_date) {
        const due = new Date(t.due_date + "T12:00:00");
        // Diferença em dias
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Se vence hoje ou nos próximos 3 dias
        if (diffDays >= 0 && diffDays <= 3) {
          dueCount++;
        }
      }
    });

    if (dueCount > 0) {
      toast.info(`Atenção: Você tem ${dueCount} contas vencendo em breve!`, {
        duration: 5000,
        icon: <CalendarClock className="w-5 h-5 text-orange-500" />
      });
    }
  };

  async function handleDelete(id: string) {
    if (window.confirm("Excluir lançamento?")) {
      try {
        await deleteDoc(doc(db, "transactions", id));
        toast.success("Lançamento excluído com sucesso.");
      }
      catch (e) {
        toast.error("Erro ao excluir lançamento. Tente novamente.");
      }
    }
  }

  const saldoTotal = income - expense;

  // Dados para o Gráfico
  const chartData = [
    { name: 'Entradas', valor: income, fill: '#10b981' },
    { name: 'Saídas', valor: expense, fill: '#ef4444' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* HEADER */}
      <header className="bg-white pt-8 pb-6 px-6 rounded-b-[2rem] shadow-sm mb-6">
        <div className="max-w-lg mx-auto">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-lg">
                {user?.displayName?.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">Bem-vindo,</p>
                <h2 className="font-bold text-zinc-800">{user?.displayName?.split(" ")[0]}</h2>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => logout()} className="text-zinc-400 hover:text-red-500">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          {/* Seletor de Mês e Saldo */}
          <div className="flex flex-col items-center justify-center">

            <div className="flex items-center gap-4 mb-2 bg-zinc-50 rounded-full p-1 pr-4 pl-1 border border-zinc-100">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white shadow-sm hover:bg-zinc-100" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4 text-zinc-600" />
              </Button>
              <span className="text-sm font-semibold text-zinc-700 w-32 text-center select-none">
                {monthLabel}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white shadow-sm hover:bg-zinc-100" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4 text-zinc-600" />
              </Button>
            </div>

            <p className="text-zinc-500 text-sm mb-1 mt-2">Saldo em {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}</p>
            <h1 className={`text-4xl font-extrabold ${saldoTotal >= 0 ? 'text-zinc-900' : 'text-red-600'}`}>
              {formatMoney(saldoTotal)}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6">

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-zinc-200/50 p-1 rounded-xl">
            <TabsTrigger value="list" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold">
              <ListIcon className="w-4 h-4 mr-2" /> Extrato
            </TabsTrigger>
            <TabsTrigger value="graphics" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold">
              <PieChart className="w-4 h-4 mr-2" /> Relatórios
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: Listagem */}
          <TabsContent value="list" className="space-y-6 animate-in fade-in-50">
            {/* 50/30/20 Resumo */}
            <div>
              <h3 className="text-xs font-bold text-zinc-400 tracking-wider mb-3 px-1">Planejamento mensal</h3>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <SummaryCard title="Necessidades" amount={totals.needs} meta={income * 0.5} colorClass="bg-blue-500" icon={Wallet} />
                <SummaryCard title="Estilo de vida" amount={totals.wants} meta={income * 0.3} colorClass="bg-orange-500" icon={ShoppingBag} />
                <SummaryCard title="Futuro" amount={totals.savings} meta={income * 0.2} colorClass="bg-emerald-500" icon={TrendingUp} />
              </div>
            </div>

            {/* Lista */}
            <div>
              <div className="flex justify-between items-end mb-4 px-1">
                <h3 className="text-lg font-bold text-zinc-800">Transações</h3>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-zinc-400 text-sm">Atualizando...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-zinc-100 rounded-2xl bg-zinc-50/50">
                  <p className="text-zinc-400 font-medium">Nenhum lançamento neste mês.</p>
                  <p className="text-zinc-300 text-sm mt-1">Clique em + para adicionar.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {transactions.map((t) => (
                    <TransactionItem
                      key={t.id}
                      transaction={t}
                      onEdit={(item: Transaction) => {
                        setEditingTransaction(item);
                        setIsEditModalOpen(true);
                      }}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ABA 2: Gráficos */}
          <TabsContent value="graphics" className="space-y-6 animate-in fade-in-50">

            {/* Totais */}
            <div className="grid grid-cols-1 gap-3">
              <TotalCard title="Total Entradas" value={income} type="income" />
              <TotalCard title="Total Saídas" value={expense} type="expense" />
              <TotalCard title="Resultado do Mês" value={saldoTotal} type="balance" />
            </div>

            {/* Gráfico de barras */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
              <h3 className="text-lg font-bold text-zinc-800 mb-6">Comparativo Visual</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#a1a1aa', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#a1a1aa', fontSize: 12 }}
                      tickFormatter={(val) => `R$${val / 1000}k`}
                    />
                    <Tooltip
                      cursor={{ fill: '#f4f4f5' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={60}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </TabsContent>
        </Tabs>
      </main>

      {/* Modal de Edição */}
      {editingTransaction && (
        <NewTransactionModal
          openControl={isEditModalOpen}
          onOpenChangeControl={(open) => {
            setIsEditModalOpen(open);
            if (!open) setEditingTransaction(null);
          }}
          transactionToEdit={editingTransaction}
        />
      )}
    </div>
  );
}
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";

import { NewTransactionModal } from "@/components/NewTransactionModal";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  TrendingUp, 
  Wallet, 
  ShoppingBag, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// --- TIPOS ---
interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category_group: "needs" | "wants" | "savings";
  date: string;
  created_at: any;
}

// --- COMPONENTES VISUAIS ---
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
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
        </h3>
        {/* Barra de Progresso Mini */}
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

// Item da Lista
function TransactionItem({ transaction, onEdit, onDelete }: any) {
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
        // SAÍDA SEM GRUPO
        iconBg = "bg-red-50";
        iconColor = "text-red-500";
        Icon = ArrowDownLeft;
        break;
    }
  }

  // Lógica para o Texto da Categoria
  const categoryLabel = () => {
    if (isIncome) return 'Receita';
    if (transaction.category_group === 'needs') return 'Necessidades';
    if (transaction.category_group === 'wants') return 'Estilo de Vida';
    if (transaction.category_group === 'savings') return 'Futuro';
    return 'Despesa Avulsa';
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-zinc-50 mb-3 hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-center gap-4">
        {/* Ícone Quadrado Arredondado */}
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        
        {/* Texto */}
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-800 text-sm sm:text-base">
            {transaction.description}
          </span>
          <span className="text-xs text-zinc-400 font-medium capitalize">
            {dateFormatted} • {categoryLabel()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Valor */}
        <span className={`font-bold text-sm sm:text-base ${isIncome ? 'text-emerald-600' : 'text-zinc-800'}`}>
          {isIncome ? '+ ' : '- '}
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
        </span>

        {/* Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-700">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(transaction)}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(transaction.id)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export function Dashboard() {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState(0);
  const [totals, setTotals] = useState({ needs: 0, wants: 0, savings: 0 });

  // Estados de Edição
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Snapshot do Firebase
  useEffect(() => {
    if (!user?.groupId) return;
    const q = query(
      collection(db, "transactions"),
      where("group_id", "==", user.groupId),
      orderBy("date", "desc"),
      orderBy("created_at", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      setTransactions(data);
      calculateSummaries(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.groupId]);

  function calculateSummaries(data: Transaction[]) {
    let totalIncome = 0;
    const currentTotals = { needs: 0, wants: 0, savings: 0 };
    data.forEach(t => {
      if (t.type === "income") totalIncome += t.amount;
      else if (currentTotals[t.category_group] !== undefined) currentTotals[t.category_group] += t.amount;
    });
    setIncome(totalIncome);
    setTotals(currentTotals);
  }

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

  const saldoTotal = income - (totals.needs + totals.wants + totals.savings);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* HEADER */}
      <header className="bg-white pt-8 pb-6 px-6 rounded-b-[2rem] shadow-sm mb-6">
        <div className="max-w-lg mx-auto">
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

          <div className="text-center">
            <p className="text-zinc-500 text-sm mb-1">Saldo Atual</p>
            <h1 className={`text-4xl font-extrabold ${saldoTotal >= 0 ? 'text-zinc-900' : 'text-red-600'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoTotal)}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6">
        
        {/* Seção 50/30/20 (Grid de 3 colunas) */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-zinc-800 mb-4 px-2">Planejamento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard 
              title="Necessidades" 
              amount={totals.needs} 
              meta={income * 0.5} 
              colorClass="bg-blue-500" 
              icon={Wallet} 
            />
            <SummaryCard 
              title="Estilo de Vida" 
              amount={totals.wants} 
              meta={income * 0.3} 
              colorClass="bg-orange-500" 
              icon={ShoppingBag} 
            />
            <SummaryCard 
              title="Futuro" 
              amount={totals.savings} 
              meta={income * 0.2} 
              colorClass="bg-emerald-500" 
              icon={TrendingUp} 
            />
          </div>
        </div>

        {/* Seção de Lista de Transações */}
        <div>
          <div className="flex justify-between items-end mb-4 px-2">
            <h3 className="text-lg font-bold text-zinc-800">Transações</h3>
            <span className="text-xs text-zinc-400 font-medium">Últimos lançamentos</span>
          </div>

          {loading ? (
            <p className="text-center text-zinc-400 py-10">Carregando...</p>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <p>Nenhum lançamento ainda.</p>
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
      </main>

      {/* BOTÃO FLUTUANTE */}
      <div className="fixed bottom-6 right-6 z-50">
        <NewTransactionModal>
          <Button className="h-14 w-14 rounded-full bg-zinc-900 hover:bg-zinc-800 shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer">
            <Plus className="h-6 w-6 text-white" />
          </Button>
        </NewTransactionModal>
      </div>

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
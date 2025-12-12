import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";

import { NewInvestmentModal } from "@/components/investments/NewInvestmentModal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

import { 
  LogOut, 
  Plus, 
  TrendingUp, 
  Target, 
  MoreVertical, 
  Trash2, 
  ArrowUpCircle, 
  ArrowDownCircle,
  PiggyBank
} from "lucide-react";

interface InvestmentBox {
  id: string;
  name: string;
  current_amount: number;
  target_amount: number;
}

export function Investments() {
  const { user, logout } = useAuth();
  const [investments, setInvestments] = useState<InvestmentBox[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para movimentação (Depositar/Sacar)
  const [selectedBox, setSelectedBox] = useState<InvestmentBox | null>(null);
  const [moveAmount, setMoveAmount] = useState("");
  const [moveType, setMoveType] = useState<"deposit" | "withdraw">("deposit");

  // Estado para exclusão
  const [boxToDelete, setBoxToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.groupId) return;
    const q = query(
      collection(db, "investments"),
      where("group_id", "==", user.groupId),
      orderBy("created_at", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InvestmentBox[];
      setInvestments(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.groupId]);

  const totalInvested = investments.reduce((acc, curr) => acc + curr.current_amount, 0);

  // Função para Atualizar Saldo (Depositar ou Sacar)
  async function handleUpdateBalance() {
    if (!selectedBox || !moveAmount) return;
    const value = Number(moveAmount);
    if (value <= 0) {
        toast.error("O valor deve ser maior que zero.");
        return;
    }

    let newBalance = selectedBox.current_amount;
    
    if (moveType === "deposit") {
        newBalance += value;
    } else {
        if (value > newBalance) {
            toast.error("Saldo insuficiente na caixinha.");
            return;
        }
        newBalance -= value;
    }

    try {
        const docRef = doc(db, "investments", selectedBox.id);
        await updateDoc(docRef, { current_amount: newBalance });
        toast.success(moveType === "deposit" ? "Dinheiro guardado!" : "Dinheiro resgatado!");
        setSelectedBox(null);
        setMoveAmount("");
    } catch (e) {
        console.error(e);
        toast.error("Erro ao atualizar saldo.");
    }
  }

  // Função para Confirmar Exclusão
  async function confirmDelete() {
    if (!boxToDelete) return;
    try {
        await deleteDoc(doc(db, "investments", boxToDelete));
        toast.success("Caixinha excluída.");
        setBoxToDelete(null);
    } catch (e) {
        toast.error("Erro ao excluir.");
    }
  }

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
       {/* Cabeçalho */}
       <header className="bg-white pt-8 pb-6 px-6 rounded-b-[2rem] shadow-sm mb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">Patrimônio total</p>
                <h2 className="font-bold text-zinc-800">Investimentos</h2>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => logout()} className="text-zinc-400 hover:text-red-500">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          <div className="text-center">
            <p className="text-zinc-500 text-sm mb-1">Total acumulado</p>
            <h1 className="text-4xl font-extrabold text-emerald-600">
              {formatMoney(totalInvested)}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6">
        
        <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="text-lg font-bold text-zinc-800">Minhas caixinhas</h3>
            <NewInvestmentModal>
                <Button size="sm" className="bg-zinc-900 text-white rounded-full hover:bg-zinc-800">
                    <Plus className="h-4 w-4 mr-1" /> Criar
                </Button>
            </NewInvestmentModal>
        </div>

        {loading ? (
            <p className="text-center text-zinc-400 py-10">Carregando...</p>
        ) : investments.length === 0 ? (
            <div className="text-center py-10 opacity-50 flex flex-col items-center">
                <PiggyBank className="h-12 w-12 text-zinc-300 mb-2" />
                <p>Nenhuma caixinha criada.</p>
                <p className="text-xs">Crie objetivos para guardar dinheiro.</p>
            </div>
        ) : (
            <div className="space-y-4">
                {investments.map(box => {
                    const progress = box.target_amount > 0 
                        ? (box.current_amount / box.target_amount) * 100 
                        : 0;

                    return (
                        <div 
                            key={box.id} 
                            className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm relative overflow-hidden group cursor-pointer hover:border-emerald-200 transition-all"
                            onClick={() => {
                                setMoveType("deposit");
                                setSelectedBox(box);
                            }}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
                                        <Target className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-zinc-800">{box.name}</h4>
                                        <p className="text-xs text-zinc-500">
                                            Meta: {box.target_amount > 0 ? formatMoney(box.target_amount) : "Sem meta"}
                                        </p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-300 hover:text-zinc-600">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem 
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setBoxToDelete(box.id);
                                            }}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex justify-between items-end mb-2">
                                <span className="text-2xl font-bold text-zinc-800">{formatMoney(box.current_amount)}</span>
                                {box.target_amount > 0 && (
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                        {progress.toFixed(0)}%
                                    </span>
                                )}
                            </div>

                            {box.target_amount > 0 && <Progress value={progress} className="h-2 bg-zinc-100" />}
                            
                            <p className="text-[10px] text-zinc-400 mt-3 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                Toque para movimentar
                            </p>
                        </div>
                    );
                })}
            </div>
        )}
      </main>

      {/* Modal de movimentação */}
      <Dialog open={!!selectedBox} onOpenChange={(open) => !open && setSelectedBox(null)}>
        <DialogContent className="sm:max-w-sm rounded-3xl bg-white p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
                <DialogTitle className="text-center flex flex-col items-center gap-2">
                    <span className="bg-zinc-100 p-3 rounded-full">
                        {moveType === 'deposit' ? <ArrowUpCircle className="h-8 w-8 text-emerald-600" /> : <ArrowDownCircle className="h-8 w-8 text-red-500" />}
                    </span>
                    <span className="text-zinc-800">
                        {moveType === 'deposit' ? 'Guardar dinheiro' : 'Resgatar dinheiro'}
                    </span>
                </DialogTitle>
                <div className="flex justify-center gap-2 mt-4 bg-zinc-100 p-1 rounded-xl mx-auto w-fit">
                    <button 
                        onClick={() => setMoveType("deposit")}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${moveType === 'deposit' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500'}`}
                    >
                        Guardar
                    </button>
                    <button 
                        onClick={() => setMoveType("withdraw")}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${moveType === 'withdraw' ? 'bg-white text-red-500 shadow-sm' : 'text-zinc-500'}`}
                    >
                        Resgatar
                    </button>
                </div>
            </DialogHeader>
            
            <div className="px-6 py-4">
                <p className="text-center text-sm text-zinc-500 mb-2">
                    Saldo atual: <strong className="text-zinc-800">{selectedBox && formatMoney(selectedBox.current_amount)}</strong>
                </p>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-400">R$</span>
                    <Input 
                        type="number" 
                        autoFocus
                        value={moveAmount}
                        onChange={(e) => setMoveAmount(e.target.value)}
                        className="pl-12 h-16 text-2xl font-bold rounded-2xl bg-zinc-50 border-transparent text-center"
                        placeholder="0,00"
                    />
                </div>
            </div>

            <DialogFooter className="p-6 pt-0">
                <Button 
                    onClick={handleUpdateBalance} 
                    className={`w-full h-12 rounded-xl text-lg font-semibold ${moveType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'}`}
                >
                    Confirmar
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerta de exclusão */}
      <AlertDialog open={!!boxToDelete} onOpenChange={(open) => !open && setBoxToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente esta caixinha e 
              todo o saldo vinculado a ela.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Sim, excluir
            </AlertDialogAction>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBlueprintStore } from "@/store/useBlueprintStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { TransactionBlock } from "@/features/transactions/components/TransactionBlock";
import { toast } from "sonner";

import { formatCurrencyInput } from "@/utils/currency";

import { Trash2, Wallet } from "lucide-react";

import { CustomModal } from "@/components/shared/CustomModal";
import { MonthSelector } from "@/components/shared/MonthSelector";
import { Button } from "@/components/ui/button";

export function Home() {
  const { user } = useAuth();
  const { blueprint, fetchBlueprint, addSubgroup, removeSubgroup, removeGroup } = useBlueprintStore();
  const { transactions, fetchTransactions, addTransaction, updateTransaction, deleteTransaction, isLoading, currentMonth, currentYear, setCurrentDate } = useTransactionStore();

  // Estados para gerenciar Modais
  const [addingSubgroupTo, setAddingSubgroupTo] = useState<string | null>(null);
  const [newSubgroupName, setNewSubgroupName] = useState("");
  const [groupToDelete, setGroupToDelete] = useState<{ id: string; name: string } | null>(null);
  const [subgroupToDelete, setSubgroupToDelete] = useState<{ groupId: string; subgroupId: string; name: string } | null>(null);

  // Busca os dados
  useEffect(() => {
    if (user?.familyId) {
      fetchBlueprint(user.familyId);
      // Passa os dados do seletor para a busca
      fetchTransactions(user.familyId, currentMonth, currentYear); 
    }
  }, [user?.familyId, currentMonth, currentYear, fetchBlueprint, fetchTransactions]);

  // Se estiver carregando ou não tiver blueprint ainda
  if (!blueprint) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 pt-20">
        <div className="animate-pulse">Carregando seu mapa financeiro...</div>
      </div>
    );
  }

  // --- CÁLCULOS DO DASHBOARD ---
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense" || !t.type)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const availableBalance = totalIncome - totalExpense;

  // --- HANDLERS ---
  const handleAddSubgroupClick = (groupId: string) => {
    setAddingSubgroupTo(groupId);
    setNewSubgroupName("");
  };

  const handleSaveSubgroup = (groupId: string) => {
    if (newSubgroupName.trim() !== "") {
      addSubgroup(groupId, {
        id: crypto.randomUUID(),
        name: newSubgroupName.trim()
      });
      toast.success("Subcategoria adicionada!");
    }
    setAddingSubgroupTo(null);
    setNewSubgroupName("");
  };

  // Prepara o objeto para a Store/Firebase
  const handleAddTransaction = (parentId: string, description: string, amount: number) => {
    if (!blueprint) return;
    
    addTransaction({
      id: crypto.randomUUID(),
      familyId: blueprint.familyId, // Essencial para saber de qual família é
      parentId,
      description,
      amount,
      date: new Date().toISOString(),
      type: "expense"
    });
  };

  // Função para confirmar e executar a exclusão da Categoria
  const handleConfirmDeleteGroup = async () => {
    if (groupToDelete) {
      // Identifica o grupo e todas as suas possíveis subcategorias
      const group = blueprint?.groups.find(g => g.id === groupToDelete.id);
      if (group) {
        const validParentIds = group.subgroups && group.subgroups.length > 0 
          ? group.subgroups.map(sub => sub.id) 
          : [group.id];

        // Deleta todos os lançamentos vinculados a esse grupo/subgrupos
        const transactionsToRemove = transactions.filter(t => validParentIds.includes(t.parentId ?? ""));
        await Promise.all(transactionsToRemove.map(t => deleteTransaction(t.id)));
      }

      // Deleta o grupo
      await removeGroup(groupToDelete.id);
      toast.success(`Categoria "${groupToDelete.name}" e seus lançamentos foram excluídos.`);
      setGroupToDelete(null);
    }
  };

  // Função para confirmar e executar a exclusão da Subcategoria
  const handleDeleteSubgroupClick = async (groupId: string, subgroupId: string, subgroupName: string) => {
    const hasTransactions = transactions.some(t => t.parentId === subgroupId);
    
    if (hasTransactions) {
      // Tem lançamentos: Abre o modal de confirmação
      setSubgroupToDelete({ groupId, subgroupId, name: subgroupName });
    } else {
      // Vazio: Deleta imediatamente
      await removeSubgroup(groupId, subgroupId);
      toast.success(`Subcategoria "${subgroupName}" excluída.`);
    }
  };

  const handleConfirmDeleteSubgroup = async () => {
    if (subgroupToDelete) {
      // Filtra todos os lançamentos que pertencem a esta subcategoria
      const transactionsToRemove = transactions.filter(
        (t) => t.parentId === subgroupToDelete.subgroupId
      );

      // Deleta os lançamentos atrelados em paralelo
      await Promise.all(
        transactionsToRemove.map((t) => deleteTransaction(t.id))
      );

      // Deleta a subcategoria
      await removeSubgroup(subgroupToDelete.groupId, subgroupToDelete.subgroupId);
      
      toast.success(`Subcategoria "${subgroupToDelete.name}" e seus lançamentos excluídos.`);
      setSubgroupToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-24">

      {/* CABEÇALHO */}
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-2xl font-bold text-zinc-100">Visão geral</h1>
        <p className="text-sm text-zinc-400">Acompanhe e edite seus lançamentos livremente.</p>
      </div>

      {/* SELETOR DE MÊS */}
      <MonthSelector 
        month={currentMonth} 
        year={currentYear} 
        onChange={setCurrentDate} 
      />

      {/* CARD DE SALDO */}
      <div className="flex items-center justify-between p-5 rounded-xl border border-zinc-800 bg-zinc-950/50 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Wallet className="h-6 w-6 text-emerald-500" />
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-400">Saldo Disponível</span>
            <span className={`text-2xl font-bold tracking-tight ${availableBalance >= 0 ? 'text-zinc-100' : 'text-red-400'}`}>
              R$ {formatCurrencyInput(availableBalance.toFixed(2))}
            </span>
          </div>
        </div>

        <div className="flex flex-col text-right text-sm">
          <span className="text-emerald-500">+ R$ {formatCurrencyInput(totalIncome.toFixed(2))}</span>
          <span className="text-red-500">- R$ {formatCurrencyInput(totalExpense.toFixed(2))}</span>
        </div>
      </div>

      {blueprint.groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-500 mt-4 border border-dashed border-zinc-800 rounded-xl">
          <p>Nenhuma categoria configurada ainda.</p>
        </div>
      ) : isLoading && transactions.length === 0 ? (
        <div className="text-zinc-500 animate-pulse text-sm">Carregando seus lançamentos...</div>
      ) : (
        blueprint.groups.map((group, index) => {
          const validParentIds = group.subgroups && group.subgroups.length > 0 ? group.subgroups.map(sub => sub.id) : [group.id];
          const groupTotal = transactions
            .filter(t => validParentIds.includes(t.parentId ?? ""))
            .reduce((sum, t) => sum + (t.amount || 0), 0);

          return (
            <div key={group.id} className="flex flex-col border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: `${index * 150}ms` }}>

              <div className={`flex items-center justify-between p-4 border-b border-zinc-800 ${group.color} bg-opacity-20`}>
                <span className="font-semibold text-zinc-100 tracking-wide text-sm">{group.name}</span>
                
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-zinc-300">{group.targetPercentage}%</span>
                  <button onClick={() => setGroupToDelete({ id: group.id, name: group.name })} className="text-zinc-400 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-colors" title="Excluir categoria">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {group.subgroups && group.subgroups.length > 0 ? (
                <div className="flex flex-col">
                  {group.subgroups.map((subgroup, subIndex) => (
                    <TransactionBlock 
                    key={subgroup.id} 
                    type="subgroup" 
                    parent={subgroup} 
                    isLastSubgroup={subIndex === group.subgroups.length - 1} 
                    transactions={transactions as any} 
                    onUpdate={updateTransaction} 
                    onDelete={deleteTransaction} 
                    onAdd={handleAddTransaction} 
                    onAddSubgroup={() => handleAddSubgroupClick(group.id)} 
                    onDeleteSubgroup={() => handleDeleteSubgroupClick(group.id, subgroup.id, subgroup.name)} />
                  ))}
                  {addingSubgroupTo === group.id && (
                    <div className="flex flex-col border-l-2 border-emerald-500 bg-zinc-900/20 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center px-4 py-3">
                        <form className="w-full flex items-center" onSubmit={(e) => { e.preventDefault(); handleSaveSubgroup(group.id); }}>
                          <input autoFocus placeholder="Nome da nova subcategoria..." value={newSubgroupName} onChange={(e) => setNewSubgroupName(e.target.value)} onBlur={() => { if (!newSubgroupName.trim()) setAddingSubgroupTo(null); }} className="bg-transparent text-sm text-zinc-500 focus:text-zinc-300 focus:outline-none w-full px-2 -ml-2 placeholder:text-zinc-600" />
                        </form>
                      </div>
                      <div className="h-px w-full bg-zinc-800/50" />
                    </div>
                  )}
                </div>
              ) : (
                <TransactionBlock key={group.id} type="group" parent={group} transactions={transactions} onUpdate={updateTransaction} onDelete={deleteTransaction} onAdd={handleAddTransaction} />
              )}

              <div className="flex items-center justify-between p-4 bg-zinc-900/20 mt-auto border-t border-zinc-800/80">
                <span className="text-sm font-medium text-zinc-400">Total {group.name}</span>
                <span className="font-semibold text-zinc-100 tracking-wide">R$ {formatCurrencyInput(groupTotal.toFixed(2))}</span>
              </div>
            </div>
          );
        })
      )}

      {/* Exclusão de Categoria Principal */}
      <CustomModal 
        isOpen={!!groupToDelete} 
        onClose={() => setGroupToDelete(null)} 
        title="Excluir categoria" 
        description={`Tem certeza que deseja excluir a categoria "${groupToDelete?.name}"?`} 
        footer={
          <>
            <Button variant="ghost" onClick={() => setGroupToDelete(null)} className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">Cancelar</Button>
            <Button onClick={handleConfirmDeleteGroup} className="bg-red-600 hover:bg-red-500 text-white">Excluir</Button>
          </>
        }
      >
        <div className="text-base text-red-400/90 font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">
          Atenção: Esta ação excluirá toda a estrutura do pote e <strong>TODOS</strong> os lançamentos vinculados a ele. Esta ação não pode ser desfeita.
        </div>
      </CustomModal>

      {/* Exclusão de Subcategoria (Aparece apenas se houver transações) */}
      <CustomModal 
        isOpen={!!subgroupToDelete} 
        onClose={() => setSubgroupToDelete(null)} 
        title="Excluir subcategoria" 
        description={`A subcategoria "${subgroupToDelete?.name}" possui lançamentos registrados.`} 
        footer={
          <>
            <Button variant="ghost" onClick={() => setSubgroupToDelete(null)} className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">Cancelar</Button>
            <Button onClick={handleConfirmDeleteSubgroup} className="bg-red-600 hover:bg-red-500 text-white">Excluir</Button>
          </>
        }
      >
        <div className="text-base text-red-400/90 font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">
          Atenção: Ao excluir esta subcategoria, <strong>TODOS</strong> os lançamentos dentro dela também serão apagados. Esta ação não pode ser desfeita.
        </div>
      </CustomModal>

    </div>
  );
}
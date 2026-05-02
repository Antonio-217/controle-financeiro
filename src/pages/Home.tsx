import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBlueprintStore } from "@/store/useBlueprintStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { TransactionBlock } from "@/features/transactions/components/TransactionBlock";
import { formatCurrencyInput } from "@/utils/currency";

export function Home() {
  const { user } = useAuth();
  const { blueprint, fetchBlueprint, addSubgroup, removeSubgroup } = useBlueprintStore();
  const { transactions, fetchTransactions, addTransaction, updateTransaction, deleteTransaction, isLoading } = useTransactionStore();

  // Estados para gerenciar Subgrupo
  const [addingSubgroupTo, setAddingSubgroupTo] = useState<string | null>(null);
  const [newSubgroupName, setNewSubgroupName] = useState("");

  // Quando a tela carregar, busca tudo usando o ID da família
  useEffect(() => {
    if (user?.familyId) {
      fetchBlueprint(user.familyId);
      fetchTransactions(user.familyId);
    }
  }, [user?.familyId, fetchBlueprint, fetchTransactions]);

  // Se estiver carregando ou não tiver blueprint ainda
  if (!blueprint) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 pt-20">
        <div className="animate-pulse">Carregando seu mapa financeiro...</div>
      </div>
    );
  }

  // Se não tiver categorias configurados
  if (blueprint.groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 pt-20">
        <p>Nenhuma categoria configurada ainda.</p>
        <p className="text-sm mt-2">Crie sua primeira categoria para começar.</p>
      </div>
    );
  }

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
      date: new Date().toISOString()
    });
  };

return (
    <div className="flex flex-col gap-2 pb-6">
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-2xl font-bold text-zinc-100">Visão geral</h1>
        <p className="text-sm text-zinc-400">Acompanhe e edite seus lançamentos livremente.</p>
      </div>

      {isLoading && transactions.length === 0 ? (
        <div className="text-zinc-500 animate-pulse text-sm">Carregando seus lançamentos...</div>
      ) : (
        blueprint.groups.map((group, index) => {
          const validParentIds = group.subgroups && group.subgroups.length > 0 
            ? group.subgroups.map(sub => sub.id) 
            : [group.id];

        // Somamos todas as transações que pertencem a esses IDs
        const groupTotal = transactions
          .filter(t => validParentIds.includes(t.parentId))
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        return (
          <div 
            key={group.id} 
            className="flex flex-col border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            {/* CABEÇALHO DO GRUPO */}
            <div className={`flex items-center justify-between p-4 border-b border-zinc-800 ${group.color} bg-opacity-20`}>
              <span className="font-semibold text-zinc-100 tracking-wide uppercase text-sm">
                {group.name}
              </span>
              <span className="font-semibold text-zinc-300">
                {group.targetPercentage}%
              </span>
            </div>

            {/* LISTA DE SUBGRUPOS / TRANSAÇÕES */}
            {group.subgroups && group.subgroups.length > 0 ? (
              <div className="flex flex-col">
                {group.subgroups.map((subgroup, subIndex) => (
                  <TransactionBlock
                    key={subgroup.id}
                    type="subgroup"
                    parent={subgroup}
                    isLastSubgroup={subIndex === group.subgroups.length - 1}
                    transactions={transactions}
                    onUpdate={updateTransaction}
                    onDelete={deleteTransaction}
                    onAdd={handleAddTransaction}
                    onAddSubgroup={() => handleAddSubgroupClick(group.id)}
                    onDeleteSubgroup={() => removeSubgroup(group.id, subgroup.id)}
                  />
                ))}
                
                {/* Aparece apenas quando o botão + é clicado */}
                {addingSubgroupTo === group.id && (
                  <div className="flex flex-col border-l-2 border-emerald-500 bg-zinc-900/20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center px-4 py-3">
                      <form
                        className="w-full flex items-center"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSaveSubgroup(group.id);
                        }}
                      >
                        <input
                          autoFocus
                          placeholder="Nome do novo subgrupo..."
                          value={newSubgroupName}
                          onChange={(e) => setNewSubgroupName(e.target.value)}
                          onBlur={() => {
                            if (!newSubgroupName.trim()) setAddingSubgroupTo(null);
                          }}
                          className="bg-transparent text-sm font-medium text-emerald-400 uppercase tracking-wider focus:outline-none w-full placeholder:text-zinc-600 placeholder:normal-case placeholder:font-normal"
                        />
                      </form>
                    </div>
                    <div className="h-px w-full bg-zinc-800/50" />
                  </div>
                )}
              </div>
            ) : (
              <TransactionBlock
                key={group.id}
                type="group"
                parent={group}
                transactions={transactions}
                onUpdate={updateTransaction}
                onDelete={deleteTransaction}
                onAdd={handleAddTransaction}
              />
            )}

            {/* RODAPÉ DO GRUPO */}
            <div className="flex items-center justify-between p-4 bg-zinc-900/20 mt-auto border-t border-zinc-800/80">
              <span className="text-sm font-medium text-zinc-400">
                Total {group.name}
              </span>
              <span className="font-semibold text-zinc-100 tracking-wide">
                R$ {formatCurrencyInput(groupTotal.toFixed(2))}
              </span>
            </div>
          </div>
        );
        })
      )}
    </div>
  );
}
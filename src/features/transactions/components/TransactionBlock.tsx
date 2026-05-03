import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { formatCurrencyInput, parseCurrencyToNumber } from "@/utils/currency";

interface Transaction {
  id: string;
  parentId: string | null;
  description: string;
  amount: number;
}

interface TransactionBlockProps {
  parent: { id: string; name: string };
  type: "group" | "subgroup";
  isLastSubgroup?: boolean; // Define se é o último da lista
  transactions: Transaction[];
  onUpdate: (id: string, field: string, value: string | number) => void;
  onDelete: (id: string) => void;
  onAdd: (parentId: string, description: string, amount: number) => void;
  onAddSubgroup?: () => void;
  onDeleteSubgroup?: () => void;
}

export function TransactionBlock({
  parent,
  type,
  isLastSubgroup,
  transactions,
  onUpdate,
  onDelete,
  onAdd,
  onAddSubgroup,
  onDeleteSubgroup
}: TransactionBlockProps) {
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const sectionTx = transactions.filter((t) => t.parentId === parent.id);
  const total = sectionTx.reduce((acc, t) => acc + (t.amount || 0), 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseCurrencyToNumber(newAmount);
    if (!newDesc.trim() && numericAmount === 0) return;
    
    onAdd(parent.id, newDesc, numericAmount);
    setNewDesc("");
    setNewAmount("");
  };

  return (
    <div className="flex flex-col">
      {type === "subgroup" && (
        <>
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/10">
            <span className="text-sm font-medium text-zinc-300">
              {parent.name}
            </span>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-300">
                R$ {formatCurrencyInput(total.toFixed(2))}
              </span>

              {/* Botão de Remover Subgrupo */}
              {onDeleteSubgroup && (
                <button
                  onClick={onDeleteSubgroup}
                  className="text-zinc-400 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-colors"
                  title="Remover Subgrupo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              {/* Botão de Adicionar Subgrupo */}
              {isLastSubgroup && (
                <button
                  onClick={onAddSubgroup}
                  className="text-emerald-500 p-1.5 hover:bg-emerald-500/10 rounded transition-colors"
                  title="Adicionar Novo Subgrupo"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="h-px w-full bg-zinc-800/50" />
        </>
      )}

      <div className="flex flex-col py-1">
        {sectionTx.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between px-4 py-2 hover:bg-zinc-900/30 transition-colors">
            
            <input
              value={tx.description}
              onChange={(e) => onUpdate(tx.id, "description", e.target.value)}
              className="bg-transparent text-sm text-zinc-300 focus:text-white focus:outline-none focus:bg-zinc-900/50 rounded px-2 -ml-2 w-full truncate transition-colors"
            />
            
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <span className="text-sm text-zinc-500">R$</span>
              <input
                type="text"
                inputMode="numeric"
                value={tx.amount === 0 ? "" : formatCurrencyInput(tx.amount.toFixed(2))}
                onChange={(e) => {
                  // Processa a formatação antes de enviar para o estado
                  const formatted = formatCurrencyInput(e.target.value);
                  onUpdate(tx.id, "amount", parseCurrencyToNumber(formatted));
                }}
                className="bg-transparent text-sm text-zinc-300 focus:text-white focus:outline-none focus:bg-zinc-900/50 rounded px-1 w-20 text-right transition-colors"
              />
              
              <button 
                onClick={() => onDelete(tx.id)} 
                className="text-zinc-400 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-colors"
                aria-label="Excluir lançamento"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        <form onSubmit={handleAdd} className="flex items-center justify-between px-4 py-2 mt-1 relative focus-within:bg-zinc-900/20 transition-colors">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/50 rounded-r opacity-0 focus-within:opacity-100 transition-opacity" />
          
          <input
            placeholder="Novo lançamento..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="bg-transparent text-sm text-zinc-500 focus:text-zinc-300 focus:outline-none w-full px-2 -ml-2 placeholder:text-zinc-600"
          />
          
          <div className="flex items-center gap-2 shrink-0 ml-4 pr-9">
            <span className="text-sm text-zinc-600">R$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0,00"
              value={newAmount}
              onChange={(e) => setNewAmount(formatCurrencyInput(e.target.value))}
              className="bg-transparent text-sm text-zinc-500 focus:text-zinc-300 focus:outline-none w-20 text-right px-1 placeholder:text-zinc-700"
            />
          </div>
          <button type="submit" className="hidden" />
        </form>
      </div>
    </div>
  );
}
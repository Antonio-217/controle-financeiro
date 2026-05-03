import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTransactionStore } from "@/store/useTransactionStore";
import { toast } from "sonner";
import { parseCurrencyToNumber, formatCurrencyInput } from "@/utils/currency";

interface IncomeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function IncomeForm({ onSuccess, onCancel }: IncomeFormProps) {
  const { user } = useAuth();
  const { addTransaction } = useTransactionStore();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericAmount = parseCurrencyToNumber(amount);
    if (!description || numericAmount <= 0) {
      toast.warning("Preencha a descrição e um valor válido.");
      return;
    }

    addTransaction({
      id: crypto.randomUUID(),
      familyId: user?.familyId || "",
      parentId: null, // Receitas não têm subgrupo
      description: description.trim(),
      amount: numericAmount,
      date: new Date().toISOString(),
      type: "income" // Marca como entrada
    });
    
    toast.success("Receita adicionada com sucesso!");
    onSuccess();
  };

  return (
    <form id="income-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="animate-in fade-in slide-in-from-left-2 duration-300">
        <label className="text-sm text-zinc-400 mb-1.5 block">Descrição da Entrada</label>
        <Input 
          placeholder="Ex: Salário mensal, Freelance..." 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="text-zinc-100 bg-zinc-900/50 border-zinc-800 placeholder:text-zinc-600 focus-visible:ring-emerald-500"
          autoFocus
        />
      </div>

      <div className="animate-in fade-in slide-in-from-left-2 duration-300">
        <label className="text-sm text-zinc-400 mb-1.5 block">Valor (R$)</label>
        <Input 
          type="text"
          inputMode="numeric"
          placeholder="0,00" 
          value={amount}
          onChange={(e) => setAmount(formatCurrencyInput(e.target.value))}
          className="text-zinc-100 bg-zinc-900/50 border-zinc-800 placeholder:text-zinc-600 focus-visible:ring-emerald-500"
        />
      </div>

      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
          Cancelar
        </Button>
        <Button type="submit" form="income-form" className="bg-emerald-600 hover:bg-emerald-500 text-white">
          Adicionar
        </Button>
      </div>
    </form>
  );
}
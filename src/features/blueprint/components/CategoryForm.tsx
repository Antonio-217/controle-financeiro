import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Percent } from "lucide-react";
import { toast } from "sonner";
import { useBlueprintStore } from "@/store/useBlueprintStore";

interface CategoryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// Lista de cores disponíveis
const COLOR_OPTIONS = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-500"
];

export function CategoryForm({ onSuccess, onCancel }: CategoryFormProps) {
  const { user } = useAuth();
  const addGroup = useBlueprintStore((state) => state.addGroup);

  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [subcategories, setSubcategories] = useState([{ id: crypto.randomUUID(), name: "" }]);

  const addSubcategory = () => {
    setSubcategories([...subcategories, { id: crypto.randomUUID(), name: "" }]);
  };

  const removeSubcategory = (idToRemove: string) => {
    if (subcategories.length === 1) return;
    setSubcategories(subcategories.filter(sub => sub.id !== idToRemove));
  };

  const updateSubcategory = (id: string, newName: string) => {
    setSubcategories(subcategories.map(sub => 
      sub.id === id ? { ...sub, name: newName } : sub
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !percentage) {
      toast.warning("Preencha o nome e a porcentagem da categoria.");
      return;
    }

    // Filtra inputs vazios e mapeia no formato correto que a Store exige (Subgroup)
    const validSubcategories = subcategories
      .filter(sub => sub.name.trim() !== "")
      .map(sub => ({ id: sub.id, name: sub.name.trim() }));

    const newGroup = {
      id: crypto.randomUUID(),
      name: name.trim(),
      targetPercentage: Number(percentage),
      color: color,
      subgroups: validSubcategories
    };

    addGroup(newGroup, user?.familyId || "");
    
    toast.success(`Pote "${name}" criado com sucesso!`);
    onSuccess();
  };

  return (
    <form id="category-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

      <div className="flex gap-4">
        <div className="flex-1 animate-in fade-in slide-in-from-left-2 duration-300">
          <label className="text-sm text-zinc-400 mb-1.5 block">Nome da categoria</label>
          <Input 
            placeholder="Ex: Liberdade financeira" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-zinc-100 bg-zinc-900/50 border-zinc-800 placeholder:text-zinc-600 focus-visible:ring-emerald-500"
          />
        </div>

        <div className="w-28">
          <label className="text-sm text-zinc-400 mb-1.5 block">Alvo (%)</label>
          <div className="relative animate-in fade-in slide-in-from-left-2 duration-300">
            <Input 
              type="number" 
              placeholder="20" 
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className="text-zinc-100 bg-zinc-900/50 border-zinc-800 pr-8 placeholder:text-zinc-600 focus-visible:ring-emerald-500"
            />
            <Percent className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          </div>
        </div>
      </div>

      {/* Seleção de Cor */}
      <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
        <label className="text-sm text-zinc-400 block">Cor de identificação</label>
        <div className="flex items-center gap-3">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full transition-all duration-200 ${c} ${
                color === c 
                  ? "ring-2 ring-zinc-100 ring-offset-2 ring-offset-zinc-950 scale-110" 
                  : "opacity-40 hover:opacity-100 hover:scale-105"
              }`}
              aria-label={`Selecionar cor ${c}`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-left-2 duration-300">
          <label className="text-sm text-zinc-400">Subcategorias (Opcional)</label>
          <button 
            type="button" 
            onClick={addSubcategory}
            className="text-sm flex items-center gap-1 text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            <Plus className="h-4 w-4"/> Adicionar
          </button>
        </div>

        <div className="flex flex-col gap-2 max-h-[170px] overflow-y-auto pl-1 pr-1 pb-0 scrollbar-thin scrollbar-thumb-zinc-800">
          {subcategories.map((sub, index) => (
            <div key={sub.id} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <Input 
                placeholder={`Ex: ${index === 0 ? 'Reserva de emergência' : 'Poupança'}`}
                value={sub.name}
                onChange={(e) => updateSubcategory(sub.id, e.target.value)}
                className="text-zinc-100 bg-zinc-900/50 border-zinc-800 placeholder:text-zinc-600 focus-visible:ring-emerald-500"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSubcategory(sub.id)}
                className="h-10 w-10 text-zinc-500 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-colors"
                disabled={subcategories.length === 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex justify-end gap-3">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel} 
          className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          form="category-form" 
          className="bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          Salvar
        </Button>
      </div>
    </form>
  );
}
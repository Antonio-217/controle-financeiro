import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, getDoc, addDoc, updateDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  CalendarIcon,
  Tag,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  Banknote,
  Landmark,
  X,
  CalendarClock
} from "lucide-react";

// Grupo e Categoria opcionais para permitir que o usuário limpe o campo
const formSchema = z.object({
  description: z.string().min(2, "Mínimo 2 caracteres"),
  amount: z.coerce.number().min(0.01, "Valor inválido"),
  type: z.enum(["expense", "income"]),
  category_group: z.string().optional(),
  subcategory_id: z.string().optional(),
  payment_method: z.string().min(1, "Obrigatório"),
  date: z.string(),
  due_date: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof formSchema>;

interface TransactionModalProps {
  children?: React.ReactNode;
  transactionToEdit?: any;
  openControl?: boolean;
  onOpenChangeControl?: (open: boolean) => void;
}

export function NewTransactionModal({
  children,
  transactionToEdit,
  openControl,
  onOpenChangeControl
}: TransactionModalProps) {
  const { user } = useAuth();

  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = openControl !== undefined ? openControl : internalOpen;
  const setIsOpen = onOpenChangeControl || setInternalOpen;

  const [categories, setCategories] = useState<any>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      description: "",
      amount: 0,
      type: "expense",
      category_group: "",
      subcategory_id: "",
      payment_method: "debit",
      date: new Date().toISOString().split("T")[0],
      due_date: "",
    },
  });

  // Effects
  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        form.reset({
          description: transactionToEdit.description,
          amount: transactionToEdit.amount,
          type: transactionToEdit.type,
          category_group: transactionToEdit.category_group,
          subcategory_id: transactionToEdit.subcategory_id,
          payment_method: transactionToEdit.payment_method,
          date: transactionToEdit.date,
          due_date: transactionToEdit.due_date || "",
        });
      } else {
        form.reset({
          description: "",
          amount: 0,
          type: "expense", // Padrão Saída
          category_group: "",
          subcategory_id: "",
          payment_method: "debit",
          date: new Date().toISOString().split("T")[0],
          due_date: "",
        });
      }
    }
  }, [isOpen, transactionToEdit, form]);

  useEffect(() => {
    async function fetchCategories() {
      if (!user?.groupId) return;
      try {
        const groupRef = doc(db, "groups", user.groupId);
        const groupSnap = await getDoc(groupRef);
        if (groupSnap.exists()) {
          setCategories(groupSnap.data().categories_settings);
        }
      } catch (error) {
        console.error("Erro categorias", error);
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, [user?.groupId]);

  async function onSubmit(data: TransactionFormValues) {
    if (!user?.groupId || !user?.uid) return;
    setIsSaving(true);

    try {
      const transactionData = {
        description: data.description,
        amount: Number(data.amount),
        type: data.type,
        category_group: data.category_group || "",
        subcategory_id: data.subcategory_id || "",
        payment_method: data.payment_method,
        date: data.date,
        due_date: data.due_date || null,
      };

      if (transactionToEdit) {
        const docRef = doc(db, "transactions", transactionToEdit.id);
        await updateDoc(docRef, transactionData);
        toast.success("Lançamento atualizado!");
      } else {
        await addDoc(collection(db, "transactions"), {
          ...transactionData,
          group_id: user.groupId,
          created_by: user.uid,
          created_at: new Date(),
          status: data.payment_method === "credit_card" ? "pending" : "paid"
        });
        toast.success("Lançamento criado!");
      }

      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  }

  const selectedGroup = form.watch("category_group");
  const currentType = form.watch("type");

  const handleClearGroup = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.setValue("category_group", "");
    form.setValue("subcategory_id", "");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-[500px] p-0 gap-0 bg-white rounded-2xl border shadow-xl overflow-hidden outline-none">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)}>

            {/* --- Cabeçalho --- */}
            <div className="pt-8 pb-4 bg-white">
              <DialogTitle className="text-center flex flex-col items-center gap-3">
                {/* Ícone dentro do círculo */}
                <span className={`p-4 rounded-full transition-colors duration-300 ${currentType === 'income' ? 'bg-emerald-50' : 'bg-red-50'
                  }`}>
                  {currentType === 'income'
                    ? <ArrowUpCircle className="h-8 w-8 text-emerald-600" />
                    : <ArrowDownCircle className="h-8 w-8 text-red-500" />
                  }
                </span>

                {/* Título */}
                <span className="text-xl font-bold text-zinc-800">
                  {transactionToEdit
                    ? "Editar movimentação"
                    : (currentType === 'income' ? 'Nova entrada' : 'Nova saída')
                  }
                </span>
              </DialogTitle>

              {/* Toggle Switch */}
              <div className="flex justify-center gap-1 mt-5 bg-zinc-100 p-1.5 rounded-xl mx-auto w-fit">
                <button
                  type="button"
                  onClick={() => form.setValue("type", "expense")}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${currentType === 'expense'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                >
                  Saída
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue("type", "income")}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${currentType === 'income'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                >
                  Entrada
                </button>
              </div>
            </div>

            {/* --- Corpo --- */}
            <div className="px-6 pb-6 space-y-5">

              {/* Valor e data */}
              <div className="grid grid-cols-[1.5fr_1fr] gap-4 mt-2">
                <FormField
                  control={form.control as any}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-zinc-500">Valor</FormLabel>
                      <div className="relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold text-lg group-focus-within:text-zinc-800">R$</span>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                            className="pl-10 h-12 text-lg font-bold bg-zinc-50 border-zinc-200 focus:bg-white focus:ring-2 focus:ring-offset-0 transition-all"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-zinc-500">Data</FormLabel>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="pl-9 h-12 bg-zinc-50 border-zinc-200 focus:bg-white transition-all text-sm font-medium"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Data de vencimento */}
              {currentType === 'expense' && (
                <FormField
                  control={form.control as any}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                        Vencimento <span className="text-zinc-400">(opcional)</span>
                      </FormLabel>
                      <div className="relative">
                        <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="pl-9 h-12 bg-zinc-50 border-zinc-200 focus:bg-white transition-all text-sm font-medium"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Descrição */}
              <FormField
                control={form.control as any}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <FormControl>
                        <Input
                          placeholder="Descrição (ex: Compras do mês)"
                          {...field}
                          className="pl-9 h-12 bg-zinc-50 border-zinc-200 focus:bg-white transition-all text-base"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="bg-zinc-100" />

              {/* Grupo e categoria */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="category_group"
                  render={({ field }) => (
                    <FormItem className="flex flex-col w-full">
                      <div className="flex items-center justify-between h-[18px] mb-2">
                        <FormLabel className="text-xs font-bold text-zinc-500">Grupo (opcional)</FormLabel>
                        {/* Botão limpar */}
                        {field.value && (
                          <button
                            type="button"
                            onClick={handleClearGroup}
                            className="text-[10px] font-medium text-zinc-400 hover:text-red-500 flex items-center gap-1 transition-colors tracking-wide bg-zinc-50 px-1.5 py-0.5 rounded"
                          >
                            <X className="w-3 h-3" /> Limpar
                          </button>
                        )}
                      </div>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("subcategory_id", "");
                        }}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full h-12 bg-zinc-50 border-zinc-200 focus:bg-white focus:ring-2 focus:ring-offset-0 text-base">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="needs">Necessidades</SelectItem>
                          <SelectItem value="wants">Estilo de vida</SelectItem>
                          <SelectItem value="savings">Futuro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="subcategory_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col w-full">
                      <div className="flex items-center justify-between h-[18px] mb-2">
                        <FormLabel className="text-xs font-bold text-zinc-500">Categoria (opcional)</FormLabel>
                      </div>
                      <Select onValueChange={field.onChange} value={field.value || ""} disabled={!selectedGroup || !categories}>
                        <FormControl>
                          <SelectTrigger className="w-full h-full bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-offset-0 text-base">
                            <SelectValue placeholder={loadingCategories ? "..." : "Selecione"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedGroup && categories && categories[selectedGroup]?.subcategories.map((sub: any) => (
                            <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Forma de pagamento */}
              <FormField
                control={form.control as any}
                name="payment_method"
                render={({ field }) => (
                  <FormItem className="space-y-3 pt-2">
                    <FormLabel className="text-xs font-bold text-zinc-500">Forma de pagamento</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-3 gap-3"
                      >
                        <FormItem>
                          <FormControl>
                            <RadioGroupItem value="debit" className="peer sr-only" />
                          </FormControl>
                          <FormLabel className="flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 border-zinc-100 bg-white hover:bg-zinc-50 hover:border-zinc-200 peer-data-[state=checked]:border-zinc-800 peer-data-[state=checked]:bg-zinc-50 peer-data-[state=checked]:text-zinc-900 cursor-pointer transition-all">
                            <Landmark className="h-5 w-5 mb-0.5" />
                            <span className="text-xs font-medium">Débito/Pix</span>
                          </FormLabel>
                        </FormItem>

                        <FormItem>
                          <FormControl>
                            <RadioGroupItem value="credit_card" className="peer sr-only" />
                          </FormControl>
                          <FormLabel className="flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 border-zinc-100 bg-white hover:bg-zinc-50 hover:border-zinc-200 peer-data-[state=checked]:border-zinc-800 peer-data-[state=checked]:bg-zinc-50 peer-data-[state=checked]:text-zinc-900 cursor-pointer transition-all">
                            <CreditCard className="h-5 w-5 mb-0.5" />
                            <span className="text-xs font-medium">Crédito</span>
                          </FormLabel>
                        </FormItem>

                        <FormItem>
                          <FormControl>
                            <RadioGroupItem value="cash" className="peer sr-only" />
                          </FormControl>
                          <FormLabel className="flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 border-zinc-100 bg-white hover:bg-zinc-50 hover:border-zinc-200 peer-data-[state=checked]:border-zinc-800 peer-data-[state=checked]:bg-zinc-50 peer-data-[state=checked]:text-zinc-900 cursor-pointer transition-all">
                            <Banknote className="h-5 w-5 mb-0.5" />
                            <span className="text-xs font-medium">Dinheiro</span>
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isSaving}
                className={`w-full h-12 rounded-xl text-base font-semibold shadow-md transition-all ${currentType === 'expense'
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-100'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                  }`}
              >
                {isSaving ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
                {isSaving ? "Salvando..." : (transactionToEdit ? "Salvar alterações" : "Confirmar")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
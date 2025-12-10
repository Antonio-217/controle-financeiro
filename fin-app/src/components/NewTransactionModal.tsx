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
  DialogTrigger,
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

import { toast } from "sonner";

import { CalendarIcon, DollarSign, Tag, CreditCard, ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";

const formSchema = z.object({
  description: z.string().min(2, "Mínimo 2 caracteres"),
  amount: z.coerce.number().min(0.01, "Valor inválido"),
  type: z.enum(["expense", "income"]),
  category_group: z.string().min(0, "Preencha a categoria"),
  subcategory_id: z.string().min(0, "Preencha a subcategoria"),
  payment_method: z.string().min(1, "Obrigatório"),
  date: z.string(),
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
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: 0,
      type: "expense",
      category_group: "",
      subcategory_id: "",
      payment_method: "debit",
      date: new Date().toISOString().split("T")[0],
    },
  });

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
        });
      } else {
        form.reset({
          description: "",
          amount: 0,
          type: "expense",
          category_group: "",
          subcategory_id: "",
          payment_method: "debit",
          date: new Date().toISOString().split("T")[0],
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
        category_group: data.category_group,
        subcategory_id: data.subcategory_id,
        payment_method: data.payment_method,
        date: data.date,
      };

      if (transactionToEdit) {
        const docRef = doc(db, "transactions", transactionToEdit.id);
        await updateDoc(docRef, transactionData);

        toast.success("Lançamento atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "transactions"), {
          ...transactionData,
          group_id: user.groupId,
          created_by: user.uid,
          created_at: new Date(),
          status: data.payment_method === "credit_card" ? "pending" : "paid"
        });
        toast.success("Lançamento criado com sucesso!");
      }

      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error("Erro ao salvar", error);
      toast.error("Erro ao salvar o lançamento. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  const selectedGroup = form.watch("category_group");
  const currentType = form.watch("type");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white rounded-3xl border-0 shadow-2xl">
        
        {/* Header Personalizado */}
        <div className={`p-6 pb-4 ${currentType === 'expense' ? 'bg-red-50' : 'bg-emerald-50'} border-b border-zinc-100`}>
          <DialogTitle className="text-xl font-bold text-zinc-800 flex items-center gap-2">
            {transactionToEdit ? "Editar Lançamento" : "Novo Lançamento"}
          </DialogTitle>
          <p className="text-sm text-zinc-500 mt-1">Preencha os detalhes abaixo</p>
        </div>

        <div className="p-6 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              
              {/* Seletor de Tipo Visual */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        value={field.value} 
                        className="grid grid-cols-2 gap-3"
                      >
                        <FormItem>
                          <FormControl>
                            <RadioGroupItem value="expense" className="peer sr-only" />
                          </FormControl>
                          <FormLabel className="flex flex-col items-center justify-center rounded-xl border-2 border-transparent bg-zinc-50 p-3 hover:bg-zinc-100 peer-data-[state=checked]:border-red-100 peer-data-[state=checked]:bg-red-50 peer-data-[state=checked]:text-red-600 cursor-pointer transition-all">
                            <ArrowDownCircle className="mb-1 h-6 w-6" />
                            <span className="font-semibold">Despesa</span>
                          </FormLabel>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <RadioGroupItem value="income" className="peer sr-only" />
                          </FormControl>
                          <FormLabel className="flex flex-col items-center justify-center rounded-xl border-2 border-transparent bg-zinc-50 p-3 hover:bg-zinc-100 peer-data-[state=checked]:border-emerald-100 peer-data-[state=checked]:bg-emerald-50 peer-data-[state=checked]:text-emerald-600 cursor-pointer transition-all">
                            <ArrowUpCircle className="mb-1 h-6 w-6" />
                            <span className="font-semibold">Receita</span>
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Valor e Data */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-zinc-500 font-semibold uppercase">Valor</FormLabel>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0,00" {...field} className="pl-9 h-12 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200 transition-all font-semibold text-lg" />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-zinc-500 font-semibold uppercase">Data</FormLabel>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <FormControl>
                          <Input type="date" {...field} className="pl-9 h-12 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200 transition-all" />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Descrição */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-zinc-500 font-semibold uppercase">Descrição</FormLabel>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <FormControl>
                        <Input placeholder="Ex: Mercado Semanal" {...field} className="pl-9 h-12 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200 transition-all" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Grupo e Categoria */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category_group"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-zinc-500 font-semibold uppercase">Grupo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="needs">Necessidades</SelectItem>
                          <SelectItem value="wants">Estilo de Vida</SelectItem>
                          <SelectItem value="savings">Futuro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subcategory_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-zinc-500 font-semibold uppercase">Categoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedGroup || !categories}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200">
                            <SelectValue placeholder={loadingCategories ? "..." : "Detalhe"} />
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

              {/* Pagamento */}
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-zinc-500 font-semibold uppercase">Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                         <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 z-10" />
                            <SelectTrigger className="pl-9 h-12 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                         </div>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="debit">Débito / PIX</SelectItem>
                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={isSaving}
                className={`w-full h-12 rounded-xl text-base font-semibold transition-all shadow-lg ${currentType === 'expense' ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'}`}
              >
                {isSaving ? <Loader2 className="animate-spin" /> : (transactionToEdit ? "Salvar Alterações" : "Confirmar Lançamento")}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
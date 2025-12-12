import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
import { Loader2, Target, PiggyBank, DollarSign } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(2, "Nome da caixinha é obrigatório"),
    target_amount: z.coerce.number().optional(), // Meta é opcional
    initial_amount: z.coerce.number().min(0, "O valor não pode ser negativo"),
});

type InvestmentFormValues = z.infer<typeof formSchema>;

export function NewInvestmentModal({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<InvestmentFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            target_amount: 0,
            initial_amount: 0,
        },
    });

    async function onSubmit(data: InvestmentFormValues) {
        if (!user?.groupId) return;
        setIsSaving(true);

        try {
            await addDoc(collection(db, "investments"), {
                group_id: user.groupId,
                name: data.name,
                target_amount: Number(data.target_amount) || 0,
                current_amount: Number(data.initial_amount),
                created_by: user.uid,
                created_at: new Date(),
            });

            toast.success("Caixinha criada com sucesso!");
            setOpen(false);
            form.reset();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao criar caixinha.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white rounded-3xl p-0 overflow-hidden">
                <div className="bg-emerald-50 p-6 pb-4 border-b border-zinc-100">
                    <DialogTitle className="flex items-center gap-2 text-zinc-800">
                        <PiggyBank className="h-5 w-5 text-emerald-600" />
                        Nova caixinha
                    </DialogTitle>
                    <p className="text-sm text-zinc-500 mt-1">Crie um objetivo para guardar dinheiro.</p>
                </div>

                <div className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">

                            <FormField
                                control={form.control as any}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs uppercase font-bold text-zinc-500">Nome do objetivo</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                                <Input placeholder="Ex: Reserva de Emergência" {...field} className="pl-9 h-12 bg-zinc-50 border-transparent rounded-xl" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="target_amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs uppercase font-bold text-zinc-500">Meta (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0,00" {...field} className="h-12 bg-zinc-50 border-transparent rounded-xl" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control as any}
                                    name="initial_amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs uppercase font-bold text-zinc-500">Começar com</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                                                    <Input type="number" placeholder="0,00" {...field} className="pl-8 h-12 bg-zinc-50 border-transparent rounded-xl font-bold text-emerald-700" />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button type="submit" disabled={isSaving} className="w-full h-12 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold">
                                {isSaving ? <Loader2 className="animate-spin" /> : "Criar Caixinha"}
                            </Button>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
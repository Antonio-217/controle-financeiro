import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Plus, PieChart, Settings, FolderPlus, ArrowDownToLine, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomModal } from "@/components/shared/CustomModal";
import { CategoryForm } from "@/features/blueprint/components/CategoryForm";
import { IncomeForm } from "@/features/blueprint/components/IncomeForm";

export function BottomNav() {
    const location = useLocation();
    
    const [activeModal, setActiveModal] = useState<"category" | "income" | null>(null);
    const closeModal = () => setActiveModal(null);

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 pb-safe">
                <div className="max-w-md mx-auto flex items-center justify-between h-16 px-8">

                    {/* Botão 1: Home */}
                    <Link
                        to="/"
                        className={cn(
                            "flex flex-col items-center gap-1 transition-colors",
                            location.pathname === "/" ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <Home className="h-6 w-6" />
                        <span className="text-[10px] font-medium tracking-wide">Início</span>
                    </Link>

                    {/* Botão 2: Relatórios */}
                    <Link
                        to="/reports"
                        className={cn(
                            "flex flex-col items-center gap-1 transition-colors",
                            location.pathname === "/reports" ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <PieChart className="h-6 w-6" />
                        <span className="text-[10px] font-medium tracking-wide">Relatórios</span>
                    </Link>

                    {/* Botão Central */}
                    <div className="relative -top-5">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex items-center justify-center h-14 w-14 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all focus:outline-none"
                                    aria-label="Opções de criação"
                                >
                                    <Plus className="h-7 w-7" />
                                </button>
                            </DropdownMenuTrigger>
                            
                            {/* O Menu suspenso */}
                            <DropdownMenuContent 
                                align="center" 
                                sideOffset={8}
                                className="w-48 bg-zinc-900 border-zinc-800 rounded-xl shadow-2xl p-1 animate-in fade-in zoom-in-95"
                            >
                                <DropdownMenuItem 
                                    onClick={() => setActiveModal("income")}
                                    className="flex items-center gap-3 cursor-pointer text-zinc-300 hover:text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100 rounded-lg py-2.5"
                                >
                                    <ArrowDownToLine className="h-4 w-4" />
                                    Nova entrada
                                </DropdownMenuItem>
                                
                                <div className="h-px w-full bg-zinc-800 my-1" />
                                
                                <DropdownMenuItem 
                                    onClick={() => setActiveModal("category")}
                                    className="flex items-center gap-3 cursor-pointer text-zinc-300 hover:text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100 rounded-lg py-2.5"
                                >
                                    <FolderPlus className="h-4 w-4" />
                                    Criar categoria
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Botão 4: Potes/Estratégia */}
                    <Link
                        to="/boxes"
                        className={cn(
                            "flex flex-col items-center gap-1 transition-colors",
                            location.pathname === "/boxes" ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <Archive className="h-6 w-6" />
                        <span className="text-[10px] font-medium tracking-wide">Potes</span>
                    </Link>

                    {/* Botão 5: Configurações */}
                    <Link
                        to="/settings"
                        className={cn(
                            "flex flex-col items-center gap-1 transition-colors w-12",
                            location.pathname === "/settings" ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <Settings className="h-6 w-6" />
                        <span className="text-[10px] font-medium tracking-wide">Ajustes</span>
                    </Link>
                    
                </div>
            </nav>

            <CustomModal
                isOpen={activeModal === "income"}
                onClose={closeModal}
                title="Nova entrada"
                description="Registre seu salário, rendimentos ou dinheiro extra."
            >
                <IncomeForm onSuccess={closeModal} onCancel={closeModal} />
            </CustomModal>

            <CustomModal
                isOpen={activeModal === "category"}
                onClose={closeModal}
                title="Criar categoria"
                description="Configure uma nova categoria e defina sua meta."  
            >
                <CategoryForm onSuccess={closeModal} onCancel={closeModal} />
            </CustomModal>
        </>
    );
}
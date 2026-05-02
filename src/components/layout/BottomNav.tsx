import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Plus, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomModal } from "@/components/shared/CustomModal";
import { CategoryForm } from "@/features/blueprint/components/CategoryForm";

export function BottomNav() {
    const location = useLocation();
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    const closeCategoryModal = () => setIsCategoryModalOpen(false);

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 pb-safe">
                <div className="max-w-md mx-auto flex items-center justify-between h-16 px-8">

                    {/* Botão Esquerdo: Home */}
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

                    {/* Botão Central */}
                    <div className="relative -top-5">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all focus:outline-none"
                                    aria-label="Opções de criação"
                                    onClick={() => setIsCategoryModalOpen(true)}
                                >
                                    <Plus className="h-7 w-7" />
                                </button>
                            </DropdownMenuTrigger>
                        </DropdownMenu>
                    </div>

                    {/* Botão Direito: Potes/Estratégia */}
                    <Link
                        to="/potes"
                        className={cn(
                            "flex flex-col items-center gap-1 transition-colors",
                            location.pathname === "/potes" ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <Target className="h-6 w-6" />
                        <span className="text-[10px] font-medium tracking-wide">Potes</span>
                    </Link>

                </div>
            </nav>

            <CustomModal
                isOpen={isCategoryModalOpen}
                onClose={closeCategoryModal}
                title="Nova categoria"
                description="Defina as regras do seu controle financeiro."  
            >
                <CategoryForm onSuccess={closeCategoryModal} onCancel={closeCategoryModal} />
            </CustomModal>
        </>
    );
}
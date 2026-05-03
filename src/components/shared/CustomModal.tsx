import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function CustomModal({ isOpen, onClose, title, description, children, footer }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hook para travar a rolagem da página quando o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"; // Desativa a rolagem
    } else {
      document.body.style.overflow = "unset";  // Restaura a rolagem
    }

    // Função de limpeza caso o componente seja destruído
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !onClose || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4"
      onClick={onClose} 
    >
      <div 
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} 
      > 
        <div className="mb-5">
          <h2 className="text-xl font-bold text-zinc-100 tracking-wide">{title}</h2>
          {description && <p className="text-base text-zinc-400 mt-1.5">{description}</p>}
        </div>
        
        <div className="py-0">
          {children}
        </div>

        {footer && (
          <div className="mt-6 flex justify-end gap-3">
            {footer}
          </div>
        )}
        
      </div>
    </div>,
    document.body
  );
}
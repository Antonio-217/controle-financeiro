interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function CustomModal({ isOpen, onClose, title, description, children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        
        <div className="py-4">
          {children}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
          {footer}
        </div>
      </div>
    </div>
  );
}
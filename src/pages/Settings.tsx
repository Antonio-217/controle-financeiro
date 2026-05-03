import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, User, Camera, Users, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { getAuth, updatePassword, deleteUser } from "firebase/auth";
import { db } from "@/lib/firebase";
import { CustomModal } from "@/components/shared/CustomModal";

export function Settings() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para formulário
  const [name, setName] = useState(user?.name || "");
  const [newPassword, setNewPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(user?.avatarUrl || user?.photoURL || null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Função para copiar o ID da Família
  const handleCopyFamilyId = () => {
    if (user?.familyId) {
      navigator.clipboard.writeText(user.familyId);
      setCopied(true);
      toast.success("ID da Família copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Função para salvar as alterações do perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    try {
      // Salva o novo nome no banco de dados (se foi alterado)
      if (name.trim() !== user.name) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { name: name.trim() });
      }

      // Atualiza a senha no Firebase Auth (se o campo foi preenchido)
      if (newPassword.trim() !== "") {
        const auth = getAuth();
        if (auth.currentUser) {
          await updatePassword(auth.currentUser, newPassword);
          setNewPassword("");
        }
      }

      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      
      // Tratamento de segurança do Firebase
      if (error.code === 'auth/requires-recent-login') {
        toast.error("Por segurança, saia do aplicativo e faça login novamente para alterar sua senha.");
      } else {
        toast.error("Erro ao atualizar o perfil. Verifique os dados.");
      }
    }
  };

  // Função para processar e comprimir a imagem do avatar
  const processAndCompressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 256;
          let width = img.width;
          let height = img.height;

          // Calcula a proporção para redimensionar
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Converte para WebP em base64 com 70% de qualidade
          const base64Webp = canvas.toDataURL("image/webp", 0.7);
          resolve(base64Webp);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    try {
      toast.loading("Salvando nova foto...", { id: "avatar-toast" });
      
      // Converte e comprime
      const base64Image = await processAndCompressImage(file);
      
      // Atualiza no Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { avatarUrl: base64Image });
      
      // Atualiza a tela imediatamente
      setLocalAvatar(base64Image);
      
      toast.success("Foto atualizada com sucesso!", { id: "avatar-toast" });
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      toast.error("Erro ao atualizar a foto. Tente novamente.", { id: "avatar-toast" });
    }
  };

  // Função para excluir conta
  const handleConfirmDeleteAccount = async () => {
    const auth = getAuth();
    if (!auth.currentUser || !user?.uid || !user?.familyId) return;

    try {
      toast.loading("Limpando seus dados...", { id: "delete-toast" });

      // Verificar membros da família
      const familyRef = doc(db, "families", user.familyId);
      const familySnap = await getDoc(familyRef);
      const familyData = familySnap.data();
      const isLastMember = familyData?.members?.length <= 1;

      if (isLastMember) {
        // --- LIMPEZA TOTAL (Usuário Único) ---
        // Buscar e deletar Transações
        const txQuery = query(collection(db, "transactions"), where("familyId", "==", user.familyId));
        const txDocs = await getDocs(txQuery);
        await Promise.all(txDocs.docs.map(d => deleteDoc(d.ref)));

        // Buscar e deletar Blueprints
        const bpQuery = query(collection(db, "blueprints"), where("familyId", "==", user.familyId));
        const bpDocs = await getDocs(bpQuery);
        await Promise.all(bpDocs.docs.map(d => deleteDoc(d.ref)));

        // Deletar a própria Família
        await deleteDoc(familyRef);
      } else {
        // --- MODO CASAL (Remover apenas o vínculo) ---
        const newMembers = familyData?.members?.filter((m: string) => m !== user.uid);
        await updateDoc(familyRef, { members: newMembers });
      }

      // Deletar documento do Usuário
      const userRef = doc(db, "users", user.uid);
      await deleteDoc(userRef);

      // Deletar o usuário da autenticação (Firebase Auth)
      await deleteUser(auth.currentUser);
      
      toast.success("Todos os seus dados foram removidos.", { id: "delete-toast" });
      
    } catch (error: any) {
      console.error("Erro ao excluir conta:", error);
      setIsDeleteModalOpen(false);
      if (error.code === 'auth/requires-recent-login') {
        toast.error("Por segurança, saia e logue novamente antes de excluir.", { id: "delete-toast" });
      } else {
        toast.error("Erro ao processar a limpeza de dados.", { id: "delete-toast" });
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-md mx-auto w-full">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-2xl font-bold text-zinc-100">Ajustes</h1>
        <p className="text-sm text-zinc-400">Gerencie sua conta e configurações.</p>
      </div>

      {/* PERFIL & AVATAR */}
      <section className="flex flex-col gap-4 bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-5 w-5 text-emerald-500" />
          <h2 className="text-base font-semibold text-zinc-100">Meu Perfil</h2>
        </div>

        <div className="flex items-center gap-4 mb-2">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center overflow-hidden">
              {localAvatar ? (
                <img src={localAvatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-zinc-500" />
              )}
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden" 
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 bg-emerald-600 rounded-full text-white hover:bg-emerald-500 transition-colors"
            >
              <Camera className="h-3 w-3" />
            </button>
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-100">{name || user?.name || "Usuário"}</span>
            <span className="text-xs text-zinc-500">{user?.email}</span>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 mt-2">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Nome de exibição</label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-900/50 border-zinc-800 text-zinc-100 focus-visible:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Nova senha (opcional)</label>
            <Input 
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-zinc-900/50 border-zinc-800 text-zinc-100 focus-visible:ring-emerald-500"
            />
          </div>
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white mt-2">
            Salvar alterações
          </Button>
        </form>
      </section>

      {/* SEÇÃO 2: MODO CASAL / FAMÍLIA */}
      <section className="flex flex-col gap-4 bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-5 w-5 text-emerald-500" />
          <h2 className="text-base font-semibold text-zinc-100">Modo casal (Família)</h2>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Compartilhe este código com seu parceiro(a) para que ele possa ingressar no seu grupo familiar.
        </p>
        
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 font-mono text-sm text-zinc-300 truncate">
            {user?.familyId || "Gerando ID..."}
          </div>
          <Button 
            type="button"
            onClick={handleCopyFamilyId}
            variant="outline" 
            className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-3"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </section>

      {/* EXCLUSÃO DE CONTA */}
      <section className="flex flex-col gap-3 mt-4">
        <Button 
          variant="ghost" 
          onClick={() => setIsDeleteModalOpen(true)}
          className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 justify-start px-5 h-12"
        >
          <ShieldAlert className="h-4 w-4 mr-3" />
          Excluir minha conta
        </Button>
      </section>

      <CustomModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Excluir conta permanentemente" 
        description="Esta ação é irreversível. Todos os seus dados de perfil serão apagados." 
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">Cancelar</Button>
            <Button onClick={handleConfirmDeleteAccount} className="bg-red-600 hover:bg-red-500 text-white">Sim, excluir conta</Button>
          </>
        }
      >
        <div className="text-base text-red-400/90 font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">
          Nota: Ao excluir sua conta, todos os seus dados serão permanentemente removidos. Se estiver usando o modo casal, seu parceiro(a) perderá acesso às transações compartilhadas.
        </div>
      </CustomModal>

    </div>
  );
}
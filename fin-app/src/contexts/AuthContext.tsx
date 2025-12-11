import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// --- Definição das categorias padrão
const DEFAULT_CATEGORIES = {
  needs: {
    label: "Necessidades (50%)",
    subcategories: [
      { id: "cat_fixas", name: "Contas Fixas" },
      { id: "cat_saude", name: "Saúde" },
      { id: "cat_transporte", name: "Transporte" },
      { id: "cat_mercado", name: "Supermercado" }
    ]
  },
  wants: {
    label: "Estilo de Vida (30%)",
    subcategories: [
      { id: "cat_lazer", name: "Lazer e Viagens" },
      { id: "cat_compras", name: "Compras Pessoais" },
      { id: "cat_assinaturas", name: "Assinaturas" },
      { id: "cat_restaurante", name: "Restaurantes/Delivery" }
    ]
  },
  savings: {
    label: "Futuro (20%)",
    subcategories: [
      { id: "cat_reserva", name: "Reserva de Emergência" },
      { id: "cat_invest", name: "Investimentos" },
      { id: "cat_objetivos", name: "Objetivos de Longo Prazo" }
    ]
  }
};

// --- Tipos ---
interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  groupId: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  authenticateWithEmail: (email: string, pass: string, isRegister: boolean, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Usuário logado no Firebase Auth
        await handleUserDatabase(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Lógica para sincronizar Auth -> Firestore
  async function handleUserDatabase(firebaseUser: FirebaseUser) {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      let groupId = null;

      if (userSnap.exists()) {
        const userData = userSnap.data();
        groupId = userData.current_group_id;
      } else {
        const userName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Usuário";
        
        // Cria o grupo familiar
        const groupRef = await addDoc(collection(db, "groups"), {
          name: `Família de ${firebaseUser.displayName?.split(" ")[0]}`,
          created_at: new Date(),
          members: [firebaseUser.uid],
          categories_settings: DEFAULT_CATEGORIES
        });

        groupId = groupRef.id;

        // Cria o documento do usuário linkado ao grupo
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: userName,
          photo_url: firebaseUser.photoURL,
          current_group_id: groupId,
          created_at: new Date()
        });
      }

      // Atualiza estado da aplicação
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Usuário",
        photoURL: firebaseUser.photoURL,
        groupId: groupId
      });

    } catch (error) {
      console.error("Erro ao sincronizar usuário:", error);
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }
  
  async function authenticateWithEmail(email: string, pass: string, isRegister: boolean, name?: string) {
    if (isRegister) {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      // Se tiver nome, atualiza o perfil do Firebase Auth
      if (name) {
        await updateProfile(userCredential.user, { displayName: name });
        await userCredential.user.reload();
      }
    } else {
      await signInWithEmailAndPassword(auth, email, pass);
    }
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, authenticateWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
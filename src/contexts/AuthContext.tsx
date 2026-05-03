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
import { doc, getDoc, setDoc, collection, updateDoc, arrayUnion } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// --- Tipos de Estado Interno ---
interface AppUser {
  uid: string;
  email: string | null;
  name: string;
  photoURL: string | null;
  avatarUrl?: string | null;
  familyId: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  authenticateWithEmail: (email: string, pass: string, isRegister: boolean, name?: string, familyId?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Escuta mudanças de sessão (Login/Logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserData(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Lê os dados do Firestore para alimentar a sessão do React
  async function syncUserData(firebaseUser: FirebaseUser) {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: userData.name || firebaseUser.displayName || "Usuário",
          photoURL: firebaseUser.photoURL,
          avatarUrl: userData.avatarUrl || null,
          familyId: userData.familyId || null
        });
      }
    } catch (error) {
      console.error("Erro ao ler usuário:", error);
    } finally {
      setLoading(false);
    }
  }

  // Função para criar a estrutura inicial
  async function createInitialDatabaseStructure(uid: string, email: string, name: string, inputFamilyId?: string) {
    const userRef = doc(db, "users", uid);
    let finalFamilyId = inputFamilyId;

    if (inputFamilyId) {
      // Usuário quer entrar numa família existente (Modo casal)
      const familyRef = doc(db, "families", inputFamilyId);
      const familySnap = await getDoc(familyRef);
      
      if (familySnap.exists()) {
        await updateDoc(familyRef, {
          members: arrayUnion(uid)
        });
      } else {
        throw new Error("ID da família não encontrado.");
      }
    } else {
      // Usuário é novo e não tem família, cria-se uma nova
      const newFamilyRef = doc(collection(db, "families"));
      finalFamilyId = newFamilyRef.id;

      await setDoc(newFamilyRef, {
        id: finalFamilyId,
        name: `Finanças de ${name.split(" ")[0]}`,
        members: [uid],
        createdAt: new Date().toISOString()
      });

      const newBlueprintRef = doc(collection(db, "blueprints"));
      await setDoc(newBlueprintRef, {
        id: newBlueprintRef.id,
        familyId: finalFamilyId,
        monthYear: "Padrão",
        updatedAt: new Date().toISOString(),
        groups: [
          {
            id: crypto.randomUUID(),
            name: "Gastos essenciais",
            targetPercentage: 50,
            color: "bg-blue-500",
            subgroups: [{ id: crypto.randomUUID(), name: "Moradia" }]
          },
          {
            id: crypto.randomUUID(),
            name: "Estilo de vida",
            targetPercentage: 30,
            color: "bg-purple-500",
            subgroups: [{ id: crypto.randomUUID(), name: "Lazer" }]
          },
          {
            id: crypto.randomUUID(),
            name: "Liberdade financeira",
            targetPercentage: 20,
            color: "bg-emerald-500",
            subgroups: [{ id: crypto.randomUUID(), name: "Reserva de emergência" }]
          }
        ]
      });
    }

    // Salva o usuário
    await setDoc(userRef, {
      id: uid,
      email: email,
      name: name,
      familyId: finalFamilyId,
      createdAt: new Date().toISOString()
    });
  }

  // Login/Cadastro com Email
  async function authenticateWithEmail(email: string, pass: string, isRegister: boolean, name?: string, familyId?: string) {
    if (isRegister) {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const displayName = name || email.split('@')[0];
      
      await updateProfile(userCredential.user, { displayName });
      
      // Monta as coleções do banco assim que cria a conta
      await createInitialDatabaseStructure(userCredential.user.uid, email, displayName, familyId);
      await syncUserData(userCredential.user);
    } else {
      await signInWithEmailAndPassword(auth, email, pass);
    }
  }

  // Login com Google
  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Verifica se é o primeiro login do Google
    const userRef = doc(db, "users", result.user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      const displayName = result.user.displayName || "Usuário";
      await createInitialDatabaseStructure(result.user.uid, result.user.email || "", displayName);
      await syncUserData(result.user);
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
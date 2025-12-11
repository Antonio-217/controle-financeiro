import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, DollarSign, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";

export function Login() {
  const { signInWithGoogle, authenticateWithEmail, user, loading } = useAuth();
  // Estados do Formulário
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  if (user) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // Login com Google
  async function handleGoogleLogin() {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Erro Google", error);
      toast.error("Erro ao conectar com Google");
      setIsLoggingIn(false);
    }
  }

  // Login/Cadastro com Email
  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.warning("Preencha email e senha");
      return;
    }
    setIsLoggingIn(true);
    try {
      await authenticateWithEmail(email, password, isRegistering, name);
    } catch (error: any) {
      console.error("Erro Email", error);
      let msg = "Erro ao autenticar.";
      
      if (error.code === 'auth/invalid-credential') msg = "Email ou senha incorretos.";
      if (error.code === 'auth/email-already-in-use') msg = "Este email já está cadastrado.";
      if (error.code === 'auth/weak-password') msg = "A senha deve ter pelo menos 6 caracteres.";
      
      toast.error(msg);
      setIsLoggingIn(false);
    }
  }

  return (
    <div className="min-h-screen w-full grid place-items-center bg-zinc-950 p-4">
      {/* CARTÃO DE LOGIN */}
      <div className="w-full max-w-[400px] flex flex-col gap-8">
        {/* CABEÇALHO */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-900/10">
            <DollarSign className="h-8 w-8 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">FinApp</h1>
            <p className="text-zinc-400 mt-2">
              {isRegistering ? "Crie sua conta gratuita" : "Controle financeiro 50/30/20"}
            </p>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-4">
            
            {/* Campo Nome (Apenas no Cadastro) */}
            {isRegistering && (
              <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                  <User className="h-5 w-5" />
                </div>
                <Input 
                  placeholder="Seu Nome" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="pl-12 h-14 bg-zinc-900 border-zinc-800 text-lg rounded-xl text-zinc-100"
                  required
                />
              </div>
            )}

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                <Mail className="h-5 w-5" />
              </div>
              <Input 
                type="email"
                placeholder="Email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-12 h-14 bg-zinc-900 border-zinc-800 text-lg rounded-xl text-zinc-100"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                <Lock className="h-5 w-5" />
              </div>
              <Input 
                type="password" 
                placeholder="Senha" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-12 h-14 bg-zinc-900 border-zinc-800 text-lg rounded-xl text-zinc-100"
                required
              />
            </div>
          </div>

          {/* Botão de Ação (Login ou Cadastro) */}
          <Button 
            type="submit"
            disabled={isLoggingIn}
            className="h-14 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-lg rounded-xl shadow-lg shadow-emerald-900/20 transition-all mt-2"
          >
            {isLoggingIn ? <Loader2 className="animate-spin" /> : (isRegistering ? "Criar Conta" : "Entrar")}
          </Button>

        </form>

        {/* Separador */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-950 px-2 text-zinc-500">Ou continue com</span>
          </div>
        </div>

        {/* Botão Google */}
        <Button 
          variant="outline"
          onClick={handleGoogleLogin} 
          disabled={isLoggingIn}
          className="h-12 w-full bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white text-zinc-300 font-medium rounded-xl transition-all"
        >
          <div className="bg-white p-0.5 rounded-full mr-3">
             <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
          </div>
          Google
        </Button>

        {/* Toggle Login/Cadastro */}
        <p className="text-center text-sm text-zinc-500">
          {isRegistering ? "Já tem uma conta? " : "Não tem uma conta? "}
          <button 
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-emerald-500 font-bold hover:underline"
          >
            {isRegistering ? "Faça Login" : "Registre-se"}
          </button>
        </p>
      </div>
    </div>
  );
}
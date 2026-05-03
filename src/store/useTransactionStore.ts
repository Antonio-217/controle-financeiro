import { create } from 'zustand';
import type { Transaction } from '@/types/transaction';
import { transactionService } from '@/services/transactionService';

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  currentMonth: number;
  currentYear: number;
  setCurrentDate: (month: number, year: number) => void;
  
  fetchTransactions: (familyId: string, month: number, year: number) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (id: string, field: string, value: string | number) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  isLoading: false,
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),

  // Função para atualizar a data quando o usuário clicar nas setas
  setCurrentDate: (month, year) => set({ currentMonth: month, currentYear: year }),

  fetchTransactions: async (familyId, month, year) => {
    set({ isLoading: true });
    try {
      const data = await transactionService.getTransactionsByMonth(familyId, month, year);
      set({ transactions: data });
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addTransaction: async (transaction) => {
    // Atualiza a tela instantaneamente
    set((state) => ({ transactions: [...state.transactions, transaction] }));
    // Salva no banco de dados em segundo plano
    try {
      await transactionService.addTransaction(transaction);
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
    }
  },

  updateTransaction: async (id, field, value) => {
    // Atualiza a tela instantaneamente
    set((state) => ({
      transactions: state.transactions.map((t) => 
        t.id === id ? { ...t, [field]: value } : t
      ),
    }));
    // Atualiza no banco de dados em segundo plano
    try {
      await transactionService.updateTransaction(id, field, value);
    } catch (error) {
      console.error("Erro ao atualizar transação:", error);
    }
  },

  deleteTransaction: async (id) => {
    // Remove da tela instantaneamente
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
    // Deleta do banco de dados em segundo plano
    try {
      await transactionService.deleteTransaction(id);
    } catch (error) {
      console.error("Erro ao deletar transação:", error);
    }
  },
}));
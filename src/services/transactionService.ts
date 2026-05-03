import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Transaction } from "@/types/transaction";

export const transactionService = {
  // GET: Busca todas as transações da família
  async getTransactionsByMonth(familyId: string, month: number, year: number): Promise<Transaction[]> {
    try {
      // Calcula o primeiro e o último milissegundo do mês selecionado
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();

      const txRef = collection(db, "transactions");
      
      // Cria a query com filtros de igualdade (familyId) e intervalo (date)
      const q = query(
        txRef, 
        where("familyId", "==", familyId),
        where("date", ">=", startDate),
        where("date", "<=", endDate)
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Transaction));
    } catch (error) {
      console.error("Erro ao buscar transações por mês:", error);
      throw error;
    }
  },

  // POST: Cria um novo lançamento
  async addTransaction(transaction: Transaction) {
    await setDoc(doc(db, "transactions", transaction.id), transaction);
  },

  // PATCH: Atualiza descrição ou valor
  async updateTransaction(id: string, field: string, value: string | number) {
    await updateDoc(doc(db, "transactions", id), {
      [field]: value,
      updatedAt: new Date().toISOString()
    });
  },

  // DELETE: Remove a transação
  async deleteTransaction(id: string) {
    await deleteDoc(doc(db, "transactions", id));
  }
};
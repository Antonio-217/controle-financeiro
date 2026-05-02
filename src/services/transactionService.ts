import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Transaction } from "@/types/transaction";

export const transactionService = {
  // GET: Busca todas as transações da família
  async getTransactions(familyId: string): Promise<Transaction[]> {
    const q = query(collection(db, "transactions"), where("familyId", "==", familyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
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
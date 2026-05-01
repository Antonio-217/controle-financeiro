import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Group } from "@/types/blueprint"; 

export const blueprintService = {
  /**
   * Sincroniza a lista de Potes (Grupos) no Firebase.
   */
  async syncGroups(familyId: string, newGroups: Group[]) {
    try {
      // Procura qual é o documento de Blueprint pertencente a essa família
      const blueprintsRef = collection(db, "blueprints");
      const q = query(blueprintsRef, where("familyId", "==", familyId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Nenhum mapa financeiro encontrado para esta família.");
      }

      // Pega o ID exato do documento gerado pelo Firebase
      const blueprintDocId = querySnapshot.docs[0].id;
      const docRef = doc(db, "blueprints", blueprintDocId);

      // Atualiza o array de grupos com os dados novos
      await updateDoc(docRef, {
        groups: newGroups,
        updatedAt: new Date(),
      });

    } catch (error) {
      console.error("Erro ao sincronizar com o Firestore:", error);
      throw error;
    }
  }
};
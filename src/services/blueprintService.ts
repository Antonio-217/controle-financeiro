import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Group, Blueprint } from "@/types/blueprint";

export const blueprintService = {
  async getBlueprint(familyId: string): Promise<Blueprint | null> {
    const blueprintsRef = collection(db, "blueprints");
    const q = query(blueprintsRef, where("familyId", "==", familyId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Blueprint;
    }
    return null;
  },

  async syncGroups(familyId: string, newGroups: Group[]) {
    try {
      const blueprintsRef = collection(db, "blueprints");
      const q = query(blueprintsRef, where("familyId", "==", familyId));
      const querySnapshot = await getDocs(q);

      let blueprintDocId;

      // Se o usuário já tem um Blueprint, pegamos o ID dele
      if (!querySnapshot.empty) {
        blueprintDocId = querySnapshot.docs[0].id;
      } else {
        // Se for a primeira vez, geramos um ID novo para criar o documento
        blueprintDocId = crypto.randomUUID();
      }

      const docRef = doc(db, "blueprints", blueprintDocId);

      await setDoc(docRef, {
        familyId: familyId,
        groups: newGroups,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

    } catch (error) {
      console.error("Erro ao sincronizar com o Firestore:", error);
      throw error;
    }
  }
};
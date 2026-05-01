export interface UserProfile {
  id: string;          // UID do Firebase Auth
  name: string;
  email: string;
  avatarUrl?: string;  
  familyId: string;    // O vínculo com a família/grupo financeiro
  createdAt: Date;
}

export interface Family {
  id: string;
  name: string;        // Ex: "Finanças Casal" ou "Finanças Pessoais"
  members: string[];   // Array de UIDs (User IDs) que têm acesso
  createdAt: Date;
}
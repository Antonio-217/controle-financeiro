export interface User {
  id: string;
  email: string;
  name: string;
  familyId: string;
  createdAt: string; 
}

export interface Family {
  id: string;
  name: string;
  members: string[]; // Array com os UIDs dos usuários (Modo casal)
  createdAt: string;
}
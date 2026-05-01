// O nível mais profundo: O gasto específico
export interface ExpenseItem {
  id: string;
  name: string;      // Ex: "Conta de Luz - Janeiro"
  amount: number;    // Ex: 150.00
  date: string;      // Data do gasto
}

// O nível intermediário: O Subgrupo (A categoria)
export interface Subgroup {
  id: string;
  name: string;      // Ex: "Infraestrutura (Luz e Água)"
  items: ExpenseItem[]; 
}

// O nível macro: O Grupo (O Pote)
export interface Group {
  id: string;
  name: string;             // Ex: "Gastos Essenciais"
  targetPercentage: number; // Ex: 50% (Vindo da configuração)
  subgroups: Subgroup[];
}
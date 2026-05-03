export interface Transaction {
  id: string;
  familyId: string; // Para buscar apenas as transações daquela família
  parentId: string | null; // ID do Grupo ou Subgrupo onde o gasto ocorreu
  description: string;
  amount: number;
  date: string;     // Data do lançamento
  type: "income" | "expense";
}
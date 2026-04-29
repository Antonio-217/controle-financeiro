export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  familyId: string;      // Essencial para a query raiz de segurança
  groupId: string;       // Em qual Pote impacta
  subgroupId: string;    // Em qual Categoria exata
  type: TransactionType; 
  description: string;   // Ex: "Conta de Luz", "Salário"
  amount: number;        
  date: Date;            // Data do gasto (pode ser diferente da data de criação)
  createdBy: string;     // UID de quem registrou (útil no modo casal)
  createdAt: Date;
}
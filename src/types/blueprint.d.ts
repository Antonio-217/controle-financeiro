export interface Subgroup {
  id: string;
  name: string;        // Ex: "Transporte" ou "Assinaturas"
  icon?: string;       // Nome do ícone (ex: 'car', 'tv') para a UI
}

export interface Group {
  id: string;
  name: string;              // Ex: "Necessidades Básicas", "Lazer"
  targetPercentage: number;  // Ex: 50, 30, 20
  color: string;             
  subgroups: Subgroup[];
}

export interface Blueprint {
  id: string;
  familyId: string;    // A qual família este mapa pertence
  monthYear: string;   // Ex: "05/2026" (permite ter históricos/mudanças)
  groups: Group[];
  updatedAt: string;
}
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

export const formatDate = (date: Date | string | number | { toDate: () => Date }): string => {
  if (!date) return '';

  let dateObj: Date;

  // Verifica se é um Timestamp
  if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    dateObj = date.toDate();
  } else {
    // Caso seja uma string, número ou já um Date nativo
    dateObj = new Date(date as string | number | Date);
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
};
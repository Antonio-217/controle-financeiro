/**
 * Formata um valor (número ou string) para o padrão BRL visual enquanto o usuário digita.
 * Retorna o formato "1.234,56"
 */
export const formatCurrencyInput = (value: string | number): string => {
  // Remove tudo que não for dígito
  const onlyNumbers = String(value).replace(/\D/g, "");
  
  if (!onlyNumbers) return "";

  // Transforma os últimos dois dígitos em centavos
  const decimalValue = Number(onlyNumbers) / 100;

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(decimalValue);
};

/**
 * Converte o texto da tela ("1.234,56") de volta para um número puro do JavaScript (1234.56)
 * para podermos fazer cálculos e salvar no banco de dados.
 */
export const parseCurrencyToNumber = (value: string): number => {
  if (!value) return 0;
  // Remove os pontos de milhar e troca a vírgula decimal por ponto
  const cleanString = value.replace(/\./g, "").replace(",", ".");
  return Number(cleanString);
};
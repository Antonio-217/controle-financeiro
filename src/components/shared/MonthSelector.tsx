import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface MonthSelectorProps {
  month: number; // 0 a 11
  year: number;
  onChange: (month: number, year: number) => void;
}

export function MonthSelector({ month, year, onChange }: MonthSelectorProps) {
  const handlePrev = () => {
    if (month === 0) {
      onChange(11, year - 1);
    } else {
      onChange(month - 1, year);
    }
  };

  const handleNext = () => {
    if (month === 11) {
      onChange(0, year + 1);
    } else {
      onChange(month + 1, year);
    }
  };

  return (
    <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 mb-2 shadow-sm">
      <button 
        onClick={handlePrev} 
        className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors rounded-lg hover:bg-zinc-800 active:scale-95"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      
      <span className="font-semibold text-zinc-100 tracking-wide text-sm capitalize">
        {MONTHS[month]} {year}
      </span>
      
      <button 
        onClick={handleNext} 
        className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors rounded-lg hover:bg-zinc-800 active:scale-95"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
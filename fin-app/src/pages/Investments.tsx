export function Investments() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[80vh] text-center p-6">
      <div className="bg-emerald-100 p-4 rounded-full mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald-600"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-zinc-800">Investimentos</h2>
      <p className="text-zinc-500 mt-2">
        Em breve você poderá controlar sua reserva e aplicações aqui.
      </p>
    </div>
  );
}
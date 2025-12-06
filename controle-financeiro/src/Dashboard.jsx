// Exemplo simplificado de lógica dentro do Dashboard.jsx
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebase';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    income: 0,
    needs: 0,
    wants: 0,
    future: 0
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    // Query para pegar dados do mês atual e do usuário logado
    const q = query(
      collection(db, "transactions"),
      where("uid", "==", auth.currentUser.uid)
      // Adicione aqui filtro de data se quiser
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
      setTransactions(data);
      calcularTotais(data);
    });

    return () => unsubscribe();
  }, []);

  const calcularTotais = (data) => {
    let income = 0;
    let needs = 0;
    let wants = 0;
    let future = 0;

    data.forEach(item => {
      const val = parseFloat(item.amount);
      if (item.type === 'income') {
        income += val;
      } else {
        if (item.category === 'necessidades') needs += val;
        if (item.category === 'estilo_vida') wants += val;
        if (item.category === 'futuro') future += val;
      }
    });

    setSummary({ income, needs, wants, future });
  };

  // Funções de UI Helpers para renderizar as barras de progresso
  const getProgress = (current, total, percentage) => {
    const limit = total * percentage;
    return (current / limit) * 100;
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dashboard 50/30/20</h1>
      
      {/* CARD DE RENDA */}
      <div className="bg-gray-800 text-white p-4 rounded mb-6">
        <h2>Renda Disponível</h2>
        <p className="text-3xl">R$ {summary.income.toFixed(2)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD NECESSIDADES (50%) */}
        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <h3 className="font-bold text-blue-800">Necessidades (50%)</h3>
          <p>Gasto: R$ {summary.needs.toFixed(2)}</p>
          <p className="text-sm text-gray-500">Meta: R$ {(summary.income * 0.5).toFixed(2)}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div className="bg-blue-600 h-2.5 rounded-full" 
                 style={{width: `${Math.min(getProgress(summary.needs, summary.income, 0.5), 100)}%`}}></div>
          </div>
        </div>

        {/* CARD ESTILO DE VIDA (30%) */}
        <div className="bg-orange-50 p-4 rounded border border-orange-200">
          <h3 className="font-bold text-orange-800">Estilo de Vida (30%)</h3>
          <p>Gasto: R$ {summary.wants.toFixed(2)}</p>
          <p className="text-sm text-gray-500">Meta: R$ {(summary.income * 0.3).toFixed(2)}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div className="bg-orange-500 h-2.5 rounded-full" 
                 style={{width: `${Math.min(getProgress(summary.wants, summary.income, 0.3), 100)}%`}}></div>
          </div>
        </div>

        {/* CARD FUTURO (20%) */}
        <div className="bg-green-50 p-4 rounded border border-green-200">
          <h3 className="font-bold text-green-800">Futuro (20%)</h3>
          <p>Guardado: R$ {summary.future.toFixed(2)}</p>
          <p className="text-sm text-gray-500">Meta: R$ {(summary.income * 0.2).toFixed(2)}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div className="bg-green-600 h-2.5 rounded-full" 
                 style={{width: `${Math.min(getProgress(summary.future, summary.income, 0.2), 100)}%`}}></div>
          </div>
        </div>
      </div>

      {/* LISTA DE LANÇAMENTOS (Tabela Simples) */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-2">Últimos Lançamentos</h3>
        {/* Aqui você faria um map do estado 'transactions' */}
        {transactions.map(t => (
           <div key={t.id} className="flex justify-between border-b p-2">
              <span>{t.description}</span>
              <span className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                R$ {t.amount}
              </span>
           </div>
        ))}
      </div>
    </div>
  );
}
import React from 'react';
import { X, User, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/helpers';
import { TransactionTable } from './TransactionTable';

interface ClientModalProps {
  clientName: string;
  transactions: Transaction[];
  onClose: () => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({ clientName, transactions, onClose }) => {
  const totalSpent = transactions.reduce((acc, curr) => acc + curr.saleValue, 0);
  const totalProfit = transactions.reduce((acc, curr) => acc + curr.profit, 0);
  const salesCount = transactions.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-card w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{clientName}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Perfil Detalhado do Cliente</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Gasto</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalSpent)}</p>
              </div>
            </div>
            
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Lucro Gerado</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalProfit)}</p>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30 flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg">
                <ShoppingCart size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">Transações</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{salesCount}</p>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white px-1">Histórico de Transações</h3>
            <TransactionTable data={transactions} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-800/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

import { useState } from "react";
import { formatCurrency } from "../lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Plus, TrendingUp, TrendingDown, Filter, Calendar } from "lucide-react";
import { TransactionModal } from "./TransactionModal";

// Mock data
const mockWalletDetails = {
  id: "1",
  userId: "1",
  totalBalance: 4250000,
  availableCash: 2550000,
  lockedTaxReserve: 1062500,
  riskZoneCash: 425000,
  futureCommittedCash: 212500,
  currency: "INR",
  region: "IN",
  isSimulationActive: false,
  lastUpdated: Date.now(),
};

const mockTransactions = [
  { id: "1", type: "income", amount: 800000, description: "Freelance Project Payment", category: "salary", date: Date.now() - 86400000 * 2, tags: ["freelance"] },
  { id: "2", type: "expense", amount: 250000, description: "Office Rent", category: "housing", date: Date.now() - 86400000 * 3, tags: ["rent"] },
  { id: "3", type: "expense", amount: 45000, description: "Software Subscription", category: "software", date: Date.now() - 86400000 * 5, tags: ["subscription"] },
  { id: "4", type: "expense", amount: 120000, description: "Marketing Campaign", category: "marketing", date: Date.now() - 86400000 * 7, tags: ["advertising"] },
  { id: "5", type: "income", amount: 1500000, description: "Client Retainer", category: "salary", date: Date.now() - 86400000 * 10, tags: ["client"] },
  { id: "6", type: "expense", amount: 30000, description: "Office Supplies", category: "supplies", date: Date.now() - 86400000 * 12, tags: ["office"] },
  { id: "7", type: "expense", amount: 80000, description: "Travel Expenses", category: "travel", date: Date.now() - 86400000 * 15, tags: ["business"] },
  { id: "8", type: "income", amount: 500000, description: "Investment Return", category: "investments", date: Date.now() - 86400000 * 18, tags: ["passive"] },
];

export function IncomeExpenseTracking() {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [dateRange, setDateRange] = useState("month");
  const [categoryFilter, setCategoryFilter] = useState("all");


  const handleSaveTransaction = (transaction: any) => {
    if (editingTransaction) {
      setTransactions(transactions.map(t => t.id === transaction.id ? transaction : t));
    } else {
      setTransactions([transaction, ...transactions]);
    }
    setEditingTransaction(null);
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setShowModal(true);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  // Filter transactions based on date range and category
  const filteredTransactions = transactions.filter(transaction => {
    const now = Date.now();
    const cutoff =
      dateRange === "week" ? now - 7 * 86400000 :
        dateRange === "month" ? now - 30 * 86400000 :
          dateRange === "quarter" ? now - 90 * 86400000 :
            now - 365 * 86400000;

    const dateMatch = transaction.date >= cutoff;
    const categoryMatch = categoryFilter === "all" || transaction.category === categoryFilter;

    return dateMatch && categoryMatch;
  });

  // Calculate totals
  const totals = filteredTransactions.reduce((acc, transaction) => {
    if (transaction.type === "income") {
      acc.totalIncome += transaction.amount;
    } else {
      acc.totalExpenses += transaction.amount;
    }
    return acc;
  }, { totalIncome: 0, totalExpenses: 0 });

  // Prepare data for chart
  const chartData = [
    { name: "Income", value: totals.totalIncome },
    { name: "Expenses", value: totals.totalExpenses }
  ];

  // Group transactions by category for bar chart
  const categoryData = filteredTransactions.reduce((acc: any[], transaction) => {
    const existing = acc.find(item => item.category === transaction.category);
    if (existing) {
      existing[transaction.type] = (existing[transaction.type] || 0) + transaction.amount;
    } else {
      acc.push({
        category: transaction.category,
        income: transaction.type === "income" ? transaction.amount : 0,
        expense: transaction.type === "expense" ? transaction.amount : 0
      });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Income & Expense Tracking</h2>
          <p className="text-slate-400 mt-1">Monitor your cash flow and spending patterns</p>
        </div>

        <button
          onClick={() => {
            setEditingTransaction(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-10 pr-8 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
            <option value="year">Last Year</option>
          </select>
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
        </div>

        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-10 pr-8 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Categories</option>
            <option value="salary">Salary</option>
            <option value="business">Business</option>
            <option value="marketing">Marketing</option>
            <option value="software">Software</option>
            <option value="travel">Travel</option>
            <option value="supplies">Supplies</option>
            <option value="investments">Investments</option>
            <option value="other">Other</option>
          </select>
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="text-green-400" size={20} />
            </div>
            <div>
              <div className="text-slate-400 text-sm">Total Income</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(totals.totalIncome, "INR")}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <TrendingDown className="text-red-400" size={20} />
            </div>
            <div>
              <div className="text-slate-400 text-sm">Total Expenses</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(totals.totalExpenses, "INR")}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <div className="text-blue-400 font-bold text-lg">₹</div>
            </div>
            <div>
              <div className="text-slate-400 text-sm">Net Cash Flow</div>
              <div className={`text-2xl font-bold ${totals.totalIncome - totals.totalExpenses >= 0 ? "text-green-400" : "text-red-400"
                }`}>
                {formatCurrency(totals.totalIncome - totals.totalExpenses, "INR")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" tickFormatter={(value) => `₹${(value / 1000000).toFixed(1)}M`} />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value), "INR"), 'Amount']}
                labelStyle={{ color: '#1F2937' }}
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
              />
              <Bar dataKey="value" fill="#CCFF00" name="Amount" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Category */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">By Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="category" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" tickFormatter={(value) => `₹${(value / 1000000).toFixed(1)}M`} />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value), "INR"), 'Amount']}
                labelStyle={{ color: '#1F2937' }}
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="income" fill="#10B981" name="Income" />
              <Bar dataKey="expense" fill="#EF4444" name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr>
                <th className="text-left p-4 text-slate-400 font-normal">Date</th>
                <th className="text-left p-4 text-slate-400 font-normal">Description</th>
                <th className="text-left p-4 text-slate-400 font-normal">Category</th>
                <th className="text-right p-4 text-slate-400 font-normal">Amount</th>
                <th className="text-right p-4 text-slate-400 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 text-slate-300">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-white">
                    {transaction.description}
                    {transaction.tags && transaction.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {transaction.tags.map((tag: string) => (
                          <span key={tag} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-white/10 rounded text-xs text-slate-300">
                      {transaction.category}
                    </span>
                  </td>
                  <td className={`p-4 text-right font-medium ${transaction.type === "income" ? "text-green-400" : "text-red-400"
                    }`}>
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount, "INR")}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        transaction={editingTransaction}
      />
    </div>
  );
}
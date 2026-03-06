import { useState } from "react";
import { X, Check, Calendar, Tag } from "lucide-react";
import { toast } from "sonner";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: any) => void;
  transaction?: any;
}

export function TransactionModal({ isOpen, onClose, onSave, transaction }: TransactionModalProps) {
  const [formData, setFormData] = useState({
    type: transaction?.type || "expense",
    amount: transaction?.amount ? transaction.amount.toString() : "",
    description: transaction?.description || "",
    category: transaction?.category || "business",
    date: transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    tags: transaction?.tags?.join(", ") || ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newTransaction = {
      id: transaction?.id || Date.now().toString(),
      ...formData,
      amount: parseFloat(formData.amount),
      tags: formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag)
    };

    onSave(newTransaction);
    toast.success(transaction ? "Transaction updated successfully!" : "Transaction added successfully!");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md rounded-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {transaction ? "Edit Transaction" : "Add Transaction"}
          </h2>
          <p className="text-slate-400">
            Record a new income or expense transaction
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full glass-input"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Amount *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full glass-input"
                placeholder="Enter amount"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full glass-input"
              placeholder="Enter description"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full glass-input"
            >
              <option value="salary">Salary</option>
              <option value="business">Business</option>
              <option value="marketing">Marketing</option>
              <option value="software">Software</option>
              <option value="travel">Travel</option>
              <option value="supplies">Supplies</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full glass-input pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tags
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="w-full glass-input pl-10"
                placeholder="Enter tags separated by commas"
              />
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-primary text-black font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
            >
              <Check size={18} />
              {transaction ? "Update" : "Add"} Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
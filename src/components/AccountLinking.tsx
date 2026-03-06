import { useState } from "react";
import { Link2, CheckCircle2, AlertCircle, CreditCard, Building2 } from "lucide-react";
import { toast } from "sonner";

export function AccountLinking() {
  const [accounts, setAccounts] = useState([
    { id: '1', name: 'Chase Business Checking', type: 'checking', status: 'connected', lastSync: '2 hours ago' },
    { id: '2', name: 'American Express Business', type: 'credit_card', status: 'connected', lastSync: '1 day ago' },
  ]);

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'checking' as 'checking' | 'savings' | 'credit_card' | 'investment',
    institution: '',
  });

  const handleConnect = () => {
    toast.info('Account linking feature coming soon. This will integrate with Plaid or similar services.');
  };

  const handleDisconnect = (accountId: string) => {
    setAccounts(accounts.filter(a => a.id !== accountId));
    toast.success('Account disconnected');
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
        return <CreditCard size={20} className="text-primary" />;
      case 'checking':
      case 'savings':
        return <Building2 size={20} className="text-primary" />;
      default:
        return <Link2 size={20} className="text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Account Linking</h3>
          <p className="text-sm text-slate-400">Connect your bank accounts and cards for automatic transaction sync</p>
        </div>
        <button
          onClick={() => setShowAddAccount(true)}
          className="flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors font-medium"
        >
          <Link2 size={18} />
          Connect Account
        </button>
      </div>

      {/* Connected Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((account) => (
          <div key={account.id} className="glass-card p-4 sm:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  {getAccountIcon(account.type)}
                </div>
                <div>
                  <h4 className="font-semibold text-white">{account.name}</h4>
                  <p className="text-xs text-slate-400 capitalize">{account.type.replace('_', ' ')}</p>
                </div>
              </div>
              {account.status === 'connected' ? (
                <CheckCircle2 className="text-emerald-400 flex-shrink-0" size={20} />
              ) : (
                <AlertCircle className="text-amber-400 flex-shrink-0" size={20} />
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Status</span>
                <span className={`font-medium capitalize ${
                  account.status === 'connected' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {account.status}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Last Sync</span>
                <span className="text-white">{account.lastSync}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-white/10">
              <button
                onClick={() => toast.info('Manual sync feature coming soon')}
                className="flex-1 bg-white/10 text-slate-300 border border-white/20 py-2 px-3 rounded-lg hover:bg-white/20 transition-colors text-sm font-medium"
              >
                Sync Now
              </button>
              <button
                onClick={() => handleDisconnect(account.id)}
                className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 py-2 px-3 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
              >
                Disconnect
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Connect Account</h2>
              <button
                onClick={() => setShowAddAccount(false)}
                className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="text-blue-400" size={18} />
                  <span className="text-blue-400 font-medium">Coming Soon</span>
                </div>
                <p className="text-sm text-blue-300">
                  Account linking will be available soon. This feature will integrate with secure banking APIs 
                  (like Plaid) to automatically sync your transactions.
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Account Name</label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  className="glass-input w-full"
                  placeholder="e.g., Chase Business Checking"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Account Type</label>
                <select
                  value={newAccount.type}
                  onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value as any })}
                  className="glass-input w-full"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="investment">Investment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Financial Institution</label>
                <input
                  type="text"
                  value={newAccount.institution}
                  onChange={(e) => setNewAccount({ ...newAccount, institution: e.target.value })}
                  className="glass-input w-full"
                  placeholder="e.g., Chase, Bank of America"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddAccount(false)}
                  className="flex-1 bg-white/10 text-slate-300 border border-white/20 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnect}
                  className="flex-1 bg-primary text-black px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors font-medium"
                >
                  Connect Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {accounts.length === 0 && (
        <div className="glass-card p-8 text-center">
          <Link2 className="mx-auto mb-4 text-slate-400" size={48} />
          <p className="text-slate-400 mb-4">No accounts connected yet</p>
          <button
            onClick={() => setShowAddAccount(true)}
            className="bg-primary text-black px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors font-medium"
          >
            Connect Your First Account
          </button>
        </div>
      )}
    </div>
  );
}


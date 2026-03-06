import { formatCurrency } from "../lib/utils";
import { Wallet, TrendingUp, Shield, AlertTriangle, Lock } from "lucide-react";

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

export function WalletDetailView() {
  const walletDetails = mockWalletDetails;

  if (!walletDetails) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading wallet details...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Wallet Details</h2>
        <p className="text-slate-400 mt-1">Detailed breakdown of your financial buckets</p>
      </div>

      {/* Main Balance Card */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-slate-400">Total Balance</div>
            <div className="text-3xl font-bold text-white mt-1">
              {formatCurrency(walletDetails.totalBalance, walletDetails.currency)}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              Last updated: {new Date(walletDetails.lastUpdated).toLocaleDateString()}
            </div>
          </div>
          <div className="p-4 bg-primary/10 rounded-xl">
            <Wallet className="text-primary" size={32} />
          </div>
        </div>
      </div>

      {/* Financial Buckets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Available Cash */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="text-green-400" size={20} />
                <h3 className="font-semibold text-white">Available Cash</h3>
              </div>
              <p className="text-slate-400 text-sm mt-1">Ready for immediate use</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-white">
                {formatCurrency(walletDetails.availableCash, walletDetails.currency)}
              </div>
              <div className="text-sm text-slate-400">
                {((walletDetails.availableCash / walletDetails.totalBalance) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Tax Reserve */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="text-blue-400" size={20} />
                <h3 className="font-semibold text-white">Tax Reserve</h3>
              </div>
              <p className="text-slate-400 text-sm mt-1">Locked for tax obligations</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-white">
                {formatCurrency(walletDetails.lockedTaxReserve, walletDetails.currency)}
              </div>
              <div className="text-sm text-slate-400">
                {((walletDetails.lockedTaxReserve / walletDetails.totalBalance) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Risk Zone */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-yellow-400" size={20} />
                <h3 className="font-semibold text-white">Risk Zone</h3>
              </div>
              <p className="text-slate-400 text-sm mt-1">Emergency buffer funds</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-white">
                {formatCurrency(walletDetails.riskZoneCash, walletDetails.currency)}
              </div>
              <div className="text-sm text-slate-400">
                {((walletDetails.riskZoneCash / walletDetails.totalBalance) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Future Committed */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Lock className="text-purple-400" size={20} />
                <h3 className="font-semibold text-white">Future Committed</h3>
              </div>
              <p className="text-slate-400 text-sm mt-1">Reserved for upcoming expenses</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-white">
                {formatCurrency(walletDetails.futureCommittedCash, walletDetails.currency)}
              </div>
              <div className="text-sm text-slate-400">
                {((walletDetails.futureCommittedCash / walletDetails.totalBalance) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Allocation Chart */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Fund Allocation</h3>
        <div className="space-y-4">
          <AllocationBar 
            label="Available Cash" 
            value={walletDetails.availableCash} 
            total={walletDetails.totalBalance}
            color="bg-green-500"
          />
          <AllocationBar 
            label="Tax Reserve" 
            value={walletDetails.lockedTaxReserve} 
            total={walletDetails.totalBalance}
            color="bg-blue-500"
          />
          <AllocationBar 
            label="Risk Zone" 
            value={walletDetails.riskZoneCash} 
            total={walletDetails.totalBalance}
            color="bg-yellow-500"
          />
          <AllocationBar 
            label="Future Committed" 
            value={walletDetails.futureCommittedCash} 
            total={walletDetails.totalBalance}
            color="bg-purple-500"
          />
        </div>
      </div>
    </div>
  );
}

function AllocationBar({ label, value, total, color }: { 
  label: string; 
  value: number; 
  total: number;
  color: string;
}) {
  const percentage = (value / total) * 100;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-white font-medium">
          {formatCurrency(value, "INR")} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div 
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
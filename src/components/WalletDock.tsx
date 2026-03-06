import { motion } from "framer-motion";
import { formatCurrency } from "../lib/utils";
import { Wallet, TrendingUp, Shield, AlertTriangle, Lock } from "lucide-react";

// Mock data
const mockWalletSummary = {
  totalBalance: 4250000,
  availableCash: 2550000,
  lockedTaxReserve: 1062500,
  riskZoneCash: 425000,
  futureCommittedCash: 212500,
  currency: "INR",
  lastUpdated: Date.now(),
};

export function WalletDock() {
  const walletSummary = mockWalletSummary;

  if (!walletSummary) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
    >
      <div className="glass-card rounded-2xl p-4 border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Wallet className="text-primary" size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400">Available Cash</div>
              <div className="text-lg font-bold text-white">
                {formatCurrency(walletSummary.availableCash, walletSummary.currency)}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="text-green-400" size={16} />
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <AlertTriangle className="text-yellow-400" size={16} />
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Shield className="text-blue-400" size={16} />
            </div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-xs text-slate-400">Total</div>
              <div className="text-sm font-medium text-white">
                {formatCurrency(walletSummary.totalBalance, walletSummary.currency)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Tax</div>
              <div className="text-sm font-medium text-blue-400">
                {formatCurrency(walletSummary.lockedTaxReserve, walletSummary.currency)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Risk</div>
              <div className="text-sm font-medium text-yellow-400">
                {formatCurrency(walletSummary.riskZoneCash, walletSummary.currency)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Committed</div>
              <div className="text-sm font-medium text-purple-400">
                {formatCurrency(walletSummary.futureCommittedCash, walletSummary.currency)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
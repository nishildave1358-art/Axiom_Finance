import { useState } from "react";
import { X, AlertTriangle, Check, ArrowRight } from "lucide-react";
import { formatCurrency } from "../lib/utils";

interface ActionConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: string;
  amount?: number;
  description?: string;
}

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

const mockExplanation = {
  recommendation: "This action aligns with your financial goals and current runway.",
  impact: "Positive impact on long-term financial health.",
  alternatives: [
    "Consider spreading this expense over multiple months",
    "Review other discretionary spending to accommodate this"
  ]
};

export function ActionConfirmation({ 
  isOpen, 
  onClose, 
  onConfirm, 
  action, 
  amount, 
  description 
}: ActionConfirmationProps) {
  const [understood, setUnderstood] = useState(false);
  
  const walletSummary = mockWalletSummary;
  const explanation = mockExplanation;

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
          <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-yellow-400" size={24} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Confirm Action</h2>
          <p className="text-slate-400">
            Please review the details before proceeding
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="font-medium text-white">{action}</div>
            {description && (
              <div className="text-sm text-slate-400 mt-1">{description}</div>
            )}
            {amount && (
              <div className="text-lg font-bold text-white mt-2">
                {formatCurrency(amount, "INR")}
              </div>
            )}
          </div>

          {explanation && (
            <div className="p-4 bg-white/5 rounded-lg">
              <h3 className="font-medium text-white mb-2">AI Recommendation</h3>
              <p className="text-sm text-slate-300">{explanation.recommendation}</p>
              
              {explanation.impact && (
                <div className="mt-3 p-3 bg-green-500/10 rounded-lg">
                  <div className="text-sm font-medium text-green-400">Impact</div>
                  <div className="text-sm text-slate-300">{explanation.impact}</div>
                </div>
              )}
              
              {explanation.alternatives && explanation.alternatives.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm font-medium text-slate-300 mb-2">Alternatives to Consider</div>
                  <ul className="space-y-2">
                    {explanation.alternatives.map((alt, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-400">
                        <ArrowRight size={14} className="mt-0.5 flex-shrink-0" />
                        {alt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <input
              type="checkbox"
              id="understood"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="w-4 h-4 text-primary bg-white/10 border-white/20 rounded focus:ring-primary focus:ring-2"
            />
            <label htmlFor="understood" className="text-sm text-slate-300">
              I understand the implications of this action
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!understood}
            className="flex-1 px-4 py-3 rounded-xl bg-primary text-black font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={18} />
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
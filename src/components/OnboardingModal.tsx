import { useState } from "react";
import { motion } from "framer-motion";
import { X, Check, ArrowRight, Wallet, TrendingUp, Shield } from "lucide-react";
import { toast } from "sonner";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [setupType, setSetupType] = useState<"demo" | "quick" | null>(null);
  const [quickSetupData, setQuickSetupData] = useState({
    initialBalance: "",
    monthlyIncome: "",
    monthlyExpenses: ""
  });

  const handleDemoSetup = () => {
    // Simulate demo setup
    toast.success("Demo wallet initialized successfully!");
    onComplete();
  };

  const handleQuickSetup = () => {
    if (!quickSetupData.initialBalance || !quickSetupData.monthlyIncome || !quickSetupData.monthlyExpenses) {
      toast.error("Please fill in all fields");
      return;
    }

    // Simulate quick setup
    toast.success("Wallet setup completed successfully!");
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card w-full max-w-md rounded-2xl p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>

        {step === 1 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="text-primary" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to Axiom Finance</h2>
            <p className="text-slate-400 mb-6">
              Let's set up your financial command center to predict your runway and build with confidence.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => setStep(2)}
                className="w-full p-4 text-left rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Quick Setup</div>
                    <div className="text-sm text-slate-400">Set up with your own financial data</div>
                  </div>
                  <ArrowRight className="text-slate-400" size={20} />
                </div>
              </button>
              
              <button
                onClick={() => setStep(3)}
                className="w-full p-4 text-left rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Demo Wallet</div>
                    <div className="text-sm text-slate-400">Explore with sample data</div>
                  </div>
                  <ArrowRight className="text-slate-400" size={20} />
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setStep(1)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <ArrowRight className="text-slate-400 rotate-180" size={20} />
              </button>
              <h2 className="text-xl font-bold text-white">Quick Setup</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Initial Balance
                </label>
                <input
                  type="number"
                  value={quickSetupData.initialBalance}
                  onChange={(e) => setQuickSetupData({...quickSetupData, initialBalance: e.target.value})}
                  className="w-full glass-input"
                  placeholder="Enter your current balance"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Monthly Income
                </label>
                <input
                  type="number"
                  value={quickSetupData.monthlyIncome}
                  onChange={(e) => setQuickSetupData({...quickSetupData, monthlyIncome: e.target.value})}
                  className="w-full glass-input"
                  placeholder="Enter your average monthly income"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Monthly Expenses
                </label>
                <input
                  type="number"
                  value={quickSetupData.monthlyExpenses}
                  onChange={(e) => setQuickSetupData({...quickSetupData, monthlyExpenses: e.target.value})}
                  className="w-full glass-input"
                  placeholder="Enter your average monthly expenses"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-3 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleQuickSetup}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-black font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Complete Setup
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setStep(1)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <ArrowRight className="text-slate-400 rotate-180" size={20} />
              </button>
              <h2 className="text-xl font-bold text-white">Demo Wallet</h2>
            </div>
            
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-primary" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Explore with Sample Data</h3>
              <p className="text-slate-400 mb-6">
                Get started quickly with a pre-configured demo wallet containing sample financial data.
              </p>
              
              <div className="bg-white/5 rounded-xl p-4 text-left mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Wallet className="text-green-400" size={16} />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Initial Balance</div>
                    <div className="font-medium text-white">₹40,00,000</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Shield className="text-blue-400" size={16} />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Monthly Income</div>
                    <div className="font-medium text-white">₹6,40,000</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <TrendingUp className="text-yellow-400" size={16} />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Sample Expenses</div>
                    <div className="font-medium text-white">₹2,50,000/month</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-3 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleDemoSetup}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-black font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Start Demo
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
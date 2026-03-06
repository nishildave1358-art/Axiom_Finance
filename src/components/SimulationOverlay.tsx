import { useState } from "react";
import { X, Play, Save, Trash2, Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { WhatIfSimulator } from "./WhatIfSimulator";

interface SimulationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (results: any) => void;
}

export function SimulationOverlay({ isOpen, onClose, onApply }: SimulationOverlayProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);

  // Mock simulation state
  const simulationState = {
    isActive: isSimulating,
    changes: []
  };

  const handleStartSimulation = () => {
    setIsSimulating(true);
  };

  const handleApplySimulation = () => {
    // Simulate applying changes
    const results = {
      originalRunway: 73,
      newRunway: 85,
      impact: "+12 days",
      projectedBalance: 4500000
    };
    
    onApply(results);
    setIsSimulating(false);
    setSimulationResults(null);
    toast.success("Simulation applied successfully!");
    onClose();
  };

  const handleDiscardSimulation = () => {
    setIsSimulating(false);
    setSimulationResults(null);
    toast.info("Simulation discarded");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-4xl rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Financial Simulator</h2>
          <p className="text-slate-400">
            Test different scenarios to see their impact on your finances
          </p>
        </div>

        {!isSimulating ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="text-primary" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Ready to Simulate</h3>
            <p className="text-slate-400 mb-6">
              Start a new simulation to test different financial scenarios
            </p>
            <button
              onClick={handleStartSimulation}
              className="px-6 py-3 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2 mx-auto"
            >
              <Play size={18} />
              Start Simulation
            </button>
          </div>
        ) : (
          <div>
            <WhatIfSimulator onApply={(results) => {
              setSimulationResults(results);
            }} />
            
            {simulationResults && (
              <div className="glass-card rounded-xl p-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Simulation Results</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <div className="text-slate-400 text-sm">Original Runway</div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {simulationResults.originalRunway} days
                    </div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <div className="text-slate-400 text-sm">New Runway</div>
                    <div className="text-2xl font-bold text-green-400 mt-1">
                      {simulationResults.newRunway} days
                    </div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <div className="text-slate-400 text-sm">Impact</div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {simulationResults.impact}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleDiscardSimulation}
                    className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    <Trash2 size={16} />
                    Discard
                  </button>
                  <button
                    onClick={handleApplySimulation}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    <Save size={16} />
                    Apply Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
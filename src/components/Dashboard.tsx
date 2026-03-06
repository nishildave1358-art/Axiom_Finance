import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Activity, AlertTriangle, X, IndianRupee, FileText, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "../lib/utils";
import { useAuth } from "../lib/useAuth";
import { apiJson } from "../lib/api";
import { FinancialTimeline } from "./FinancialTimeline";
import { CashFlowHealthScore } from "./CashFlowHealthScore";
import { PredictiveRunway } from "./PredictiveRunway";
import { IncomeExpenseTracking } from "./IncomeExpenseTracking";
import { Budgeting } from "./Budgeting";
import { DebtManagement } from "./DebtManagement";
import { WhatIfSimulator } from "./WhatIfSimulator";
import { SimulationOverlay } from "./SimulationOverlay";
import { ScenarioComparison } from "./ScenarioComparison";
import { TransactionModal } from "./TransactionModal";
import { ActionConfirmation } from "./ActionConfirmation";
import { OnboardingModal } from "./OnboardingModal";
import { AnalyticsView } from "./AnalyticsView";
import { ReportsView } from "./ReportsView";
import { StatCard } from "./StatCard";
import { WalletDetailView } from "./WalletDetailView";
import { AccountLinking } from "./AccountLinking";
import { NeonOverview } from "./NeonOverview";
import { GoalSetting } from "./GoalSetting";
import { ScenariosView } from "./ScenariosView";

type WalletSummary = {
  totalBalance: number;
  availableCash: number;
  lockedTaxReserve: number;
  riskZoneCash: number;
  futureCommittedCash: number;
  runwayDays: number;
  riskLevel: string;
  currency: "INR";
  lastUpdated: number;
};

type AnalyticsMetrics = {
  monthlyBurnRate: number;
  runwayDays: number;
  cashFlowScore: number;
  expenseCategories: { name: string; value: number }[];
  incomeSources: { name: string; value: number }[];
  trendData: { month: string; balance: number; income: number; expenses: number }[];
};

export function Dashboard({ activeSection, onSectionChange }: { activeSection: string; onSectionChange: (section: string) => void }) {
  const { user } = useAuth();

  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [analyticsMetrics, setAnalyticsMetrics] = useState<AnalyticsMetrics | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const data = await apiJson<{ wallet: WalletSummary; analytics: AnalyticsMetrics }>("/api/dashboard");
        if (!mounted) return;
        setWalletSummary(data.wallet);
        setAnalyticsMetrics(data.analytics);
        setDashboardError(null);
        hasLoadedRef.current = true;
      } catch (e: any) {
        if (mounted && !hasLoadedRef.current) {
          setDashboardError(e?.message || "Failed to load dashboard data. Check backend and login session.");
        }
      }
    };

    const intervalId: number = window.setInterval(() => {
      void poll();
    }, 5000);

    void poll();

    return () => {
      mounted = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [refreshKey]);

  const [_isSimulating, setIsSimulating] = useState(false);
  const [_simulationResults, setSimulationResults] = useState<any>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [needsInitialization, setNeedsInitialization] = useState(true);
  const [showWalletDetail, setShowWalletDetail] = useState(false);
  const [isSimulationOverlayOpen, setIsSimulationOverlayOpen] = useState(false);

  // Mock functions to replace Convex mutations
  const startSimulation = async (): Promise<void> => {
    setIsSimulating(true);
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        setSimulationResults({
          projectedBalance: 4500000,
          runwayDays: 85,
          riskLevel: "healthy",
          recommendations: [
            "Consider increasing emergency fund by 10%",
            "Optimize software subscription costs",
          ],
        });
        resolve();
      }, 1500);
    });
  };

  const applySimulation = async (): Promise<void> => {
    setIsSimulating(false);
    setSimulationResults(null);
    toast.success("Simulation applied successfully!");
  };

  const saveTransaction = async (tx: any): Promise<void> => {
    const payload = {
      type: String(tx?.type || "expense"),
      amount: Number(tx?.amount),
      description: String(tx?.description || "").trim(),
      category: String(tx?.category || "other"),
      date: tx?.date ? new Date(tx.date).getTime() : Date.now(),
      tags: Array.isArray(tx?.tags) ? tx.tags : String(tx?.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean),
    };

    await apiJson<{ transaction: any }>("/api/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  const discardSimulation = async (): Promise<void> => {
    setIsSimulating(false);
    setSimulationResults(null);
    toast.info("Simulation discarded");
  };

  const analyticsData = useMemo(() => {
    if (!analyticsMetrics) return [];
    return analyticsMetrics.trendData.map((row) => {
      const revenue = row.balance;
      const expenses = row.expenses;
      return {
        name: row.month,
        revenue,
        expenses,
        prediction: revenue - expenses * 3,
      };
    });
  }, [analyticsMetrics]);

  const kpis = useMemo(() => {
    if (!analyticsMetrics) return null;
    const totalRevenueInInr = analyticsMetrics.incomeSources.reduce((sum, s) => sum + s.value, 0);
    return {
      revenue: {
        value: totalRevenueInInr,
        change: 12.3,
      },
      burnRate: {
        value: analyticsMetrics.monthlyBurnRate,
        change: -2.5,
      },
    };
  }, [analyticsMetrics]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    if (h < 21) return "Good Evening";
    return "Good Night";
  }, []);

  const userName = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "Guest";

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    try {
      switch (pendingAction.type) {
        case "start_simulation":
          await startSimulation();
          setIsSimulationOverlayOpen(true);
          toast.success("Simulation mode started");
          break;
        case "apply_simulation":
          await applySimulation();
          toast.success("Simulation changes applied");
          setIsSimulationOverlayOpen(false);
          break;
        case "discard_simulation":
          await discardSimulation();
          toast.success("Simulation discarded");
          setIsSimulationOverlayOpen(false);
          break;
      }
      setPendingAction(null);
    } catch (error: any) {
      toast.error(error.message || "Action failed");
    }
  };

  const handleCloseWalletDetail = () => {
    setShowWalletDetail(false);
  };

  // Check if wallet needs initialization

  if (activeSection === "analytics") {
    return <AnalyticsView />;
  }

  if (activeSection === "reports") {
    return <ReportsView />;
  }

  if (activeSection === "goals") {
    return (
      <div className="p-4 sm:p-6 space-y-6 pb-32">
        <GoalSetting />
      </div>
    );
  }

  if (activeSection === "scenarios") {
    return (
      <div className="p-4 sm:p-6 space-y-6 pb-32">
        <ScenariosView />
      </div>
    );
  }

  // Dashboard Section
  if (activeSection === "dashboard") {
    if (!walletSummary || !analyticsMetrics) {
      if (dashboardError) {
        return (
          <div className="p-6">
            <div className="glass-card rounded-xl p-6">
              <div className="text-white font-bold">Dashboard unavailable</div>
              <div className="text-slate-400 mt-2">{dashboardError}</div>
              <button
                type="button"
                onClick={() => {
                  setDashboardError(null);
                  setRefreshKey((k) => k + 1);
                }}
                className="mt-4 btn-secondary"
              >
                Retry
              </button>
            </div>
          </div>
        );
      }

      return <div className="p-6 text-slate-400">Loading dashboard…</div>;
    }
    return (
      <>
        <OnboardingModal
          isOpen={showOnboarding && needsInitialization}
          onClose={() => setShowOnboarding(false)}
          onComplete={() => {
            setNeedsInitialization(false);
            setShowOnboarding(false);
          }}
        />
        <NeonOverview greeting={greeting} userName={userName} wallet={walletSummary} trend={analyticsData} />

        <div className="px-4 sm:px-6 space-y-6 sm:space-y-8 pb-32">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Total Revenue"
              value={kpis ? formatCurrency(kpis.revenue.value) : "..."}
              change={kpis ? `${kpis.revenue.change > 0 ? "+" : ""}${kpis.revenue.change.toFixed(1)}%` : "..."}
              positive={kpis ? kpis.revenue.change >= 0 : true}
              icon={IndianRupee}
            />
            <StatCard
              title="Burn Rate"
              value={kpis ? formatCurrency(kpis.burnRate.value) : "..."}
              change={kpis ? `${kpis.burnRate.change > 0 ? "+" : ""}${kpis.burnRate.change.toFixed(1)}%` : "..."}
              positive={kpis ? kpis.burnRate.change <= 0 : true}
              icon={Activity}
            />
            <StatCard
              title="Runway"
              value={walletSummary ? `${walletSummary.runwayDays} Days` : "..."}
              change="Stable"
              positive={walletSummary ? walletSummary.runwayDays > 90 : true}
              icon={TrendingUp}
            />
            <StatCard
              title="Predicted Risk"
              value={walletSummary?.riskLevel || "Low"}
              change="Stable"
              positive={walletSummary?.riskLevel === "healthy"}
              icon={Activity}
            />
          </div>

          <PredictiveRunway />
          <CashFlowHealthScore />
          <ScenarioComparison />
          <WhatIfSimulator onApply={(results) => setSimulationResults(results)} />
        </div>

        <SimulationOverlay
          isOpen={isSimulationOverlayOpen}
          onClose={() => setIsSimulationOverlayOpen(false)}
          onApply={(results) => {
            setSimulationResults(results);
          }}
        />

        {/* Wallet Detail Modal */}
        {showWalletDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass-card w-full max-w-4xl rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={handleCloseWalletDetail}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
              <WalletDetailView />
            </div>
          </div>
        )}

        {/* Transaction Modal */}
        <TransactionModal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          onSave={(tx) => {
            void (async () => {
              try {
                await saveTransaction(tx);
                toast.success("Transaction saved");
              } catch (e: any) {
                toast.error(e?.message || "Failed to save transaction");
              } finally {
                setShowTransactionModal(false);
              }
            })();
          }}
          transaction={editingTransaction}
        />

        {/* Action Confirmation Modal */}
        <ActionConfirmation
          isOpen={!!pendingAction}
          onClose={() => setPendingAction(null)}
          onConfirm={() => {
            void handleConfirmAction();
          }}
          action={pendingAction?.actionLabel || "Confirm"}
        />
      </>
    );
  }

  // Wallet Section
  if (activeSection === "wallet") {
    return (
      <>
        <OnboardingModal
          isOpen={showOnboarding && needsInitialization}
          onClose={() => setShowOnboarding(false)}
          onComplete={() => {
            setNeedsInitialization(false);
            setShowOnboarding(false);
          }}
        />
        <div className="p-4 sm:p-6 space-y-6 pb-32">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Financial Command Center</h1>
                <p className="text-slate-400">Wallet management + projections in one place</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onSectionChange?.("dashboard");
                  }}
                  className="bg-white/10 text-slate-300 border border-white/20 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors font-medium text-sm"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => setShowTransactionModal(true)}
                  className="bg-primary text-black px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors font-medium text-sm"
                >
                  Add Transaction
                </button>
              </div>
            </div>
          </div>

          {/* Income & Expense Tracking */}
          <div className="glass-card">
            <IncomeExpenseTracking />
          </div>

          <div className="h-[calc(100vh-200px)]">
            <WalletDetailView />
          </div>
        </div>
        <TransactionModal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          onSave={(tx) => {
            void (async () => {
              try {
                await saveTransaction(tx);
                toast.success("Transaction saved");
              } catch (e: any) {
                toast.error(e?.message || "Failed to save transaction");
              } finally {
                setShowTransactionModal(false);
              }
            })();
          }}
          transaction={editingTransaction}
        />
        <ActionConfirmation
          isOpen={!!pendingAction}
          onClose={() => setPendingAction(null)}
          onConfirm={() => {
            void handleConfirmAction();
          }}
          action={pendingAction?.actionLabel || "Confirm"}
        />
      </>
    );
  }

  // Timeline Section
  if (activeSection === "timeline") {
    return (
      <>
        <OnboardingModal
          isOpen={showOnboarding && needsInitialization}
          onClose={() => setShowOnboarding(false)}
          onComplete={() => {
            setNeedsInitialization(false);
            setShowOnboarding(false);
          }}
        />
        <div className="p-4 sm:p-6 space-y-6 pb-32">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Financial Timeline</h1>
            <p className="text-slate-400">6-month projection and critical dates</p>
          </div>
          <FinancialTimeline />
        </div>
      </>
    );
  }

  // Reports Section
  if (activeSection === "reports") {
    return (
      <>
        <OnboardingModal
          isOpen={showOnboarding && needsInitialization}
          onClose={() => setShowOnboarding(false)}
          onComplete={() => {
            setNeedsInitialization(false);
            setShowOnboarding(false);
          }}
        />
        <div className="p-4 sm:p-6 space-y-6 pb-32">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Reports</h1>
            <p className="text-slate-400">Decision-ready summaries and exports</p>
          </div>

          <PredictiveRunway />

          <Budgeting />

          <DebtManagement />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Monthly Report", description: "January 2024", icon: FileText },
              { title: "Quarterly Summary", description: "Q4 2023", icon: BarChart3 },
              { title: "Annual Review", description: "2023", icon: FileText },
              { title: "Expense Analysis", description: "Detailed breakdown", icon: BarChart3 },
              { title: "Revenue Report", description: "Income sources", icon: TrendingUp },
              { title: "Risk Assessment", description: "Financial health", icon: AlertTriangle },
            ].map((report, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                className="glass-card cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <report.icon size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{report.title}</h3>
                    <p className="text-xs text-slate-400">{report.description}</p>
                  </div>
                </div>
                <button className="w-full mt-4 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors text-sm font-medium border border-primary/20">
                  View Report
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Settings Section
  if (activeSection === "settings") {
    return (
      // ...
      <>
        <div className="p-4 sm:p-6 space-y-6 pb-32">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-slate-400">Configure your account and preferences</p>
          </div>

          {/* Account Linking */}
          <AccountLinking />

          <div className="space-y-6">
            <div className="glass-card">
              <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Currency</label>
                  <select className="glass-input w-full">
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Time Zone</label>
                  <select className="glass-input w-full">
                    <option>UTC-5 (Eastern Time)</option>
                    <option>UTC-8 (Pacific Time)</option>
                    <option>UTC+0 (GMT)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="glass-card">
              <h3 className="text-lg font-semibold text-white mb-4">Notifications</h3>
              <div className="space-y-3">
                {[
                  { label: "Email Notifications", enabled: true },
                  { label: "Low Balance Alerts", enabled: true },
                  { label: "Critical Date Reminders", enabled: true },
                  { label: "Weekly Reports", enabled: false },
                ].map((setting, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-slate-300">{setting.label}</span>
                    <button className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${setting.enabled
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                      }`}>
                      {setting.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
}

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

import {
  LayoutDashboard,
  BarChart3,
  Wallet,
  Target,
  TrendingUp,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut
} from "lucide-react";
import { ProfileModal } from "./ProfileModal";
import { useCurrency } from "../lib/useCurrency";
import { formatCurrency } from "../lib/utils";
import { useAuth } from "../lib/useAuth";
import { apiJson } from "../lib/api";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

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

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { currency } = useCurrency();
  const { user, logout } = useAuth();
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);

  const toSelectedCurrency = useCallback(
    (amountInInr: number) => {
      return amountInInr;
    },
    []
  );

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const data = await apiJson<{ wallet: WalletSummary }>("/api/wallet/summary");
        if (!mounted) return;
        setWalletSummary(data.wallet);
      } catch {
        // ignore
      }
    };

    void poll();
    const intervalId: number = window.setInterval(() => {
      void poll();
    }, 7000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const profileUser = user
    ? {
      name: user.name,
      email: user.email ?? undefined,
    }
    : undefined;

  return (
    <>
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`fixed left-0 top-20 bottom-0 z-40 glass border-r border-white/10 transition-all duration-300 hidden sm:block ${isCollapsed ? 'w-16' : 'w-64'
          }`}
      >
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-4 p-1.5 bg-primary rounded-full text-black hover:bg-primary-hover transition-colors shadow-lg z-50"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* User Profile */}
        <div className={`p-4 border-b border-white/10 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className={`flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors ${isCollapsed ? 'justify-center' : ''
              }`}
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium text-white truncate">{user?.name || 'Guest User'}</div>
                <div className="text-xs text-slate-400 truncate">{user?.email || 'guest@example.com'}</div>
              </div>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors mb-1 ${activeSection === item.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon size={20} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Wallet Summary */}
        {!isCollapsed && (
          <div className="p-4 border-t border-white/10 mt-auto">
            <div className="text-xs text-slate-400 mb-2">Available Cash</div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(toSelectedCurrency(walletSummary?.availableCash || 0), currency)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Total: {formatCurrency(toSelectedCurrency(walletSummary?.totalBalance || 0), currency)}
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className={`p-4 border-t border-white/10 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={() => {
              void logout();
            }}
            className={`flex items-center gap-3 w-full p-3 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors ${isCollapsed ? 'justify-center' : ''
              }`}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={profileUser}
      />
    </>
  );
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'scenarios', label: 'Scenarios', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings },
];
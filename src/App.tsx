import { useState, useRef } from "react";
import { Toaster } from "sonner";

import { Dashboard } from "./components/Dashboard";
import { Sidebar } from "./components/Sidebar";
import { Hero } from "./components/Hero";
import { ContactUs } from "./components/ContactUs";
import { LoginPage } from "./components/LoginPage";
import { CurrencyProvider } from "./lib/currency";
import { useCurrency } from "./lib/useCurrency";
import { AuthProvider } from "./lib/auth";
import { useAuth } from "./lib/useAuth";

function AppShell() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isLanding, setIsLanding] = useState(true);
  const { currency } = useCurrency();
  const contactRef = useRef<HTMLDivElement>(null);
  const { user, isLoading } = useAuth();

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Get user name or default to "Guest"
  const getUserName = () => {
    return user?.name || (user?.email ? user.email.split("@")[0] : "Guest");
  };

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 selection:bg-primary selection:text-white overflow-y-auto">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 px-4 sm:px-6 py-3 sm:py-4 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setIsLanding(true)}
          >
            <div className="h-7 w-7 sm:h-8 sm:w-8 bg-primary rounded-lg flex items-center justify-center font-bold text-black text-sm sm:text-base">
              A
            </div>
            <span className="font-bold text-lg sm:text-xl tracking-tight">Axiom Finance</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {!isLanding && (
              <span className="text-xs sm:text-sm text-slate-400 hidden sm:block">
                {`${getGreeting()} — Welcome, ${getUserName()}`}
              </span>
            )}

            <div className="flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300">
              ₹ {currency}
            </div>

            {isLanding ? (
              <button
                onClick={() => setIsLanding(false)}
                className="btn-primary text-sm px-4 py-2"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={() => setIsLanding(true)}
                className="px-4 py-2 rounded-lg border border-white/10 text-xs font-medium hover:bg-white/5 transition-colors"
              >
                Home
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={isLanding ? "" : "pt-20"}>
        {isLanding ? (
          <div className="flex flex-col">
            <Hero
              onGetStarted={() => setIsLanding(false)}
              onContactScroll={scrollToContact}
            />
            <div ref={contactRef}>
              <ContactUs />
            </div>
            <footer className="py-12 border-t border-white/5 bg-background text-center text-slate-500 text-sm">
              <div className="max-w-7xl mx-auto px-4">
                © 2025 Axiom Finance. All rights reserved. Built for Solo Founders.
              </div>
            </footer>
          </div>
        ) : (
          isLoading ? (
            <div className="min-h-[70vh] flex items-center justify-center">
              <div className="text-slate-400">Loading…</div>
            </div>
          ) : !user ? (
            <LoginPage />
          ) : (
          <div className="flex relative">
            <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
            <div className="flex-1 ml-0 sm:ml-64 transition-all duration-300 min-h-screen">
              <Dashboard activeSection={activeSection} onSectionChange={setActiveSection} />
            </div>
          </div>
          )
        )}
      </main>

      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}

export default function App() {
  return (
    <CurrencyProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </CurrencyProvider>
  );
}
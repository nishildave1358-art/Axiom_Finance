import { motion } from "framer-motion";
import { TrendingUp, Wallet, ArrowUpRight } from "lucide-react";

export function HeroPhoneVisual() {
    return (
        <div className="relative w-full max-w-[500px] h-[600px] mx-auto lg:mr-0 perspective-1000">
            {/* Decorative Elements behind */}
            <div className="absolute top-10 right-10 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow" />

            {/* Phone 1 (Back/Right) */}
            <motion.div
                className="absolute top-0 right-0 w-[280px] h-[580px] bg-[#0B0E14] rounded-[40px] border-4 border-[#1F2937] shadow-2xl overflow-hidden z-10"
                initial={{ rotateY: -15, rotateX: 5, rotateZ: 5, y: 50, opacity: 0 }}
                animate={{ rotateY: -15, rotateX: 5, rotateZ: 5, y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1F2937] rounded-b-xl z-20" />

                {/* Screen Content */}
                <div className="p-6 h-full flex flex-col pt-12">
                    <div className="flex justify-between items-center mb-8">
                        <div className="w-8 h-8 rounded-full bg-white/10" />
                        <div className="w-8 h-8 rounded-full bg-white/10" />
                    </div>

                    <div className="text-center mb-8">
                        <div className="text-gray-400 text-sm">Total Balance</div>
                        <div className="text-3xl font-bold text-white mt-1">$12,450</div>
                        <div className="text-primary text-sm mt-1">+8.2%</div>
                    </div>

                    {/* Chart Graphic Area */}
                    <div className="relative h-32 w-full mb-6">
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                            <path d="M0,80 C50,80 80,30 130,30 C180,30 210,60 260,10" stroke="#CCFF00" strokeWidth="3" fill="none" />
                            <path d="M0,80 C50,80 80,30 130,30 C180,30 210,60 260,10 L260,120 L0,120 Z" fill="url(#grad1)" opacity="0.2" />
                            <defs>
                                <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: "#CCFF00", stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: "#CCFF00", stopOpacity: 0 }} />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary">
                                    <TrendingUp size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className="h-2 w-20 bg-white/20 rounded mb-2" />
                                    <div className="h-2 w-12 bg-white/10 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Phone 2 (Front/Left) - Main Focus */}
            <motion.div
                className="absolute top-20 right-[120px] w-[280px] h-[580px] bg-[#000] rounded-[40px] border-4 border-[#2D3748] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-20"
                initial={{ rotateY: -15, rotateX: 5, rotateZ: -5, y: 100, opacity: 0 }}
                animate={{ rotateY: -15, rotateX: 5, rotateZ: -5, y: 40, opacity: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1F2937] rounded-b-xl z-20" />

                {/* Screen Content */}
                <div className="p-6 h-full flex flex-col pt-12 bg-gradient-to-b from-surface to-background">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="text-white font-semibold">Runway</div>
                        <Wallet className="text-gray-400" size={20} />
                    </div>

                    {/* Main Stat */}
                    <div className="mb-8">
                        <div className="text-4xl font-bold text-white tracking-tight">18 mo</div>
                        <div className="flex items-center gap-2 mt-2 text-primary bg-primary/10 px-3 py-1 rounded-full w-fit">
                            <ArrowUpRight size={14} />
                            <span className="text-xs font-bold">Safe Zone</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Visual Cards */}
                        <div className="p-4 rounded-2xl bg-[#CCFF00] text-black">
                            <div className="text-xs font-bold opacity-70 uppercase tracking-wider mb-1">Burn Rate</div>
                            <div className="text-2xl font-black">$12.4k</div>
                            <div className="mt-2 h-1 bg-black/10 rounded-full overflow-hidden">
                                <div className="h-full w-2/3 bg-black" />
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className="text-xs text-gray-400 mb-2">Projected</div>
                            <div className="flex justify-between items-end">
                                <div className="text-xl font-bold text-white">Stable</div>
                                <div className="h-8 w-20 flex items-end gap-1">
                                    {[40, 60, 45, 80, 55].map((h, i) => (
                                        <div key={i} className="flex-1 bg-primary" style={{ height: `${h}%`, opacity: 0.5 + (i * 0.1) }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <button className="w-full py-4 rounded-xl bg-primary text-black font-bold text-lg">
                            View Report
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Floating Elements / Orbitals */}
            <motion.div
                className="absolute bottom-32 -left-4 z-30"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className="glass px-4 py-3 rounded-2xl border border-white/10 shadow-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-black font-bold">
                        <ArrowUpRight />
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Growth</div>
                        <div className="text-white font-bold">+128%</div>
                    </div>
                </div>
            </motion.div>

        </div>
    );
}

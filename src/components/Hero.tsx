import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { HeroPhoneVisual } from "./HeroPhoneVisual";

export function Hero({ onGetStarted, onContactScroll }: { onGetStarted: () => void, onContactScroll: () => void }) {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-4 overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -z-10" />

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-left space-y-8"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-bold uppercase tracking-widest">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Next-Gen Financial Intelligence
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
                        Predict the Future of <br />
                        <span className="text-primary italic">Your Business.</span>
                    </h1>

                    <p className="text-lg lg:text-xl text-slate-400 max-w-xl leading-relaxed">
                        Axiom Finance combines AI-driven predictive modeling with high-fidelity financial visualization to help solo founders and freelancers navigate their cash flow with 99% confidence.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            onClick={onGetStarted}
                            className="btn-primary flex items-center justify-center gap-2 group text-lg py-4 px-8"
                        >
                            Get Started
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={onContactScroll}
                            className="px-8 py-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all text-lg"
                        >
                            Contact Support
                        </button>
                    </div>

                    <div className="flex items-center gap-8 pt-6 border-t border-white/5">
                        <div>
                            <div className="text-2xl font-bold text-white">99%</div>
                            <div className="text-xs text-slate-500 uppercase tracking-tighter">Accuracy</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">₹500M+</div>
                            <div className="text-xs text-slate-500 uppercase tracking-tighter">Analyzed</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">2.5k+</div>
                            <div className="text-xs text-slate-500 uppercase tracking-tighter">Founders</div>
                        </div>
                    </div>
                </motion.div>

                {/* Visual Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="relative"
                >
                    <HeroPhoneVisual />
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500 cursor-pointer flex flex-col items-center gap-2"
                onClick={onContactScroll}
            >
                <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Contact Us</span>
                <ChevronDown size={20} className="text-primary" />
            </motion.div>
        </section>
    );
}

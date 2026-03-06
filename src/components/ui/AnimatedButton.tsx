import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedButtonProps {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: "primary" | "secondary" | "accent";
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
}

export function AnimatedButton({
    children,
    onClick,
    className = "",
    variant = "primary",
    type = "button",
    disabled = false,
}: AnimatedButtonProps) {
    const variants = {
        primary: "bg-primary hover:bg-primary-hover text-black shadow-md shadow-primary/20 border border-primary/20",
        secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-md",
        accent: "bg-slate-700 hover:bg-slate-600 text-white shadow-md border border-slate-600/20",
    };

    return (
        <motion.button
            type={type}
            onClick={onClick}
            className={`
        relative overflow-hidden px-6 py-3 rounded-xl font-semibold
        transition-all duration-300 flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.95 }}
            disabled={disabled}
        >
            <span className="relative z-10">{children}</span>
            <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            />
        </motion.button>
    );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Send, User } from "lucide-react";
import { toast } from "sonner";

export function ContactUs() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            toast.success("Message sent! We'll get back to you soon.");
            setFormData({ name: "", email: "", message: "" });
            setIsSubmitting(false);
        }, 1500);
    };

    return (
        <section id="contact" className="py-24 px-4 bg-background relative overflow-hidden">
            {/* Decorative Blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[180px] -z-10" />

            <div className="max-w-4xl mx-auto">
                <div className="text-center space-y-4 mb-16">
                    <h2 className="text-4xl lg:text-5xl font-black text-white">Get in Touch</h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Have questions about Axiom? Our dedicated support team is here to help you scaling your business.
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="glass-card p-8 lg:p-12"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-2">
                                    <User size={14} className="text-primary" />
                                    Full Name
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Vagisha Mankad"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="glass-input h-14"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-2">
                                    <Mail size={14} className="text-primary" />
                                    Email Address
                                </label>
                                <input
                                    required
                                    type="email"
                                    placeholder="VagishaMankad@gmail.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="glass-input h-14"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-2">
                                <MessageSquare size={14} className="text-primary" />
                                Your Message
                            </label>
                            <textarea
                                required
                                rows={5}
                                placeholder="How can we help you?"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className="glass-input py-4 min-h-[150px]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary w-full h-16 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group transition-all"
                        >
                            {isSubmitting ? (
                                <div className="h-6 w-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    Send Message
                                    <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>

                <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                    <div className="space-y-2">
                        <div className="text-sm text-slate-500 uppercase font-black">Support</div>
                        <div className="text-white">support@axiom.finance</div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm text-slate-500 uppercase font-black">Twitter</div>
                        <div className="text-white">@AxiomFinance</div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm text-slate-500 uppercase font-black">Office</div>
                        <div className="text-white">Charusat College, Gujarat, India</div>
                    </div>
                </div>
            </div>
        </section>
    );
}

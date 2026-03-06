import { useState, useEffect } from "react";
import { X, Camera, Check, Link } from "lucide-react";
import { toast } from "sonner";
import { apiJson } from "../lib/api";
import { useAuth } from "../lib/useAuth";

interface User {
  name?: string;
  email?: string;
  image?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
}

export function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const { refresh } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [image, setImage] = useState(user?.image || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(user?.name || "");
      setEmail(user?.email || "");
      setImage(user?.image || "");
    }
  }, [isOpen, user]);

  const calculateCompleteness = () => {
    let score = 0;
    if (name) score += 40;
    if (email) score += 30;
    if (image) score += 30;
    return score;
  };

  const completeness = calculateCompleteness();

  const handleImageUpdate = () => {
    const url = window.prompt("Enter image URL:");
    if (url) setImage(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await apiJson("/api/auth/update", {
        method: "POST",
        body: JSON.stringify({ name, email, image }),
      });
      await refresh();
      toast.success("Profile updated successfully!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h2 className="text-2xl font-bold text-white mb-2">Profile Settings</h2>
          <p className="text-slate-400 text-sm">
            Complete your profile to unlock premium features
          </p>
        </div>

        {/* Profile Completeness */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-300">Profile Completeness</span>
            <span className="text-sm font-medium text-white">{completeness}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            ></div>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {image ? (
              <img
                src={image}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center">
                <span className="text-2xl text-primary font-bold">
                  {name ? name.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
            )}
            <button
              onClick={handleImageUpdate}
              className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-black hover:bg-primary-hover transition-colors"
            >
              <Camera size={16} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full glass-input"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full glass-input"
              placeholder="Enter your email"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-3 rounded-xl bg-primary text-black font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <Check size={18} />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
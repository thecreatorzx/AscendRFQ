import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, TrendingDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/Toast";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = "Email is required";
    if (!form.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid credentials";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-1 flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex w-105 shrink-0 bg-ink flex-col justify-between p-10">
        <div className="flex items-center gap-2">
          <TrendingDown size={18} className="text-white" />
          <span className="text-white text-sm font-medium tracking-tight">BritishRFQ</span>
        </div>
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-4">
            How it works
          </p>
          {[
            ["Buyer creates an RFQ", "Sets auction rules, invites suppliers"],
            ["Suppliers compete", "Place bids, undercutting each other"],
            ["Auto-extension fires", "If bids come in the last X minutes"],
            ["Forced close wins", "Auction ends, lowest bid wins"],
          ].map(([title, sub], i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              className="flex gap-3 mb-5"
            >
              <span className="text-white/20 text-xs font-mono mt-0.5 w-4 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-white text-xs font-medium">{title}</p>
                <p className="text-white/40 text-xs mt-0.5">{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-white/20 text-2xs">
          British Auction · RFQ System
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-85"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <TrendingDown size={16} className="text-ink" />
            <span className="text-sm font-medium tracking-tight">BritishRFQ</span>
          </div>

          <h1 className="text-base font-medium text-ink mb-1">Sign in</h1>
          <p className="text-xs text-ink-4 mb-6">
            Access your dashboard to manage auctions
          </p>

          <form onSubmit={submit} className="flex flex-col gap-3">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={set("email")}
              error={errors.email}
              prefix={<Mail size={11} />}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set("password")}
              error={errors.password}
              prefix={<Lock size={11} />}
            />

            <Button
              type="submit"
              loading={loading}
              className="mt-1 w-full"
              size="md"
            >
              Sign in
            </Button>
          </form>

          <p className="text-xs text-ink-4 mt-5 text-center">
            No account?{" "}
            <Link to="/register" className="text-ink underline-offset-2 hover:underline">
              Register
            </Link>
          </p>

          {/* Dev shortcut hints */}
          <div className="mt-8 p-3 bg-surface-2 rounded-lg border border-surface-3">
            <p className="text-2xs text-ink-4 font-medium mb-1.5">Dev credentials</p>
            <div className="flex flex-col gap-1">
              {[
                ["Buyer",      "buyer@test.com"],
                ["Supplier 1", "supplier1@test.com"],
                ["Supplier 2", "supplier2@test.com"],
              ].map(([role, email]) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => setForm({ email, password: "Password123" })}
                  className="text-left text-2xs text-ink-3 hover:text-ink transition-colors cursor-pointer"
                >
                  <span className="text-ink-4">{role}:</span> {email}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
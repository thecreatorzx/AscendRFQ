import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Building2, TrendingDown, Package } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/Toast";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { clsx } from "clsx";

const ROLES = [
  {
    key: "BUYER",
    label: "Buyer",
    icon: <Package size={14} />,
    description: "Create RFQs, invite suppliers, manage auctions",
  },
  {
    key: "SUPPLIER",
    label: "Supplier",
    icon: <TrendingDown size={14} />,
    description: "Accept invites, submit competitive bids",
  },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "BUYER",
    companyId: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setRole = (role) => setForm((f) => ({ ...f, role }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name      = "Name is required";
    if (!form.email.trim())    e.email     = "Email is required";
    if (form.password.length < 8) e.password = "Min 8 characters";
    if (!form.companyId.trim()) e.companyId = "Company ID is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-95"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <TrendingDown size={16} className="text-ink" />
          <span className="text-sm font-medium tracking-tight">BritishRFQ</span>
        </div>

        <h1 className="text-base font-medium text-ink mb-1">Create account</h1>
        <p className="text-xs text-ink-4 mb-6">
          Join as a buyer or supplier to participate in auctions
        </p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {/* Role selector */}
          <div className="flex flex-col gap-1">
            <p className="text-xs text-ink-3 font-medium tracking-wide">
              I am a
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <motion.button
                  key={r.key}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRole(r.key)}
                  className={clsx(
                    "flex flex-col gap-1.5 p-3 rounded-lg border text-left transition-all duration-150",
                    form.role === r.key
                      ? "border-ink bg-ink text-white"
                      : "border-surface-3 bg-white text-ink hover:border-ink/30"
                  )}
                >
                  <span
                    className={clsx(
                      "transition-colors",
                      form.role === r.key ? "text-white" : "text-ink-3"
                    )}
                  >
                    {r.icon}
                  </span>
                  <span className="text-xs font-medium">{r.label}</span>
                  <span
                    className={clsx(
                      "text-2xs leading-relaxed transition-colors",
                      form.role === r.key ? "text-white/60" : "text-ink-4"
                    )}
                  >
                    {r.description}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          <Input
            label="Full name"
            placeholder="Alice Buyer"
            value={form.name}
            onChange={set("name")}
            error={errors.name}
            prefix={<User size={11} />}
          />

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
            placeholder="Min 8 characters"
            value={form.password}
            onChange={set("password")}
            error={errors.password}
            prefix={<Lock size={11} />}
          />

          <Input
            label="Company ID"
            placeholder={
              form.role === "BUYER"
                ? "company-buyer-001"
                : "company-supplier-001"
            }
            value={form.companyId}
            onChange={set("companyId")}
            error={errors.companyId}
            prefix={<Building2 size={11} />}
            hint="Must match an existing company record"
          />

          {/* Password strength */}
          <AnimatePresence>
            {form.password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <PasswordStrength password={form.password} />
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            loading={loading}
            className="mt-1 w-full"
            size="md"
          >
            Create account
          </Button>
        </form>

        <p className="text-xs text-ink-4 mt-5 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-ink underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function PasswordStrength({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
  ];
  const passed = checks.filter(Boolean).length;
  const colors = ["bg-close", "bg-warn", "bg-bid"];
  const labels = ["Weak", "Fair", "Strong"];

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {checks.map((ok, i) => (
          <motion.div
            key={i}
            className={clsx(
              "h-0.5 flex-1 rounded-full transition-colors duration-300",
              i < passed ? colors[passed - 1] : "bg-surface-3"
            )}
            initial={false}
            animate={{ scaleX: i < passed ? 1 : 0.3 }}
            transition={{ duration: 0.2 }}
          />
        ))}
      </div>
      <span
        className={clsx(
          "text-2xs font-medium transition-colors",
          passed === 1 && "text-close",
          passed === 2 && "text-warn",
          passed === 3 && "text-bid"
        )}
      >
        {labels[passed - 1] || ""}
      </span>
    </div>
  );
}
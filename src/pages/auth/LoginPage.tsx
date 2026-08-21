import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { ROUTES } from "../../constants/routes";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate(ROUTES.DASHBOARD);
      } else {
        setErrorMsg(
          res.error || "Authentication failed. Please check your credentials.",
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lavender-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Card */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-lavender-600 to-indigo-500 flex items-center justify-center text-white shadow-glow border border-lavender-400/40">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            CCC Prep Admin
          </h1>
          <p className="text-sm text-dark-muted mt-1">
            Authorized Administrator Portal
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-background-card/90 backdrop-blur-xl border border-dark-border rounded-3xl p-8 shadow-card space-y-6">
          <div className="flex items-center gap-2 p-3 bg-lavender-500/10 border border-lavender-500/20 rounded-2xl text-xs text-lavender-300">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-lavender-400" />
            <span>
              Secured area: Mobile app users cannot access this panel.
            </span>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 animate-slide-up">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Admin Email"
              type="email"
              placeholder="email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="flex items-center justify-end text-xs pt-1">
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-lavender-400 hover:text-lavender-300 transition-colors font-medium"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Admin
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

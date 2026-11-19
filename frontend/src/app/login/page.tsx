"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import AppLogo from "@/components/AppLogo";
import { getCaptcha, loginWithPassword } from "@/lib/authApi";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [accountWarning, setAccountWarning] = useState<string | null>(null);

  const fetchCaptcha = async () => {
    try {
      const data = await getCaptcha();
      setCaptchaToken(data.token);
      setCaptchaQuestion(data.question);
      setCaptchaAnswer("");
    } catch {
      toast.error("Failed to load captcha");
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    if (!captchaToken || !captchaQuestion) {
      toast.error("Please wait for captcha to load");
      return;
    }
    if (!captchaAnswer) {
      toast.error("Please enter the captcha answer");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setAccountWarning(null);
    setLoading(true);
    try {
      await loginWithPassword({
        email,
        password,
        captchaToken,
        captchaAnswer,
      });
      toast.success("Login successful!");
      setTimeout(() => router.push("/"), 800);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Login failed.";
      if (message.toLowerCase().includes("no account found")) {
        setAccountWarning(message);
      } else {
        toast.error(message);
      }
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-astrogyan-boy/10 via-white to-astrogyan-girl/10 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <Toaster position="top-right" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-astrogyan-boy/20 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-astrogyan-girl/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <div className="relative max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AppLogo href="/login" height={100} />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setAccountWarning(null);
                }}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-astrogyan-boy/30 focus:border-astrogyan-boy text-gray-900"
                placeholder="you@example.com"
              />
              {accountWarning ? (
                <p
                  role="alert"
                  className="mt-2 text-sm font-medium text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2"
                >
                  {accountWarning}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-astrogyan-boy/30 focus:border-astrogyan-boy text-gray-900"
                placeholder="Enter password"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Solve to verify</label>
              {captchaQuestion ? (
                <div className="bg-gray-200 border-2 border-gray-400 rounded-xl p-4 mb-3 text-center">
                  <span className="text-2xl font-bold font-mono">{captchaQuestion}</span>
                </div>
              ) : null}
              {captchaQuestion && (
                <input
                  type="number"
                  required
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-astrogyan-boy/30 focus:border-astrogyan-boy text-center font-semibold"
                  placeholder="Your answer"
                />
              )}
              {captchaQuestion && (
                <button
                  type="button"
                  onClick={() => {
                    fetchCaptcha();
                    toast.success("Captcha regenerated!");
                  }}
                  className="mt-3 w-full py-2 border-2 border-purple-600 text-purple-600 font-semibold rounded-xl hover:bg-purple-600/10 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>New Question</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-astrogyan-boy hover:bg-astrogyan-boy-dark text-white font-semibold rounded-xl shadow-lg shadow-astrogyan-boy/25 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
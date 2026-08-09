"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Bot, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  Target, 
  Search, 
  HelpCircle, 
  Mail, 
  ShieldCheck,
  Zap,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

function OrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTier = searchParams.get("tier");
  const initialTier: 'starter' | 'professional' | 'enterprise' = 
    rawTier === 'professional' || rawTier === 'enterprise' ? rawTier : 'starter';

  const [tier, setTier] = useState<'starter' | 'professional' | 'enterprise'>(initialTier);
  
  const [formData, setFormData] = useState({
    business_name: "",
    business_description: "",
    industry: "",
    target_market: "",
    competitors: "",
    specific_questions: "",
    customer_email: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const competitorsArray = formData.competitors
        .split("\n")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          competitors: competitorsArray,
          tier,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to process order. Please try again.");
      }

      const data = await res.json();
      const origin = window.location.origin;
      if (data.url) {
        if (data.url.startsWith("http") && !data.url.startsWith(origin)) {
          window.location.href = data.url;
        } else {
          router.push(data.url.replace(origin, ""));
        }
      } else {
        router.push(`/report/${data.order_id}`);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const prices = {
    starter: "$49",
    professional: "$99",
    enterprise: "$149",
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans selection:bg-[#00E5FF] selection:text-[#020617]">
      {/* Background Lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20 bg-[#00E5FF] blur-[150px] rounded-full" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] opacity-15 bg-[#7C3AED] blur-[160px] rounded-full" />
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#00E5FF] flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#020617]" />
            </div>
            <span className="font-bold tracking-tight text-lg">Scope<span className="text-[#00E5FF]">AI</span> Order</span>
          </div>
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Gemini 3.6 Flash Ready
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 text-[#00E5FF] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Autonomous Intelligence Briefing
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">
            Commission Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#7C3AED]">AI Report</span>
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Provide details about your business and competitors. Our Gemini 3.6 agents will begin autonomous research immediately.
          </p>
        </div>

        {/* Tier Selector Tabs */}
        <div className="grid grid-cols-3 gap-3 mb-10 bg-white/5 p-1.5 rounded-xl border border-white/10 max-w-xl mx-auto">
          {(['starter', 'professional', 'enterprise'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTier(t)}
              className={`py-3 px-4 rounded-lg text-sm font-semibold capitalize transition-all duration-200 flex flex-col items-center gap-1 ${
                tier === t
                  ? 'bg-[#00E5FF] text-[#020617] shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{t}</span>
              <span className="text-xs opacity-80">{prices[t]}</span>
            </button>
          ))}
        </div>

        {/* Form Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden"
        >
          {loading && (
            <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full border-4 border-[#00E5FF]/20 border-t-[#00E5FF] animate-spin mb-6" />
              <h3 className="text-xl font-bold mb-2 text-white">Deploying Gemini 3.6 Flash Agents...</h3>
              <p className="text-slate-400 text-sm max-w-md animate-pulse">
                Investigator Agent is initializing competitor scrapers and market cross-references. Redirecting to live execution dashboard...
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center gap-3">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#00E5FF]" /> Your Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Cloud Analytics"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-[#00E5FF] transition-colors"
                />
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#7C3AED]" /> Industry / Niche *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B2B SaaS, E-Commerce, Coffee Roasting"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-[#00E5FF] transition-colors"
                />
              </div>
            </div>

            {/* Business Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                What does your business do? *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe your product/service, value proposition, and key features..."
                value={formData.business_description}
                onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-[#00E5FF] transition-colors"
              />
            </div>

            {/* Target Market */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Target Customer & Market Segment *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Small business owners in North America, Developers, Freelancers"
                value={formData.target_market}
                onChange={(e) => setFormData({ ...formData, target_market: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-[#00E5FF] transition-colors"
              />
            </div>

            {/* Competitors List */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-[#00E5FF]" /> Key Competitors (One per line) *
              </label>
              <textarea
                required
                rows={3}
                placeholder={`Competitor One (e.g. Stripe.com)\nCompetitor Two (e.g. Adyen.com)\nCompetitor Three`}
                value={formData.competitors}
                onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-[#00E5FF] transition-colors"
              />
            </div>

            {/* Specific Questions */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-slate-400" /> Specific Questions for the AI Agents (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. What is their pricing model? Where do customers complain about them most?"
                value={formData.specific_questions}
                onChange={(e) => setFormData({ ...formData, specific_questions: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-[#00E5FF] transition-colors"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#00E5FF]" /> Email to Receive Report *
              </label>
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-[#00E5FF] transition-colors"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] text-white py-4 px-6 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(0,229,255,0.3)] disabled:opacity-50"
              >
                <span>Launch Autonomous Agents ({prices[tier]})</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Instant Execution</span>
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-yellow-400" /> Powered by Gemini 3.6 Flash</span>
              </div>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030712] flex items-center justify-center text-slate-400 font-mono">
        Loading Order Form...
      </div>
    }>
      <OrderForm />
    </Suspense>
  );
}


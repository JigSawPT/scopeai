"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Sparkles, Play, CheckCircle2, Zap } from "lucide-react";
import Link from "next/link";

const PRESET_DEMOS = [
  {
    id: "b2b-saas",
    title: "AI Email Marketing SaaS",
    industry: "B2B Software",
    business_name: "MailPulse AI",
    business_description: "An automated email marketing platform that uses generative AI to write, personalize, and optimize B2B sales sequences.",
    target_market: "B2B SaaS companies, Sales teams, Agencies",
    competitors: "Mailchimp\nHubSpot Email\nInstantly.ai",
    specific_questions: "How do competitors price their AI features? What is their main customer churn cause?",
    tier: "professional" as const,
  },
  {
    id: "coffee-roasters",
    title: "Artisanal Specialty Coffee Export",
    industry: "Food & Beverage",
    business_name: "TerraCraft Coffee",
    business_description: "Direct-to-consumer sustainable coffee roasters sourcing single-origin beans directly from high-altitude farms in Colombia and Ethiopia.",
    target_market: "Coffee enthusiasts, Specialty cafes, Remote workers",
    competitors: "Blue Bottle Coffee\nTrade Coffee\nStumptown Coffee",
    specific_questions: "What organic certifications do competitors highlight? What subscription discounts do they offer?",
    tier: "starter" as const,
  },
  {
    id: "fintech-payroll",
    title: "Global Contractor Payroll Platform",
    industry: "Fintech",
    business_name: "PayFlow Global",
    business_description: "Automated crypto and fiat payroll solution for remote global teams with instant tax compliance in 50+ countries.",
    target_market: "Remote-first startups, International hiring managers",
    competitors: "Deel\nRippling\nOyster HR",
    specific_questions: "What are their transparent transaction fees vs hidden FX markups?",
    tier: "enterprise" as const,
  }
];

export default function DemoPage() {
  const router = useRouter();
  const [selectedDemo, setSelectedDemo] = useState(PRESET_DEMOS[0]);
  const [loading, setLoading] = useState(false);

  const handleRunDemo = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...selectedDemo,
          competitors: selectedDemo.competitors.split("\n").filter((c) => c.length > 0),
          customer_email: "judge@xprize.org",
        }),
      });

      if (!res.ok) {
        throw new Error("Demo execution failed");
      }

      const report = await res.json();
      router.push(`/report/${report.id}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans selection:bg-[#00E5FF] selection:text-[#020617]">
      {/* Background Lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 bg-[#00E5FF] blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] opacity-15 bg-[#7C3AED] blur-[160px] rounded-full" />
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#00E5FF] flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#020617]" />
            </div>
            <span className="font-bold tracking-tight text-lg">Scope<span className="text-[#00E5FF]">AI</span> XPRIZE Evaluation</span>
          </Link>
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Judge Sandbox Mode
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-400/30 bg-yellow-400/10 text-yellow-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5" /> Instant Live Demonstration for Judges
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">
            Test Gemini 2.5 Flash <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#7C3AED]">Autonomy</span>
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Select a preset business scenario or custom brief to witness the 3-agent Gemini pipeline execute live research, strategic cross-referencing, and report synthesis.
          </p>
        </div>

        {/* Demo Selector Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {PRESET_DEMOS.map((demo) => (
            <button
              key={demo.id}
              onClick={() => setSelectedDemo(demo)}
              className={`p-5 rounded-2xl text-left border transition-all relative overflow-hidden flex flex-col justify-between ${
                selectedDemo.id === demo.id
                  ? "bg-slate-900 border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.2)]"
                  : "bg-slate-950/60 border-white/10 hover:border-white/20 text-slate-300"
              }`}
            >
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#00E5FF] font-semibold block mb-1">
                  {demo.industry}
                </span>
                <h3 className="font-bold text-white mb-2 text-base">{demo.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {demo.business_description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Tier: {demo.tier}</span>
                {selectedDemo.id === demo.id && <CheckCircle2 className="w-4 h-4 text-[#00E5FF]" />}
              </div>
            </button>
          ))}
        </div>

        {/* Selected Demo Configuration Card */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl relative space-y-6">
          {loading && (
            <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center rounded-2xl">
              <div className="w-16 h-16 rounded-full border-4 border-[#00E5FF]/20 border-t-[#00E5FF] animate-spin mb-6" />
              <h3 className="text-xl font-bold mb-2 text-white">Gemini 2.5 Flash Pipeline Active</h3>
              <p className="text-slate-400 text-sm max-w-md animate-pulse">
                Investigator → Analyst → Writer executing live. Redirecting to real-time agent telemetry console...
              </p>
            </div>
          )}

          <div className="border-b border-white/10 pb-4 flex items-center justify-between">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00E5FF]" /> {selectedDemo.business_name} Sandbox Brief
            </h3>
            <span className="text-xs font-mono text-[#00E5FF] bg-[#00E5FF]/10 px-3 py-1 rounded-full border border-[#00E5FF]/30">
              Preset Brief
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-1">
              <strong className="text-slate-400 block font-mono uppercase text-[10px]">Business Description</strong>
              <p className="text-slate-200 leading-relaxed">{selectedDemo.business_description}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-1">
              <strong className="text-slate-400 block font-mono uppercase text-[10px]">Target Competitors</strong>
              <p className="text-slate-200 font-mono whitespace-pre-line">{selectedDemo.competitors}</p>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-2">
            <button
              onClick={handleRunDemo}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] text-white py-4 px-6 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,229,255,0.4)] disabled:opacity-50"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Execute Live Gemini Agent Pipeline</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Bot, 
  Terminal as TerminalIcon, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Download, 
  Share2, 
  ArrowLeft,
  Sparkles,
  Zap,
  Activity,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Search
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AgentLogEntry, Report } from "@/lib/agents/types";

export default function ReportPage() {
  const params = useParams();
  const reportId = params?.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!reportId) return;

    let isMounted = true;

    async function fetchReport() {
      try {
        const res = await fetch(`/api/logs?id=${reportId}`);
        if (!res.ok) {
          throw new Error("Report not found");
        }
        const data = await res.json();
        if (isMounted) {
          if (data.report) {
            setReport(data.report);
            setLogs(data.report.logs || []);
          } else if (data.logs) {
            setLogs(data.logs);
          }
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load report");
          setLoading(false);
        }
      }
    }

    fetchReport();
    const interval = setInterval(fetchReport, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [reportId]);

  const handleCopyMarkdown = () => {
    if (report?.markdown) {
      navigator.clipboard.writeText(report.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getAgentBadgeColor = (agent: string) => {
    switch (agent) {
      case "INVESTIGATOR":
        return "text-[#00E5FF] border-[#00E5FF]/30 bg-[#00E5FF]/10";
      case "ANALYST":
        return "text-[#7C3AED] border-[#7C3AED]/30 bg-[#7C3AED]/10";
      case "WRITER":
        return "text-[#EC4899] border-[#EC4899]/30 bg-[#EC4899]/10";
      default:
        return "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans selection:bg-[#00E5FF] selection:text-[#020617]">
      {/* Glow Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[300px] opacity-15 bg-[#00E5FF] blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[300px] opacity-15 bg-[#7C3AED] blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#00E5FF] flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#020617]" />
            </div>
            <span className="font-bold tracking-tight text-lg">Scope<span className="text-[#00E5FF]">AI</span> Agent Telemetry</span>
          </div>
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
            Live Execution
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Title Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-slate-300 mb-2">
              <Activity className="w-3.5 h-3.5 text-[#00E5FF]" /> Order ID: {reportId.slice(0, 8)}...
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Competitive Intelligence <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#7C3AED]">Dashboard</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {report?.markdown && (
              <>
                <button
                  onClick={handleCopyMarkdown}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied Markdown" : "Copy Markdown"}
                </button>

                <button
                  onClick={() => window.print()}
                  className="bg-[#00E5FF] text-[#020617] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#00E5FF]/90 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status / Telemetry Box */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Agent Execution Logs Console */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <TerminalIcon className="w-5 h-5 text-[#00E5FF]" /> Agent Execution Logs
              </h2>
              <span className="text-xs font-mono text-slate-500">{logs.length} events logged</span>
            </div>

            <div className="bg-slate-950 border border-white/10 rounded-2xl p-4 font-mono text-xs h-[600px] overflow-y-auto space-y-3 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-6">
                  <Clock className="w-8 h-8 mb-2 animate-spin text-[#00E5FF]" />
                  <p>Waiting for agent pipeline to initialize...</p>
                </div>
              ) : (
                logs.map((log, index) => (
                  <motion.div
                    key={log.id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg bg-slate-900/80 border border-white/5 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <span className={`px-2 py-0.5 rounded border font-semibold ${getAgentBadgeColor(log.agent)}`}>
                        {log.agent}
                      </span>
                      <span className="text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-slate-200 font-semibold text-xs pt-1">{log.action}</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{log.details}</p>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Generated Report Display */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#7C3AED]" /> Deliverable Report
              </h2>
              {report && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                </span>
              )}
            </div>

            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl min-h-[600px] overflow-y-auto">
              {!report ? (
                <div className="h-[500px] flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] animate-pulse">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">AI Agents Operating in Production</h3>
                    <p className="text-slate-400 text-sm max-w-md">
                      Gemini 3.6 Flash Investigator and Analyst agents are currently executing strategic synthesis. The final report will stream here automatically.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none space-y-6">
                  {/* Executive Summary Card */}
                  <div className="p-6 rounded-xl bg-gradient-to-r from-[#00E5FF]/10 to-[#7C3AED]/10 border border-[#00E5FF]/20">
                    <h3 className="text-lg font-bold text-[#00E5FF] mb-2 flex items-center gap-2">
                      <Zap className="w-5 h-5" /> Executive Summary
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {report.content.executive_summary}
                    </p>
                  </div>

                  {/* Competitor Analysis Breakdown */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Competitor Breakdown</h3>
                    <div className="grid gap-4">
                      {report.content.competitors.map((comp, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-2">
                          <h4 className="font-bold text-[#00E5FF]">{comp.name}</h4>
                          <p className="text-xs text-slate-400">{comp.market_position}</p>
                          <div className="grid sm:grid-cols-2 gap-4 text-xs pt-2">
                            <div>
                              <strong className="text-emerald-400 block mb-1">Strengths:</strong>
                              <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                                {comp.strengths.map((s, i) => <li key={i}>{s}</li>)}
                              </ul>
                            </div>
                            <div>
                              <strong className="text-rose-400 block mb-1">Weaknesses:</strong>
                              <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                                {comp.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strategic Opportunities & Recommendations */}
                  <div className="grid md:grid-cols-2 gap-6 pt-4">
                    <div className="p-5 rounded-xl bg-slate-950 border border-white/10">
                      <h4 className="font-bold text-[#7C3AED] mb-3">Strategic Opportunities</h4>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {report.content.opportunities.map((opp, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[#7C3AED]">•</span> {opp}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-5 rounded-xl bg-slate-950 border border-white/10">
                      <h4 className="font-bold text-[#00E5FF] mb-3">Actionable Recommendations</h4>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {report.content.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[#00E5FF]">•</span> {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Verified Web Search Sources */}
                  {report.all_sources && report.all_sources.length > 0 && (
                    <div className="p-5 rounded-xl bg-slate-950 border border-emerald-500/20">
                      <h4 className="font-bold text-emerald-400 mb-3 flex items-center gap-2 text-sm">
                        <Search className="w-4 h-4" /> Verified Web Sources & Citations ({report.all_sources.length})
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-2 text-xs">
                        {report.all_sources.map((src, i) => (
                          <a 
                            key={i}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-slate-300 hover:text-emerald-300 transition-colors flex items-center justify-between gap-2 group truncate"
                          >
                            <span className="truncate font-medium">{src.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full Markdown Report — Rendered */}
                  <div className="pt-6 border-t border-white/10">
                    <h3 className="text-lg font-bold mb-4">Complete Generated Report</h3>
                    <div className="p-6 md:p-8 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4 pb-2 border-b border-white/10">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-xl font-bold text-[#00E5FF] mt-8 mb-3">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-lg font-semibold text-[#7C3AED] mt-6 mb-2">{children}</h3>,
                          h4: ({ children }) => <h4 className="text-base font-semibold text-slate-200 mt-4 mb-1.5">{children}</h4>,
                          p: ({ children }) => <p className="text-sm text-slate-300 leading-relaxed mb-3">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside text-sm text-slate-300 space-y-1 mb-3 ml-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside text-sm text-slate-300 space-y-1 mb-3 ml-2">{children}</ol>,
                          li: ({ children }) => <li className="text-slate-300">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({ children }) => <em className="text-slate-400 italic">{children}</em>,
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#00E5FF] hover:text-[#00E5FF]/80 underline underline-offset-2 transition-colors inline-flex items-center gap-1">
                              {children}<ExternalLink className="w-3 h-3 inline" />
                            </a>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 border-[#7C3AED] pl-4 py-1 my-3 bg-[#7C3AED]/5 rounded-r-lg text-sm text-slate-300 italic">{children}</blockquote>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-4 rounded-lg border border-white/10">
                              <table className="w-full text-xs text-left">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-slate-800/80 text-[#00E5FF] uppercase text-[10px] tracking-wider">{children}</thead>,
                          tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
                          tr: ({ children }) => <tr className="hover:bg-white/5 transition-colors">{children}</tr>,
                          th: ({ children }) => <th className="px-3 py-2 font-semibold">{children}</th>,
                          td: ({ children }) => <td className="px-3 py-2 text-slate-300">{children}</td>,
                          code: ({ children, className }) => {
                            const isBlock = className?.includes('language-');
                            if (isBlock) {
                              return <pre className="bg-slate-900 rounded-lg p-4 my-3 overflow-x-auto text-xs font-mono text-slate-300 border border-white/5"><code>{children}</code></pre>;
                            }
                            return <code className="bg-slate-800 text-[#00E5FF] px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>;
                          },
                          hr: () => <hr className="my-6 border-white/10" />,
                        }}
                      >
                        {report.markdown}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { fetchUserRepos, fetchRepoMetrics } from "@/lib/github";
import { calculateMetrics, DevOpsMetrics } from "@/lib/metrics";
import { generateDevOpsInsights } from "@/lib/ai";
import { saveMetricsSnapshot } from "@/lib/supabase";
import { DevOpsCharts } from "@/components/DevOpsCharts";
import {
  BarChart3,
  Github,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Loader2,
  ChevronRight
} from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DevOpsMetrics | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeAnalysisId = useRef(0);

  useEffect(() => {
    if (session?.accessToken) {
      fetchUserRepos(session.accessToken as string)
        .then(setRepos)
        .catch((err) => setError("Failed to fetch repositories"));
    }
  }, [session]);

  const analyzeRepo = async (repoFullName: string) => {
    if (!session?.accessToken) return;

    const analysisId = ++activeAnalysisId.current;
    setLoading(true);
    setError(null);
    setSelectedRepo(repoFullName);

    try {
      const [owner, repo] = repoFullName.split("/");
      const rawData = await fetchRepoMetrics(session.accessToken as string, owner, repo);
      const computedMetrics = calculateMetrics(rawData);

      if (analysisId !== activeAnalysisId.current) return;

      setMetrics(computedMetrics);

      const aiInsights = await generateDevOpsInsights(repoFullName, computedMetrics);

      if (analysisId !== activeAnalysisId.current) return;

      setInsights(aiInsights || null);

      // Save to Supabase (optional, handle errors silently for now)
      try {
        await saveMetricsSnapshot(repoFullName, computedMetrics);
      } catch (e) {
        console.error("Supabase save error:", e);
      }

    } catch (err) {
      if (analysisId !== activeAnalysisId.current) return;

      console.error(err);
      setError("Analysis failed. Please check repository permissions.");
    } finally {
      if (analysisId === activeAnalysisId.current) {
        setLoading(false);
      }
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="flex justify-center">
            <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200">
              <BarChart3 className="w-12 h-12 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">DeployMind</h1>
            <p className="text-slate-500 text-lg">AI-Powered DevOps Intelligence Dashboard</p>
          </div>
          <button
            onClick={() => signIn("github")}
            className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl"
          >
            <Github className="w-5 h-5" />
            Sign in with GitHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar / Header */}
      <header className="bg-white border-bottom border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span className="font-bold text-xl tracking-tight">DeployMind</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {session.user?.name}
            </div>
            <button
              onClick={() => signOut()}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Repository List */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-indigo-500" />
                  Repositories
                </h2>
                <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">
                  {repos.length}
                </span>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search repos..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {repos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => analyzeRepo(repo.full_name)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${selectedRepo === repo.full_name
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                        : "bg-white border-transparent hover:border-slate-200 hover:bg-slate-50"
                      }`}
                  >
                    <div className="truncate">
                      <p className="font-semibold text-sm truncate">{repo.name}</p>
                      <p className="text-xs opacity-60 truncate">{repo.owner.login}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedRepo === repo.full_name ? "translate-x-1" : "opacity-0 group-hover:opacity-100"}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis Dashboard */}
          <div className="lg:col-span-8 space-y-8">
            {loading ? (
              <div className="bg-white rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4 border border-slate-100 shadow-sm">
                <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" />
                <div>
                  <h3 className="text-xl font-bold">Analyzing Repository</h3>
                  <p className="text-slate-500">Extracting DORA metrics and generating AI insights...</p>
                </div>
              </div>
            ) : metrics ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Health Score & Warning */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-indigo-600 rounded-2xl p-8 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-indigo-100 font-medium mb-1">DevOps Health Score</p>
                      <div className="flex items-end gap-4">
                        <h2 className="text-6xl font-black">{metrics.healthScore}</h2>
                        <span className="text-2xl font-bold opacity-60 mb-2">/ 100</span>
                      </div>
                      <p className="mt-4 text-indigo-100/80 text-sm max-w-md">
                        Based on deployment frequency, success rates, and build efficiency.
                      </p>
                    </div>
                    <Zap className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12" />
                  </div>

                  <div className={`rounded-2xl p-8 flex flex-col justify-center items-center text-center border-2 ${metrics.successRate < 70
                      ? "bg-red-50 border-red-100 text-red-700"
                      : "bg-green-50 border-green-100 text-green-700"
                    }`}>
                    {metrics.successRate < 70 ? (
                      <>
                        <ShieldAlert className="w-12 h-12 mb-4" />
                        <h3 className="font-bold text-xl">High Risk</h3>
                        <p className="text-sm opacity-80">Success rate is below 70% threshold.</p>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-12 h-12 mb-4" />
                        <h3 className="font-bold text-xl">Healthy</h3>
                        <p className="text-sm opacity-80">Pipeline stability is within optimal range.</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Deploy Freq", value: `${metrics.deploymentFrequency.toFixed(1)}/wk`, sub: "Runs" },
                    { label: "Success Rate", value: `${metrics.successRate.toFixed(0)}%`, sub: "Stability" },
                    { label: "Avg Build", value: `${metrics.avgBuildTime.toFixed(1)}m`, sub: "Duration" },
                    { label: "PR Merge", value: `${metrics.prMergeFrequency.toFixed(1)}/wk`, sub: "Velocity" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <DevOpsCharts metrics={metrics} />

                {/* AI Insights */}
                {insights && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="bg-slate-900 p-4 flex items-center gap-2 text-white">
                      <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <h3 className="font-bold text-sm tracking-wide uppercase">AI-Powered Insights</h3>
                    </div>
                    <div className="p-8 prose prose-slate max-w-none">
                      <div className="markdown-body">
                        <Markdown remarkPlugins={[remarkGfm]}>{insights}</Markdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-6 border border-slate-100 shadow-sm">
                <div className="p-4 bg-slate-50 rounded-full">
                  <LayoutDashboard className="w-12 h-12 text-slate-300" />
                </div>
                <div className="max-w-xs">
                  <h3 className="text-xl font-bold">No Repository Selected</h3>
                  <p className="text-slate-500 mt-2">Choose a repository from the left panel to begin DevOps analysis.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .markdown-body h1, .markdown-body h2, .markdown-body h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 700;
        }
        .markdown-body p {
          margin-bottom: 1em;
          line-height: 1.6;
        }
        .markdown-body ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin-bottom: 1em;
        }
        .markdown-body li {
          margin-bottom: 0.5em;
        }
      `}</style>
    </div>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  RefreshCw,
  Zap,
  AlertTriangle,
  Lightbulb,
  Target,
  Clock,
  TrendingUp
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface MagicSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  metrics: {
    website?: any;
    advertising?: any;
    social?: any;
    seo?: any;
  };
}

const MagicSuggestionModal = ({ isOpen, onClose, projectId, metrics }: MagicSuggestionModalProps) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async (forceRegenerate: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post("/ai/generate-overview", {
        projectId,
        metrics,
        forceRegenerate,
      });

      if (data.success) {
        setAnalysis(data.data.analysis);
        setFromCache(data.data.fromCache);
        setGeneratedAt(new Date(data.data.generatedAt));
      } else {
        setError(data.error || "Failed to generate analysis");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to generate analysis");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on open if not already loaded
  const handleOpen = () => {
    if (!analysis && !loading) {
      fetchAnalysis();
    }
  };

  if (isOpen && !analysis && !loading && !error) {
    handleOpen();
  }

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="bg-gradient-to-b from-slate-50 to-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
              <div className="relative px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Sparkles className="h-7 w-7 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Magic Suggestions</h2>
                      <p className="text-white/80 text-sm font-medium">Your personalized marketing insights</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2.5 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Status Bar */}
            {analysis && !loading && !error && (
              <div className="px-6 py-3 bg-slate-100/80 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${fromCache
                        ? "bg-blue-100 text-blue-700"
                        : "bg-emerald-100 text-emerald-700"
                      }`}>
                      {fromCache ? (
                        <>
                          <Clock className="h-3.5 w-3.5" />
                          Cached
                        </>
                      ) : (
                        <>
                          <Zap className="h-3.5 w-3.5" />
                          Fresh
                        </>
                      )}
                    </div>
                    {generatedAt && (
                      <span className="text-xs text-slate-500">
                        Generated {formatTime(generatedAt)}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchAnalysis(true)}
                    disabled={loading}
                    className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 gap-1.5 text-xs font-semibold"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    Regenerate
                  </Button>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative">
                    <motion.div
                      className="absolute inset-0 rounded-full bg-violet-400/30"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="relative p-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg"
                    >
                      <Sparkles className="h-8 w-8 text-white" />
                    </motion.div>
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-lg font-semibold text-slate-800">Analyzing your data...</p>
                    <p className="text-slate-500 text-sm mt-1">AI is reviewing your metrics</p>
                  </div>
                  <div className="flex gap-1 mt-4">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-violet-500 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="p-4 bg-red-100 rounded-2xl">
                    <AlertTriangle className="h-10 w-10 text-red-500" />
                  </div>
                  <p className="mt-5 text-lg font-semibold text-slate-800">Something went wrong</p>
                  <p className="text-slate-500 text-sm text-center max-w-sm mt-2">{error}</p>
                  <Button
                    onClick={() => fetchAnalysis(true)}
                    className="mt-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : analysis ? (
                <div className="space-y-1">
                  <div className="prose-container">
                    <ReactMarkdown
                      components={{
                        h2: ({ children }) => {
                          const text = String(children);
                          let icon = <TrendingUp className="h-5 w-5" />;
                          let bgColor = "from-slate-100 to-slate-50";
                          let iconBg = "bg-slate-200 text-slate-600";
                          let borderColor = "border-slate-200";

                          if (text.includes("Attention") || text.includes("🔴")) {
                            icon = <AlertTriangle className="h-5 w-5" />;
                            bgColor = "from-red-50 to-orange-50";
                            iconBg = "bg-red-100 text-red-600";
                            borderColor = "border-red-200";
                          } else if (text.includes("Action") || text.includes("✅")) {
                            icon = <Target className="h-5 w-5" />;
                            bgColor = "from-emerald-50 to-green-50";
                            iconBg = "bg-emerald-100 text-emerald-600";
                            borderColor = "border-emerald-200";
                          } else if (text.includes("Quick Win") || text.includes("💡")) {
                            icon = <Lightbulb className="h-5 w-5" />;
                            bgColor = "from-amber-50 to-yellow-50";
                            iconBg = "bg-amber-100 text-amber-600";
                            borderColor = "border-amber-200";
                          }

                          return (
                            <div className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${bgColor} rounded-xl border ${borderColor} mt-6 mb-4 first:mt-0`}>
                              <div className={`p-2 rounded-lg ${iconBg}`}>
                                {icon}
                              </div>
                              <h2 className="text-lg font-bold text-slate-800 m-0">
                                {text.replace(/🔴|✅|💡/g, '').trim()}
                              </h2>
                            </div>
                          );
                        },
                        h3: ({ children }) => (
                          <h3 className="text-base font-semibold text-slate-800 mt-5 mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-slate-600 mb-4 leading-relaxed text-[15px] pl-1">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="space-y-3 mb-5 pl-1">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="space-y-3 mb-5 pl-1 counter-reset-item">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="flex gap-3 text-slate-600 text-[15px] leading-relaxed">
                            <span className="flex-shrink-0 w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                              •
                            </span>
                            <span className="flex-1">{children}</span>
                          </li>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-slate-800">{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em className="text-violet-600 not-italic font-medium">{children}</em>
                        ),
                      }}
                    >
                      {analysis}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Powered by AI • Cached for 6 hours</span>
                </div>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-slate-300 hover:bg-slate-100"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MagicSuggestionModal;

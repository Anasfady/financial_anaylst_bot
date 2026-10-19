import React, { useState } from "react";
import {
  ShieldAlert,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

type ExecutionMetrics = {
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number | null;
  latency_ms: number;
  provider: string;
  model: string;
  usage_is_estimated: boolean;
};

type FinTechTriageOutput = {
  thought_process: string;
  category: string;
  urgency: string;
  summary: string;
  assigned_department: string;
  metadata: ExecutionMetrics;
};

type CompareResponse = {
  external: FinTechTriageOutput | null;
  ollama: FinTechTriageOutput | null;
  errors: Record<string, string>;
};

export default function App() {
  const [incidentText, setIncidentText] = useState("");
  const [provider, setProvider] = useState("compare");
  const [loading, setLoading] = useState(false);

  const [aiResult, setAiResult] = useState<FinTechTriageOutput | null>(null);
  const [compareResults, setCompareResults] = useState<CompareResponse | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [reviewUrgency, setReviewUrgency] = useState("");
  const [reviewDept, setReviewDept] = useState("");
  const [reviewStatus, setReviewStatus] = useState<{
    status: "approved" | "rejected";
    msg: string;
  } | null>(null);

  const handleRunTriage = async () => {
    if (!incidentText.trim()) {
      setErrorMsg("Please enter an incident description.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setAiResult(null);
    setCompareResults(null);
    setReviewStatus(null);

    try {
      const endpoint = provider === "compare" ? "/compare" : "/triage";
      const payload = {
        text: incidentText,
        provider: provider === "compare" ? "compare" : provider,
      };

      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Backend validation error");
      }

      const data = await res.json();

      if (provider === "compare") {
        setCompareResults(data);
      } else {
        setAiResult(data);
        setReviewUrgency(data.urgency);
        setReviewDept(data.assigned_department);
      }
    } catch (err: any) {
      setErrorMsg(
        err.message === "Failed to fetch"
          ? "Cannot connect to backend. Is FastAPI running on port 8000?"
          : err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = (action: "approve" | "reject") => {
    if (action === "approve") {
      setReviewStatus({
        status: "approved",
        msg: `Successfully registered to ${reviewDept} as ${reviewUrgency} priority. AI recommendation preserved in audit log.`,
      });
    } else {
      setReviewStatus({
        status: "rejected",
        msg: "Case rejected. Flagged for manual escalation and AI review.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans text-slate-800 bg-slate-50">
      <div className="w-full md:w-96 bg-white border-r border-slate-200 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-2 text-blue-900">
          <ShieldAlert className="w-8 h-8" />
          <h1 className="text-xl font-bold">FinTech Triage Ops</h1>
        </div>
        <p className="text-xs text-slate-500 mb-6 italic">
          Prototype environment. Human approval required.
        </p>

        <h2 className="font-semibold text-sm mb-2 uppercase tracking-wider text-slate-600">
          1. Incident Intake
        </h2>

        <label className="block text-sm font-medium text-slate-700 mb-1">
          Customer Claim:
        </label>
        <textarea
          className="w-full h-44 p-3 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm mb-4"
          placeholder="Paste unstructured customer complaint here..."
          value={incidentText}
          onChange={(e) => setIncidentText(e.target.value)}
        />

        <label className="block text-sm font-medium text-slate-700 mb-1">
          Execution Strategy:
        </label>
        <select
          className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm mb-6"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        >
          <option value="compare">Compare Both</option>
          <option value="groq">Groq Cloud (GPT-OSS-120B)</option>
          <option value="ollama">Local (TinyLlama)</option>
        </select>

        <button
          onClick={handleRunTriage}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {loading ? <Activity className="animate-spin w-5 h-5" /> : null}
          {loading ? "Processing..." : "Run Triage"}
        </button>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm">
            {errorMsg}
          </div>
        )}
      </div>

      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        {!aiResult && !compareResults && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
            <ShieldAlert className="w-16 h-16 mb-4 text-slate-300" />
            <p>
              Enter an incident claim and run triage to inspect AI
              classifications.
            </p>
          </div>
        )}

        {aiResult && (
          <div className="max-w-4xl mx-auto">
            <h2 className="font-semibold text-lg mb-4 text-slate-800 border-b pb-2">
              2. AI Recommendation
            </h2>

            {aiResult.metadata.provider === "ollama-mock" && (
              <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-sm flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>
                  <strong>Local Mock Mode active:</strong> Ollama daemon not
                  running. Using fallback response.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Category
                </p>
                <p className="font-semibold text-blue-900">
                  {aiResult.category}
                </p>
              </div>
              <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Urgency
                </p>
                <p
                  className={`font-semibold ${aiResult.urgency === "Critical" || aiResult.urgency === "High" ? "text-red-600" : "text-amber-600"}`}
                >
                  {aiResult.urgency}
                </p>
              </div>
              <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Routing
                </p>
                <p className="font-semibold text-slate-800">
                  {aiResult.assigned_department}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded border border-slate-200 shadow-sm mb-6">
              <p className="text-sm font-medium mb-2">
                <span className="text-slate-500">Summary:</span>{" "}
                {aiResult.summary}
              </p>
              <p className="text-sm">
                <span className="text-slate-500">Decision Rationale:</span>{" "}
                {aiResult.thought_process}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-slate-500 bg-slate-100 p-3 rounded mb-8">
              <span>
                <strong>Provider:</strong> {aiResult.metadata.provider}
              </span>
              <span>
                <strong>Model:</strong> {aiResult.metadata.model}
              </span>
              <span>
                <strong>Latency:</strong> {aiResult.metadata.latency_ms}ms
              </span>
              <span>
                <strong>Tokens:</strong> {aiResult.metadata.input_tokens} in /{" "}
                {aiResult.metadata.output_tokens} out
              </span>
              <span>
                <strong>Est. Cost:</strong>{" "}
                {aiResult.metadata.estimated_cost_usd !== null
                  ? `$${aiResult.metadata.estimated_cost_usd.toFixed(6)}`
                  : "N/A"}
              </span>
            </div>

            <h2 className="font-semibold text-lg mb-4 text-slate-800 border-b pb-2">
              3. Human Review & Approval
            </h2>
            <div className="bg-white p-6 rounded border border-blue-100 shadow-sm border-t-4 border-t-blue-500">
              <p className="text-sm text-slate-600 mb-4">
                Review the AI recommendation. Adjust values if needed prior to
                registration.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Confirm/Adjust Urgency
                  </label>
                  <select
                    className="w-full p-2 border border-slate-300 rounded-md text-sm"
                    value={reviewUrgency}
                    onChange={(e) => setReviewUrgency(e.target.value)}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Confirm/Adjust Routing
                  </label>
                  <select
                    className="w-full p-2 border border-slate-300 rounded-md text-sm"
                    value={reviewDept}
                    onChange={(e) => setReviewDept(e.target.value)}
                  >
                    <option>Fraud Ops</option>
                    <option>Payments IT</option>
                    <option>Compliance/AML</option>
                    <option>Customer Support Tier 1</option>
                    <option>Customer Support Tier 2</option>
                    <option>Escalations</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => handleReviewSubmit("approve")}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Approve & Register
                </button>
                <button
                  onClick={() => handleReviewSubmit("reject")}
                  className="flex-1 bg-white border border-red-300 hover:bg-red-50 text-red-600 font-semibold py-2 px-4 rounded flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Reject Case
                </button>
              </div>

              {reviewStatus && (
                <div
                  className={`mt-4 p-3 rounded text-sm border ${reviewStatus.status === "approved" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}
                >
                  {reviewStatus.msg}
                </div>
              )}
            </div>
          </div>
        )}

        {compareResults && (
          <div className="max-w-6xl mx-auto">
            <h2 className="font-semibold text-lg mb-4 text-slate-800 border-b pb-2">
              Model Comparison: External vs. Local
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProviderCard
                title={
                  compareResults.external?.metadata?.provider === "groq"
                    ? "Groq Cloud"
                    : "External Provider"
                }
                data={compareResults.external}
              />
              <ProviderCard
                title="Local Pipeline"
                data={compareResults.ollama}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProviderCard({
  title,
  data,
}: {
  title: string;
  data: FinTechTriageOutput | null;
}) {
  if (!data) {
    return (
      <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex items-center justify-center h-64 text-slate-400">
        No data returned.
      </div>
    );
  }

  return (
    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-100 p-3 border-b border-slate-200 font-semibold text-slate-700 flex items-center justify-between">
        <span>{title}</span>
        <span className="text-xs font-normal text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
          {data.metadata.model || "Unknown Model"}
        </span>
      </div>
      <div className="p-5">
        {data.metadata.provider === "ollama-mock" && (
          <div className="mb-4 text-xs p-2 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" /> Local Mock Mode active.
          </div>
        )}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-sm text-slate-500">Category</span>
            <span className="text-sm font-medium">{data.category}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-sm text-slate-500">Urgency</span>
            <span
              className={`text-sm font-bold ${data.urgency === "Critical" || data.urgency === "High" ? "text-red-600" : "text-slate-800"}`}
            >
              {data.urgency}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-sm text-slate-500">Routing</span>
            <span className="text-sm font-medium">
              {data.assigned_department}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Summary
          </p>
          <p className="text-sm bg-slate-50 p-2 rounded">{data.summary}</p>
        </div>

        <div className="mb-6">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Rationale
          </p>
          <p className="text-sm text-slate-600">{data.thought_process}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
          <span>⏱️ {data.metadata.latency_ms}ms</span>
          <span>
            🪙 {data.metadata.input_tokens} / {data.metadata.output_tokens} tok
          </span>
          <span>
            💸{" "}
            {data.metadata.estimated_cost_usd !== null
              ? `$${data.metadata.estimated_cost_usd.toFixed(6)}`
              : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}

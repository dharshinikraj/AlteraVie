import ChatBot from "../components/ChatBot";
import { BookOpenCheck, Database, ShieldCheck, Sparkles } from "lucide-react";

export default function ChatAssistant() {
  return (
    <div className="max-w-4xl mx-auto px-0 sm:px-6 py-0 sm:py-7">
      <section className="px-4 sm:px-0 pt-5 sm:pt-0 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[.16em] font-extrabold text-emerald-600 dark:text-emerald-300">RAG nutrition companion</p>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-950 dark:text-white mt-1">Ask AlteraVie AI</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl">Answers are generated from retrieved nutrition evidence and your available health context.</p>
          </div>
          <div className="hidden sm:flex source-pill mt-1"><Sparkles className="w-3.5 h-3.5" /> RAG live</div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <TrustChip icon={BookOpenCheck} text="PubMed evidence" />
          <TrustChip icon={Database} text="USDA food data" />
          <TrustChip icon={ShieldCheck} text="Safety guardrails" />
        </div>
      </section>
      <ChatBot isOpenDefault={true} />
    </div>
  );
}

function TrustChip({ icon: Icon, text }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap"><Icon className="w-3.5 h-3.5 text-emerald-600" />{text}</span>;
}

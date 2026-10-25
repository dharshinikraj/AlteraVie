import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X, Bot, User, Camera, Sparkles, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, MapPin, Award, BookOpen, Clock, Flame } from "lucide-react";
import { api } from "../api/client";
import { useAssessment } from "../context/AssessmentContext";

export default function ChatBot({ isOpenDefault = false }) {
  const { profile, user } = useAssessment();
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: `Hi ${profile?.name || "there"}! I’m **AlteraVie AI**. Ask about nutrition, your available health context, or a food choice. I’ll retrieve current evidence and show the sources used in my answer.`,
      citations: [],
      widget: null,
      suggestedPrompts: [
        "Why am I tired in the afternoon?",
        "What breakfast should I eat today?",
        "Is raw or cooked spinach better for calcium?",
        "Find a clinical dietitian near me"
      ]
    }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCitationsIndex, setShowCitationsIndex] = useState({});

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Hide floating chatbot trigger button if user is not logged in
  if (!user && !isOpenDefault) {
    return null;
  }

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMsg;
    if (!textToSend.trim() && !imagePreview) return;

    const userMessageObj = {
      sender: "user",
      text: textToSend,
      image: imagePreview
    };

    setMessages((prev) => [...prev, userMessageObj]);
    setInputMsg("");
    setImagePreview(null);
    setLoading(true);

    try {
      const response = await api.chat({
        message: textToSend,
        user_profile: profile,
        image_base64: imagePreview
      });

      const botMsgObj = {
        sender: "bot",
        text: response.reply,
        citations: response.citations || [],
        widget: response.widget || null,
        suggestedPrompts: response.suggested_prompts || [],
        isEmergency: response.is_emergency || false
      };

      setMessages((prev) => [...prev, botMsgObj]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `⚠️ **Connection Note:** I could not reach the clinical server: ${err.message}. Please check your connection.`,
          citations: [],
          suggestedPrompts: ["Try again", "Show my diet chart"]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleCitation = (msgIdx) => {
    setShowCitationsIndex((prev) => ({
      ...prev,
      [msgIdx]: !prev[msgIdx]
    }));
  };

  return (
    <>
      {/* FLOATING CHATBOT TRIGGER BUTTON (Bottom-Right) */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-[96px] sm:bottom-6 right-4 sm:right-6 z-50 bg-[#3AAE6F] text-[#FFFFFF] p-4 rounded-full shadow-2xl border-2 border-[#FFFFFF] flex items-center gap-3 cursor-pointer group hover:bg-[#329860] transition-all"
        >
          <div className="relative">
            <Bot className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#F4B942] animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#F4B942]" />
          </div>
          <span className="font-display font-extrabold text-sm pr-1 hidden sm:inline-block">
            AI NUTRITION BOT
          </span>
        </motion.button>
      )}

      {/* CHATBOT EXPANDED WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={isOpenDefault
              ? "relative w-full h-[calc(100dvh-13.5rem)] min-h-[520px] sm:h-[680px] bg-white dark:bg-slate-900 sm:rounded-3xl sm:shadow-sm border-y sm:border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden font-sans"
              : "fixed inset-x-2 bottom-[96px] sm:inset-x-auto sm:bottom-6 sm:right-6 w-auto sm:w-[440px] h-[calc(100dvh-120px)] sm:h-[650px] max-h-[85dvh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-emerald-200 dark:border-slate-700 z-50 flex flex-col overflow-hidden font-sans"}
          >
            {/* CHATBOT HEADER */}
            <div className="bg-[#3AAE6F] text-white px-4 sm:px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFFFFF]/20 flex items-center justify-center border border-[#FFFFFF]/30">
                  <Bot className="w-6 h-6 text-[#F4B942]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display font-extrabold text-base tracking-tight leading-none">
                      AlteraVie AI
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#FFFFFF]/90 font-medium mt-0.5">
                    Clinical &amp; Culinary Companion
                  </p>
                </div>
              </div>

              {!isOpenDefault && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
                  aria-label="Close assistant"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* MESSAGES BODY */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-4 bg-[#F7F9F7] dark:bg-slate-950/60 scrollbar-none">
              {messages.map((msg, idx) => {
                const isBot = msg.sender === "bot";
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isBot ? "items-start" : "items-end"}`}
                  >
                    <div className="flex items-start gap-2 max-w-[88%]">
                      {isBot && (
                        <div className="w-7 h-7 rounded-xl bg-[#3AAE6F] text-[#FFFFFF] flex items-center justify-center shrink-0 mt-1 shadow-xs">
                          <Bot className="w-4 h-4 text-[#F4B942]" />
                        </div>
                      )}

                      <div
                        className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                          isBot
                            ? msg.isEmergency
                              ? "bg-[#FFEBEB] text-[#990000] border border-[#FF9999]"
                              : "bg-[#FFFFFF] text-[#4A4A4A] border border-[#3AAE6F]/20"
                            : "bg-[#3AAE6F] text-[#FFFFFF] rounded-br-none"
                        }`}
                      >
                        {/* Message Image attachment */}
                        {msg.image && (
                          <img
                            src={msg.image}
                            alt="Uploaded meal"
                            className="w-full max-h-40 object-cover rounded-xl mb-2 border"
                          />
                        )}

                        {/* Render simple markdown bold */}
                        <div className="whitespace-pre-line">
                          {msg.text.split("**").map((part, i) =>
                            i % 2 === 1 ? (
                              <strong key={i} className="font-extrabold text-[#3AAE6F]">
                                {part}
                              </strong>
                            ) : (
                              part
                            )
                          )}
                        </div>

                        {/* INTERACTIVE WIDGET CARDS */}
                        {msg.widget && (
                          <div className="mt-3 pt-3 border-t border-[#3AAE6F]/20">
                            {/* MEAL CARD WIDGET */}
                            {msg.widget.type === "meal_card" && (
                              <div className="bg-[#DCEBD8]/60 rounded-xl p-3 border border-[#3AAE6F]/30 text-xs text-[#4A4A4A]">
                                <div className="flex items-center justify-between font-bold text-[#3AAE6F] mb-1">
                                  <span>🥗 Scanned Dish Analysis</span>
                                  <span>{msg.widget.calories} kcal</span>
                                </div>
                                <div className="font-extrabold text-sm mb-2">{msg.widget.dish_name}</div>
                                <div className="grid grid-cols-3 gap-1 text-[11px] text-center font-semibold bg-[#FFFFFF] p-2 rounded-lg border border-[#3AAE6F]/20">
                                  <div>
                                    <span className="text-[#3AAE6F] block">Protein</span>
                                    <span>{msg.widget.protein}g</span>
                                  </div>
                                  <div>
                                    <span className="text-[#3AAE6F] block">Iron</span>
                                    <span>{msg.widget.iron}mg</span>
                                  </div>
                                  <div>
                                    <span className="text-[#3AAE6F] block">Calcium</span>
                                    <span>{msg.widget.calcium}mg</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* LAB REPORT CARD WIDGET */}
                            {msg.widget.type === "lab_card" && (
                              <div className="bg-[#FFFFFF] rounded-xl p-3 border border-[#3AAE6F]/30 text-xs text-[#4A4A4A]">
                                <div className="font-bold text-[#3AAE6F] mb-1 flex items-center justify-between">
                                  <span>🩸 Biomarker Lab Summary</span>
                                  <span className="text-[10px] text-[#F4B942] font-extrabold">ACTION REQUIRED</span>
                                </div>
                                <div className="space-y-1 text-[11px] mt-2">
                                  <div className="flex justify-between border-b pb-1">
                                    <span>Serum Ferritin:</span>
                                    <strong className="text-red-600">{msg.widget.ferritin}</strong>
                                  </div>
                                  <div className="flex justify-between border-b pb-1">
                                    <span>Vitamin D (25-OH):</span>
                                    <strong className="text-amber-600">{msg.widget.vit_d}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Hemoglobin:</span>
                                    <strong>{msg.widget.hemoglobin}</strong>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* SPECIALIST CARD WIDGET */}
                            {msg.widget.type === "specialist_card" && (
                              <div className="bg-[#DCEBD8]/60 rounded-xl p-3 border border-[#3AAE6F]/30 text-xs text-[#4A4A4A] space-y-2">
                                <div className="font-bold text-[#3AAE6F]">{msg.widget.title || "Clinical Specialists"}</div>
                                {msg.widget.specialists?.map((spec, sIdx) => (
                                  <div key={sIdx} className="bg-[#FFFFFF] p-2 rounded-lg border border-[#3AAE6F]/20 text-[11px]">
                                    <div className="font-extrabold text-[#4A4A4A]">{spec.name}</div>
                                    <div className="text-[#3AAE6F] font-bold">{spec.specialty} · {spec.hospital}</div>
                                    <div className="text-[10px] text-[#4A4A4A]/70 flex justify-between mt-1">
                                      <span>📍 {spec.city} ({spec.distance_km} km)</span>
                                      <span>📞 {spec.contact}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* CITATIONS ACCORDION */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-[#3AAE6F]/15">
                            <button
                              onClick={() => toggleCitation(idx)}
                              className="text-[10px] font-bold text-[#3AAE6F] flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <BookOpen className="w-3 h-3 text-[#F4B942]" />
                              <span>{msg.citations.length} Verified Sources &amp; Clinical Evidence</span>
                              {showCitationsIndex[idx] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>

                            {showCitationsIndex[idx] && (
                              <div className="mt-2 space-y-1.5 text-[10px] bg-[#DCEBD8]/30 p-2 rounded-xl border border-[#3AAE6F]/20">
                                {msg.citations.map((c, cIdx) => (
                                  <div key={cIdx} className="border-b last:border-0 pb-1">
                                    {(c.url || c.source_url) ? (
                                      <a href={c.url || c.source_url} target="_blank" rel="noreferrer" className="font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-300 underline-offset-2 hover:underline">{c.title || "Retrieved source"}</a>
                                    ) : (
                                      <div className="font-bold text-slate-800 dark:text-slate-100">{c.title || "Retrieved source"}</div>
                                    )}
                                    {c.citation && <div className="text-[#3AAE6F] italic">{c.citation}</div>}
                                    {c.snippet && <div className="text-slate-500 dark:text-slate-400 mt-0.5">{c.snippet}</div>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SUGGESTED PROMPT CHIPS */}
                    {isBot && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[90%] pl-9">
                        {msg.suggestedPrompts.map((prompt, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => handleSendMessage(prompt)}
                            className="bg-[#FFFFFF] text-[#3AAE6F] border border-[#3AAE6F]/30 hover:bg-[#3AAE6F] hover:text-[#FFFFFF] text-[10px] font-bold py-1 px-2.5 rounded-full transition-all cursor-pointer shadow-2xs"
                          >
                            ✨ {prompt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* TYPING INDICATOR */}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-[#3AAE6F] font-bold">
                  <div className="w-7 h-7 rounded-xl bg-[#3AAE6F] text-[#FFFFFF] flex items-center justify-center animate-pulse">
                    <Bot className="w-4 h-4 text-[#F4B942]" />
                  </div>
                  <span>AlteraVie AI is retrieving scientific evidence...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* IMAGE PREVIEW BAR */}
            {imagePreview && (
              <div className="px-4 py-2 bg-[#DCEBD8] border-t border-[#3AAE6F]/20 flex items-center justify-between text-xs font-bold text-[#3AAE6F]">
                <span>📸 Meal Photo Attached for Food Vision Analysis</span>
                <button onClick={() => setImagePreview(null)} className="text-red-500 hover:underline">
                  Remove
                </button>
              </div>
            )}

            {/* CHAT INPUT FORM */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 pb-[max(.75rem,env(safe-area-inset-bottom))]"
            >
              {/* Photo Upload Hidden Input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach Meal Photo for Food Vision"
                className="p-2.5 rounded-xl bg-[#DCEBD8] text-[#3AAE6F] hover:bg-[#3AAE6F] hover:text-[#FFFFFF] transition-colors cursor-pointer shrink-0"
              >
                <Camera className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Ask about your diet, symptoms, or upload meal photo..."
                className="flex-1 bg-[#DCEBD8]/30 border border-[#3AAE6F]/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#4A4A4A] focus:outline-none focus:border-[#3AAE6F]"
              />

              <button
                type="submit"
                disabled={loading || (!inputMsg.trim() && !imagePreview)}
                className="p-2.5 rounded-xl bg-[#3AAE6F] text-[#FFFFFF] hover:bg-[#329860] disabled:opacity-50 transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

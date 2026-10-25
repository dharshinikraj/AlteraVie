import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChefHat, Plus, X, Search, ExternalLink, ChevronDown, ChevronUp, ShieldCheck, Lightbulb } from "lucide-react";
import { Card, SectionEyebrow } from "../components/Cards";
import { useAssessment } from "../context/AssessmentContext";
import { api } from "../api/client";

const QUICK_PICKS = {
  "Grains & flours": ["rice", "atta", "poha", "oats", "ragi", "bajra", "besan", "suji"],
  "Pulses": ["toor dal", "moong dal", "masoor dal", "chana", "rajma", "lobia"],
  "Vegetables": ["onion", "tomato", "potato", "spinach", "carrot", "cauliflower", "brinjal", "okra", "peas", "capsicum", "cabbage"],
  "Dairy & eggs": ["milk", "curd", "paneer", "egg"],
  "Protein & seafood": ["chicken", "fish", "prawns", "tofu"],
  "Fruits & seeds": ["lemon", "banana", "guava", "orange", "peanut", "sesame", "coconut"],
};
const NUTRIENTS = ["Iron", "Calcium", "Vitamin D", "Vitamin B12", "Protein", "Vitamin C", "Fiber"];
const STORAGE_KEY = "alteravie_pantry_items";

function loadSaved() {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch { return []; }
}

const asList = (v) => (Array.isArray(v) ? v : (v || "").split(",").map((s) => s.trim()).filter(Boolean));

export default function PantryChef() {
  const { profile, recommendation } = useAssessment();
  const [items, setItems] = useState(loadSaved);
  const [draft, setDraft] = useState("");
  const [diet, setDiet] = useState(profile.diet || "vegetarian");
  const [focus, setFocus] = useState(() => (recommendation?.detailed_recommendations || []).map((r) => r.nutrient).filter((n) => NUTRIENTS.includes(n)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState(null);

  const allergies = profile.allergies || [];
  const disliked = useMemo(() => asList(profile.disliked_foods), [profile.disliked_foods]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* storage unavailable */ }
  }, [items]);

  function addItems(text) {
    const parts = text.split(/[,\n]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!parts.length) return;
    setItems((cur) => [...new Set([...cur, ...parts])].slice(0, 25));
    setDraft("");
  }
  const toggleQuick = (name) => setItems((cur) => (cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name].slice(0, 25)));
  const toggleFocus = (n) => setFocus((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]));

  async function findMeals() {
    if (!items.length) return;
    setLoading(true); setError(null); setResult(null); setOpen(null);
    try {
      setResult(await api.pantrySuggest({
        ingredients: items, diet, allergies, disliked_foods: disliked, focus_nutrients: focus, limit: 8,
      }));
    } catch (e) {
      setError(e.message || "Could not get suggestions.");
    } finally { setLoading(false); }
  }

  const chip = "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors";
  const chipOn = "bg-[#3AAE6F] text-white border-[#3AAE6F]";
  const chipOff = "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#3AAE6F]";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
      <SectionEyebrow>Pantry Chef</SectionEyebrow>
      <h1 className="font-display text-3xl text-ink dark:text-slate-100 mb-2 flex items-center gap-2">
        <ChefHat className="w-7 h-7 text-[#3AAE6F]" /> Cook with what you have
      </h1>
      <p className="text-ink-soft dark:text-slate-300 mb-6">
        Add the ingredients available at home. We rank them by how well they cover your nutrient gaps (USDA data)
        and suggest real recipes you can make, showing exactly what is still missing.
      </p>

      <Card className="mb-6">
        <h2 className="font-semibold mb-3 text-ink dark:text-slate-100">1 · Your ingredients</h2>
        <form onSubmit={(e) => { e.preventDefault(); addItems(draft); }} className="flex gap-2 mb-3">
          <input
            value={draft} onChange={(e) => setDraft(e.target.value)}
            placeholder="Type an ingredient (e.g. dal, spinach, curd) and press Enter"
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            aria-label="Add ingredient"
          />
          <button type="submit" className="rounded-xl bg-[#3AAE6F] text-white px-4 text-sm font-semibold flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>

        {items.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {items.map((it) => (
              <span key={it} className={`${chip} ${chipOn}`}>
                {it}
                <button type="button" aria-label={`Remove ${it}`} onClick={() => setItems((c) => c.filter((x) => x !== it))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button type="button" onClick={() => setItems([])} className="text-xs text-slate-500 underline ml-1">Clear all</button>
          </div>
        )}

        <details className="mt-1">
          <summary className="text-sm font-medium text-[#3AAE6F] cursor-pointer">Tap to pick common groceries</summary>
          <div className="mt-3 space-y-3">
            {Object.entries(QUICK_PICKS).map(([group, list]) => (
              <div key={group}>
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">{group}</p>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((n) => (
                    <button key={n} type="button" onClick={() => toggleQuick(n)} className={`${chip} ${items.includes(n) ? chipOn : chipOff}`}>{n}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      </Card>

      <Card className="mb-6">
        <h2 className="font-semibold mb-3 text-ink dark:text-slate-100">2 · Nutrients to prioritise</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {NUTRIENTS.map((n) => (
            <button key={n} type="button" onClick={() => toggleFocus(n)} className={`${chip} ${focus.includes(n) ? chipOn : chipOff}`}>{n}</button>
          ))}
        </div>
        {!recommendation && (
          <p className="text-xs text-slate-500 mb-3">
            Tip: <Link to="/profile" className="underline text-[#3AAE6F]">complete your health assessment</Link> and we will pre-select your predicted deficiencies.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">Diet
            <select value={diet} onChange={(e) => setDiet(e.target.value)} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1">
              <option value="vegetarian">Vegetarian</option>
              <option value="non-vegetarian">Non-vegetarian</option>
              <option value="vegan">Vegan</option>
            </select>
          </label>
          {(allergies.length > 0 || disliked.length > 0) && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
              Safety filters from your profile: {[...allergies.map((a) => `${a}-free`), ...disliked.map((d) => `no ${d}`)].join(", ")}
            </span>
          )}
        </div>
      </Card>

      <button
        type="button" onClick={findMeals} disabled={!items.length || loading}
        className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#3AAE6F] text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Search className="w-4 h-4" /> {loading ? "Finding meals…" : "Suggest meals from my pantry"}
      </button>

      {error && <Card className="mt-6 border-rose-300 dark:border-rose-900"><p className="text-sm text-rose-600 dark:text-rose-300">{error}</p></Card>}

      {result && (
        <div className="mt-8 space-y-8">
          {result.notes?.length > 0 && (
            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              {result.notes.map((n, i) => <p key={i}>ℹ️ {n}</p>)}
            </div>
          )}

          {result.ingredients_excluded?.length > 0 && (
            <Card className="border-amber-300 dark:border-amber-900">
              <p className="text-sm font-semibold mb-1">Left out for your safety filters</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{result.ingredients_excluded.map((e) => e.ingredient).join(", ")}</p>
            </Card>
          )}

          {result.pairing_tips?.length > 0 && (
            <Card>
              <p className="font-semibold mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-[#F4B942]" /> Smart pairings</p>
              <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
                {result.pairing_tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </Card>
          )}

          {result.recipes?.length > 0 && (
            <section>
              <SectionEyebrow>Meals you can make</SectionEyebrow>
              <div className="grid sm:grid-cols-2 gap-5">
                {result.recipes.map((r) => (
                  <Card key={r.id} className="!p-0 overflow-hidden flex flex-col">
                    {r.thumbnail && <img src={r.thumbnail} alt={r.name} loading="lazy" className="w-full h-40 object-cover" />}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-lg text-ink dark:text-slate-100">{r.name}</h3>
                        <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full ${r.coverage_percent >= 70 ? "bg-emerald-100 text-emerald-800" : r.coverage_percent >= 40 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>
                          {r.coverage_percent}% on hand
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{[r.cuisine, r.category].filter(Boolean).join(" · ")}</p>
                      {r.helps_with?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {r.helps_with.map((h) => <span key={h} className="text-[11px] font-semibold bg-[#DCEBD8] text-[#2c8a56] px-2 py-0.5 rounded-full">Good for {h}</span>)}
                        </div>
                      )}
                      <p className="text-sm"><span className="font-semibold">You have:</span> {r.you_have.join(", ") || "—"}</p>
                      <p className="text-sm mb-3">
                        <span className="font-semibold">Still needed:</span>{" "}
                        {r.still_needed.length ? r.still_needed.map((m) => m.name).join(", ") : "Nothing — you're set!"}
                      </p>
                      <button type="button" onClick={() => setOpen(open === r.id ? null : r.id)} className="mt-auto text-sm font-semibold text-[#3AAE6F] flex items-center gap-1">
                        {open === r.id ? <>Hide method <ChevronUp className="w-4 h-4" /></> : <>View ingredients & method <ChevronDown className="w-4 h-4" /></>}
                      </button>
                      {open === r.id && (
                        <div className="mt-3 text-sm space-y-3">
                          <ul className="list-disc pl-5">{r.ingredients.map((i, k) => <li key={k}>{i.measure} {i.name}</li>)}</ul>
                          <p className="whitespace-pre-line text-slate-700 dark:text-slate-300">{r.instructions}</p>
                          <a href={r.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs underline text-slate-500">
                            Source: {r.source} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {result.ingredient_insights?.length > 0 && (
            <section>
              <SectionEyebrow>Your ingredients, ranked for your nutrient gaps</SectionEyebrow>
              <div className="grid sm:grid-cols-2 gap-4">
                {result.ingredient_insights.map((i) => (
                  <Card key={i.ingredient} className="!p-4">
                    <p className="font-semibold capitalize text-ink dark:text-slate-100">{i.ingredient}</p>
                    {i.available ? (
                      <>
                        <p className="text-xs text-slate-500 mb-2">USDA: {i.usda_name} · per 100 g</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {i.good_source_of.length
                            ? i.good_source_of.map((g) => <span key={g} className="text-[11px] font-semibold bg-[#DCEBD8] text-[#2c8a56] px-2 py-0.5 rounded-full capitalize">{g}</span>)
                            : <span className="text-xs text-slate-400">No standout nutrient</span>}
                        </div>
                        {Object.keys(i.focus_values || {}).length > 0 && (
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {Object.entries(i.focus_values).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </p>
                        )}
                        {i.source_url && <a href={i.source_url} target="_blank" rel="noreferrer" className="text-[11px] underline text-slate-400">USDA record</a>}
                      </>
                    ) : <p className="text-xs text-slate-400">No USDA match found for this ingredient.</p>}
                  </Card>
                ))}
              </div>
            </section>
          )}
          <p className="text-xs text-slate-500">Educational suggestions, not medical advice. Check recipes and labels against your allergies and any medication guidance.</p>
        </div>
      )}
    </div>
  );
}

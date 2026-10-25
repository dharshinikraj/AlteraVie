import { useState } from "react";
import { Tag, ExternalLink, Star, ShieldCheck, ShoppingBag, Sparkles, Filter } from "lucide-react";

export default function DeficiencyDeals({ deals = [], title = "Deficiency-Targeted Supplement Deals" }) {
  const [selectedNutrient, setSelectedNutrient] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");

  const fallbackDeals = [
    {
      id: "f-1",
      nutrient: "Iron",
      title: "Carbamide Forte Chelated Iron + Vitamin C 100 Capsules",
      brand: "Carbamide Forte",
      platform: "Amazon",
      platform_color: "#FF9900",
      original_price: 699,
      sale_price: 449,
      discount_percent: 36,
      on_sale: true,
      rating: 4.6,
      reviews_count: 5120,
      buy_url: "https://www.amazon.in/s?k=Carbamide+Forte+Chelated+Iron",
      dosage_form: "Capsules",
      health_benefit: "Non-constipating Ferrous Bisglycinate paired with Vitamin C for 3x higher absorption.",
    },
    {
      id: "f-2",
      nutrient: "Vitamin D",
      title: "Fast&Up Plant Based Vitamin D3 600 IU (Swiss Formula)",
      brand: "Fast&Up",
      platform: "Amazon",
      platform_color: "#FF9900",
      original_price: 599,
      sale_price: 389,
      discount_percent: 35,
      on_sale: true,
      rating: 4.8,
      reviews_count: 4190,
      buy_url: "https://www.amazon.in/s?k=FastAndUp+Vitamin+D3",
      dosage_form: "Effervescent Tablets",
      health_benefit: "Lichen-derived D3 for high bioavailability to support immune defense & bone mineral density.",
    },
    {
      id: "f-3",
      nutrient: "Vitamin B12",
      title: "Sublingual B12 Methylcobalamin 1500 mcg Fast Melt Spray",
      brand: "Boldfit",
      platform: "Flipkart",
      platform_color: "#2874F0",
      original_price: 649,
      sale_price: 389,
      discount_percent: 40,
      on_sale: true,
      rating: 4.8,
      reviews_count: 6450,
      buy_url: "https://www.flipkart.com/search?q=Boldfit+B12",
      dosage_form: "Sublingual Spray",
      health_benefit: "Direct oral mucosal absorption bypassing GI degradation — ideal for vegetarians & vegans.",
    },
    {
      id: "f-4",
      nutrient: "Calcium",
      title: "OZiva Plant Based Bettr.Cal+ with Plant Calcium & Vitamin K2-MK7",
      brand: "OZiva",
      platform: "Tata 1mg",
      platform_color: "#FF6F61",
      original_price: 999,
      sale_price: 649,
      discount_percent: 35,
      on_sale: true,
      rating: 4.7,
      reviews_count: 3100,
      buy_url: "https://www.1mg.com/search/all?name=Calcium",
      dosage_form: "Plant Capsules",
      health_benefit: "Derived from Red Algae (Lithothamnion) with Natural Magnesium & K2 for optimal bone density.",
    },
    {
      id: "f-5",
      nutrient: "Protein",
      title: "MuscleBlaze Biozyme Performance Whey Protein (Rich Milk Chocolate 1kg)",
      brand: "MuscleBlaze",
      platform: "HealthKart",
      platform_color: "#00A859",
      original_price: 3299,
      sale_price: 2299,
      discount_percent: 30,
      on_sale: true,
      rating: 4.8,
      reviews_count: 12840,
      buy_url: "https://www.healthkart.com/search?q=MuscleBlaze+Whey",
      dosage_form: "Whey Powder",
      health_benefit: "Enhanced Absorption Formula (EAF) clinically proven for 50% higher protein absorption.",
    },
    {
      id: "f-6",
      nutrient: "Vitamin D",
      title: "PharmEasy Vitamin D3 60K IU (4 Softgels Weekly Pack)",
      brand: "PharmEasy",
      platform: "PharmEasy",
      platform_color: "#10847E",
      original_price: 240,
      sale_price: 149,
      discount_percent: 38,
      on_sale: true,
      rating: 4.9,
      reviews_count: 8930,
      buy_url: "https://pharmeasy.in/search/all?name=Vitamin%20D3%2060k",
      dosage_form: "Weekly Softgels",
      health_benefit: "High potency 60,000 IU Cholecalciferol for correcting moderate to severe Vitamin D deficiency.",
    },
  ];

  const activeDeals = deals.length > 0 ? deals : fallbackDeals;

  // Filter only items that are strictly ON SALE
  const saleOnlyDeals = activeDeals.filter((d) => d.on_sale);

  // Apply Nutrient & Platform Filters
  const filteredDeals = saleOnlyDeals.filter((d) => {
    const matchesNutrient = selectedNutrient === "all" || d.nutrient?.toLowerCase() === selectedNutrient.toLowerCase();
    const matchesPlatform = selectedPlatform === "all" || d.platform?.toLowerCase() === selectedPlatform.toLowerCase();
    return matchesNutrient && matchesPlatform;
  });

  const nutrients = ["all", "Iron", "Vitamin D", "Calcium", "Vitamin B12", "Protein"];
  const platforms = ["all", "Amazon", "Flipkart", "Tata 1mg", "PharmEasy", "HealthKart"];

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-[#EBE5DA] dark:border-slate-800 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#EBE5DA] dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#D97757] uppercase tracking-wider">
            <Tag className="w-4 h-4 text-[#D97757]" />
            <span>Verified E-Commerce Deals · On Sale Only</span>
          </div>
          <h2 className="font-display text-xl font-extrabold text-[#2D3748] dark:text-slate-100 mt-1">
            {title}
          </h2>
          <p className="text-xs text-[#5A6A80] dark:text-slate-400 mt-0.5">
            Curated active sales across Amazon, Flipkart, Tata 1mg, PharmEasy, and HealthKart matched to your health goals.
          </p>
        </div>

        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#D97757]/10 text-[#D97757] dark:bg-rose-950/60 dark:text-rose-300 font-bold text-xs border border-[#D97757]/30 shrink-0">
          <Sparkles className="w-3.5 h-3.5" /> ON SALE ONLY
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center text-xs">
        <span className="font-bold text-[#2D3748] dark:text-slate-300 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Target Nutrient:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {nutrients.map((n) => (
            <button
              key={n}
              onClick={() => setSelectedNutrient(n)}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                selectedNutrient === n
                  ? "bg-[#3AAE6F] text-white shadow-xs"
                  : "bg-[#FAF7F2] dark:bg-slate-800 text-[#5A6A80] dark:text-slate-300 hover:bg-[#EBE5DA]"
              }`}
            >
              {n === "all" ? "All Nutrients" : n}
            </button>
          ))}
        </div>
      </div>

      {/* Platform Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center text-xs pt-1">
        <span className="font-bold text-[#2D3748] dark:text-slate-300 flex items-center gap-1">
          <ShoppingBag className="w-3.5 h-3.5" /> Platform:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              className={`px-2.5 py-0.5 rounded-full font-semibold transition-all cursor-pointer ${
                selectedPlatform === p
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-[#FAF7F2] dark:bg-slate-800 text-[#5A6A80] dark:text-slate-400 hover:bg-[#EBE5DA]"
              }`}
            >
              {p === "all" ? "All Platforms" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Deal Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {filteredDeals.map((deal) => {
          const savings = deal.original_price - deal.sale_price;
          return (
            <div
              key={deal.id}
              className="bg-[#FAF7F2] dark:bg-slate-800/80 rounded-2xl p-4 border border-[#EBE5DA] dark:border-slate-700 hover:border-[#3AAE6F]/60 transition-all flex flex-col justify-between space-y-3 relative group"
            >
              {/* Top Row: Platform Pill & Discount Badge */}
              <div className="flex items-center justify-between">
                <span
                  className="px-2.5 py-0.5 rounded-md font-extrabold text-[10px] uppercase text-white shadow-xs"
                  style={{ backgroundColor: deal.platform_color || "#3AAE6F" }}
                >
                  {deal.platform}
                </span>

                <span className="px-2 py-0.5 rounded-full bg-[#D97757] text-white font-extrabold text-[10px] tracking-wider uppercase animate-pulse">
                  {deal.discount_percent}% OFF
                </span>
              </div>

              {/* Product Info */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#5A6A80] dark:text-slate-400 font-medium">
                  <span>{deal.brand}</span>
                  <span className="font-bold text-[#3AAE6F] dark:text-emerald-400">
                    Target: {deal.nutrient}
                  </span>
                </div>

                <h4 className="font-display font-bold text-sm text-[#2D3748] dark:text-slate-100 line-clamp-2 leading-snug">
                  {deal.title}
                </h4>

                <p className="text-[11px] text-[#5A6A80] dark:text-slate-300 leading-tight italic bg-white dark:bg-slate-900/60 p-2 rounded-xl border border-[#EBE5DA] dark:border-slate-800">
                  "{deal.health_benefit}"
                </p>
              </div>

              {/* Rating & Pricing */}
              <div className="pt-2 border-t border-[#EBE5DA] dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{deal.rating}</span>
                    <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 font-normal">
                      ({deal.reviews_count?.toLocaleString()})
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-xs text-[#5A6A80] dark:text-slate-400 line-through">
                      ₹{deal.original_price}
                    </span>
                    <span className="font-display font-extrabold text-base text-[#2D3748] dark:text-slate-100">
                      ₹{deal.sale_price}
                    </span>
                  </div>
                </div>

                {/* Buy Button */}
                <a
                  href={deal.buy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#3AAE6F] to-emerald-600 hover:from-[#339961] hover:to-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs group-hover:scale-[1.01] cursor-pointer"
                >
                  <span>Buy on {deal.platform} (Save ₹{savings})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDeals.length === 0 && (
        <div className="p-6 text-center bg-[#FAF7F2] dark:bg-slate-800 rounded-2xl">
          <p className="text-xs text-[#5A6A80] dark:text-slate-400 font-medium">
            No active deals found matching your selected filters. Try selecting "All Nutrients" or "All Platforms".
          </p>
        </div>
      )}
    </section>
  );
}

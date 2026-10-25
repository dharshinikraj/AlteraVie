import { Link } from "react-router-dom";
import { Leaf, ArrowRight, ShieldCheck, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#4A4A4A] dark:bg-slate-950 text-[#DCEBD8] pt-20 pb-12 border-t border-[#3AAE6F]/20 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 space-y-16">
        {/* Top Newsletter & Callout Grid */}
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 pb-12 border-b border-[#FFFFFF]/10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-xl bg-[#3AAE6F] flex items-center justify-center text-[#FFFFFF] shadow-md">
                <Leaf className="w-5 h-5" />
              </span>
              <span className="font-display text-2xl font-extrabold text-[#FFFFFF] tracking-tight">
                AlteraVie
              </span>
              <span className="bg-[#F4B942] text-[#4A4A4A] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ml-2">
                ORGANIC HEALTH
              </span>
            </div>
            <p className="text-base text-[#DCEBD8]/80 leading-relaxed max-w-xl">
              Helping you eat better, cook smarter, and feel energized every day with simple food insights and personalized meal plans.
            </p>
          </div>

          <div className="bg-[#FFFFFF]/5 p-6 rounded-2xl border border-[#DCEBD8]/10 space-y-4">
            <h4 className="font-display text-sm font-bold text-[#FFFFFF] uppercase tracking-wider">
              Subscribe to Weekly Healthy Recipe Ideas
            </h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email address"
                className="bg-[#FFFFFF]/10 text-[#FFFFFF] placeholder-[#DCEBD8]/50 text-xs px-4 py-3 rounded-full flex-1 border border-[#DCEBD8]/20 focus:outline-none focus:border-[#3AAE6F]"
              />
              <button className="px-5 py-3 rounded-full bg-[#3AAE6F] text-[#FFFFFF] font-bold text-xs hover:bg-[#339961] transition-colors flex items-center gap-1.5 cursor-pointer">
                <span>Join</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#DCEBD8]/70">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F4B942]" />
              <span>Zero spam. Simple, delicious health tips only.</span>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
          <div className="space-y-3">
            <span className="label-eyebrow text-[#F4B942] block">OUR TOOLS</span>
            <ul className="space-y-2">
              <li><Link to="/profile" className="hover:text-[#FFFFFF] transition-colors">Free Health Quiz</Link></li>
              <li><Link to="/prediction" className="hover:text-[#FFFFFF] transition-colors">Health Need Checker</Link></li>
              <li><Link to="/nutrition" className="hover:text-[#FFFFFF] transition-colors">Smart Cooking Guide</Link></li>
              <li><Link to="/food-vision" className="hover:text-[#FFFFFF] transition-colors">Meal Photo Scanner</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="label-eyebrow text-[#F4B942] block">RESOURCES</span>
            <ul className="space-y-2">
              <li><Link to="/recommendations" className="hover:text-[#FFFFFF] transition-colors">Meal Plan Ideas</Link></li>
              <li><Link to="/doctors" className="hover:text-[#FFFFFF] transition-colors">Doctor & Dietitian Finder</Link></li>
              <li><a href="#pipeline" className="hover:text-[#FFFFFF] transition-colors">Healthy Cooking Tips</a></li>
              <li><a href="#pipeline" className="hover:text-[#FFFFFF] transition-colors">Daily Vitamin Goals</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="label-eyebrow text-[#F4B942] block">HEALTH FOCUS</span>
            <ul className="space-y-2">
              <li><span className="text-[#DCEBD8]/70">Personalized Health Check</span></li>
              <li><span className="text-[#DCEBD8]/70">Instant Food Camera</span></li>
              <li><span className="text-[#DCEBD8]/70">Verified Food Database</span></li>
              <li><span className="text-[#DCEBD8]/70">Easy Cooking Guidance</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="label-eyebrow text-[#F4B942] block">PRIVACY & TRUST</span>
            <ul className="space-y-2 text-[#DCEBD8]/70">
              <li>Health Guidance Notice</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Data Protection Standard</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#FFFFFF]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#DCEBD8]/60">
          <p>© {new Date().getFullYear()} AlteraVie Health Platform. All rights reserved.</p>
          <div className="flex items-center gap-1 text-[11px]">
            <span>Made with passion for</span>
            <Heart className="w-3.5 h-3.5 fill-[#F4B942] text-[#F4B942]" />
            <span>everyday health and happiness.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { useEffect, useState } from "react";
import { api } from "../api/client";
export const WEEK_DAYS = [];
export const DIET_CUISINE_DATA = {};
export default function WeeklyDietChart(){
 const [nutrient,setNutrient]=useState("calcium"),[foods,setFoods]=useState([]),[status,setStatus]=useState("");
 useEffect(()=>{setStatus("Loading live USDA data…");api.getLiveFoodRecommendations(nutrient,"vegetarian").then(r=>{setFoods(r.foods||[]);setStatus("")}).catch(()=>{setFoods([]);setStatus("Live data unavailable; no static weekly plan is substituted.")})},[nutrient]);
 return <section className="py-14 sm:py-20 bg-emerald-50/30"><div className="max-w-6xl mx-auto px-4 sm:px-6"><div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-end"><div><p className="text-xs uppercase tracking-widest font-bold text-emerald-700">Live food explorer</p><h2 className="text-3xl sm:text-5xl font-extrabold">USDA nutrient picks</h2></div><select value={nutrient} onChange={e=>setNutrient(e.target.value)} className="border rounded-xl px-4 py-3 bg-white"><option value="iron">Iron</option><option value="calcium">Calcium</option><option value="vitamin d">Vitamin D</option><option value="vitamin b12">Vitamin B12</option><option value="protein">Protein</option></select></div>{status&&<p className="mt-6 text-sm opacity-70">{status}</p>}<div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{foods.slice(0,8).map(f=><a key={f.fdc_id} href={f.source_url} target="_blank" rel="noreferrer" className="p-4 bg-white border rounded-2xl hover:shadow-md transition"><p className="font-bold text-sm">{f.name}</p><p className="text-xs mt-2 opacity-60">USDA FoodData Central ↗</p></a>)}</div></div></section>
}

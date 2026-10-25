export default function InteractiveMealBooks({ recommendation }){
 const meals=recommendation?.daily_meal_plan?.meals || {};
 const entries=Object.entries(meals);
 return <section className="mt-8"><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{entries.map(([slot,m])=><article key={slot} className="p-4 rounded-2xl border bg-white"><p className="text-[10px] uppercase tracking-widest font-bold text-emerald-700">{slot}</p><h3 className="font-bold mt-2">{m.name}</h3>{m.source&&<p className="text-xs opacity-60 mt-2">{m.source}</p>}{m.source_url&&<a href={m.source_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-700 inline-block mt-3">Open source ↗</a>}</article>)}</div>{!entries.length&&<p className="text-sm opacity-70">No live meal data returned yet.</p>}</section>
}

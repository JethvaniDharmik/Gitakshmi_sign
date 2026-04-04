const StatCard = ({ title, value, hint, icon, tone = "indigo" }) => {
  const toneMap = {
    indigo: "from-indigo-500 to-blue-500",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-pink-500",
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold leading-tight text-slate-900">{value}</p>
          <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br text-white ${toneMap[tone]}`}>
          {icon}
        </div>
      </div>
    </article>
  );
};

export default StatCard;

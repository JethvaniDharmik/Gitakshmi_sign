const MetricCard = ({ title, value, hint }) => {
  return (
    <article className="sf-card sf-fade-in p-5 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
    </article>
  );
};

export default MetricCard;

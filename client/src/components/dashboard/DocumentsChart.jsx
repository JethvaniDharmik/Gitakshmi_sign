const DocumentsChart = ({ series }) => {
  const maxValue = Math.max(1, ...series.map((item) => item.count));

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Documents Over Time</h3>
        <span className="text-xs text-slate-500">Last 7 days</span>
      </div>

      <div className="flex h-28 items-end gap-2">
        {series.map((item) => {
          const height = Math.max(8, Math.round((item.count / maxValue) * 100));
          return (
            <div key={item.label} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t-md bg-indigo-500/90" style={{ height: `${height}%` }} />
              <span className="text-[10px] font-medium text-slate-500">{item.label}</span>
              <span className="text-[10px] font-semibold text-slate-700">{item.count}</span>
            </div>
          );
        })}
      </div>
    </article>
  );
};

export default DocumentsChart;

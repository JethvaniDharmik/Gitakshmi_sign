const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  viewed: "bg-indigo-50 text-indigo-700 border-indigo-200",
  signed: "bg-sky-50 text-sky-700 border-sky-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  expired: "bg-rose-50 text-rose-700 border-rose-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  waiting: "bg-slate-100 text-slate-700 border-slate-200",
};

const StatusBadge = ({ status }) => {
  const normalized = String(status || "").toLowerCase();
  const style = STATUS_STYLES[normalized] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize tracking-wide ${style}`}>
      {normalized || "unknown"}
    </span>
  );
};

export default StatusBadge;

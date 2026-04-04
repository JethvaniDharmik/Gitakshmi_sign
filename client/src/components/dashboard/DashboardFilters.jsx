const DashboardFilters = ({ query, onQueryChange, status, onStatusChange }) => {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search documents by title..."
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </div>
      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
        className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:w-48"
      >
        <option value="all">All Statuses</option>
        <option value="Signed">Signed</option>
        <option value="Pending">Pending</option>
        <option value="Viewed">Viewed</option>
        <option value="Rejected">Rejected</option>
      </select>
    </div>
  );
};

export default DashboardFilters;

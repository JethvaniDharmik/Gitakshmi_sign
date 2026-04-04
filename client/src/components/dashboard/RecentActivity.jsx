const actionLabel = {
  DOCUMENT_UPLOADED: "uploaded",
  DOCUMENT_VIEWED: "viewed",
  DOCUMENT_SIGNED: "signed",
  SIGN_REQUEST_SENT: "sign request sent",
};

const RecentActivity = ({ items }) => {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Recent Activity</h3>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No activity yet.</p>
      ) : (
        <ol className="max-h-64 space-y-3 overflow-auto pr-1">
          {items.map((item) => (
            <li key={item.id} className="relative pl-5">
              <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-indigo-500" />
              <div className="text-sm text-slate-700">
                <span className="font-semibold text-slate-900">{item.title}</span> {actionLabel[item.action] || item.action}
              </div>
              <div className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
};

export default RecentActivity;

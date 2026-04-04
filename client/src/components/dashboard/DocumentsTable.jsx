import StatusBadge from "./StatusBadge";

const ActionButton = ({ label, onClick, tone = "default" }) => {
  const toneClass =
    tone === "danger"
      ? "text-rose-600 hover:bg-rose-50"
      : "text-indigo-600 hover:bg-indigo-50";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${toneClass}`}
    >
      {label}
    </button>
  );
};

const DocumentsTable = ({ documents, onView, onDownload, onDelete, deletingId }) => {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
      <div className="max-h-[430px] overflow-auto">
        <table className="min-w-full text-left">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-semibold">Document Name</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <tr key={doc._id} className="text-sm text-slate-700">
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-slate-900">{doc.title}</div>
                  <div className="text-xs text-slate-500">{doc.originalName}</div>
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={doc.status} />
                </td>
                <td className="px-5 py-3.5">{new Date(doc.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <ActionButton label="View" onClick={() => onView(doc)} />
                    <ActionButton label="Download" onClick={() => onDownload(doc)} />
                    <ActionButton
                      label={deletingId === doc._id ? "Deleting..." : "Delete"}
                      onClick={() => onDelete(doc)}
                      tone="danger"
                    />
                  </div>
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">
                  No documents match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
};

export default DocumentsTable;

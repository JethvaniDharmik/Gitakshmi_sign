const TablePanel = ({ title, subtitle, columns, rows, emptyLabel }) => {
  return (
    <section className="sf-card sf-fade-in overflow-hidden">
      <div className="border-b border-slate-200/80 px-5 py-4 md:px-6">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50/90 text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-3 font-medium md:px-6">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={row.id || index} className="border-t border-slate-100 text-slate-700 transition hover:bg-slate-50/70">
                  {columns.map((column) => (
                    <td key={`${row.id || index}-${column.key}`} className="px-5 py-3.5 align-top md:px-6">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-slate-500 md:px-6">
                  {emptyLabel || "No data available."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TablePanel;

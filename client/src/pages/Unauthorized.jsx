const Unauthorized = () => {
  return (
    <section className="flex min-h-screen items-center justify-center px-4">
      <article className="sf-card sf-fade-in w-full max-w-lg p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">SignFlow</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Unauthorized</h1>
        <p className="mt-3 text-sm text-slate-600">You do not have permission to access this page.</p>
      </article>
    </section>
  );
};

export default Unauthorized;

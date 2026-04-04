import { useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const DocumentViewer = ({ fileUrl }) => {
  const options = useMemo(
    () => ({
      standardFontDataUrl: "https://unpkg.com/pdfjs-dist@4.8.69/standard_fonts/",
    }),
    []
  );

  if (!fileUrl) {
    return <p className="text-sm text-slate-500">No document selected.</p>;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <Document
        file={fileUrl}
        options={options}
        loading={<p className="text-sm text-slate-500">Loading PDF...</p>}
        error={<p className="text-sm text-red-600">Failed to load PDF.</p>}
      >
        <Page pageNumber={1} width={650} />
      </Document>
    </div>
  );
};

export default DocumentViewer;

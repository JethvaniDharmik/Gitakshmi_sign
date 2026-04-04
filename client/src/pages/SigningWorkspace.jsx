import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import ReactSignatureCanvas from "react-signature-canvas";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { userApi } from "../services/api";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

const FIELD_TEMPLATES = {
  signature: { width: 22, height: 10, label: "Signature", required: true },
  date: { width: 16, height: 8, label: "Date", required: true },
  checkbox: { width: 18, height: 8, label: "I agree", required: true },
  text: { width: 26, height: 8, label: "Text", required: false },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const SigningWorkspace = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const signatureCanvasRef = useRef(null);

  const [meta, setMeta] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [fields, setFields] = useState([]);
  const [activeFieldId, setActiveFieldId] = useState("");
  const [numPages, setNumPages] = useState(1);
  const [signingModalFieldId, setSigningModalFieldId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadWorkspace = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await userApi.getSigningWorkspace(documentId);
        setMeta(data);
        setPdfUrl(data.pdfUrl?.startsWith("http") ? data.pdfUrl : userApi.assignedPdfUrl(documentId));
        setFields(data.savedFields?.length ? data.savedFields : []);
      } catch (apiError) {
        setError(apiError?.response?.data?.message || "Failed to load signing workspace.");
      } finally {
        setLoading(false);
      }
    };

    loadWorkspace();
  }, [documentId]);

  useEffect(() => {
    if (!activeFieldId && fields.length) {
      setActiveFieldId(fields[0].fieldId);
    }
  }, [fields, activeFieldId]);

  const activeField = useMemo(() => fields.find((field) => field.fieldId === activeFieldId) || null, [fields, activeFieldId]);

  const addField = (type) => {
    const template = FIELD_TEMPLATES[type];
    if (!template) return;

    const next = {
      fieldId: `field-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      type,
      label: template.label,
      required: template.required,
      page: 1,
      x: 10,
      y: 12,
      width: template.width,
      height: template.height,
      value: type === "date" ? new Date().toISOString().slice(0, 10) : "",
      checked: false,
      signatureDataUrl: "",
    };

    setFields((prev) => [...prev, next]);
    setActiveFieldId(next.fieldId);
  };

  const updateField = (fieldId, updates) => {
    setFields((prev) => prev.map((field) => (field.fieldId === fieldId ? { ...field, ...updates } : field)));
  };

  const removeField = (fieldId) => {
    setFields((prev) => prev.filter((field) => field.fieldId !== fieldId));
    if (activeFieldId === fieldId) {
      setActiveFieldId("");
    }
  };

  const startDrag = (event, fieldId) => {
    event.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const targetField = fields.find((field) => field.fieldId === fieldId);
    if (!targetField) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const originalX = targetField.x;
    const originalY = targetField.y;

    const onMove = (moveEvent) => {
      const dxPct = ((moveEvent.clientX - startX) / rect.width) * 100;
      const dyPct = ((moveEvent.clientY - startY) / rect.height) * 100;

      updateField(fieldId, {
        x: clamp(originalX + dxPct, 0, 100 - targetField.width),
        y: clamp(originalY + dyPct, 0, 100 - targetField.height),
      });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const openSignatureModal = (fieldId) => {
    setSigningModalFieldId(fieldId);
    setTimeout(() => {
      signatureCanvasRef.current?.clear();
    }, 0);
  };

  const saveSignature = () => {
    if (!signingModalFieldId || !signatureCanvasRef.current || signatureCanvasRef.current.isEmpty()) return;

    const dataUrl = signatureCanvasRef.current.toDataURL("image/png");
    updateField(signingModalFieldId, { signatureDataUrl: dataUrl });
    setSigningModalFieldId("");
  };

  const validateBeforeSubmit = () => {
    if (!fields.length) return "Please add at least one field before submitting.";

    for (const field of fields) {
      if (!field.required) continue;

      if (field.type === "signature" && !field.signatureDataUrl) {
        return `Signature field '${field.label || field.fieldId}' is required.`;
      }
      if (field.type === "checkbox" && !field.checked) {
        return `Checkbox '${field.label || field.fieldId}' must be checked.`;
      }
      if (field.type !== "checkbox" && field.type !== "signature" && !String(field.value || "").trim()) {
        return `Field '${field.label || field.fieldId}' is required.`;
      }
    }

    return "";
  };

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    const validationError = validateBeforeSubmit();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await userApi.submitSigningFields(documentId, { fields });
      setMessage(data.message || "Submitted successfully.");
      setTimeout(() => navigate("/my-documents"), 1200);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Failed to submit signing form.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="PDF Signing Workspace" subtitle="Place fields, fill values, and submit your signature">
      {loading ? <p className="text-sm text-slate-500">Loading document...</p> : null}
      {error ? <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</p> : null}

      {!loading && meta ? (
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{meta.document.title}</h2>
              <p className="text-sm text-slate-500">Workflow: {meta.workflow.name}</p>
              <p className="text-xs text-slate-500">Step {meta.myStep.order} - {meta.myStep.status}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add fields</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => addField("signature")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Signature</button>
                <button type="button" onClick={() => addField("date")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Date</button>
                <button type="button" onClick={() => addField("checkbox")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Checkbox</button>
                <button type="button" onClick={() => addField("text")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Text</button>
              </div>
            </div>

            {activeField ? (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-800">Selected field</p>
                <input
                  value={activeField.label}
                  onChange={(e) => updateField(activeField.fieldId, { label: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  placeholder="Label"
                />
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={activeField.required}
                    onChange={(e) => updateField(activeField.fieldId, { required: e.target.checked })}
                  />
                  Required
                </label>
                <button
                  type="button"
                  onClick={() => removeField(activeField.fieldId)}
                  className="rounded-md bg-red-50 px-2 py-1.5 text-sm text-red-600"
                >
                  Remove field
                </button>
              </div>
            ) : null}

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Signing Form"}
              </button>
              <Link to="/my-documents" className="block text-center text-sm text-slate-500 hover:text-slate-700">
                Cancel
              </Link>
            </div>
          </aside>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div ref={containerRef} className="relative mx-auto w-fit">
              <Document
                file={pdfUrl}
                onLoadSuccess={(doc) => setNumPages(doc.numPages || 1)}
                loading={<p className="text-sm text-slate-500">Loading PDF...</p>}
                error={<p className="text-sm text-red-600">Failed to load PDF preview.</p>}
              >
                <Page pageNumber={1} width={860} />
              </Document>

              {fields
                .filter((field) => field.page === 1)
                .map((field) => (
                  <div
                    key={field.fieldId}
                    className={`absolute rounded-md border px-2 py-1.5 text-xs shadow-sm backdrop-blur ${
                      field.fieldId === activeFieldId
                        ? "border-slate-900 bg-white/95"
                        : "border-slate-300 bg-white/90"
                    }`}
                    style={{
                      left: `${field.x}%`,
                      top: `${field.y}%`,
                      width: `${field.width}%`,
                      minHeight: `${field.height}%`,
                    }}
                    onMouseDown={(event) => {
                      setActiveFieldId(field.fieldId);
                      startDrag(event, field.fieldId);
                    }}
                  >
                    <p className="mb-1 truncate font-semibold text-slate-700">{field.label || field.type}</p>

                    {field.type === "text" ? (
                      <input
                        value={field.value}
                        onChange={(e) => updateField(field.fieldId, { value: e.target.value })}
                        placeholder="Enter text"
                        className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs"
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    ) : null}

                    {field.type === "date" ? (
                      <input
                        type="date"
                        value={field.value}
                        onChange={(e) => updateField(field.fieldId, { value: e.target.value })}
                        className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs"
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    ) : null}

                    {field.type === "checkbox" ? (
                      <label className="inline-flex items-center gap-1 text-xs text-slate-700" onMouseDown={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={field.checked}
                          onChange={(e) => updateField(field.fieldId, { checked: e.target.checked })}
                        />
                        I agree
                      </label>
                    ) : null}

                    {field.type === "signature" ? (
                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => openSignatureModal(field.fieldId)}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                      >
                        {field.signatureDataUrl ? "Edit Signature" : "Draw Signature"}
                      </button>
                    ) : null}
                  </div>
                ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Drag fields to position them on the PDF. Pages loaded: {numPages}</p>
          </section>
        </div>
      ) : null}

      {signingModalFieldId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-4">
            <h3 className="text-lg font-semibold text-slate-900">Draw Signature</h3>
            <p className="text-sm text-slate-500">Sign inside the area below.</p>
            <div className="mt-3 rounded-lg border border-slate-300 bg-slate-50 p-2">
              <ReactSignatureCanvas
                ref={signatureCanvasRef}
                penColor="#0f172a"
                canvasProps={{ width: 860, height: 220, className: "h-auto w-full" }}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  signatureCanvasRef.current?.clear();
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setSigningModalFieldId("")}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSignature}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
              >
                Save Signature
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
};

export default SigningWorkspace;

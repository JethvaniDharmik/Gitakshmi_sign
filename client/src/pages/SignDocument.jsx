import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DocumentViewer from "../components/DocumentViewer";
import SignaturePad from "../components/SignaturePad";
import { signApi } from "../services/api";

const SignDocument = () => {
  const { token } = useParams();
  const [meta, setMeta] = useState(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [position, setPosition] = useState({ page: 1, x: 100, y: 100, width: 160, height: 60 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await signApi.detailsByToken(token);
        setMeta(data);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load signing page.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const previewUrl = useMemo(() => signApi.previewUrl(token), [token]);

  const handleSign = async () => {
    if (!signatureDataUrl) {
      setError("Please save your signature first.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const { data } = await signApi.signByToken(token, {
        signatureDataUrl,
        ...position,
      });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to sign document.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading sign request...</p>;
  if (error && !meta) return <p className="text-sm font-medium text-red-600">{error}</p>;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-extrabold text-ink">{meta?.document?.title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Signer: {meta?.signer?.name} ({meta?.signer?.email})
        </p>
      </div>

      <DocumentViewer fileUrl={previewUrl} />
      <SignaturePad onChange={setSignatureDataUrl} />

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-5">
        {["page", "x", "y", "width", "height"].map((field) => (
          <label key={field} className="text-sm text-slate-700">
            {field.toUpperCase()}
            <input
              type="number"
              min={1}
              value={position[field]}
              onChange={(e) =>
                setPosition((prev) => ({ ...prev, [field]: Number(e.target.value || 1) }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        ))}
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {message && <p className="text-sm font-medium text-emerald-700">{message}</p>}

      <button
        disabled={submitting}
        type="button"
        onClick={handleSign}
        className="rounded-xl bg-accent px-6 py-3 font-semibold text-white"
      >
        {submitting ? "Signing..." : "Sign Document"}
      </button>
    </section>
  );
};

export default SignDocument;

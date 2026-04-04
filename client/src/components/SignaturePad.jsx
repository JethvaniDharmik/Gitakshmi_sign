import { useRef } from "react";
import ReactSignatureCanvas from "react-signature-canvas";

const SignaturePad = ({ onChange }) => {
  const signatureRef = useRef(null);

  const handleSave = () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) return;
    onChange(signatureRef.current.toDataURL("image/png"));
  };

  const handleClear = () => {
    signatureRef.current?.clear();
    onChange("");
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <p className="mb-2 text-sm font-semibold text-ink">Draw Signature</p>
      <div className="rounded-xl border border-slate-300 bg-slate-50 p-2">
        <ReactSignatureCanvas
          ref={signatureRef}
          penColor="#0f172a"
          canvasProps={{ width: 600, height: 180, className: "w-full" }}
        />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Save Signature
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;

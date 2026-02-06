"use client";

import { useState } from "react";

export default function UploadComponent() {
    const [file, setFile] = useState<File | null>(null);
    const [patientId, setPatientId] = useState("");
    const [fileType, setFileType] = useState("XRAY");
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !patientId) return;

        setUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("patient_id", patientId);
        formData.append("file_type", fileType);

        try {
            const res = await fetch("http://localhost:8000/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Manual Upload
            </h2>

            <form onSubmit={handleUpload} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Patient ID</label>
                    <input
                        type="text"
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="e.g. P-1024"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Diagnostic Type</label>
                    <select
                        value={fileType}
                        onChange={(e) => setFileType(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="XRAY">X-Ray</option>
                        <option value="CT">CT Scan</option>
                        <option value="ECG">ECG</option>
                        <option value="REPORT">Blood Report (PDF)</option>
                    </select>
                </div>

                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-blue-300 transition cursor-pointer relative">
                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required
                    />
                    <div className="text-slate-500">
                        {file ? (
                            <span className="text-blue-600 font-medium">{file.name}</span>
                        ) : (
                            <span>Click to select file or drag & drop</span>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={uploading}
                    className={`w-full py-2.5 rounded-lg font-medium text-white transition ${uploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                        }`}
                >
                    {uploading ? "Analyzing..." : "Upload & Analyze"}
                </button>
            </form>

            {result && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-100 animate-fade-in">
                    <h3 className="text-green-800 font-semibold mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Analysis Complete
                    </h3>
                    <div className="text-sm text-green-700 space-y-1">
                        <p><span className="font-medium">Summary:</span> {result.analysis.summary}</p>
                        <p><span className="font-medium">Confidence:</span> {(result.analysis.confidence * 100).toFixed(1)}%</p>
                    </div>
                </div>
            )}
        </div>
    );
}

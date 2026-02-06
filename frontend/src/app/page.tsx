"use client";

import { useEffect, useState } from "react";
import UploadComponent from "./components/UploadComponent";

interface Task {
  id: string;
  patient_id: string;
  file_path: string;
  file_type: string;
  status: string;
}

export default function Home() {
  const [queue, setQueue] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Poll the backend queue every 2 seconds
    const interval = setInterval(() => {
      fetch("http://localhost:8000/queue")
        .then((res) => res.json())
        .then((data) => {
          setQueue(data);
          setLoading(false);
        })
        .catch((err) => console.error("Failed to fetch queue", err));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      <header className="flex justify-between items-center mb-10 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
            Medical Diagnostic Bot
          </h1>
          <p className="text-slate-500">Autonomous Diagnostic Analysis Service</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="font-semibold text-green-700">System Online</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Live Queue */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800">Processing Queue {queue.length > 0 && `(${queue.length})`}</h2>
            <button className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium hover:bg-blue-100 transition">
              Sync Now
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10 text-slate-400">Connecting to Bot Backend...</div>
          ) : queue.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-lg">
              <p className="text-slate-400 mb-2">Queue is empty</p>
              <p className="text-sm text-slate-300">Waiting for new database entries...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold ${task.file_type === 'XRAY' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                      {task.file_type}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-700">Patient: {task.patient_id}</h3>
                      <p className="text-xs text-slate-400 truncate max-w-[200px]">{task.file_path}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Recent Activity / Stats */}
        <section className="space-y-6">
          <UploadComponent />

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">System Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">12</div>
                <div className="text-sm text-blue-600/80">Processed Today</div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-700">98%</div>
                <div className="text-sm text-emerald-600/80">AI Confidence</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Live Logs</h2>
            <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs h-40 overflow-y-auto">
              <p>[12:00:01] System started.</p>
              <p>[12:00:02] Connected to HMS Database.</p>
              <p>[12:00:05] Watching table `patient_xray_report_details`...</p>
              <p className="text-green-400">[12:05:00] New XRAY detected for P-505.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

import React, { useState } from 'react';
import { Sparkles, Calendar, CheckSquare, Plus, Zap } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState([
    { id: 1, title: 'Analyze system telemetry logs', due: 'Today', priority: 'High', done: false },
    { id: 2, title: 'Optimize bundle size with esbuild', due: 'Tomorrow', priority: 'Medium', done: true }
  ]);
  const [input, setInput] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setItems([...items, { id: Date.now(), title: input, due: 'Today', priority: 'Medium', done: false }]);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6">
      <div className="max-w-md mx-auto bg-slate-800 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 bg-linear-to-r from-indigo-900 to-indigo-850 border-b border-indigo-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h1 className="font-semibold tracking-tight text-white">CEO Active Planner</h1>
          </div>
          <span className="text-xs bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded-full">v1.0.0</span>
        </div>
        <div className="p-6">
          <form onSubmit={handleAdd} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Inject core task requirement..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 text-xs px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100"
            />
            <button className="bg-indigo-600 hover:bg-indigo-500 text-xs font-medium py-2 px-3 rounded-xl transition flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Inject
            </button>
          </form>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={item.done} onChange={() => {}} className="rounded text-indigo-600 focus:ring-0 cursor-pointer" />
                  <span className={`text-xs ${item.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>{item.title}</span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">{item.priority}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
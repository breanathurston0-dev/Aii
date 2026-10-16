import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { History, Search, Download, Trash2, Filter } from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { history, addNotification } = useStudio();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = history.filter(h => {
    const matchesSearch = h.action.toLowerCase().includes(search.toLowerCase()) || 
                          h.details.toLowerCase().includes(search.toLowerCase()) ||
                          h.projectName.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || h.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <span>Activity &amp; Artifact History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit log of all project operations, AI generations, speech synthesis runs, and exports.
          </p>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search history records..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
          {(['all', 'project', 'ai', 'export', 'media'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded capitalize font-medium ${
                filterType === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* History Log Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase">
              <tr>
                <th className="py-2.5 px-4">TIMESTAMP</th>
                <th className="py-2.5 px-4">TYPE</th>
                <th className="py-2.5 px-4">ACTION</th>
                <th className="py-2.5 px-4">DETAILS</th>
                <th className="py-2.5 px-4">PROJECT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(item.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-[10px] font-mono uppercase bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                    {item.action}
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-md truncate">
                    {item.details}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-indigo-400 whitespace-nowrap">
                    {item.projectName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500">
            No history logs match your search.
          </div>
        )}
      </div>
    </div>
  );
};

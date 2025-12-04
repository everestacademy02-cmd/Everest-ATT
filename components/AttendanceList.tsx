import React from 'react';
import { AttendanceRecord } from '../types';
import { Clock, User, CheckCircle2, Sparkles, MapPin } from 'lucide-react';

interface AttendanceListProps {
  records: AttendanceRecord[];
}

export const AttendanceList: React.FC<AttendanceListProps> = ({ records }) => {
  if (records.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">No records yet</h3>
        <p className="text-slate-500 mt-1">Clock in to start your day!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <div 
          key={record.id} 
          className="group bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-6"
        >
          {/* Photo Section */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden ring-4 ring-slate-50 shadow-inner">
              <img 
                src={record.photoUrl} 
                alt={record.staffName} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-full border-2 border-white ${record.type === 'CLOCK_IN' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
              {record.type === 'CLOCK_IN' ? (
                <CheckCircle2 className="w-3 h-3 text-white" />
              ) : (
                <Clock className="w-3 h-3 text-white" />
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{record.staffName}</h4>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                  <p className="text-sm text-slate-500 flex items-center gap-1.5">
                     <Clock className="w-3.5 h-3.5" />
                     {record.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     <span className="text-slate-300">•</span>
                     {record.timestamp.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  {record.location && (
                    <p className="text-sm text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {record.location.latitude.toFixed(4)}, {record.location.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${
                record.type === 'CLOCK_IN' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                  : 'bg-amber-50 text-amber-700 border border-amber-100'
              }`}>
                {record.type.replace('_', ' ')}
              </span>
            </div>

            {/* AI Greeting or Sync Status */}
            {record.isSyncing ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600 animate-pulse">
                <Sparkles className="w-4 h-4" />
                <span>AI is generating a greeting...</span>
              </div>
            ) : record.aiGreeting ? (
              <div className="mt-3 relative bg-slate-50 rounded-lg p-3 border border-slate-100">
                <Sparkles className="w-4 h-4 text-indigo-500 absolute top-3 left-3" />
                <p className="text-sm text-slate-700 pl-7 leading-relaxed italic">
                  "{record.aiGreeting}"
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};
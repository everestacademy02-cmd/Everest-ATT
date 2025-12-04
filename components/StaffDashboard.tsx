import React, { useState } from 'react';
import { Fingerprint, LogOut, History, Settings, X, Check, MapPin, Battery, Zap } from 'lucide-react';
import { AttendanceRecord, User } from '../types';
import { CameraCapture } from './CameraCapture';
import { AttendanceList } from './AttendanceList';
import { generateSmartGreeting } from '../services/geminiService';

interface StaffDashboardProps {
  currentUser: User;
  records: AttendanceRecord[];
  onAddRecord: (record: AttendanceRecord) => void;
  onLogout: () => void;
}

type LocationAccuracy = 'high' | 'medium' | 'low';

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ currentUser, records, onAddRecord, onLogout }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeType, setActiveType] = useState<'CLOCK_IN' | 'CLOCK_OUT'>('CLOCK_IN');
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<LocationAccuracy>('high');

  const handleOpenClockIn = () => {
    setActiveType('CLOCK_IN');
    setIsCameraOpen(true);
  };

  const handleOpenClockOut = () => {
    setActiveType('CLOCK_OUT');
    setIsCameraOpen(true);
  };

  const handleCapture = async (imageData: string) => {
    // Close camera immediately for better UX
    setIsCameraOpen(false);

    const tempId = Date.now().toString();

    // Create a record
    const newRecord: AttendanceRecord = {
      id: tempId,
      staffName: currentUser.name,
      timestamp: new Date(),
      photoUrl: imageData,
      type: activeType,
      isSyncing: true
    };

    // Notify parent to add record immediately (optimistic)
    onAddRecord(newRecord);

    // Define geolocation fetcher based on user settings
    const getLocation = () => new Promise<{latitude: number; longitude: number} | undefined>((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve(undefined);
        return;
      }

      let options: PositionOptions;
      
      switch (locationAccuracy) {
        case 'high':
          // Best accuracy, forces fresh GPS, shorter timeout
          options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
          break;
        case 'medium':
          // Good accuracy, accepts cached position from last minute
          options = { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 };
          break;
        case 'low':
          // Low power, accepts any cached position, no GPS force
          options = { enableHighAccuracy: false, timeout: 5000, maximumAge: Infinity };
          break;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error("Location error:", error);
          resolve(undefined);
        },
        options
      );
    });

    // Call Gemini Service and Location in parallel
    const [greeting, location] = await Promise.all([
      generateSmartGreeting(imageData, currentUser.name, activeType),
      getLocation()
    ]);

    // Create updated record
    const updatedRecord = {
      ...newRecord,
      aiGreeting: greeting,
      isSyncing: false,
      location: location
    };

    // We need to update the specific record in the parent state. 
    onAddRecord(updatedRecord);
  };

  // Filter records for this staff member only
  const myRecords = records.filter(r => r.staffName === currentUser.name);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
      
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {currentUser.name}</h1>
          <p className="text-slate-500">Mark your attendance securely with Face ID.</p>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button 
          onClick={handleOpenClockIn}
          className="group relative overflow-hidden bg-white hover:bg-indigo-50 p-6 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all duration-300 shadow-sm hover:shadow-indigo-100/50 text-left"
        >
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Fingerprint className="w-24 h-24 text-indigo-600 transform rotate-12" />
           </div>
           <div className="relative z-10">
             <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Fingerprint className="w-6 h-6" />
             </div>
             <h3 className="text-lg font-bold text-slate-900">Clock In</h3>
             <p className="text-sm text-slate-500 mt-1">Start your shift</p>
           </div>
        </button>

        <button 
          onClick={handleOpenClockOut}
          className="group relative overflow-hidden bg-white hover:bg-amber-50 p-6 rounded-2xl border border-slate-200 hover:border-amber-200 transition-all duration-300 shadow-sm hover:shadow-amber-100/50 text-left"
        >
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <LogOut className="w-24 h-24 text-amber-600 transform -rotate-12" />
           </div>
           <div className="relative z-10">
             <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <LogOut className="w-6 h-6" />
             </div>
             <h3 className="text-lg font-bold text-slate-900">Clock Out</h3>
             <p className="text-sm text-slate-500 mt-1">End your shift</p>
           </div>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              Your Recent Activity
            </h2>
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
              Today
            </span>
         </div>
         
         <AttendanceList records={myRecords} />
      </div>

      <CameraCapture 
        show={isCameraOpen} 
        onCapture={handleCapture} 
        onClose={() => setIsCameraOpen(false)} 
      />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                 <Settings className="w-5 h-5 text-slate-700" />
                 <h3 className="font-bold text-lg text-slate-800">Settings</h3>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-6">
              <h4 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider text-xs">Location Accuracy</h4>
              <div className="space-y-3">
                {/* High Accuracy */}
                <button
                  onClick={() => setLocationAccuracy('high')}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${
                    locationAccuracy === 'high' 
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                      : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${locationAccuracy === 'high' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                     <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                       <span className={`font-semibold ${locationAccuracy === 'high' ? 'text-indigo-900' : 'text-slate-900'}`}>High Accuracy</span>
                       {locationAccuracy === 'high' && <Check className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Uses GPS for precise location. Best for outdoor tracking but may consume more battery and take longer.
                    </p>
                  </div>
                </button>

                {/* Medium Accuracy */}
                <button
                  onClick={() => setLocationAccuracy('medium')}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${
                    locationAccuracy === 'medium' 
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                      : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${locationAccuracy === 'medium' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                     <Battery className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                       <span className={`font-semibold ${locationAccuracy === 'medium' ? 'text-indigo-900' : 'text-slate-900'}`}>Balanced</span>
                       {locationAccuracy === 'medium' && <Check className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Combines accuracy with efficiency. Accepts recently cached locations (up to 1 min) if available.
                    </p>
                  </div>
                </button>

                {/* Low Accuracy */}
                <button
                  onClick={() => setLocationAccuracy('low')}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${
                    locationAccuracy === 'low' 
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                      : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${locationAccuracy === 'low' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                     <Zap className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                       <span className={`font-semibold ${locationAccuracy === 'low' ? 'text-indigo-900' : 'text-slate-900'}`}>Low Power</span>
                       {locationAccuracy === 'low' && <Check className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Fastest response. Uses Wi-Fi/Cellular approx location. Best for saving battery.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
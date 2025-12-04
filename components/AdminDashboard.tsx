import React, { useState, useMemo } from 'react';
import { Users, FileText, Map, Filter, Plus, UserPlus, Trash2, Lock, Download, Calendar } from 'lucide-react';
import { AttendanceRecord, User } from '../types';
import { AttendanceList } from './AttendanceList';

interface AdminDashboardProps {
  records: AttendanceRecord[];
  users: User[];
  onAddStaff: (user: User) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ records, users, onAddStaff }) => {
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'STAFF'>('REPORTS');
  
  // Staff Management State
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUser, setNewStaffUser] = useState('');
  const [newStaffPass, setNewStaffPass] = useState('');
  const [showAddStaff, setShowAddStaff] = useState(false);

  // Calculate statistics
  const today = new Date().toDateString();
  const todaysRecords = records.filter(r => new Date(r.timestamp).toDateString() === today);
  const activeStaffCount = new Set(todaysRecords.map(r => r.staffName)).size;
  const staffList = users.filter(u => u.role === 'STAFF');

  // Monthly Statistics Logic
  const monthlyStats = useMemo(() => {
    const stats: any[] = [];
    const now = new Date();
    
    // 1. Identify all unique Year-Month combinations from records + Current Month
    const periods = new Set<string>();
    // Ensure current month is always shown
    periods.add(`${now.getFullYear()}-${now.getMonth()}`); 
    
    records.forEach(r => {
      const d = new Date(r.timestamp);
      periods.add(`${d.getFullYear()}-${d.getMonth()}`);
    });

    // Convert to array and sort desc (Newest months first)
    const sortedPeriods = Array.from(periods).sort((a, b) => {
      const [y1, m1] = a.split('-').map(Number);
      const [y2, m2] = b.split('-').map(Number);
      return (y2 - y1) || (m2 - m1);
    });

    // 2. Generate stats for every staff member for every period
    sortedPeriods.forEach(periodKey => {
      const [year, monthIndex] = periodKey.split('-').map(Number);
      const periodDate = new Date(year, monthIndex);
      const monthName = periodDate.toLocaleString('default', { month: 'long' });
      
      // Calculate how many days have passed in this month to determine potential attendance
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      let daysPassed = 0;
      
      if (year === now.getFullYear() && monthIndex === now.getMonth()) {
        // Current month: count days up to today
        daysPassed = now.getDate();
      } else if (periodDate < now) {
        // Past month: count all days in month
        daysPassed = daysInMonth;
      } else {
        // Future month (shouldn't happen based on logic): 0
        daysPassed = 0;
      }

      staffList.forEach(staff => {
        // Filter records for this specific staff in this specific month
        const staffRecords = records.filter(r => {
           const d = new Date(r.timestamp);
           return r.staffName === staff.name && d.getFullYear() === year && d.getMonth() === monthIndex;
        });

        // Count unique days present
        const uniqueDaysPresent = new Set(staffRecords.map(r => new Date(r.timestamp).toDateString())).size;
        
        // Calculate absent days (Days Passed - Days Present)
        // Ensure it doesn't go below 0
        const daysAbsent = Math.max(0, daysPassed - uniqueDaysPresent);

        stats.push({
          key: `${staff.id}-${year}-${monthIndex}`,
          staffName: staff.name,
          month: monthName,
          year: year,
          present: uniqueDaysPresent,
          absent: daysAbsent,
          totalActions: staffRecords.length
        });
      });
    });

    return stats;
  }, [records, staffList]);

  const handleExportDetailedCSV = () => {
    // Export detailed records with Date and Time
    const headers = ['Date', 'Time', 'Staff Name', 'Action', 'Location', 'AI Greeting'];
    
    const sortedRecords = [...records].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const csvContent = [
      headers.join(','),
      ...sortedRecords.map(record => {
        const dateObj = new Date(record.timestamp);
        const date = dateObj.toLocaleDateString();
        const time = dateObj.toLocaleTimeString();
        const locationStr = record.location 
          ? `"${record.location.latitude.toFixed(6)}, ${record.location.longitude.toFixed(6)}"` 
          : '"N/A"';
        const cleanGreeting = record.aiGreeting ? record.aiGreeting.replace(/"/g, '""') : '';
        
        return `"${date}","${time}","${record.staffName}","${record.type.replace('_', ' ')}",${locationStr},"${cleanGreeting}"`;
      })
    ].join('\n');

    downloadCSV(csvContent, `detailed_attendance_logs_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportSummaryCSV = () => {
    // Export the Monthly Summary Table
    const headers = ['Staff Name', 'Month', 'Year', 'Total Present', 'Total Absent', 'Total Scans'];
    
    const csvContent = [
        headers.join(','),
        ...monthlyStats.map(stat => 
            `"${stat.staffName}","${stat.month}",${stat.year},${stat.present},${stat.absent},${stat.totalActions}`
        )
    ].join('\n');

    downloadCSV(csvContent, `monthly_attendance_summary_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if(newStaffName && newStaffUser && newStaffPass) {
        const newUser: User = {
            id: Date.now().toString(),
            name: newStaffName,
            username: newStaffUser,
            password: newStaffPass,
            role: 'STAFF'
        };
        onAddStaff(newUser);
        setNewStaffName('');
        setNewStaffUser('');
        setNewStaffPass('');
        setShowAddStaff(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500">Overview of all staff attendance and reports.</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="bg-slate-100 p-1 rounded-lg inline-flex">
            <button 
                onClick={() => setActiveTab('REPORTS')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'REPORTS' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
                Attendance Reports
            </button>
            <button 
                onClick={() => setActiveTab('STAFF')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'STAFF' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
                Manage Staff
            </button>
        </div>
      </div>

      {activeTab === 'REPORTS' ? (
        <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
                </div>
                <p className="text-slate-500 text-sm font-medium">Active Staff Today</p>
                <h3 className="text-2xl font-bold text-slate-900">{activeStaffCount}</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                    </div>
                </div>
                <p className="text-slate-500 text-sm font-medium">Total Entries</p>
                <h3 className="text-2xl font-bold text-slate-900">{records.length}</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                    <Map className="w-6 h-6" />
                    </div>
                </div>
                <p className="text-slate-500 text-sm font-medium">Locations Tracked</p>
                <h3 className="text-2xl font-bold text-slate-900">{records.filter(r => r.location).length}</h3>
                </div>
            </div>

            {/* Monthly Summary Section */}
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-slate-500" />
                        Monthly Attendance Summary
                     </h2>
                     <div className="flex gap-2">
                         <button 
                            onClick={handleExportSummaryCSV}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2 shadow-sm"
                         >
                            <Download className="w-4 h-4" />
                            Export Summary
                        </button>
                         <button 
                            onClick={handleExportDetailedCSV}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 shadow-sm shadow-emerald-200"
                         >
                            <Download className="w-4 h-4" />
                            Export Detailed Logs
                        </button>
                     </div>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-900">Staff Name</th>
                                    <th className="px-6 py-4 font-semibold text-slate-900">Month</th>
                                    <th className="px-6 py-4 font-semibold text-slate-900">Year</th>
                                    <th className="px-6 py-4 font-semibold text-slate-900">Present (Days)</th>
                                    <th className="px-6 py-4 font-semibold text-slate-900">Absent (Days)</th>
                                    <th className="px-6 py-4 font-semibold text-slate-900">Total Scans</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {monthlyStats.length > 0 ? monthlyStats.map((stat) => (
                                    <tr key={stat.key} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{stat.staffName}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-semibold uppercase">
                                                {stat.month}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{stat.year}</td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-emerald-600">{stat.present}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${stat.absent > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                {stat.absent}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{stat.totalActions}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                            No attendance data available for summary.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* All Records List */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                     <h2 className="text-lg font-bold text-slate-900">Recent Activity Feed</h2>
                </div>
                <div className="bg-slate-50 p-1 rounded-xl">
                   <AttendanceList records={records} />
                </div>
            </div>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* Staff Management Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">Registered Staff Members</h2>
                <button 
                    onClick={() => setShowAddStaff(!showAddStaff)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 shadow-sm shadow-emerald-200"
                >
                    {showAddStaff ? 'Cancel' : 'Add New Staff'}
                    <Plus className={`w-4 h-4 transition-transform ${showAddStaff ? 'rotate-45' : ''}`} />
                </button>
            </div>

            {/* Add Staff Form */}
            {showAddStaff && (
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl shadow-sm">
                    <h3 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Create New Staff Account
                    </h3>
                    <form onSubmit={handleCreateStaff} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-emerald-800 mb-1">Staff Full Name</label>
                            <input 
                                type="text"
                                value={newStaffName}
                                onChange={e => setNewStaffName(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="e.g. Jane Doe"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-emerald-800 mb-1">Username (Login ID)</label>
                            <input 
                                type="text"
                                value={newStaffUser}
                                onChange={e => setNewStaffUser(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="e.g. janed"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-emerald-800 mb-1">Set Password</label>
                            <div className="relative">
                                <input 
                                    type="text"
                                    value={newStaffPass}
                                    onChange={e => setNewStaffPass(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="Password"
                                    required
                                />
                            </div>
                        </div>
                        <div className="md:col-span-3 flex justify-end mt-2">
                            <button type="submit" className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700">
                                Create Account
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Staff List */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-900">Name</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Username</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Password</th>
                            <th className="px-6 py-4 font-semibold text-slate-900 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {staffList.length > 0 ? staffList.map((staff) => (
                            <tr key={staff.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                                        {staff.name.charAt(0)}
                                    </div>
                                    {staff.name}
                                </td>
                                <td className="px-6 py-4">{staff.username}</td>
                                <td className="px-6 py-4 font-mono text-slate-500 flex items-center gap-2">
                                    <Lock className="w-3 h-3" />
                                    {staff.password}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                    No staff members registered yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};
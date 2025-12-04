import React, { useState } from 'react';
import { ShieldCheck, LogOut as LogOutIcon } from 'lucide-react';
import { AttendanceRecord, User } from './types';
import { LoginScreen } from './components/LoginScreen';
import { StaffDashboard } from './components/StaffDashboard';
import { AdminDashboard } from './components/AdminDashboard';

// Initial Mock Data
const INITIAL_USERS: User[] = [
  { id: '1', username: 'admin', password: 'admin', name: 'Administrator', role: 'ADMIN' },
  { id: '2', username: 'staff', password: 'staff', name: 'Alex Chen', role: 'STAFF' }
];

const INITIAL_RECORDS: AttendanceRecord[] = [
  {
    id: 'mock-1',
    staffName: 'Sarah Jones',
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    type: 'CLOCK_IN',
    aiGreeting: "Welcome Sarah! Your smile brightens the office today.",
    isSyncing: false,
    location: { latitude: 40.7128, longitude: -74.0060 }
  },
  {
    id: 'mock-2',
    staffName: 'Mike Ross',
    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    type: 'CLOCK_IN',
    aiGreeting: "Good morning Mike, ready to tackle the day!",
    isSyncing: false,
    location: { latitude: 40.7130, longitude: -74.0055 }
  }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [records, setRecords] = useState<AttendanceRecord[]>(INITIAL_RECORDS);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleRegisterUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  // Centralized record management
  const handleUpdateRecord = (record: AttendanceRecord) => {
    setRecords(prev => {
      const exists = prev.find(r => r.id === record.id);
      if (exists) {
        return prev.map(r => r.id === record.id ? record : r);
      }
      return [record, ...prev];
    });
  };

  // If not logged in, show login screen
  if (!user) {
    return (
      <LoginScreen 
        users={users}
        onLogin={handleLogin} 
        onRegister={handleRegisterUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${user.role === 'ADMIN' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className={`text-xl font-bold bg-clip-text text-transparent ${user.role === 'ADMIN' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-indigo-600 to-blue-600'}`}>
                {user.role === 'ADMIN' ? 'StaffSnap Admin' : 'StaffSnap'}
              </span>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden sm:flex flex-col items-end mr-2">
                  <span className="text-sm font-semibold text-slate-700">{user.name}</span>
                  <span className="text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</span>
               </div>
               <button 
                 onClick={handleLogout}
                 className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                 title="Logout"
               >
                  <LogOutIcon className="w-5 h-5" />
               </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {user.role === 'ADMIN' ? (
          <AdminDashboard 
            records={records} 
            users={users}
            onAddStaff={handleRegisterUser}
          />
        ) : (
          <StaffDashboard 
            currentUser={user} 
            records={records} 
            onAddRecord={handleUpdateRecord} 
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  );
};

export default App;
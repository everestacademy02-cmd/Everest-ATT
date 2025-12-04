import React, { useState } from 'react';
import { ShieldCheck, Lock, User as UserIcon, ChevronRight, UserPlus } from 'lucide-react';
import { User, UserRole } from '../types';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  onRegister: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin, onRegister }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      // Registration Logic (Admin Self-Registration)
      if (!username || !password || !name) {
        setError('All fields are required');
        return;
      }
      
      if (users.some(u => u.username === username)) {
        setError('Username already exists');
        return;
      }

      const newUser: User = {
        id: Date.now().toString(),
        username,
        password,
        name,
        role: 'ADMIN' // Self-registration is only for Admins
      };
      
      onRegister(newUser);
      onLogin(newUser);
      
    } else {
      // Login Logic
      const foundUser = users.find(
        (u) => u.username === username && u.password === password
      );

      if (foundUser) {
        onLogin(foundUser);
      } else {
        setError('Invalid credentials.');
      }
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setUsername('');
    setPassword('');
    setName('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 bg-indigo-600 text-center transition-colors duration-300">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
            {isRegistering ? (
              <UserPlus className="w-8 h-8 text-white" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isRegistering ? 'Admin Registration' : 'StaffSnap Portal'}
          </h1>
          <p className="text-indigo-100 mt-2 text-sm">
            {isRegistering ? 'Create your admin account' : 'Secure Attendance Management'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          
          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => isRegistering && toggleMode()}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isRegistering ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => !isRegistering && toggleMode()}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isRegistering ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Register Admin
            </button>
          </div>

          {isRegistering && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-medium text-slate-700 block">Full Name</label>
              <div className="relative">
                <UserIcon className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g. John Doe"
                  required={isRegistering}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 block">Username</label>
            <div className="relative">
              <UserIcon className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter your ID"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 block">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium animate-in fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            {isRegistering ? 'Create Account' : 'Login'}
            <ChevronRight className="w-4 h-4" />
          </button>
          
          {!isRegistering && (
             <div className="text-center text-xs text-slate-400 mt-4">
                Note: Staff members must get their credentials from an Admin.
             </div>
          )}
        </form>
      </div>
    </div>
  );
};
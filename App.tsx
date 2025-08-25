
import React, { useState, useEffect } from 'react';
import CompetitorAnalysis from './components/CompetitorAnalysis';
import PitchDeckLibrary from './components/PitchDeckLibrary';
import SalesDashboard from './components/SalesDashboard';
import AdminDashboard from './components/AdminDashboard';
import DataQuality from './components/DataQuality';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import { Card } from './components/ui/Card';
import { ChartBarIcon, PresentationChartBarIcon, DashboardIcon, LogoutIcon, UserCircleIcon, ShieldCheckIcon, DocumentCheckIcon } from './components/icons/Icons';
import * as authService from './services/authService';
import * as clientService from './services/clientService';
import type { User, Client } from './types';

type Tool = 'competitor' | 'pitch' | 'dashboard' | 'admin' | 'data';
type AuthView = 'login' | 'register';

const AuthenticatedApp: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [activeTool, setActiveTool] = useState<Tool>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState<boolean>(true);

  useEffect(() => {
    const loadClients = async () => {
      setIsLoadingClients(true);
      const userClients = await clientService.getClients(user.id);
      setClients(userClients);
      setIsLoadingClients(false);
    };
    if (activeTool === 'dashboard') {
        loadClients();
    }
  }, [user.id, activeTool]);

  

  const handleAddClient = async (newClientData: Pick<Client, 'name' | 'value' | 'status' | 'email' | 'phone'>) => {
    const newClient = await clientService.addClient(user.id, newClientData);
    setClients(prevClients => [newClient, ...prevClients]);
  };


  const NavButton = ({ tool, label, children }: { tool: Tool, label: string, children: React.ReactNode }) => (
    <button
      onClick={() => setActiveTool(tool)}
      className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 ${
        activeTool === tool
          ? 'bg-sky-600 text-white shadow-md'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
      }`}
    >
      {children}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <header className="bg-slate-800 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between py-3 gap-4">
            <h1 className="text-2xl font-bold text-white">
              ClientIQ
            </h1>
            <div className="flex items-center gap-4">
                <nav className="flex items-center gap-2 p-1 bg-slate-900/50 rounded-lg">
                    <NavButton tool="dashboard" label="Dashboard">
                        <DashboardIcon className="w-5 h-5" />
                    </NavButton>
                    <NavButton tool="competitor" label="Competitor Analysis">
                        <ChartBarIcon className="w-5 h-5" />
                    </NavButton>
                    <NavButton tool="pitch" label="Pitch Deck Library">
                        <PresentationChartBarIcon className="w-5 h-5" />
                    </NavButton>
                    <NavButton tool="data" label="Data Quality">
                        <DocumentCheckIcon className="w-5 h-5" />
                    </NavButton>
                    {user.isAdmin && (
                         <NavButton tool="admin" label="Admin">
                            <ShieldCheckIcon className="w-5 h-5" />
                        </NavButton>
                    )}
                </nav>
                 <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                        <UserCircleIcon className="w-6 h-6 text-slate-400" />
                        <span>{user.name}</span>
                    </div>
                    <button onClick={onLogout} title="Logout" className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                        <LogoutIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
          </div>
        </div>
      </header>

      <main key={activeTool} className="container mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in-up">
        {activeTool === 'dashboard' && <SalesDashboard clients={clients} onAddClient={handleAddClient} isLoading={isLoadingClients} />}
        {activeTool === 'competitor' && <CompetitorAnalysis />}
        {activeTool === 'pitch' && <PitchDeckLibrary />}
        {activeTool === 'data' && <DataQuality />}
        {activeTool === 'admin' && user.isAdmin && <AdminDashboard />}
      </main>

      <footer className="text-center py-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center justify-center gap-2">
            <span>Created by code.serve</span>
        </div>
      </footer>
    </div>
  );
};


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [authView, setAuthView] = useState<AuthView>('login');
  
  const handleAuthSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    if (user) {
        authService.logout(user.id);
    } else {
        authService.logout();
    }
    setUser(null);
    setAuthView('login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white">
              ClientIQ
            </h1>
            <p className="text-slate-600 dark:text-slate-400">Please log in or register to continue</p>
        </div>
        <Card className="w-full max-w-md">
            {authView === 'login' ? (
                <Login onLoginSuccess={handleAuthSuccess} onSwitchToRegister={() => setAuthView('register')} />
            ) : (
                <Register onRegisterSuccess={handleAuthSuccess} onSwitchToLogin={() => setAuthView('login')} />
            )}
        </Card>
      </div>
    );
  }

  return <AuthenticatedApp user={user} onLogout={handleLogout} />;
};

export default App;
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { MessageCircle, Network, LayoutDashboard, FileText } from 'lucide-react';
import Chat from './components/Chat';
import EntityGraph from './components/EntityGraph';
import Dashboard from './components/Dashboard';
import DocumentViewer from './components/DocumentViewer';
import TransparencyPanel from './components/TransparencyPanel';

export default function App() {
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [transparencyData, setTransparencyData] = useState<any>(null);

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        {/* Navigation */}
        <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-8">
                <Link to="/" className="text-xl font-bold text-purple-400">
                  Fleet Intelligence
                </Link>
                <div className="hidden md:flex gap-4">
                  <NavLink to="/chat" icon={MessageCircle} label="Chat" />
                  <NavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                  <NavLink to="/graph" icon={Network} label="Entity Graph" />
                  <NavLink to="/documents" icon={FileText} label="Documents" />
                </div>
              </div>
              <div className="text-sm text-slate-400">
                API: {import.meta.env.VITE_API_URL || 'http://192.168.1.160:8002'}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Chat onToolExecuted={setTransparencyData} />} />
            <Route path="/chat" element={<Chat onToolExecuted={setTransparencyData} />} />
            <Route path="/dashboard" element={<Dashboard onSelectTruck={setSelectedTruckId} />} />
            <Route path="/graph" element={<EntityGraph onSelectEntity={setSelectedTruckId} />} />
            <Route path="/documents" element={<DocumentViewer truckId={selectedTruckId} />} />
          </Routes>
        </div>

        {/* Transparency Panel */}
        {transparencyData && (
          <div className="fixed bottom-4 right-4 max-w-md">
            <TransparencyPanel data={transparencyData} onClose={() => setTransparencyData(null)} />
          </div>
        )}
      </div>
    </Router>
  );
}

function NavLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-purple-400 transition-colors"
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}

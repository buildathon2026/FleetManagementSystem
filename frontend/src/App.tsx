import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink as RouterNavLink } from 'react-router-dom';
import { MessageCircle, Network, LayoutDashboard, FileText } from 'lucide-react';
import Chat from './components/Chat';
import EntityGraph from './components/EntityGraph';
import Dashboard from './components/Dashboard';
import DocumentViewer from './components/DocumentViewer';
import Overview from './components/Overview';
import ProjectBrief from './components/ProjectBrief';

export default function App() {
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);

  return (
    <Router>
      <div className="min-h-screen bg-[#f7fbff] text-slate-950">
        {/* Navigation */}
        <nav className="sticky top-0 z-30 border-b border-cyan-100 bg-white/95 shadow-sm backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex min-h-16 flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center justify-between gap-4">
                <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-600 text-white shadow-sm shadow-teal-100">
                    <LayoutDashboard size={19} />
                  </span>
                  FleetProof AI
                </Link>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                <NavLink to="/overview" icon={LayoutDashboard} label="Overview" />
                <NavLink to="/dashboard" icon={LayoutDashboard} label="Fleet" />
                <NavLink to="/documents" icon={FileText} label="Documents" />
                <NavLink to="/chat" icon={MessageCircle} label="Ask" />
                <NavLink to="/graph" icon={Network} label="Aliases" />
                <NavLink to="/documentation" icon={FileText} label="Documentation" />
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/brief" element={<ProjectBrief />} />
            <Route path="/documentation" element={<ProjectBrief />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/dashboard" element={<Dashboard onSelectTruck={setSelectedTruckId} />} />
            <Route path="/graph" element={<EntityGraph onSelectEntity={setSelectedTruckId} />} />
            <Route path="/documents" element={<DocumentViewer truckId={selectedTruckId} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function NavLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        isActive
          ? 'flex shrink-0 items-center gap-2 rounded-md bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800 ring-1 ring-teal-100'
          : 'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-cyan-50 hover:text-cyan-800'
      }
    >
      <Icon size={18} />
      {label}
    </RouterNavLink>
  );
}

import { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp, DollarSign, FileCheck, Archive, Zap } from 'lucide-react';
import apiService from '../services/mockApi';

interface Truck {
  id: string;
  driver: string;
  status: string;
  revenue_mtd: number;
  doc_count: number;
}

interface Alert {
  id: number;
  truck_id: string;
  type: string;
  message: string;
  severity: string;
}

export default function Dashboard({ onSelectTruck }: { onSelectTruck: (id: string) => void }) {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'revenue' | 'documents' | 'id'>('revenue');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const overview = await apiService.getFleetOverview();
        setTrucks(overview.trucks);
        setAlerts(overview.alerts);
      } catch (error) {
        console.error('Error fetching fleet overview:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading fleet data...</div>;
  }

  const sortedTrucks = [...trucks].sort((a, b) => {
    if (sortBy === 'revenue') return b.revenue_mtd - a.revenue_mtd;
    if (sortBy === 'documents') return b.doc_count - a.doc_count;
    return a.id.localeCompare(b.id);
  });

  const totalRevenue = trucks.reduce((sum, t) => sum + t.revenue_mtd, 0);
  const activeTrucks = trucks.filter((t) => t.status === 'active').length;
  const totalDocs = trucks.reduce((sum, t) => sum + t.doc_count, 0);
  const avgExpenses = totalRevenue / trucks.length;

  return (
    <div className="space-y-6">
      {/* Problem Context */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 backdrop-blur">
        <p className="text-sm text-slate-300 leading-relaxed">
          <span className="font-semibold">The Challenge:</span> {totalDocs} documents across {trucks.length} trucks—
          all stored before in filing cabinets and emails, unsearchable, unorganized.
          <br />
          <span className="text-slate-400">Today: Everything is ingested, linked to the right truck, and queryable in plain English.</span>
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Total Revenue (MTD)"
          value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          color="bg-green-900/20 text-green-400"
          description="Across all trucks"
        />
        <StatCard
          icon={FileCheck}
          label="Documents Ingested"
          value={totalDocs.toString()}
          color="bg-blue-900/20 text-blue-400"
          description="Pre-scanned & linked"
        />
        <StatCard
          icon={Archive}
          label="Active Trucks"
          value={`${activeTrucks}/${trucks.length}`}
          color="bg-purple-900/20 text-purple-400"
          description="In fleet"
        />
        <StatCard
          icon={DollarSign}
          label="Avg Spend/Truck"
          value={`$${avgExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          color="bg-orange-900/20 text-orange-400"
          description="Monthly"
        />
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div className="bg-slate-900 border border-red-800/50 rounded-lg p-4">
          <h3 className="flex items-center gap-2 font-semibold text-red-400 mb-3">
            <AlertCircle size={20} />
            Critical Alerts ({alerts.length})
          </h3>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded border-l-4 flex justify-between items-start ${
                  alert.severity === 'critical'
                    ? 'bg-red-900/20 border-red-600 text-red-200'
                    : alert.severity === 'alert'
                      ? 'bg-yellow-900/20 border-yellow-600 text-yellow-200'
                      : 'bg-orange-900/20 border-orange-600 text-orange-200'
                }`}
              >
                <div>
                  <p className="font-medium text-sm">{alert.message}</p>
                  <p className="text-xs opacity-75">Vehicle: {alert.truck_id}</p>
                </div>
                <span className="text-xs font-semibold">
                  {alert.severity === 'critical' ? '🔴' : alert.severity === 'alert' ? '🟡' : '🟠'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trucks Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-100">Fleet Overview</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('revenue')}
              className={`px-3 py-2 text-sm rounded ${
                sortBy === 'revenue'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              } transition-colors`}
            >
              💰 Revenue
            </button>
            <button
              onClick={() => setSortBy('documents')}
              className={`px-3 py-2 text-sm rounded ${
                sortBy === 'documents'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              } transition-colors`}
            >
              📄 Documents
            </button>
            <button
              onClick={() => setSortBy('id')}
              className={`px-3 py-2 text-sm rounded ${
                sortBy === 'id'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              } transition-colors`}
            >
              🆔 Name
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTrucks.map((truck) => (
            <button
              key={truck.id}
              onClick={() => onSelectTruck(truck.id)}
              className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-purple-600 hover:shadow-lg hover:shadow-purple-600/20 transition-all text-left group"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-bold text-purple-400 group-hover:text-purple-300 transition-colors">
                    {truck.id}
                  </h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                    {truck.driver}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    truck.status === 'active'
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-red-900/30 text-red-400'
                  }`}
                >
                  {truck.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                </span>
              </div>

              {/* Metrics */}
              <div className="space-y-2 border-t border-slate-700 pt-3">
                {/* Revenue */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Revenue (MTD)</span>
                  <span className="font-semibold text-green-400">
                    ${truck.revenue_mtd.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* Documents */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Documents</span>
                  <span className="font-semibold text-slate-100 flex items-center gap-1">
                    <FileCheck size={14} />
                    {truck.doc_count}
                  </span>
                </div>

                {/* Profitability */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Profitability</span>
                  <span className={`font-semibold text-sm ${
                    truck.revenue_mtd > avgExpenses
                      ? 'text-green-400'
                      : truck.revenue_mtd > avgExpenses * 0.8
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }`}>
                    {truck.revenue_mtd > avgExpenses ? '📈 Above Avg' : truck.revenue_mtd > avgExpenses * 0.8 ? '📊 At Avg' : '📉 Below Avg'}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-500 group-hover:text-purple-400 transition-colors flex items-center gap-1">
                <Zap size={14} />
                Click to view documents & details →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  description,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
  description?: string;
}) {
  return (
    <div className={`${color} border border-opacity-20 rounded-lg p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs opacity-75 mb-1">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && <p className="text-xs opacity-50 mt-1">{description}</p>}
        </div>
        <Icon size={32} className="opacity-30 flex-shrink-0" />
      </div>
    </div>
  );
}

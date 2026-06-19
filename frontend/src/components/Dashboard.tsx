import { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp, DollarSign, FileCheck } from 'lucide-react';
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
    return <div className="text-center py-12">Loading fleet data...</div>;
  }

  const totalRevenue = trucks.reduce((sum, t) => sum + t.revenue_mtd, 0);
  const activeTrucks = trucks.filter((t) => t.status === 'active').length;

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Total Revenue (MTD)"
          value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          color="bg-green-900/20 text-green-400"
        />
        <StatCard icon={FileCheck} label="Active Trucks" value={`${activeTrucks}/${trucks.length}`} color="bg-blue-900/20 text-blue-400" />
        <StatCard
          icon={DollarSign}
          label="Average Revenue"
          value={`$${(totalRevenue / trucks.length).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          color="bg-purple-900/20 text-purple-400"
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-slate-900 border border-red-800 rounded-lg p-4">
          <h3 className="flex items-center gap-2 font-semibold text-red-400 mb-3">
            <AlertCircle size={20} />
            Active Alerts
          </h3>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded border-l-4 ${
                  alert.severity === 'critical'
                    ? 'bg-red-900/20 border-red-600 text-red-200'
                    : alert.severity === 'alert'
                      ? 'bg-yellow-900/20 border-yellow-600 text-yellow-200'
                      : 'bg-orange-900/20 border-orange-600 text-orange-200'
                }`}
              >
                <p className="font-medium text-sm">{alert.message}</p>
                <p className="text-xs opacity-75">{alert.truck_id}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trucks Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-slate-100">Fleet Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trucks.map((truck) => (
            <div
              key={truck.id}
              onClick={() => onSelectTruck(truck.id)}
              className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-purple-600 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-purple-400">{truck.id}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    truck.status === 'active'
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-red-900/30 text-red-400'
                  }`}
                >
                  {truck.status}
                </span>
              </div>

              <p className="text-sm text-slate-300 mb-4">Driver: {truck.driver}</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Revenue (MTD):</span>
                  <span className="font-semibold text-green-400">
                    ${truck.revenue_mtd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Documents:</span>
                  <span className="font-semibold">{truck.doc_count}</span>
                </div>
              </div>
            </div>
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
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`${color} border border-opacity-20 rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-75">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon size={32} className="opacity-50" />
      </div>
    </div>
  );
}

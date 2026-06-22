import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, ArrowRight, DollarSign, FileCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiService from '../services/mockApi';

interface FleetTruck {
  id: string;
  driver: string;
  status: string;
  revenue_mtd: number;
  doc_count: number;
}

interface FleetAlert {
  id: number;
  truck_id: string;
  type: string;
  message: string;
  severity: string;
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function Dashboard({ onSelectTruck }: { onSelectTruck: (id: string) => void }) {
  const [trucks, setTrucks] = useState<FleetTruck[]>([]);
  const [alerts, setAlerts] = useState<FleetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'attention' | 'revenue' | 'documents'>('attention');

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
    return (
      <div className="rounded-lg border border-blue-100 bg-white p-8 text-center text-slate-600">
        Loading fleet status...
      </div>
    );
  }

  const alertTruckIds = new Set(alerts.map((alert) => alert.truck_id));
  const sortedTrucks = [...trucks].sort((a, b) => {
    if (sortBy === 'attention') {
      return Number(alertTruckIds.has(b.id)) - Number(alertTruckIds.has(a.id));
    }
    if (sortBy === 'revenue') return b.revenue_mtd - a.revenue_mtd;
    return b.doc_count - a.doc_count;
  });

  const totalRevenue = trucks.reduce((sum, truck) => sum + truck.revenue_mtd, 0);
  const activeTrucks = trucks.filter((truck) => truck.status === 'active').length;
  const totalDocs = trucks.reduce((sum, truck) => sum + truck.doc_count, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Fleet Status</h1>
          <p className="mt-1 text-sm text-slate-600">
            Start here to see revenue, document coverage, and trucks that need attention.
          </p>
        </div>
        <Link
          to="/documents"
          className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <FileCheck size={18} />
          Search documents
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard icon={DollarSign} label="Revenue this month" value={currency.format(totalRevenue)} />
        <StatCard icon={Truck} label="Active trucks" value={`${activeTrucks} of ${trucks.length}`} />
        <StatCard icon={FileCheck} label="Documents linked" value={totalDocs.toString()} />
      </section>

      <section className="rounded-lg border border-amber-100 bg-[#fffdf7] shadow-sm">
        <div className="border-b border-amber-100 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-600" size={20} />
            <h2 className="font-semibold text-slate-950">Needs Attention</h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            These are the items an operator would probably check first.
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {alerts.length === 0 ? (
            <p className="p-4 text-sm text-slate-600">No open alerts.</p>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={severityClass(alert.severity)}>{alert.severity}</span>
                    <span className="font-semibold text-slate-950">{alert.truck_id}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
                </div>
                <button
                  onClick={() => onSelectTruck(alert.truck_id)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:text-slate-600"
                >
                  Select truck <ArrowRight size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-lg border border-blue-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-blue-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">Truck List</h2>
            <p className="mt-1 text-sm text-slate-600">Choose a truck, then open Documents to see its records.</p>
          </div>
          <div className="flex gap-2">
            <SortButton active={sortBy === 'attention'} onClick={() => setSortBy('attention')}>
              Attention
            </SortButton>
            <SortButton active={sortBy === 'revenue'} onClick={() => setSortBy('revenue')}>
              Revenue
            </SortButton>
            <SortButton active={sortBy === 'documents'} onClick={() => setSortBy('documents')}>
              Documents
            </SortButton>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-blue-50 text-xs font-semibold uppercase text-blue-800">
              <tr>
                <th className="px-4 py-3">Truck</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Documents</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTrucks.map((truck) => (
                <tr key={truck.id} className="hover:bg-blue-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-950">
                    <div className="flex items-center gap-2">
                      {alertTruckIds.has(truck.id) && <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />}
                      {truck.id}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{truck.driver}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        truck.status === 'active'
                          ? 'rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700'
                          : 'rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700'
                      }
                    >
                      {truck.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{currency.format(truck.revenue_mtd)}</td>
                  <td className="px-4 py-3 text-slate-700">{truck.doc_count}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onSelectTruck(truck.id)}
                      className="rounded-md border border-blue-200 px-3 py-1.5 font-semibold text-blue-800 hover:bg-blue-50"
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-blue-800">
          <Icon size={22} />
        </span>
      </div>
    </div>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? 'rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white'
          : 'rounded-md border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50'
      }
    >
      {children}
    </button>
  );
}

function severityClass(severity: string) {
  if (severity === 'critical') {
    return 'rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold uppercase text-rose-700';
  }
  if (severity === 'alert') {
    return 'rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold uppercase text-amber-700';
  }
  return 'rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold uppercase text-sky-700';
}

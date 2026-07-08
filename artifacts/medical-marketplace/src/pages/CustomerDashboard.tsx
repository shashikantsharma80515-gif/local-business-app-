import React from 'react';
import { DashboardLayout, StatusBadge } from '@/components/DashboardLayout';
import { useGetCustomerDashboard, getGetCustomerDashboardQueryKey } from '@workspace/api-client-react';
import { Package, Activity, CheckCircle, MapPin, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'wouter';

export function CustomerDashboardPage() {
  const { data: dashboard, isLoading, error } = useGetCustomerDashboard({
    query: { queryKey: getGetCustomerDashboardQueryKey() }
  });

  if (isLoading) {
    return (
      <DashboardLayout role="customer">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="customer">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          Failed to load dashboard data.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="customer">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customer Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Overview of your orders and nearby stores.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg text-blue-600 dark:text-blue-400">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Orders</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{dashboard?.totalOrders || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Orders</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{dashboard?.activeOrders || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg text-green-600 dark:text-green-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Delivered</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{dashboard?.deliveredOrders || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Orders</h2>
              <button className="text-sm text-primary font-medium hover:underline">View All</button>
            </div>
            
            {dashboard?.recentOrders && dashboard.recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 uppercase">
                    <tr>
                      <th className="px-6 py-4 font-medium">Order ID</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Amount</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-200 dark:border-slate-800 last:border-0">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          #{order.id.toString().padStart(5, '0')}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                          ${order.totalAmount?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={order.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p>No recent orders found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Nearby Stores */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nearby Stores</h2>
            </div>
            <div className="p-2">
              {dashboard?.nearbyStores && dashboard.nearbyStores.length > 0 ? (
                <div className="space-y-1">
                  {dashboard.nearbyStores.map((store) => (
                    <div key={store.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors flex items-start gap-3 cursor-pointer">
                      <div className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 p-2 rounded-md mt-1">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{store.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate w-48">{store.address}</p>
                        {store.rating && (
                          <div className="flex items-center gap-1 mt-1 text-xs font-medium text-amber-600">
                            ★ {store.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No verified stores found nearby.
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <button className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                <Search className="h-4 w-4" /> Browse All Stores
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
import React from 'react';
import { DashboardLayout, StatusBadge } from '@/components/DashboardLayout';
import { useGetStoreOwnerDashboard, getGetStoreOwnerDashboardQueryKey, useUpdateOrderStatus, OrderStatusUpdateStatus } from '@workspace/api-client-react';
import { Package, Clock, DollarSign, TrendingUp, Store as StoreIcon, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

export function StoreOwnerDashboardPage() {
  const queryClient = useQueryClient();
  const { data: dashboard, isLoading, error } = useGetStoreOwnerDashboard({
    query: { queryKey: getGetStoreOwnerDashboardQueryKey() }
  });

  const updateStatusMutation = useUpdateOrderStatus();

  const handleUpdateStatus = (orderId: number, status: string) => {
    updateStatusMutation.mutate({ 
      id: orderId, 
      data: { status: status as OrderStatusUpdateStatus } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStoreOwnerDashboardQueryKey() });
      }
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout role="store_owner">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="store_owner">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          Failed to load dashboard data.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="store_owner">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Store Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage orders and view revenue for {dashboard?.store?.name}</p>
        </div>
        
        {dashboard?.store && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            {dashboard.store.isVerified ? (
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            ) : (
              <StoreIcon className="h-5 w-5 text-slate-400" />
            )}
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{dashboard.store.name}</p>
              <p className="text-xs text-slate-500">{dashboard.store.isVerified ? 'Verified Store' : 'Pending Verification'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg text-amber-600 dark:text-amber-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{dashboard?.pendingOrders || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg text-emerald-600 dark:text-emerald-400">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Today's Revenue</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">${dashboard?.todayRevenue?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg text-purple-600 dark:text-purple-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">${dashboard?.totalRevenue?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Orders</h2>
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
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-200 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      #{order.id.toString().padStart(5, '0')}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {format(new Date(order.createdAt), 'MMM dd, HH:mm')}
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                      ${order.totalAmount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {order.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                            className="px-3 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-md text-xs font-medium transition-colors"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                            className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-md text-xs font-medium transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {order.status === 'confirmed' && (
                        <button 
                          onClick={() => handleUpdateStatus(order.id, 'preparing')}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-md text-xs font-medium transition-colors"
                        >
                          Mark Preparing
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button 
                          onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')}
                          className="px-3 py-1 bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50 rounded-md text-xs font-medium transition-colors"
                        >
                          Ready for Delivery
                        </button>
                      )}
                      {['out_for_delivery', 'delivered', 'cancelled'].includes(order.status) && (
                        <span className="text-xs text-slate-400">No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p>No orders yet. They will appear here once customers start ordering.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
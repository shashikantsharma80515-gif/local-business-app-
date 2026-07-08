import React from 'react';
import { DashboardLayout, StatusBadge } from '@/components/DashboardLayout';
import { useGetDeliveryDashboard, getGetDeliveryDashboardQueryKey, useUpdateOrderStatus, OrderStatusUpdateStatus } from '@workspace/api-client-react';
import { Truck, CheckCircle, DollarSign, Activity, MapPin, Clock, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

export function DeliveryDashboardPage() {
  const queryClient = useQueryClient();
  const { data: dashboard, isLoading, error } = useGetDeliveryDashboard({
    query: { queryKey: getGetDeliveryDashboardQueryKey() }
  });

  const updateStatusMutation = useUpdateOrderStatus();

  const handleUpdateStatus = (orderId: number, status: string) => {
    updateStatusMutation.mutate({ 
      id: orderId, 
      data: { status: status as OrderStatusUpdateStatus } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDeliveryDashboardQueryKey() });
      }
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout role="delivery_partner">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="delivery_partner">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          Failed to load dashboard data.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="delivery_partner">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Delivery Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your pickups and active deliveries.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg text-blue-600 dark:text-blue-400">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Deliveries</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{dashboard?.totalDeliveries || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg text-amber-600 dark:text-amber-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{dashboard?.activeDeliveries || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg text-green-600 dark:text-green-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed Today</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{dashboard?.completedToday || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg text-emerald-600 dark:text-emerald-400">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Today's Earnings</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">${dashboard?.todayEarnings?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Active Deliveries */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Active Deliveries
          </h2>
          <div className="space-y-4">
            {dashboard?.activeOrders && dashboard.activeOrders.length > 0 ? (
              dashboard.activeOrders.map(order => (
                <div key={order.id} className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Order #{order.id}</p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="font-bold text-lg">${order.totalAmount?.toFixed(2) || '0.00'}</p>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5"><MapPin className="h-4 w-4 text-emerald-500" /></div>
                      <div>
                        <p className="text-xs text-slate-500">Pickup</p>
                        <p className="text-sm font-medium">Store #{order.storeId}</p>
                      </div>
                    </div>
                    <div className="pl-2 border-l border-dashed border-slate-300 ml-1.5 h-4"></div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5"><MapPin className="h-4 w-4 text-primary" /></div>
                      <div>
                        <p className="text-xs text-slate-500">Dropoff</p>
                        <p className="text-sm font-medium">{order.address || 'Address hidden'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleUpdateStatus(order.id, 'delivered')}
                    className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
                  >
                    Mark as Delivered
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500">
                <Truck className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                <p>No active deliveries right now.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Pickups */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" /> Available Pickups
          </h2>
          <div className="space-y-4">
            {dashboard?.pendingPickups && dashboard.pendingPickups.length > 0 ? (
              dashboard.pendingPickups.map(order => (
                <div key={order.id} className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Order #{order.id}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Ready since {format(new Date(order.updatedAt), 'HH:mm')}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')}
                      className="flex-1 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 rounded-lg font-medium transition-colors text-sm"
                    >
                      Accept & Pickup
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500">
                <Package className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                <p>No pending pickups available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
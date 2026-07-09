import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useRegisterUser } from '@workspace/api-client-react';
import { saveAuth, getDashboardRoute } from '@/lib/auth';
import { Pill, ArrowLeft } from 'lucide-react';
import type { UserRegistrationRole } from '@workspace/api-client-react';

interface RegisterPageProps {
  role: 'customer' | 'store_owner' | 'delivery_partner';
}

export function RegisterPage({ role }: RegisterPageProps) {
  const [, setLocation] = useLocation();
  const registerMutation = useRegisterUser();
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Role specific state
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [city, setCity] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('bike');

  const titles = {
    customer: 'Register as Customer',
    store_owner: 'Register your Store',
    delivery_partner: 'Become a Delivery Partner',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const payload = {
      name, email, password, phone, role: role as UserRegistrationRole,
      ...(role === 'store_owner' && { storeName, storeAddress: `${storeAddress}, ${city}`, licenseNumber }),
      ...(role === 'delivery_partner' && { vehicleType }),
    };

    registerMutation.mutate({ data: payload }, {
      onSuccess: (data) => {
        saveAuth(data.token, data.user);
        setLocation(getDashboardRoute(data.user.role));
      },
      onError: (err) => {
        setError((err?.data as { error?: string })?.error || err?.message || 'Registration failed');
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full">
        <Link href="/register" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to roles
        </Link>
        
        <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full mb-4">
              <Pill className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{titles[role]}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Fill in the details to create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <input required type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </div>

              <div className="space-y-1 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </div>

              <div className="space-y-1 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                <input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </div>

              <div className="space-y-1 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <input required type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </div>

              <div className="space-y-1 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
                <input required type="password" minLength={6} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </div>

              {/* Role specific fields */}
              {role === 'store_owner' && (
                <>
                  <div className="space-y-1 sm:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Store Details</h3>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Store Name</label>
                    <input required type="text" value={storeName} onChange={e=>setStoreName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                    <input required type="text" value={storeAddress} onChange={e=>setStoreAddress(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">City</label>
                    <input required type="text" value={city} onChange={e=>setCity(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">License Number</label>
                    <input required type="text" value={licenseNumber} onChange={e=>setLicenseNumber(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                  </div>
                </>
              )}

              {role === 'delivery_partner' && (
                <>
                  <div className="space-y-1 sm:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Vehicle Details</h3>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Vehicle Type</label>
                    <select required value={vehicleType} onChange={e=>setVehicleType(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none">
                      <option value="bike">Bike / Motorcycle</option>
                      <option value="car">Car</option>
                      <option value="van">Van</option>
                    </select>
                  </div>
                </>
              )}

            </div>

            <button 
              type="submit" 
              disabled={registerMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-colors mt-8 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {registerMutation.isPending ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
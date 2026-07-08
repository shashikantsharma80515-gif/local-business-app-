import React from "react"
import { useLocation, Link } from "wouter"
import { Pill, UserCircle, Store, Truck, Shield } from "lucide-react"

export function RegisterSelectorPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-primary font-bold text-2xl mb-8">
            <Pill className="h-6 w-6" /> MediMarket
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">Join the Platform</h1>
          <p className="text-slate-600 dark:text-slate-400">Select how you want to use MediMarket.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <SelectionCard
            href="/register/customer"
            title="Customer"
            description="Order medicines from local verified stores"
            icon={<UserCircle className="h-10 w-10" />}
            colorClass="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:border-blue-800 dark:text-blue-400"
          />
          <SelectionCard
            href="/register/store-owner"
            title="Store Owner"
            description="Register your pharmacy and reach more patients"
            icon={<Store className="h-10 w-10" />}
            colorClass="bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:border-emerald-800 dark:text-emerald-400"
          />
          <SelectionCard
            href="/register/delivery-partner"
            title="Delivery Partner"
            description="Deliver medical supplies to patients securely"
            icon={<Truck className="h-10 w-10" />}
            colorClass="bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-600 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 dark:border-amber-800 dark:text-amber-400"
          />
          <SelectionCard
            href="/register/admin"
            title="Administrator"
            description="Manage platform operations and verifications"
            icon={<Shield className="h-10 w-10" />}
            colorClass="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-600 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 dark:border-purple-800 dark:text-purple-400"
          />
        </div>
        
        <div className="text-center mt-10 text-slate-600 dark:text-slate-400 text-sm">
          Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Log in</Link>
        </div>
      </div>
    </div>
  )
}

function SelectionCard({ href, title, description, icon, colorClass }: { href: string, title: string, description: string, icon: React.ReactNode, colorClass: string }) {
  return (
    <Link href={href} className={`flex flex-col items-center text-center p-8 rounded-2xl border-2 transition-all cursor-pointer ${colorClass}`}>
      <div className="mb-4">
        {icon}
      </div>
      <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{title}</h2>
      <p className="text-sm opacity-90">{description}</p>
    </Link>
  )
}
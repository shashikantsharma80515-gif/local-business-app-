import React from "react"
import { useLocation } from "wouter"
import { getDashboardRoute } from "@/lib/auth"
import { useAuth } from "@/hooks/use-auth"
import { ShieldCheck, Pill, Stethoscope, Store, Truck, ArrowRight } from "lucide-react"

export function LandingPage() {
  const [, setLocation] = useLocation()
  const { isAuthenticated, user } = useAuth()

  const navigateToLogin = () => {
    if (isAuthenticated && user) {
      setLocation(getDashboardRoute(user.role))
    } else {
      setLocation("/login")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <header className="fixed top-0 inset-x-0 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50 flex items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-white p-2 rounded-lg">
            <Pill className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">MediMarket</span>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <button
              onClick={navigateToLogin}
              className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => setLocation("/login")}
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => setLocation("/register")}
                className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Register
              </button>
            </>
          )}
        </div>
      </header>

      <main className="pt-24 pb-16 lg:pt-32">
        <section className="max-w-6xl mx-auto px-6 lg:px-12 text-center py-16 lg:py-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium mb-6">
            <ShieldCheck className="h-4 w-4" /> Trusted Clinical Platform
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Your Health, <br className="hidden lg:block" />
            <span className="text-primary">Delivered.</span>
          </h1>
          <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
            A clinical-grade marketplace connecting patients with verified medical stores and registered delivery partners. Experience hospital-level precision at home.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setLocation("/register")}
              className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-lg font-semibold text-lg hover:bg-primary/90 transition-transform active:scale-95"
            >
              Get Started
            </button>
            <button
              onClick={() => setLocation("/login")}
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-transform active:scale-95"
            >
              Partner Sign In
            </button>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 lg:px-12 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">Who is MediMarket for?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <RoleCard 
              icon={<Stethoscope className="h-8 w-8" />}
              title="Patients & Customers"
              description="Order prescribed medicines and health products from trusted local pharmacies."
              accent="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
            />
            <RoleCard 
              icon={<Store className="h-8 w-8" />}
              title="Medical Stores"
              description="Digitize your pharmacy and reach more patients in your local area."
              accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
            />
            <RoleCard 
              icon={<Truck className="h-8 w-8" />}
              title="Delivery Partners"
              description="Earn by delivering essential medical supplies safely and on time."
              accent="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
            />
          </div>
        </section>
      </main>
      
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-12 text-center text-slate-500 dark:text-slate-400">
        <div className="flex justify-center items-center gap-2 mb-4 text-slate-900 dark:text-white">
          <Pill className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg">MediMarket</span>
        </div>
        <p>© {new Date().getFullYear()} MediMarket Platform. All rights reserved.</p>
      </footer>
    </div>
  )
}

function RoleCard({ icon, title, description, accent }: { icon: React.ReactNode, title: string, description: string, accent: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${accent}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
        {description}
      </p>
    </div>
  )
}
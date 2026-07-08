import { Link, Route, Switch, Router as WouterRouter } from 'wouter';
import { ShieldAlert, Pill, Stethoscope, Store, Truck, ArrowRight, UserCircle, Shield, Menu, LogOut, Home, FileText, CheckCircle, Package, Users } from "lucide-react";
// I will build other pages in subsequent calls
import { LandingPage } from '@/pages/LandingPage';
import { RegisterSelectorPage } from '@/pages/RegisterSelectorPage';
// placeholder imports for now

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <ShieldAlert className="h-16 w-16 text-slate-400 mb-4" />
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Page Not Found</h1>
      <Link href="/" className="mt-4 text-primary hover:underline">Return Home</Link>
    </div>
  )
}

export { NotFound };
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { NotFound } from '@/components/shared';
import { LandingPage } from '@/pages/LandingPage';
import { RegisterSelectorPage } from '@/pages/RegisterSelectorPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { CustomerDashboardPage } from '@/pages/CustomerDashboard';
import { StoreOwnerDashboardPage } from '@/pages/StoreOwnerDashboard';
import { DeliveryDashboardPage } from '@/pages/DeliveryDashboard';
import { AdminDashboardPage } from '@/pages/AdminDashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      
      <Route path="/register" component={RegisterSelectorPage} />
      <Route path="/register/customer">
        <RegisterPage role="customer" />
      </Route>
      <Route path="/register/store-owner">
        <RegisterPage role="store_owner" />
      </Route>
      <Route path="/register/delivery-partner">
        <RegisterPage role="delivery_partner" />
      </Route>
      <Route path="/register/admin">
        <RegisterPage role="admin" />
      </Route>

      <Route path="/dashboard/customer">
        <ProtectedRoute role="customer">
          <CustomerDashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/store-owner">
        <ProtectedRoute role="store_owner">
          <StoreOwnerDashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/delivery">
        <ProtectedRoute role="delivery_partner">
          <DeliveryDashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/admin">
        <ProtectedRoute role="admin">
          <AdminDashboardPage />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
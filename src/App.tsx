import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AdminYachtModels from "./pages/AdminYachtModels";
import AdminOptions from "./pages/AdminOptions";
import AdminUsers from "./pages/AdminUsers";
import AdminSeedData from "./pages/AdminSeedData";
import Configurator from "./pages/Configurator";
import Quotations from "@/pages/Quotations";
import QuotationDetail from "@/pages/QuotationDetail";
import Clients from "@/pages/Clients";
import Approvals from "@/pages/Approvals";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/configurador" element={<ProtectedRoute><Configurator /></ProtectedRoute>} />
            <Route path="/configurator" element={<ProtectedRoute><Configurator /></ProtectedRoute>} />
            <Route path="/quotations" element={<ProtectedRoute><Quotations /></ProtectedRoute>} />
            <Route path="/cotacoes" element={<ProtectedRoute><Quotations /></ProtectedRoute>} />
            <Route path="/quotations/:id" element={<ProtectedRoute><QuotationDetail /></ProtectedRoute>} />
            <Route path="/cotacoes/:id" element={<ProtectedRoute><QuotationDetail /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
            <Route path="/aprovacoes" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
            <Route path="/admin/yacht-models" element={<ProtectedRoute requireAdmin><AdminYachtModels /></ProtectedRoute>} />
            <Route path="/admin/options" element={<ProtectedRoute requireAdmin><AdminOptions /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/seed-data" element={<ProtectedRoute requireAdmin><AdminSeedData /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";

// ==============================================
// IMPORTS ESTÁTICOS (páginas críticas)
// ==============================================
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// ==============================================
// LAZY LOADING (carregamento sob demanda)
// ==============================================

// Páginas de detalhes (pesadas)
const QuotationDetail = lazy(() => import("@/pages/QuotationDetail"));
const ContractDetail = lazy(() => import("@/pages/ContractDetail"));

// Configurador (componente complexo)
const Configurator = lazy(() => import("@/pages/Configurator"));

// Listas
const Quotations = lazy(() => import("@/pages/Quotations"));
const Contracts = lazy(() => import("@/pages/Contracts"));
const Clients = lazy(() => import("@/pages/Clients"));
const Approvals = lazy(() => import("@/pages/Approvals"));
const WorkflowTasks = lazy(() => import("@/pages/WorkflowTasks"));

// Perfil e público
const Profile = lazy(() => import("@/pages/Profile"));
const PublicQuotationAcceptance = lazy(() => import("@/pages/PublicQuotationAcceptance"));
const PublicQuotationView = lazy(() => import("@/pages/PublicQuotationView"));

// Admin
const Admin = lazy(() => import("@/pages/Admin"));
const AdminYachtModels = lazy(() => import("@/pages/AdminYachtModels"));
const AdminYachtModelEdit = lazy(() => import("@/pages/AdminYachtModelEdit"));
const AdminYachtModelCreate = lazy(() => import("@/pages/AdminYachtModelCreate"));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));

const AdminMemorialCategories = lazy(() => import("@/pages/AdminMemorialCategories"));
const AdminDiscountSettings = lazy(() => import("@/pages/AdminDiscountSettings"));
const AdminApprovalSettings = lazy(() => import("@/pages/AdminApprovalSettings"));
const AdminWorkflowSettings = lazy(() => import("@/pages/AdminWorkflowSettings"));
const AdminRolesPermissions = lazy(() => import("@/pages/AdminRolesPermissions"));
const AdminAuditLogs = lazy(() => import("@/pages/AdminAuditLogs"));
const AdminJobStops = lazy(() => import("@/pages/AdminJobStops"));

// ==============================================
// COMPONENTE DE LOADING
// ==============================================
const PageLoader = () => (
  <div className="container mx-auto p-6 space-y-4">
    <Skeleton className="h-12 w-64" />
    <Skeleton className="h-8 w-96" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
    </div>
    <Skeleton className="h-64 w-full mt-6" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Páginas estáticas */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Páginas públicas (lazy) */}
              <Route path="/p/:token" element={<PublicQuotationAcceptance />} />
              <Route path="/quotation/:id/:token" element={<PublicQuotationView />} />
              
              {/* Configurador */}
              <Route path="/configurador" element={<ProtectedRoute><Configurator /></ProtectedRoute>} />
              <Route path="/configurator" element={<ProtectedRoute><Configurator /></ProtectedRoute>} />
              
              {/* Cotações */}
              <Route path="/quotations" element={<ProtectedRoute><Quotations /></ProtectedRoute>} />
              <Route path="/cotacoes" element={<ProtectedRoute><Quotations /></ProtectedRoute>} />
              <Route path="/quotations/:id" element={<ProtectedRoute><QuotationDetail /></ProtectedRoute>} />
              <Route path="/cotacoes/:id" element={<ProtectedRoute><QuotationDetail /></ProtectedRoute>} />
              
              {/* Clientes e Aprovações */}
              <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
              <Route path="/clientes" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
              <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
              <Route path="/aprovacoes" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
              
              {/* Perfil */}
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              
              {/* Contratos */}
              <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
              <Route path="/contratos" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
              <Route path="/contracts/:id" element={<ProtectedRoute><ContractDetail /></ProtectedRoute>} />
              <Route path="/contratos/:id" element={<ProtectedRoute><ContractDetail /></ProtectedRoute>} />
              
              {/* Workflow Tasks */}
              <Route path="/workflow-tasks" element={<ProtectedRoute><WorkflowTasks /></ProtectedRoute>} />
              <Route path="/tarefas-workflow" element={<ProtectedRoute><WorkflowTasks /></ProtectedRoute>} />
              
              {/* Admin */}
              <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
              <Route path="/admin/yacht-models" element={<ProtectedRoute requireAdmin><AdminYachtModels /></ProtectedRoute>} />
              <Route path="/admin/yacht-models/new" element={<ProtectedRoute requireAdmin><AdminYachtModelCreate /></ProtectedRoute>} />
              <Route path="/admin/yacht-models/:modelId/edit" element={<ProtectedRoute requireAdmin><AdminYachtModelEdit /></ProtectedRoute>} />
              
              <Route path="/admin/memorial-categories" element={<ProtectedRoute requireAdmin><AdminMemorialCategories /></ProtectedRoute>} />
              <Route path="/admin/discount-settings" element={<ProtectedRoute requireAdmin><AdminDiscountSettings /></ProtectedRoute>} />
              <Route path="/admin/approval-settings" element={<ProtectedRoute requireAdmin><AdminApprovalSettings /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/workflow-settings" element={<ProtectedRoute requireAdmin><AdminWorkflowSettings /></ProtectedRoute>} />
              <Route path="/admin/roles-permissions" element={<ProtectedRoute requireAdmin><AdminRolesPermissions /></ProtectedRoute>} />
              <Route path="/admin/audit-logs" element={<ProtectedRoute requireAdmin><AdminAuditLogs /></ProtectedRoute>} />
              <Route path="/admin/job-stops" element={<ProtectedRoute requireAdmin><AdminJobStops /></ProtectedRoute>} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

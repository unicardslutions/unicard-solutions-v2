import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { OrderProvider } from "./hooks/useOrder";
import { lazy, Suspense } from "react";
import Landing from "./pages/Landing";
import SchoolLogin from "./pages/SchoolLogin";
import SchoolDashboard from "./pages/SchoolDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import Help from "./pages/Help";
import About from "./pages/About";

// Lazy load school pages for better performance
const AddStudent = lazy(() => import("./pages/school/AddStudent"));
const StudentList = lazy(() => import("./pages/school/StudentList"));
const UploadExcel = lazy(() => import("./pages/school/UploadExcel"));
const UploadPhotos = lazy(() => import("./pages/school/UploadPhotos"));
const SelectTemplate = lazy(() => import("./pages/school/SelectTemplate"));

// Lazy load admin pages for better performance
const SchoolManagement = lazy(() => import("./pages/admin/SchoolManagement"));
const OrderManagement = lazy(() => import("./pages/admin/OrderManagement"));
const AdvertisementManagement = lazy(() => import("./pages/admin/AdvertisementManagement"));
const TemplateLibrary = lazy(() => import("./pages/admin/TemplateLibrary"));
const AdvancedTemplateBuilder = lazy(() => import("./components/AdvancedTemplateBuilder"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <OrderProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                    <Route path="/school/login" element={<SchoolLogin />} />
                    <Route path="/school/dashboard" element={<SchoolDashboard />} />
                    <Route path="/school/add-student" element={<AddStudent />} />
                    <Route path="/school/students" element={<StudentList />} />
                    <Route path="/school/upload-excel" element={<UploadExcel />} />
                    <Route path="/school/upload-photos" element={<UploadPhotos />} />
                    <Route path="/school/select-template" element={<SelectTemplate />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/schools" element={<SchoolManagement />} />
                <Route path="/admin/orders" element={<OrderManagement />} />
                <Route path="/admin/advertisements" element={<AdvertisementManagement />} />
                <Route path="/admin/template-library" element={<TemplateLibrary />} />
                <Route path="/admin/template-builder" element={<AdvancedTemplateBuilder />} />
                <Route path="/admin/template-builder/:id" element={<AdvancedTemplateBuilder />} />
                <Route path="/help" element={<Help />} />
                <Route path="/about" element={<About />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </OrderProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

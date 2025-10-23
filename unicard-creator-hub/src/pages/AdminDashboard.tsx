import { useRequireAuth } from "@/hooks/useAuth";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { School, Package, Layout, AlertCircle, Users, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DashboardStats {
  totalSchools: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalStudents: number;
  totalTemplates: number;
  activeTemplates: number;
  newSchoolsThisMonth: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
}

const AdminDashboard = () => {
  const { user, isLoading } = useRequireAuth("/admin/login");
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalStudents: 0,
    totalTemplates: 0,
    activeTemplates: 0,
    newSchoolsThisMonth: 0,
    ordersThisMonth: 0,
    revenueThisMonth: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      setIsLoadingStats(true);
      try {
        // Fetch all stats in parallel
        const [
          schoolsResult,
          ordersResult,
          studentsResult,
          templatesResult,
          newSchoolsResult,
          ordersThisMonthResult
        ] = await Promise.all([
          supabase.from('schools').select('id, created_at', { count: 'exact' }),
          supabase.from('orders').select('id, status, created_at', { count: 'exact' }),
          supabase.from('students').select('id', { count: 'exact' }),
          supabase.from('templates').select('id, is_public', { count: 'exact' }),
          supabase.from('schools').select('id', { count: 'exact' })
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
          supabase.from('orders').select('id', { count: 'exact' })
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        ]);

        const schools = schoolsResult.data || [];
        const orders = ordersResult.data || [];
        const students = studentsResult.data || [];
        const templates = templatesResult.data || [];

        // Calculate stats
        const totalSchools = schoolsResult.count || 0;
        const totalOrders = ordersResult.count || 0;
        const pendingOrders = orders.filter(o => o.status === 'submitted' || o.status === 'in_design').length;
        const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
        const totalStudents = studentsResult.count || 0;
        const totalTemplates = templatesResult.count || 0;
        const activeTemplates = templates.filter(t => t.is_public).length;
        const newSchoolsThisMonth = newSchoolsResult.count || 0;
        const ordersThisMonth = ordersThisMonthResult.count || 0;

        // Mock revenue calculation (in a real app, this would come from a payments table)
        const revenueThisMonth = ordersThisMonth * 50; // Assuming ₹50 per order

        setStats({
          totalSchools,
          totalOrders,
          pendingOrders,
          completedOrders,
          totalStudents,
          totalTemplates,
          activeTemplates,
          newSchoolsThisMonth,
          ordersThisMonth,
          revenueThisMonth,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast.error('Failed to load dashboard statistics');
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [user]);

  if (isLoading || isLoadingStats) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-gradient">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-4xl font-bold">{stats.totalSchools}</CardTitle>
                  <CardDescription>Total Schools</CardDescription>
                </div>
                <School className="w-8 h-8 text-primary/60" />
              </div>
            </CardHeader>
          </Card>
          
          <Card className="card-gradient">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-4xl font-bold text-yellow-600">{stats.pendingOrders}</CardTitle>
                  <CardDescription>Orders Pending</CardDescription>
                </div>
                <Clock className="w-8 h-8 text-yellow-600/60" />
              </div>
            </CardHeader>
          </Card>
          
          <Card className="card-gradient">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-4xl font-bold text-green-600">{stats.completedOrders}</CardTitle>
                  <CardDescription>Orders Completed</CardDescription>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600/60" />
              </div>
            </CardHeader>
          </Card>

          <Card className="card-gradient">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-4xl font-bold text-blue-600">{stats.totalStudents}</CardTitle>
                  <CardDescription>Total Students</CardDescription>
                </div>
                <Users className="w-8 h-8 text-blue-600/60" />
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-gradient">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold text-purple-600">{stats.activeTemplates}</CardTitle>
                  <CardDescription>Active Templates</CardDescription>
                </div>
                <Layout className="w-8 h-8 text-purple-600/60" />
              </div>
            </CardHeader>
          </Card>

          <Card className="card-gradient">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold text-orange-600">{stats.newSchoolsThisMonth}</CardTitle>
                  <CardDescription>New Schools This Month</CardDescription>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600/60" />
              </div>
            </CardHeader>
          </Card>

          <Card className="card-gradient">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold text-indigo-600">{stats.ordersThisMonth}</CardTitle>
                  <CardDescription>Orders This Month</CardDescription>
                </div>
                <Package className="w-8 h-8 text-indigo-600/60" />
              </div>
            </CardHeader>
          </Card>

          <Card className="card-gradient">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold text-emerald-600">₹{stats.revenueThisMonth}</CardTitle>
                  <CardDescription>Revenue This Month</CardDescription>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-600/60" />
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card 
            className="card-hover cursor-pointer"
            onClick={() => window.location.href = '/admin/schools'}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <School className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Schools</CardTitle>
                  <CardDescription>Manage schools</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="card-hover cursor-pointer"
            onClick={() => window.location.href = '/admin/orders'}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Orders</CardTitle>
                  <CardDescription>View all orders</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="card-hover cursor-pointer"
            onClick={() => window.location.href = '/admin/template-library'}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Layout className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Templates</CardTitle>
                  <CardDescription>Design templates</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="card-hover cursor-pointer"
            onClick={() => window.location.href = '/admin/advertisements'}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <AlertCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Advertisements</CardTitle>
                  <CardDescription>Manage ads</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { Search, Filter, Eye, CheckCircle, XCircle, MoreHorizontal, UserCheck, UserX } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

interface SchoolWithStats extends Tables<'schools'> {
  total_orders: number;
  total_students: number;
  last_order_date: string | null;
  user_email: string;
}

const SchoolManagement = () => {
  const { user, isLoading: isLoadingAuth } = useRequireAuth("/admin/login");
  const [schools, setSchools] = useState<SchoolWithStats[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<SchoolWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchSchools = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // Fetch schools with user email and order stats
        const { data: schoolsData, error: schoolsError } = await supabase
          .from('schools')
          .select(`
            *,
            user:user_id (
              email
            )
          `)
          .order('created_at', { ascending: false });

        if (schoolsError) {
          console.error('Error fetching schools:', schoolsError);
          toast.error('Failed to load schools');
          return;
        }

        // Fetch order stats for each school
        const schoolsWithStats = await Promise.all(
          (schoolsData || []).map(async (school) => {
            const { count: ordersCount } = await supabase
              .from('orders')
              .select('*', { count: 'exact', head: true })
              .eq('school_id', school.id);

            const { count: studentsCount } = await supabase
              .from('students')
              .select('*', { count: 'exact', head: true })
              .eq('order_id', supabase
                .from('orders')
                .select('id')
                .eq('school_id', school.id)
              );

            const { data: lastOrder } = await supabase
              .from('orders')
              .select('created_at')
              .eq('school_id', school.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            return {
              ...school,
              total_orders: ordersCount || 0,
              total_students: studentsCount || 0,
              last_order_date: lastOrder?.created_at || null,
              user_email: (school as any).user?.email || 'N/A'
            };
          })
        );

        setSchools(schoolsWithStats);
        setFilteredSchools(schoolsWithStats);
      } catch (error) {
        console.error('Error fetching schools:', error);
        toast.error('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, [user]);

  useEffect(() => {
    let filtered = [...schools];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(school =>
        school.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.whatsapp_number.includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(school => {
        switch (statusFilter) {
          case "active":
            return school.total_orders > 0;
          case "inactive":
            return school.total_orders === 0;
          case "verified":
            return school.is_verified === true;
          case "unverified":
            return school.is_verified === false;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "school_name":
          aValue = a.school_name.toLowerCase();
          bValue = b.school_name.toLowerCase();
          break;
        case "total_orders":
          aValue = a.total_orders;
          bValue = b.total_orders;
          break;
        case "total_students":
          aValue = a.total_students;
          bValue = b.total_students;
          break;
        case "created_at":
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredSchools(filtered);
  }, [schools, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleVerifySchool = async (schoolId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from('schools')
        .update({ is_verified: verified })
        .eq('id', schoolId);

      if (error) {
        console.error('Error updating school verification:', error);
        toast.error('Failed to update school verification');
        return;
      }

      // Update local state
      setSchools(prev => prev.map(school => 
        school.id === schoolId ? { ...school, is_verified: verified } : school
      ));

      toast.success(`School ${verified ? 'verified' : 'unverified'} successfully`);
    } catch (error) {
      console.error('Error updating school verification:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoadingAuth || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading schools...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">School Management</CardTitle>
            <CardDescription>
              Manage and monitor all registered schools in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by school name, contact person, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  <SelectItem value="active">Active (Has Orders)</SelectItem>
                  <SelectItem value="inactive">Inactive (No Orders)</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Registration Date</SelectItem>
                  <SelectItem value="school_name">School Name</SelectItem>
                  <SelectItem value="total_orders">Total Orders</SelectItem>
                  <SelectItem value="total_students">Total Students</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground mb-4">
              Showing {filteredSchools.length} of {schools.length} schools
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{school.school_name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {school.id.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium">{school.contact_person}</div>
                          <div className="text-sm text-muted-foreground">
                            {school.whatsapp_number}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">{school.user_email}</div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <div>{school.address}</div>
                          {school.area && <div className="text-muted-foreground">{school.area}</div>}
                          {school.pin_code && <div className="text-muted-foreground">{school.pin_code}</div>}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <div>Orders: {school.total_orders}</div>
                          <div>Students: {school.total_students}</div>
                          {school.last_order_date && (
                            <div className="text-muted-foreground">
                              Last: {formatDate(school.last_order_date)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={school.is_verified ? "default" : "secondary"}>
                            {school.is_verified ? "Verified" : "Unverified"}
                          </Badge>
                          <Badge variant={school.total_orders > 0 ? "outline" : "destructive"}>
                            {school.total_orders > 0 ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(school.created_at)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant={school.is_verified ? "destructive" : "default"}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {school.is_verified ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {school.is_verified ? 'Unverify School' : 'Verify School'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to {school.is_verified ? 'unverify' : 'verify'} {school.school_name}? 
                                  This will {school.is_verified ? 'restrict' : 'allow'} their access to the platform.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleVerifySchool(school.id, !school.is_verified)}
                                >
                                  {school.is_verified ? 'Unverify' : 'Verify'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {filteredSchools.length === 0 && (
          <Card className="mt-6">
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? "No schools match your current filters." 
                  : "No schools have been registered yet."
                }
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default SchoolManagement;

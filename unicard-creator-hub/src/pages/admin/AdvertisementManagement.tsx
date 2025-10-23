import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Image as ImageIcon } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

interface AdvertisementFormData {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  display_order: number;
  is_active: boolean;
}

const AdvertisementManagement = () => {
  const { user, isLoading: isLoadingAuth } = useRequireAuth("/admin/login");
  const [advertisements, setAdvertisements] = useState<Tables<'advertisements'>[]>([]);
  const [filteredAds, setFilteredAds] = useState<Tables<'advertisements'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Tables<'advertisements'> | null>(null);
  const [formData, setFormData] = useState<AdvertisementFormData>({
    title: "",
    description: "",
    image_url: "",
    link_url: "",
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    const fetchAdvertisements = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('advertisements')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) {
          console.error('Error fetching advertisements:', error);
          toast.error('Failed to load advertisements');
          return;
        }

        setAdvertisements(data || []);
        setFilteredAds(data || []);
      } catch (error) {
        console.error('Error fetching advertisements:', error);
        toast.error('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdvertisements();
  }, [user]);

  useEffect(() => {
    let filtered = [...advertisements];

    if (searchTerm) {
      filtered = filtered.filter(ad =>
        ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAds(filtered);
  }, [advertisements, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingAd) {
        // Update existing advertisement
        const { error } = await supabase
          .from('advertisements')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAd.id);

        if (error) {
          console.error('Error updating advertisement:', error);
          toast.error('Failed to update advertisement');
          return;
        }

        toast.success('Advertisement updated successfully');
      } else {
        // Create new advertisement
        const { error } = await supabase
          .from('advertisements')
          .insert({
            ...formData,
            created_by: user.id,
          });

        if (error) {
          console.error('Error creating advertisement:', error);
          toast.error('Failed to create advertisement');
          return;
        }

        toast.success('Advertisement created successfully');
      }

      // Refresh the list
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data) {
        setAdvertisements(data);
        setFilteredAds(data);
      }

      // Reset form and close dialog
      setFormData({
        title: "",
        description: "",
        image_url: "",
        link_url: "",
        display_order: 0,
        is_active: true,
      });
      setEditingAd(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving advertisement:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleEdit = (ad: Tables<'advertisements'>) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || "",
      image_url: ad.image_url,
      link_url: ad.link_url || "",
      display_order: ad.display_order,
      is_active: ad.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (adId: string) => {
    try {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', adId);

      if (error) {
        console.error('Error deleting advertisement:', error);
        toast.error('Failed to delete advertisement');
        return;
      }

      toast.success('Advertisement deleted successfully');

      // Refresh the list
      const { data, error: fetchError } = await supabase
        .from('advertisements')
        .select('*')
        .order('display_order', { ascending: true });

      if (!fetchError && data) {
        setAdvertisements(data);
        setFilteredAds(data);
      }
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleToggleActive = async (adId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', adId);

      if (error) {
        console.error('Error toggling advertisement status:', error);
        toast.error('Failed to update advertisement status');
        return;
      }

      toast.success(`Advertisement ${!currentStatus ? 'activated' : 'deactivated'}`);

      // Refresh the list
      const { data, error: fetchError } = await supabase
        .from('advertisements')
        .select('*')
        .order('display_order', { ascending: true });

      if (!fetchError && data) {
        setAdvertisements(data);
        setFilteredAds(data);
      }
    } catch (error) {
      console.error('Error toggling advertisement status:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
              <p className="mt-4 text-muted-foreground">Loading advertisements...</p>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Advertisement Management</CardTitle>
                <CardDescription>
                  Manage advertisements displayed on school dashboards
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingAd(null);
                    setFormData({
                      title: "",
                      description: "",
                      image_url: "",
                      link_url: "",
                      display_order: 0,
                      is_active: true,
                    });
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Advertisement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingAd ? 'Edit Advertisement' : 'Add New Advertisement'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingAd ? 'Update the advertisement details below.' : 'Fill in the details for the new advertisement.'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Advertisement title"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="display_order">Display Order</Label>
                        <Input
                          id="display_order"
                          type="number"
                          value={formData.display_order}
                          onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Advertisement description"
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="image_url">Image URL *</Label>
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="link_url">Link URL</Label>
                      <Input
                        id="link_url"
                        value={formData.link_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                        placeholder="https://example.com"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingAd ? 'Update' : 'Create'} Advertisement
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search advertisements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="text-sm text-muted-foreground mb-4">
              Showing {filteredAds.length} of {advertisements.length} advertisements
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAds.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell>
                        <div className="w-16 h-12 rounded overflow-hidden border">
                          <img
                            src={ad.image_url}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA2NCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAxNkg0MFYzMkgyNFYxNloiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTI4IDIwSDM2VjI4SDI4VjIwWiIgZmlsbD0iI0YzRjRGNiIvPgo8L3N2Zz4K';
                            }}
                          />
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-medium">{ad.title}</div>
                        {ad.link_url && (
                          <div className="text-sm text-muted-foreground">
                            <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {ad.link_url}
                            </a>
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm max-w-xs truncate">
                          {ad.description || "No description"}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm font-medium">
                          {ad.display_order}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={ad.is_active ? "default" : "secondary"}>
                          {ad.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(ad.created_at)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(ad)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(ad.id, ad.is_active)}
                          >
                            {ad.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Advertisement</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{ad.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(ad.id)}>
                                  Delete
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

        {filteredAds.length === 0 && (
          <Card className="mt-6">
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                {searchTerm 
                  ? "No advertisements match your search." 
                  : "No advertisements have been created yet."
                }
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdvertisementManagement;

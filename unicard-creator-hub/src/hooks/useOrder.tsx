import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Order {
  id: string;
  school_id: string;
  template_id: string | null;
  status: 'draft' | 'submitted' | 'in_design' | 'printed' | 'delivered' | 'completed';
  total_students: number;
  notes: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderContextType {
  currentOrder: Order | null;
  isLoading: boolean;
  refreshOrder: () => Promise<void>;
  updateOrderTemplate: (templateId: string) => Promise<void>;
  submitOrder: () => Promise<boolean>;
  isOrderLocked: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  // Get school ID for current user
  useEffect(() => {
    const fetchSchoolId = async () => {
      if (!user) {
        setSchoolId(null);
        return;
      }

      const { data, error } = await supabase
        .from('schools')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setSchoolId(data.id);
      } else if (error) {
        console.error('Error fetching school ID:', error);
      }
    };

    fetchSchoolId();
  }, [user]);

  // Fetch or create draft order
  useEffect(() => {
    const fetchOrCreateOrder = async () => {
      if (!schoolId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Try to fetch existing draft order
      const { data: existingOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('school_id', schoolId)
        .eq('status', 'draft')
        .maybeSingle();

      if (existingOrder) {
        // Count students in this order
        const { count } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('order_id', existingOrder.id);

        // Update total_students count
        if (count !== existingOrder.total_students) {
          await supabase
            .from('orders')
            .update({ total_students: count || 0 })
            .eq('id', existingOrder.id);
          
          existingOrder.total_students = count || 0;
        }

        setCurrentOrder(existingOrder);
        setIsLoading(false);
        return;
      }

      // Create new draft order if none exists
      const { data: newOrder, error: createError } = await supabase
        .from('orders')
        .insert({
          school_id: schoolId,
          status: 'draft',
          total_students: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating order:', createError);
        toast.error('Failed to create order');
      } else if (newOrder) {
        setCurrentOrder(newOrder);
      }

      setIsLoading(false);
    };

    fetchOrCreateOrder();
  }, [schoolId]);

  const refreshOrder = async () => {
    if (!currentOrder) return;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', currentOrder.id)
      .single();

    if (data) {
      // Update student count
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', data.id);

      if (count !== data.total_students) {
        await supabase
          .from('orders')
          .update({ total_students: count || 0 })
          .eq('id', data.id);
        
        data.total_students = count || 0;
      }

      setCurrentOrder(data);
    } else if (error) {
      console.error('Error refreshing order:', error);
    }
  };

  const updateOrderTemplate = async (templateId: string) => {
    if (!currentOrder || currentOrder.status !== 'draft') {
      toast.error('Cannot update template - order is locked');
      return;
    }

    const { error } = await supabase
      .from('orders')
      .update({ template_id: templateId })
      .eq('id', currentOrder.id);

    if (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    } else {
      await refreshOrder();
      toast.success('Template selected successfully');
    }
  };

  const submitOrder = async (): Promise<boolean> => {
    if (!currentOrder) {
      toast.error('No active order');
      return false;
    }

    if (currentOrder.status !== 'draft') {
      toast.error('Order already submitted');
      return false;
    }

    if (currentOrder.total_students === 0) {
      toast.error('Please add at least one student before submitting');
      return false;
    }

    if (!currentOrder.template_id) {
      toast.error('Please select a template before submitting');
      return false;
    }

    // Check if all students have photos
    const { data: studentsWithoutPhotos } = await supabase
      .from('students')
      .select('id, student_name')
      .eq('order_id', currentOrder.id)
      .is('photo_url', null);

    if (studentsWithoutPhotos && studentsWithoutPhotos.length > 0) {
      toast.error(`${studentsWithoutPhotos.length} student(s) missing photos`);
      return false;
    }

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', currentOrder.id);

    if (error) {
      console.error('Error submitting order:', error);
      toast.error('Failed to submit order');
      return false;
    }

    await refreshOrder();
    toast.success('Order submitted successfully!');
    return true;
  };

  const isOrderLocked = currentOrder ? currentOrder.status !== 'draft' : false;

  return (
    <OrderContext.Provider
      value={{
        currentOrder,
        isLoading,
        refreshOrder,
        updateOrderTemplate,
        submitOrder,
        isOrderLocked,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};


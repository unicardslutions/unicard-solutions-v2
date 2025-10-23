import { supabase } from 'unicard-shared';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from 'unicard-shared';

export interface AuthUser {
  id: string;
  email: string;
  role: 'school' | 'admin';
  school?: {
    id: string;
    name: string;
    verified: boolean;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  school_name: string;
  contact_person: string;
  address: string;
  whatsapp_number: string;
  area?: string;
  pin_code?: string;
}

class AuthService {
  private currentUser: AuthUser | null = null;

  constructor() {
    this.initializeGoogleSignIn();
  }

  private initializeGoogleSignIn() {
    GoogleSignin.configure({
      webClientId: 'your-web-client-id', // Replace with actual Google OAuth client ID
      offlineAccess: true,
    });
  }

  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return { user: null as any, error: error.message };
      }

      if (!data.user) {
        return { user: null as any, error: 'Login failed' };
      }

      // Get user role and school info
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      const { data: schoolData } = await supabase
        .from('schools')
        .select('id, school_name, verified')
        .eq('user_id', data.user.id)
        .single();

      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        role: roleData?.role || 'school',
        school: schoolData ? {
          id: schoolData.id,
          name: schoolData.school_name,
          verified: schoolData.verified,
        } : undefined,
      };

      this.currentUser = user;
      await this.saveUserToStorage(user);

      return { user };
    } catch (error) {
      return { user: null as any, error: 'Login failed' };
    }
  }

  async register(credentials: RegisterCredentials): Promise<{ user: AuthUser; error?: string }> {
    try {
      if (credentials.password !== credentials.confirmPassword) {
        return { user: null as any, error: 'Passwords do not match' };
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        return { user: null as any, error: authError.message };
      }

      if (!authData.user) {
        return { user: null as any, error: 'Registration failed' };
      }

      // Create school record
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .insert({
          user_id: authData.user.id,
          school_name: credentials.school_name,
          contact_person: credentials.contact_person,
          address: credentials.address,
          whatsapp_number: credentials.whatsapp_number,
          area: credentials.area,
          pin_code: credentials.pin_code,
          verified: false,
        })
        .select('id, school_name, verified')
        .single();

      if (schoolError) {
        // Clean up auth user if school creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { user: null as any, error: schoolError.message };
      }

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'school',
        });

      if (roleError) {
        return { user: null as any, error: roleError.message };
      }

      const user: AuthUser = {
        id: authData.user.id,
        email: authData.user.email!,
        role: 'school',
        school: {
          id: schoolData.id,
          name: schoolData.school_name,
          verified: schoolData.verified,
        },
      };

      this.currentUser = user;
      await this.saveUserToStorage(user);

      return { user };
    } catch (error) {
      return { user: null as any, error: 'Registration failed' };
    }
  }

  async loginWithGoogle(): Promise<{ user: AuthUser; error?: string }> {
    try {
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        return { user: null as any, error: error.message };
      }

      if (!data.user) {
        return { user: null as any, error: 'Google login failed' };
      }

      // Get user role and school info
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      const { data: schoolData } = await supabase
        .from('schools')
        .select('id, school_name, verified')
        .eq('user_id', data.user.id)
        .single();

      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        role: roleData?.role || 'school',
        school: schoolData ? {
          id: schoolData.id,
          name: schoolData.school_name,
          verified: schoolData.verified,
        } : undefined,
      };

      this.currentUser = user;
      await this.saveUserToStorage(user);

      return { user };
    } catch (error) {
      return { user: null as any, error: 'Google login failed' };
    }
  }

  async authenticateWithBiometric(): Promise<{ success: boolean; error?: string }> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return { success: false, error: 'Biometric authentication not available' };
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return { success: false, error: 'No biometric data enrolled' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access UniCard',
        fallbackLabel: 'Use passcode',
      });

      return { success: result.success };
    } catch (error) {
      return { success: false, error: 'Biometric authentication failed' };
    }
  }

  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      await supabase.auth.signOut();
      await GoogleSignin.signOut();
      await this.clearUserFromStorage();
      this.currentUser = null;
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Logout failed' };
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.auth.user);
      if (userData) {
        this.currentUser = JSON.parse(userData);
        return this.currentUser;
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    }

    return null;
  }

  async refreshUser(): Promise<{ user: AuthUser | null; error?: string }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return { user: null, error: error?.message || 'User not found' };
      }

      // Get updated user role and school info
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const { data: schoolData } = await supabase
        .from('schools')
        .select('id, school_name, verified')
        .eq('user_id', user.id)
        .single();

      const authUser: AuthUser = {
        id: user.id,
        email: user.email!,
        role: roleData?.role || 'school',
        school: schoolData ? {
          id: schoolData.id,
          name: schoolData.school_name,
          verified: schoolData.verified,
        } : undefined,
      };

      this.currentUser = authUser;
      await this.saveUserToStorage(authUser);

      return { user: authUser };
    } catch (error) {
      return { user: null, error: 'Failed to refresh user' };
    }
  }

  private async saveUserToStorage(user: AuthUser): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.auth.user, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }

  private async clearUserFromStorage(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.auth.user,
        STORAGE_KEYS.auth.accessToken,
        STORAGE_KEYS.auth.refreshToken,
        STORAGE_KEYS.auth.session,
      ]);
    } catch (error) {
      console.error('Error clearing user from storage:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  async hasRole(role: 'admin' | 'school'): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === role;
  }
}

export const authService = new AuthService();

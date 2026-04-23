import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Auth API helpers
export const authAPI = {
  // Sign up with email and password
  signUp: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
    return data;
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Sign in with Google OAuth
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Reset password
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  },

  // Update password
  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  },
};

// File/Encryption API helpers (to be implemented with your backend)
export const fileAPI = {
  // Upload encrypted file
  uploadEncryptedFile: async (file, password, metadata = {}) => {
    // This will be implemented when you create your file encryption logic
    // For now, we'll store file metadata in Supabase
    const user = await authAPI.getCurrentUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('encryption_logs')
      .insert({
        user_id: user.id,
        original_filename: file.name,
        file_type: file.type,
        file_size: file.size,
        operation_type: 'encrypt',
        status: 'pending',
        ...metadata,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user's files
  getMyFiles: async () => {
    const user = await authAPI.getCurrentUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('encryption_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get encryption logs
  getEncryptionLogs: async () => {
    const user = await authAPI.getCurrentUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('encryption_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};

export default supabase;

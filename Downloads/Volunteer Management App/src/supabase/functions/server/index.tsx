// SRCS Volunteer Management System Server
// Hono server for handling backend operations

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Initialize database tables if they don't exist
async function initializeDatabase() {
  try {
    console.log('Initializing database tables...');
    
    // Check if users table exists
    const { data: usersTable, error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (usersError && usersError.code === 'PGRST106') {
      console.log('Creating database schema...');
      
      // Create users table
      await supabase.rpc('exec_sql', {
        sql: `
          -- Users table (extends Supabase auth.users)
          CREATE TABLE IF NOT EXISTS public.users (
              id UUID REFERENCES auth.users(id) PRIMARY KEY,
              email TEXT NOT NULL,
              name TEXT,
              role TEXT NOT NULL DEFAULT 'volunteer' CHECK (role IN ('volunteer', 'admin')),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
          );

          -- Volunteers profile table
          CREATE TABLE IF NOT EXISTS public.volunteers (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
              name TEXT NOT NULL,
              phone TEXT,
              location TEXT,
              skills TEXT,
              bio TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
              UNIQUE(user_id)
          );

          -- Events table
          CREATE TABLE IF NOT EXISTS public.events (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT NOT NULL,
              date TIMESTAMP WITH TIME ZONE NOT NULL,
              location TEXT NOT NULL,
              created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
          );

          -- Event participants table
          CREATE TABLE IF NOT EXISTS public.event_participants (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
              volunteer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
              status TEXT NOT NULL DEFAULT 'joined' CHECK (status IN ('joined', 'attended', 'cancelled')),
              hours INTEGER DEFAULT 0,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
              UNIQUE(event_id, volunteer_id)
          );

          -- Notifications table
          CREATE TABLE IF NOT EXISTS public.notifications (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
              message TEXT NOT NULL,
              type TEXT DEFAULT 'general' CHECK (type IN ('event', 'general', 'alert')),
              read_status BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
          );

          -- Enable Row Level Security
          ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
          ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
          ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
          ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
          ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
        `
      });
      
      console.log('Database schema created successfully');
    } else {
      console.log('Database tables already exist');
    }
    
    // Create demo users if they don't exist
    await createDemoUsers();
    
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Create demo users for testing
async function createDemoUsers() {
  try {
    // Check if admin user exists
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'admin@srcs.org')
      .single();
    
    if (!adminUser) {
      // Create admin user
      const { data: adminAuth, error: adminError } = await supabase.auth.admin.createUser({
        email: 'admin@srcs.org',
        password: 'admin123',
        user_metadata: { 
          name: 'Admin User',
          role: 'admin'
        },
        email_confirm: true
      });
      
      if (adminAuth.user && !adminError) {
        await supabase
          .from('users')
          .insert({
            id: adminAuth.user.id,
            email: 'admin@srcs.org',
            name: 'Admin User',
            role: 'admin'
          });
        
        console.log('Demo admin user created: admin@srcs.org / admin123');
      }
    }
    
    // Check if volunteer user exists
    const { data: volunteerUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'volunteer@srcs.org')
      .single();
    
    if (!volunteerUser) {
      // Create volunteer user
      const { data: volunteerAuth, error: volunteerError } = await supabase.auth.admin.createUser({
        email: 'volunteer@srcs.org',
        password: 'volunteer123',
        user_metadata: { 
          name: 'John Volunteer',
          role: 'volunteer'
        },
        email_confirm: true
      });
      
      if (volunteerAuth.user && !volunteerError) {
        await supabase
          .from('users')
          .insert({
            id: volunteerAuth.user.id,
            email: 'volunteer@srcs.org',
            name: 'John Volunteer',
            role: 'volunteer'
          });
        
        console.log('Demo volunteer user created: volunteer@srcs.org / volunteer123');
      }
    }
    
  } catch (error) {
    console.error('Error creating demo users:', error);
  }
}

// Health check endpoint
app.get('/make-server-7361e377/health', (c) => {
  return c.json({ status: 'ok', service: 'SRCS Volunteer Management System' });
});

// Initialize database on startup
app.get('/make-server-7361e377/init', async (c) => {
  try {
    await initializeDatabase();
    return c.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Stats endpoint for admin dashboard
app.get('/make-server-7361e377/stats', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Get user role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    // Fetch comprehensive stats
    const [
      { count: totalVolunteers },
      { count: totalEvents },
      { count: totalParticipations },
      { data: recentEvents }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'volunteer'),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('event_participants').select('*', { count: 'exact', head: true }),
      supabase.from('events')
        .select('*, event_participants(count)')
        .order('created_at', { ascending: false })
        .limit(5)
    ]);
    
    return c.json({
      totalVolunteers: totalVolunteers || 0,
      totalEvents: totalEvents || 0,
      totalParticipations: totalParticipations || 0,
      recentEvents: recentEvents || []
    });
    
  } catch (error) {
    console.error('Stats endpoint error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Export reports endpoint
app.get('/make-server-7361e377/reports/:type', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Get user role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const reportType = c.req.param('type');
    
    if (reportType === 'events') {
      const { data: events } = await supabase
        .from('events')
        .select(`
          *,
          event_participants(volunteer_id, status)
        `)
        .order('date', { ascending: false });
      
      return c.json({ events: events || [] });
    }
    
    if (reportType === 'volunteers') {
      const { data: volunteers } = await supabase
        .from('users')
        .select(`
          *,
          event_participants(id, hours, created_at)
        `)
        .eq('role', 'volunteer')
        .order('name', { ascending: true });
      
      return c.json({ volunteers: volunteers || [] });
    }
    
    return c.json({ error: 'Invalid report type' }, 400);
    
  } catch (error) {
    console.error('Reports endpoint error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Default route
app.all('/make-server-7361e377/*', (c) => {
  return c.json({ 
    message: 'SRCS Volunteer Management System API',
    endpoints: [
      'GET /health - Health check',
      'GET /init - Initialize database',
      'GET /stats - Admin statistics',
      'GET /reports/:type - Export reports'
    ]
  });
});

// Start server
Deno.serve(app.fetch);
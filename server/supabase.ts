import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://tpvwgtkjfysiglyjqdtd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseInstance && supabaseUrl && supabaseServiceKey) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.error('[Supabase] Failed to initialize client:', err);
    }
  }
  return supabaseInstance;
}

export async function checkSupabaseConnection(): Promise<{ connected: boolean; tablesFound: boolean; masterAdminFound: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { connected: false, tablesFound: false, masterAdminFound: false, error: 'Supabase credentials not configured' };
  }

  try {
    const { data: theaterData, error: theaterErr } = await client.from('theaters').select('theater_id').limit(1);
    if (theaterErr) {
      if (theaterErr.code === 'PGRST205' || theaterErr.message?.includes('schema cache')) {
        return { 
          connected: true, 
          tablesFound: false, 
          masterAdminFound: false,
          error: 'Database connected, but tables (theaters, master_admin) do not exist yet. Run supabase-schema.sql in Supabase SQL Editor.' 
        };
      }
      return { connected: false, tablesFound: false, masterAdminFound: false, error: theaterErr.message };
    }

    const { data: adminData } = await client.from('master_admin').select('username').limit(1);
    const masterAdminFound = Boolean(adminData && adminData.length > 0);

    return { 
      connected: true, 
      tablesFound: true, 
      masterAdminFound 
    };
  } catch (err: any) {
    return { connected: false, tablesFound: false, masterAdminFound: false, error: err.message };
  }
}

/**
 * Seeds Master Admin and Default Theaters directly into Supabase database
 */
export async function seedSupabaseCredentials(): Promise<{ success: boolean; message: string; details?: any }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, message: 'Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing).' };
  }

  try {
    // 1. Seed or Upsert Master Admin
    const { data: adminUpsert, error: adminErr } = await client
      .from('master_admin')
      .upsert(
        {
          username: 'Sreegeethesh',
          password_hash: 'Sree@9345662166',
          display_name: 'Sreegeethesh (Gateway Master)',
          mfa_secret: 'JBSWY3DPEHPK3PXP',
          mfa_enabled: true,
        },
        { onConflict: 'username' }
      )
      .select();

    if (adminErr) {
      return { 
        success: false, 
        message: `Failed to insert master_admin into database: ${adminErr.message}. Make sure table 'master_admin' exists (run supabase-schema.sql in Supabase Dashboard).`,
        details: adminErr 
      };
    }

    // 2. Seed Default Theaters
    const defaultTheaters = [
      {
        theater_id: 'th_grand_cineplex',
        name: 'Grand Cineplex (Downtown IMAX)',
        tagline: 'Premier Laser IMAX & Dolby Atmos Cinema',
        city: 'Bengaluru',
        address: '4th Floor, Forum Mall, Koramangala, Bengaluru, Karnataka 560095',
        admin_username: 'admin_grand',
        admin_password: 'grand@123',
        payee_vpa: 'jaspritsreea-1@okaxis',
        legal_business_name: 'Grand Multiplex Theatres Pvt Ltd',
      },
      {
        theater_id: 'th_pvr_koramangala',
        name: 'Snack Box Cinemas',
        tagline: 'Koramangala 4K 7.1 Surround & Seat Service',
        city: 'Bengaluru',
        address: '80 Feet Road, 4th Block, Koramangala, Bengaluru 560034',
        admin_username: 'admin_snackbox',
        admin_password: 'admin@123',
        payee_vpa: 'jaspritsreea-1@okaxis',
        legal_business_name: 'Snack Box Entertainment LLP',
      },
      {
        theater_id: 'th_inox_delhi',
        name: 'CineStar Multiplex',
        tagline: 'Connaught Place Heritage Screen & Dine',
        city: 'New Delhi',
        address: 'Odeon Building, Connaught Place, New Delhi 110001',
        admin_username: 'admin_cinestar',
        admin_password: 'cinestar@123',
        payee_vpa: 'jaspritsreea-1@okaxis',
        legal_business_name: 'CineStar Capital Cinemas Ltd',
      },
    ];

    const { data: theatersUpsert, error: theatersErr } = await client
      .from('theaters')
      .upsert(defaultTheaters, { onConflict: 'theater_id' })
      .select();

    if (theatersErr) {
      return {
        success: false,
        message: `Master admin inserted, but theaters table upsert failed: ${theatersErr.message}`,
        details: theatersErr,
      };
    }

    return {
      success: true,
      message: 'Successfully seeded Master Admin ("Sreegeethesh") and 3 multi-tenant cinemas into Supabase PostgreSQL!',
      details: {
        master_admin: adminUpsert,
        theaters: theatersUpsert,
      },
    };
  } catch (err: any) {
    return { success: false, message: `Database seeding error: ${err.message}` };
  }
}

/**
 * Delete a theater by ID from Supabase
 */
export async function deleteTheaterFromSupabase(theaterId: string): Promise<{ success: boolean; message: string }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, message: 'Database not connected' };
  }
  try {
    const { error } = await client.from('theaters').delete().eq('theater_id', theaterId);
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: `Theater ${theaterId} successfully deleted from database.` };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

/**
 * Fetch menu items from Supabase
 */
export async function getMenuItemsFromSupabase(theaterId?: string) {
  const client = getSupabase();
  if (!client) return null;
  try {
    let query = client.from('menu_items').select('*');
    if (theaterId) {
      query = query.or(`theater_id.eq.${theaterId},theater_id.is.null`);
    }
    const { data, error } = await query;
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Upsert menu item in Supabase
 */
export async function upsertMenuItemInSupabase(item: any) {
  const client = getSupabase();
  if (!client) return null;
  try {
    const record = {
      id: item.id,
      theater_id: item.theater_id || null,
      name: item.name,
      category: item.category,
      description: item.description,
      price: Number(item.price),
      image: item.image,
      is_veg: item.isVeg ?? item.is_veg ?? true,
      is_bestseller: item.isBestseller ?? item.is_bestseller ?? false,
      calories: item.calories || null,
      prep_time_minutes: item.prepTimeMinutes ?? item.prep_time_minutes ?? 3,
      sizes: item.sizes || [],
      flavors: item.flavors || [],
      available: item.available ?? true,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await client.from('menu_items').upsert(record).select();
    if (error) {
      console.warn('Supabase menu_items upsert error:', error.message);
      return null;
    }
    return data?.[0] || null;
  } catch (err) {
    console.warn('Supabase menu_items upsert exception:', err);
    return null;
  }
}

/**
 * Delete menu item from Supabase
 */
export async function deleteMenuItemFromSupabase(itemId: string) {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('menu_items').delete().eq('id', itemId);
    return !error;
  } catch {
    return false;
  }
}



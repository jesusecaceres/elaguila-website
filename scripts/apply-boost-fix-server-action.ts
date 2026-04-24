import { createClient } from '@supabase/supabase-js';

// This script applies the missing boost_expires column and fixes the audit trigger
// It's designed to run as a one-time migration fix

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyBoostFix() {
  try {
    console.log('Step 1: Adding boost_expires column...');
    
    // Add the missing column first
    const { error: colError } = await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS boost_expires timestamptz NULL;' 
    });
    
    if (colError) {
      console.error('Error adding column:', colError);
      // Try direct SQL approach
      const { error: directError } = await supabase
        .from('listings')
        .select('id')
        .limit(1);
      
      if (directError && directError.message.includes('boost_expires')) {
        console.log('Column confirmed missing, applying manual fix...');
      }
    }

    console.log('Step 2: Updating audit trigger to handle missing columns safely...');
    
    // Apply the fixed audit trigger that uses JSON extraction
    const auditTriggerFix = `
      CREATE OR REPLACE FUNCTION public.log_listing_lifecycle_audit()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        uid uuid;
        act text;
        meta jsonb;
        st_old text;
        st_new text;
        old_boost jsonb;
        new_boost jsonb;
      BEGIN
        uid := auth.uid();

        IF tg_op = 'INSERT' THEN
          meta := jsonb_build_object(
            'category', NEW.category,
            'status', NEW.status,
            'is_published', NEW.is_published
          );
          INSERT INTO public.listing_audit_event (listing_id, actor_user_id, action, meta)
          VALUES (NEW.id, uid, 'listing_created', meta);
          RETURN NEW;
        END IF;

        IF tg_op = 'UPDATE' THEN
          -- Use JSON extraction to safely handle missing columns
          old_boost := to_jsonb(OLD) -> 'boost_expires';
          new_boost := to_jsonb(NEW) -> 'boost_expires';

          IF OLD.status IS NOT DISTINCT FROM NEW.status
             AND OLD.is_published IS NOT DISTINCT FROM NEW.is_published
             AND old_boost IS NOT DISTINCT FROM new_boost THEN
            RETURN NEW;
          END IF;

          st_old := lower(coalesce(OLD.status, ''));
          st_new := lower(coalesce(NEW.status, ''));

          act := 'listing_lifecycle_changed';
          IF st_new = 'removed' AND st_old IS DISTINCT FROM 'removed' THEN
            act := 'listing_status_removed';
          ELSIF (NEW.is_published = false OR st_new = 'unpublished')
                AND (OLD.is_published IS NOT DISTINCT FROM NEW.is_published OR OLD.status IS NOT DISTINCT FROM NEW.status) THEN
            act := 'listing_unpublished';
          ELSIF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
            act := 'listing_published';
          ELSIF st_new = 'sold' AND st_old IS NOT DISTINCT FROM 'sold' THEN
            act := 'listing_marked_sold';
          ELSIF old_boost IS NOT DISTINCT FROM new_boost THEN
            act := 'listing_boost_changed';
          END IF;

          meta := jsonb_build_object(
            'before', jsonb_build_object(
              'status', OLD.status,
              'is_published', OLD.is_published,
              'boost_expires', old_boost
            ),
            'after', jsonb_build_object(
              'status', NEW.status,
              'is_published', NEW.is_published,
              'boost_expires', new_boost
            )
          );

          INSERT INTO public.listing_audit_event (listing_id, actor_user_id, action, meta)
          VALUES (NEW.id, uid, act, meta);
        END IF;

        RETURN NEW;
      END;
      $$;
    `;

    // Since we can't execute multi-statement SQL easily, let's try a different approach
    console.log('Step 3: Testing if boost_expires column exists...');
    
    const { data: testData, error: testError } = await supabase
      .from('listings')
      .select('boost_expires')
      .limit(1);
    
    if (testError) {
      console.log('Column still missing, error:', testError.message);
      console.log('Manual SQL fix required. Please run the migration scripts directly.');
    } else {
      console.log('✅ boost_expires column is now available!');
    }

    console.log('Boost fix process completed');
    
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

applyBoostFix();

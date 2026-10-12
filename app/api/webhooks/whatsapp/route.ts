import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client for server-side operations
// In Next.js App Router, these need to be instantiated inside the handlers or explicitly provided
// to avoid build-time errors if env vars aren't present during build.
const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321', // Dummy fallback for build
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WEBHOOK_VERIFIED');
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return new NextResponse('Bad Request', { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if it's a WhatsApp status update or message
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        const fromPhone = message.from; // Phone number without '+'
        let mealPreference: 'VEG' | 'NON_VEG' | 'SKIP' | null = null;

        // Check if it's an interactive button reply
        if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
          const buttonId = message.interactive.button_reply.id;

          if (buttonId === 'PREF_VEG') mealPreference = 'VEG';
          else if (buttonId === 'PREF_NON_VEG') mealPreference = 'NON_VEG';
          else if (buttonId === 'PREF_SKIP') mealPreference = 'SKIP';
        }
        // Fallback to text matching if not a button reply
        else if (message.type === 'text') {
          const text = message.text?.body?.toUpperCase();
          if (text === 'VEG') mealPreference = 'VEG';
          else if (text === 'NON VEG' || text === 'NON_VEG' || text === 'NONVEG') mealPreference = 'NON_VEG';
          else if (text === 'SKIP') mealPreference = 'SKIP';
        }

        if (mealPreference) {
          const supabaseAdmin = getSupabaseAdmin();

          // Find resident by phone number
          const formattedPhone = fromPhone.startsWith('+') ? fromPhone : `+${fromPhone}`;
          // Also try without '+' as fallback depending on how it's stored in DB

          const { data: profiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, tenant_id')
            .eq('role', 'RESIDENT')
            .or(`phone.eq.${formattedPhone},phone.eq.${fromPhone}`);

          if (profileError || !profiles || profiles.length === 0) {
            console.error('Resident not found for phone:', fromPhone);
            return new NextResponse('OK', { status: 200 }); // Return 200 to acknowledge receipt
          }

          const resident = profiles[0];
          const today = new Date().toISOString().split('T')[0];

          // Check if log exists for today
          const { data: existingLog } = await supabaseAdmin
            .from('meal_daily_logs')
            .select('id')
            .eq('resident_id', resident.id)
            .eq('date', today)
            .single();

          if (existingLog) {
            // Update existing log
            await supabaseAdmin
              .from('meal_daily_logs')
              .update({ diet_override: mealPreference })
              .eq('id', existingLog.id);
          } else {
            // Create new log
            await supabaseAdmin
              .from('meal_daily_logs')
              .insert({
                tenant_id: resident.tenant_id,
                resident_id: resident.id,
                date: today,
                diet_override: mealPreference
              });
          }

          console.log(`Updated meal preference to ${mealPreference} for resident ${resident.id}`);
        }
      }
    }

    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  } catch (error) {
    console.error('Webhook Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

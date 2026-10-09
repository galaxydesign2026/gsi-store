// @ts-nocheck — ported from Base44 (plain JS semantics)
import { createClientFromRequest } from '../../_shared/base44compat.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

export default async function handler(req: Request) {
  try {
    const base44 = createClientFromRequest(req);

    // Step 1: Authenticate via Base44
    const user = await base44.auth.me();
    if (!user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // v2 - uses getuserdetails(p_email) PostgreSQL function
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_KEY'))
    );

    // Step 2: Authorize via PostgreSQL
    const { data: isValid, error: validError } = await supabase.rpc('isvaliduser', { p_email: user.email });

    if (validError) {
      console.error('isvaliduser error:', validError);
      return Response.json({ error: validError.message }, { status: 500 });
    }

    if (!isValid) {
      return Response.json({ valid: false });
    }

    // Step 3: Fetch user profile from PostgreSQL (master source of truth)
    const { data: userDetails, error: detailsError } = await supabase.rpc('getuserdetails', { p_email: user.email });

    if (detailsError) {
      console.error('getuserdetails error:', detailsError);
      return Response.json({ error: detailsError.message }, { status: 500 });
    }

    const details = Array.isArray(userDetails) ? userDetails[0] : userDetails;

    if (!details) {
      console.error('getuserdetails returned no data for:', user.email);
      return Response.json({ valid: false });
    }

    // Step 4: Sync Base44 UserProfile cache
    const profileData = {
      auth_user_id: user.id,
      email: user.email,
      username: details.username,
      role: details.role,
      team: details.team || null,
      employee_id: details.employeeid,
    };

    const existing = await base44.asServiceRole.entities.UserProfile.filter({ auth_user_id: user.id });

    if (existing && existing.length > 0) {
      await base44.asServiceRole.entities.UserProfile.update(existing[0].id, profileData);
    } else {
      await base44.asServiceRole.entities.UserProfile.create(profileData);
    }

    // Step 5: Return profile to frontend
    return Response.json({
      valid: true,
      profile: {
        userId: details.id,
        employeeId: details.employeeid,
        username: details.username,
        role: details.role,
        team: details.team || null,
      }
    });

  } catch (err) {
    console.error('validateUser error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

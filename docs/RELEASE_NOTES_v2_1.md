# FacilityOS v2.1 Invite Onboarding

## Major change
The unreliable Edge Function user-creation workflow has been removed from normal operations.

## New workflow
1. Admin opens Team → Employees.
2. Admin creates an invitation for an Employee, Manager, or Customer.
3. FacilityOS generates a secure seven-day invitation link.
4. The invited user creates their own password.
5. FacilityOS securely assigns the correct company, role, and customer portal.

## Benefits
- No service-role key in the browser.
- No Supabase Dashboard user creation.
- No Edge Function deployment required.
- Customer users remain linked to one customer.
- Invitation links can be copied and revoked.

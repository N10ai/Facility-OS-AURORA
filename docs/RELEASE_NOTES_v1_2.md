# FacilityOS v1.2 Operational Core

## Stabilization
- Permanent loading screen fixed with timeout, error handling, and `finally`.
- Package contains no `node_modules` and no environment-generated lockfile.
- Existing Admin, Employee, and Customer portals preserved.

## New
- CRM Contacts page.
- Create and edit customer contacts.
- Archive customer contacts.
- Choose who receives service reports, quotes, and invoices.
- Contacts are linked to a customer.

## Supabase
Run `database/migrations/008_customer_contacts_and_startup.sql` after migration 007.

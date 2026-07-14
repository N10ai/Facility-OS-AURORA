# FacilityOS v2.0 Operational MVP Foundation

## Corrections
- System Health now checks `facility_supply_inventory`, the established production table.
- Removed the incorrect `facility_inventory` reference.
- Edge Function health messages are more actionable.
- Existing customer, facility, contact, schedule, mission, proof, issue, request, and inventory data remain intact.

## Architecture
- Canonical schema is now locked.
- No duplicate table names for the same concept.
- Additive migrations only.
- Admin, Employee, and Customer portals remain the operational baseline.

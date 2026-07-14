# FacilityOS Canonical Schema v2.0

These names are locked for all future releases.

## Identity
- companies
- profiles
- employees
- contractors

## CRM
- customers
- customer_contacts
- facilities
- facility_buildings
- facility_floors
- facility_areas

## Supplies
- supply_items
- facility_supply_inventory

## Operations
- service_plans
- service_visits
- mission_tasks
- visit_proof
- inspections
- facility_issues
- customer_requests

## Commercial
- quotes
- invoices
- payments
- expenses
- payroll_entries
- billing_subscriptions

## Rule
No future release may create a second table for an existing concept. Compatibility is handled with additive columns and migrations, never renaming or deleting production data.

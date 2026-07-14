#!/usr/bin/env bash
set -euo pipefail

echo "FacilityOS v2.1 no longer requires Edge Functions for portal onboarding."
echo "Run database/migrations/011_portal_invitation_onboarding.sql in Supabase SQL Editor."
echo "Then restart FacilityOS and create invitations under Team → Employees."

#!/bin/bash
# Script to apply the RPC function fix using psql
# This requires the Supabase database connection string

# Load environment variables
set -a
source .env
set +a

# Check if required variables are set
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ Error: SUPABASE_DB_URL not found in .env"
    echo ""
    echo "To get your database URL:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to Project Settings > Database"
    echo "4. Look for 'Connection String' > 'URI'"
    echo "5. Copy the connection string (it starts with postgresql://)"
    echo "6. Add it to your .env file as:"
    echo "   SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@..."
    echo ""
    echo "Alternatively, run the SQL manually in Supabase SQL Editor:"
    echo "   migrations/FIX_AMBIGUOUS_COLUMN.sql"
    exit 1
fi

echo "================================================================================"
echo "APPLYING RPC FUNCTION FIX"
echo "================================================================================"
echo ""
echo "This will fix the 'ambiguous column reference' error in match_projects_to_profile"
echo ""

# Execute the SQL migration
psql "$SUPABASE_DB_URL" -f migrations/FIX_AMBIGUOUS_COLUMN.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================================================"
    echo "✅ SUCCESS! RPC function has been fixed."
    echo "================================================================================"
    echo ""
    echo "Now test the matching algorithm by:"
    echo "1. Refresh your frontend (Cmd+R or F5)"
    echo "2. Go to the Dashboard - check if match percentages show up"
    echo "3. Go to Explore page and toggle 'Sort by Match'"
    echo ""
else
    echo ""
    echo "================================================================================"
    echo "❌ ERROR: Failed to apply the fix"
    echo "================================================================================"
    echo ""
    echo "You can manually run the SQL in Supabase SQL Editor:"
    echo "   migrations/FIX_AMBIGUOUS_COLUMN.sql"
    echo ""
fi

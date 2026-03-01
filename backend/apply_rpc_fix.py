"""
Script to fix the ambiguous column reference issue in the RPC function.
This resolves the "column reference 'id' is ambiguous" error.
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Initialize Supabase client (need service role key for this)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def fix_rpc_function():
    """Fix the ambiguous column reference in match_projects_to_profile RPC function."""
    
    print("=" * 80)
    print("FIXING RPC FUNCTION")
    print("=" * 80)
    
    # Read the SQL file
    sql_file_path = "migrations/FIX_AMBIGUOUS_COLUMN.sql"
    
    try:
        with open(sql_file_path, 'r') as f:
            sql_content = f.read()
        
        print(f"\n📄 Read SQL migration from {sql_file_path}")
        print(f"   Length: {len(sql_content)} characters")
        
        print("\n⚠️  IMPORTANT: This script cannot execute DDL statements directly.")
        print("   You need to run this SQL in your Supabase SQL Editor:\n")
        print("   1. Go to https://supabase.com/dashboard")
        print("   2. Select your project")
        print("   3. Go to SQL Editor")
        print("   4. Create a new query")
        print("   5. Copy and paste the content from:")
        print(f"      {sql_file_path}")
        print("   6. Click 'Run'")
        print("\n" + "=" * 80)
        print("SQL CONTENT TO RUN:")
        print("=" * 80)
        print(sql_content)
        print("=" * 80)
        
    except FileNotFoundError:
        print(f"❌ Error: Could not find {sql_file_path}")
        print("   Make sure you're running this from the backend directory")

if __name__ == "__main__":
    fix_rpc_function()

"""
Interactive script to guide the user through applying the RPC function fix.
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

def main():
    print("=" * 80)
    print("MATCHING ALGORITHM FIX - INTERACTIVE GUIDE")
    print("=" * 80)
    print()
    
    # Check if psql is available
    psql_available = os.system("which psql > /dev/null 2>&1") == 0
    
    # Check if SUPABASE_DB_URL is set
    db_url = os.getenv("SUPABASE_DB_URL")
    
    print("System Check:")
    print(f"  - psql installed: {'✅ Yes' if psql_available else '❌ No'}")
    print(f"  - SUPABASE_DB_URL in .env: {'✅ Yes' if db_url else '❌ No'}")
    print()
    
    if psql_available and db_url:
        print("🎉 You have everything needed for automatic installation!")
        print()
        print("Run this command to apply the fix:")
        print()
        print("  ./apply_rpc_fix.sh")
        print()
        print("Then follow the verification steps in MATCHING_FIX.md")
        
    elif psql_available and not db_url:
        print("⚠️  You have psql but need to add your database URL to .env")
        print()
        print("To get your database URL:")
        print("  1. Go to https://supabase.com/dashboard")
        print("  2. Select your project")
        print("  3. Go to Project Settings > Database")
        print("  4. Find 'Connection String' > 'URI'")
        print("  5. Copy it (starts with postgresql://)")
        print("  6. Add to backend/.env as:")
        print()
        print("     SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres")
        print()
        print("Then run: ./apply_rpc_fix.sh")
        
    else:
        print("📝 Manual Installation Required")
        print()
        print("Please follow these steps:")
        print()
        print("  1. Go to https://supabase.com/dashboard")
        print("  2. Select your project")
        print("  3. Click 'SQL Editor' in the left sidebar")
        print("  4. Click 'New query'")
        print("  5. Open this file: backend/migrations/FIX_AMBIGUOUS_COLUMN.sql")
        print("  6. Copy ALL the SQL content")
        print("  7. Paste into the SQL Editor")
        print("  8. Click 'Run' (or press Cmd+Enter)")
        print()
        print("You should see a success notice at the bottom!")
    
    print()
    print("-" * 80)
    print()
    print("📖 For detailed instructions, see: MATCHING_FIX.md")
    print()
    print("After applying the fix, run this to verify:")
    print("  python3 diagnose_embeddings.py")
    print()
    print("=" * 80)

if __name__ == "__main__":
    main()

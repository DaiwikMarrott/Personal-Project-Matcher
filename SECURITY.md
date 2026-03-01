# Security Policy

## Supported Versions

Currently supporting the latest version of Project Jekyll & Hyde.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, please send an email to the project maintainers. You can also create a private security advisory through GitHub.

### What to Include

* Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
* Full paths of source file(s) related to the manifestation of the issue
* The location of the affected source code (tag/branch/commit or direct URL)
* Any special configuration required to reproduce the issue
* Step-by-step instructions to reproduce the issue
* Proof-of-concept or exploit code (if possible)
* Impact of the issue, including how an attacker might exploit it

### Response Timeline

* **Initial Response**: Within 48 hours
* **Status Update**: Within 7 days
* **Fix Timeline**: Varies based on severity and complexity

## Security Best Practices

### For Developers

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use environment variables** for all API keys and secrets
3. **Keep dependencies updated** - Run `npm audit` and `pip check` regularly
4. **Review code thoroughly** before merging
5. **Use HTTPS** in production
6. **Validate all user inputs** on both client and server
7. **Use prepared statements** for database queries
8. **Implement rate limiting** on API endpoints
9. **Use strong password hashing** (Supabase handles this)
10. **Enable CORS properly** - Don't use wildcard `*` in production

### For Users

1. **Use strong passwords** - At least 12 characters
2. **Enable 2FA** if available
3. **Keep your dependencies updated**
4. **Review OAuth permissions** before granting access
5. **Report suspicious activity** immediately

## Known Security Considerations

### API Keys in Code

⚠️ **Current Status**: The codebase includes hardcoded fallback credentials in `AuthContext.tsx` for development purposes.

**Action Required**: Before deploying to production:
1. Remove hardcoded credentials from `frontend/contexts/AuthContext.tsx`
2. Ensure all credentials come from environment variables
3. Rotate all API keys that may have been exposed

### CORS Configuration

⚠️ **Current Status**: Backend CORS is set to allow all origins (`allow_origins=["*"]`)

**Action Required**: Before production:
1. Update `backend/main.py` CORS middleware
2. Specify exact frontend URLs only
3. Enable credentials properly

### Example Production CORS:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourapp.com"],  # Specific domain
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

## Dependencies

### Regular Security Audits

**Backend (Python)**:
```bash
pip install safety
safety check
```

**Frontend (Node)**:
```bash
npm audit
npm audit fix
```

### Automated Scanning

Consider setting up:
- GitHub Dependabot for automated dependency updates
- Snyk or similar tools for vulnerability scanning
- Pre-commit hooks for security checks

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine the affected versions
2. Audit code to find any similar problems
3. Prepare fixes for all supported versions
4. Release patches as soon as possible

Thank you for helping keep Project Jekyll & Hyde and our users safe! 🔒

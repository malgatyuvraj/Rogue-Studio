# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Active support  |
| < 1.0   | ❌ No longer supported |

## Reporting a Vulnerability

If you discover a security vulnerability in Rogue Studio, please report it responsibly:

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Email: security@malgatyuvraj.dev (or open a private security advisory on GitHub)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and aim to release a patch within 7 days for critical issues.

## Scope

Rogue Studio is designed for **local, self-hosted** use by security researchers. The following are **by design** and not considered vulnerabilities:

- Command execution via `/api/execute` (protected by `assertLocalhost`)
- File system access via workspace APIs (protected by `assertLocalhost`)
- Uncensored AI responses (the product's purpose)
- Payload/exploit generation capabilities (lab use only)

**In scope for reports:**
- Authentication bypass on protected endpoints
- Path traversal outside `rogue_workspace`
- Remote code execution without localhost restriction
- Dependency vulnerabilities with active exploits
- XSS in the UI that could exfiltrate data

## Security Architecture

- All dangerous endpoints enforce `assertLocalhost(req)` — returns 403 for non-localhost
- Rate limiting via Next.js middleware (60 req/min per IP)
- CSP headers block script injection
- Docker runs as non-root user (`rogue:nodejs`)
- Workspace sandboxed to `/app/rogue_workspace`
- Air-Gap mode blocks all external AI providers server-side

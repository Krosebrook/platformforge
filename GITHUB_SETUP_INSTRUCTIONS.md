# GitHub Repository Setup Instructions

## Overview

This document provides manual steps for setting up the GitHub repository and configuring GitHub Actions for CI/CD workflows for PlatformForge.

## Prerequisites

- GitHub account with repository admin access
- Git installed locally
- Node.js and npm installed
- Base44 account and app created

## Initial Repository Setup

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Enter repository name: `platformforge`
3. Select visibility: Public or Private
4. Do NOT initialize with README (we'll push existing code)
5. Click "Create repository"

### 2. Connect Local Repository

```bash
# Initialize git if not already done
cd /path/to/platformforge
git init

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/platformforge.git

# Rename default branch to main (if needed)
git branch -M main

# Stage all files
git add .

# Initial commit
git commit -m "Initial commit"

# Push to GitHub
git push -u origin main
```

## Branch Protection Rules

### 1. Protect Main Branch

Navigate to: `Settings > Branches > Add branch protection rule`

**Branch name pattern:** `main`

**Enable the following:**
- ✅ Require a pull request before merging
  - ✅ Require approvals: 1
  - ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Add required checks:
    - `build`
    - `lint`
    - `test`
    - `e2e-test`
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings (Admins can override if needed)

**Save changes**

### 2. Auto-delete Head Branches

Navigate to: `Settings > General > Pull Requests`

- ✅ Automatically delete head branches

## GitHub Secrets Configuration

Navigate to: `Settings > Secrets and variables > Actions`

### Required Secrets

#### 1. BASE44_APP_ID
- Click "New repository secret"
- Name: `BASE44_APP_ID`
- Value: Your Base44 application ID (e.g., `cbef744a8545c389ef439ea6`)
- Click "Add secret"

#### 2. BASE44_APP_BASE_URL
- Click "New repository secret"
- Name: `BASE44_APP_BASE_URL`
- Value: Your Base44 backend URL (e.g., `https://my-app.base44.app`)
- Click "Add secret"

#### 3. VITE_BASE44_APP_ID (if different for CI)
- For CI/CD environment
- Same value as BASE44_APP_ID typically

#### 4. VITE_BASE44_APP_BASE_URL (if different for CI)
- For CI/CD environment
- Same value as BASE44_APP_BASE_URL typically

### Optional Secrets

#### CODECOV_TOKEN (if using Codecov)
- For test coverage reporting
- Get from [Codecov.io](https://codecov.io)

#### SLACK_WEBHOOK_URL (if using Slack notifications)
- For deployment notifications
- Get from Slack workspace settings

## GitHub Actions Workflows

### 1. Create Workflows Directory

```bash
mkdir -p .github/workflows
```

### 2. CI Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
        if: always()

  build:
    name: Build
    runs-on: ubuntu-latest
    env:
      VITE_BASE44_APP_ID: ${{ secrets.VITE_BASE44_APP_ID }}
      VITE_BASE44_APP_BASE_URL: ${{ secrets.VITE_BASE44_APP_BASE_URL }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

  e2e-test:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          VITE_BASE44_APP_ID: ${{ secrets.VITE_BASE44_APP_ID }}
          VITE_BASE44_APP_BASE_URL: ${{ secrets.VITE_BASE44_APP_BASE_URL }}
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### 3. Deploy Workflow (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
    tags:
      - 'v*'

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_BASE44_APP_ID: ${{ secrets.VITE_BASE44_APP_ID }}
          VITE_BASE44_APP_BASE_URL: ${{ secrets.VITE_BASE44_APP_BASE_URL }}
      
      # Add your deployment steps here
      # Example: Deploy to Netlify, Vercel, AWS, etc.
```

### 4. Commit Workflows

```bash
git add .github/workflows/
git commit -m "Add GitHub Actions workflows"
git push origin main
```

## Repository Settings

### General Settings

Navigate to: `Settings > General`

#### Features
- ✅ Issues
- ✅ Projects (if using GitHub Projects)
- ✅ Preserve this repository (for important repos)
- ✅ Discussions (optional)
- ✅ Wikis (optional)

#### Pull Requests
- ✅ Allow squash merging
- ✅ Allow merge commits
- ❌ Allow rebase merging (disable to maintain clear history)
- ✅ Always suggest updating pull request branches
- ✅ Automatically delete head branches

### Issue Templates

Create `.github/ISSUE_TEMPLATE/`:

#### Bug Report
Create `.github/ISSUE_TEMPLATE/bug_report.md`

#### Feature Request
Create `.github/ISSUE_TEMPLATE/feature_request.md`

### Pull Request Template

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Description
<!-- Describe your changes -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
<!-- How has this been tested? -->

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests
- [ ] All tests pass locally
```

## Collaborator Access

### Adding Team Members

Navigate to: `Settings > Collaborators and teams`

1. Click "Add people" or "Add teams"
2. Enter username/email
3. Select role:
   - **Admin**: Full access
   - **Maintain**: Manage without destructive access
   - **Write**: Push access
   - **Triage**: Manage issues/PRs
   - **Read**: View and clone only

## GitHub Pages (Optional)

If hosting documentation:

Navigate to: `Settings > Pages`

1. **Source**: Deploy from a branch
2. **Branch**: Select branch (e.g., `gh-pages`)
3. **Folder**: Select `/docs` or `/root`
4. Click "Save"

## Notifications

### Set Up Notifications

Navigate to: `Settings > Notifications`

Configure:
- Email notifications
- Web notifications
- CI/CD failure notifications

## Webhooks (Optional)

Navigate to: `Settings > Webhooks`

Add webhooks for:
- Slack notifications
- Discord notifications
- Custom CI/CD systems
- Deployment triggers

Example Webhook:
- **Payload URL**: `https://your-webhook-url.com/github`
- **Content type**: `application/json`
- **Events**: Select which events trigger webhook

## GitHub Apps

### Recommended Apps

Install from [GitHub Marketplace](https://github.com/marketplace):

1. **Codecov** - Code coverage reporting
2. **Dependabot** - Automated dependency updates (built-in)
3. **CodeQL** - Security analysis (built-in)
4. **Prettier** - Code formatting checks
5. **Renovate** - Alternative to Dependabot

## Dependabot Configuration

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "your-username"
    labels:
      - "dependencies"
    commit-message:
      prefix: "chore"
      include: "scope"
```

Commit and push:
```bash
git add .github/dependabot.yml
git commit -m "Add Dependabot configuration"
git push origin main
```

## CodeQL Setup

Create `.github/workflows/codeql.yml`:

```yaml
name: "CodeQL"

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
```

## Verification

### Test CI/CD Pipeline

1. Create a test branch:
   ```bash
   git checkout -b test-ci
   ```

2. Make a small change:
   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "Test CI/CD"
   git push origin test-ci
   ```

3. Create pull request on GitHub

4. Verify all checks pass:
   - ✅ Lint
   - ✅ Type Check
   - ✅ Test
   - ✅ Build
   - ✅ E2E Test

5. Merge if all checks pass

## Troubleshooting

### Workflows Not Running

1. Check workflow files are in `.github/workflows/`
2. Verify YAML syntax
3. Check repository settings allow Actions
4. Review Actions tab for errors

### Failed Checks

1. Review error logs in Actions tab
2. Run checks locally:
   ```bash
   npm run lint
   npm run typecheck
   npm run test:ci
   npm run build
   ```
3. Fix errors and push again

### Secrets Not Available

1. Verify secrets are set in repository settings
2. Check secret names match workflow references
3. Ensure secrets are not exposed in logs

## Maintenance

### Regular Tasks

- **Weekly**: Review Dependabot PRs
- **Monthly**: Update GitHub Actions versions
- **Quarterly**: Review branch protection rules
- **Annually**: Audit collaborator access

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Security](https://docs.github.com/en/code-security)
- [GitHub Pages](https://docs.github.com/en/pages)

---

*Last Updated: 2026-01-08*  
*Version: 1.0.0*

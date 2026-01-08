# Semantic Versioning and Changelog

## Overview

PlatformForge follows [Semantic Versioning 2.0.0](https://semver.org/) for all releases. This document explains our versioning approach and how changes are documented in the changelog.

## Semantic Versioning Format

### Version Number Structure

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]

Example: 1.2.3-beta.1+20260108
```

### Version Components

#### MAJOR (X.0.0)
Incremented when making **incompatible API changes** or major architectural changes.

**Examples:**
- Breaking changes to public APIs
- Removal of deprecated features
- Major database schema changes requiring migration
- Complete UI/UX redesigns
- Changes requiring user action or migration

#### MINOR (0.X.0)
Incremented when adding **functionality in a backward-compatible manner**.

**Examples:**
- New features that don't break existing functionality
- New API endpoints
- New UI components or pages
- Performance improvements
- Non-breaking enhancements to existing features

#### PATCH (0.0.X)
Incremented for **backward-compatible bug fixes**.

**Examples:**
- Bug fixes
- Security patches
- Documentation updates
- Minor UI/UX improvements
- Performance optimizations
- Dependency updates (non-breaking)

### Pre-release Versions

Format: `X.Y.Z-<identifier>.<number>`

#### Alpha (α)
- **Purpose**: Early development, unstable
- **Format**: `1.0.0-alpha.1`
- **Audience**: Internal testing only
- **Stability**: Highly unstable, features incomplete

#### Beta (β)
- **Purpose**: Feature complete, testing phase
- **Format**: `1.0.0-beta.1`
- **Audience**: Selected users, early adopters
- **Stability**: Feature complete but may have bugs

#### Release Candidate (rc)
- **Purpose**: Final testing before release
- **Format**: `1.0.0-rc.1`
- **Audience**: Broader user testing
- **Stability**: Near-production quality

### Build Metadata

Format: `X.Y.Z+<metadata>`

**Examples:**
- `1.0.0+20260108`: Build date
- `1.0.0+exp.sha.5114f85`: Git commit reference
- `1.0.0+build.1234`: Build number

Build metadata does not affect version precedence.

## Versioning Rules

### When to Increment

1. **Increment MAJOR** when:
   - API changes break backward compatibility
   - Removing features or endpoints
   - Fundamental architecture changes
   - Database migrations required
   - User action required for upgrade

2. **Increment MINOR** when:
   - Adding new features
   - Adding new API endpoints
   - Deprecating features (with backward compatibility)
   - Significant improvements
   - New dependencies added

3. **Increment PATCH** when:
   - Fixing bugs
   - Security patches
   - Documentation fixes
   - Minor UI tweaks
   - Performance improvements
   - Dependency updates (patches)

### Version Precedence

```
1.0.0-alpha.1 < 1.0.0-alpha.2 < 1.0.0-beta.1 < 1.0.0-rc.1 < 1.0.0
```

### Initial Development

- Pre-1.0.0 versions are for initial development
- Version 0.x.y: Anything may change at any time
- The public API should not be considered stable

### First Stable Release

- Version 1.0.0 defines the public API
- After 1.0.0, version increments follow the rules above

## Changelog Format

PlatformForge uses the [Keep a Changelog](https://keepachangelog.com/) format.

### Changelog Structure

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security

## [1.0.0] - 2026-01-15

### Added
- Feature description
- Another feature

### Fixed
- Bug fix description
```

### Change Categories

#### Added
For new features.

**Example:**
```markdown
### Added
- Customer import/export functionality
- New dashboard widget for order statistics
- API endpoint for bulk customer updates
```

#### Changed
For changes in existing functionality.

**Example:**
```markdown
### Changed
- Updated user profile page layout
- Improved search performance for large datasets
- Modified pagination from 20 to 50 items per page
```

#### Deprecated
For soon-to-be removed features.

**Example:**
```markdown
### Deprecated
- Legacy API v1 endpoints (will be removed in v2.0.0)
- Old authentication flow (use OAuth instead)
```

#### Removed
For now removed features.

**Example:**
```markdown
### Removed
- Support for Internet Explorer 11
- Deprecated API v1 endpoints
- Legacy dashboard components
```

#### Fixed
For bug fixes.

**Example:**
```markdown
### Fixed
- Fixed customer filter not working with special characters
- Resolved memory leak in real-time updates
- Corrected timezone handling in reports
```

#### Security
For security-related changes.

**Example:**
```markdown
### Security
- Patched XSS vulnerability in customer notes
- Updated dependencies with security vulnerabilities
- Implemented rate limiting on API endpoints
```

## Release Process

### 1. Version Planning

Before starting development:
1. Determine if changes are MAJOR, MINOR, or PATCH
2. Create milestone for the version
3. Plan breaking changes carefully
4. Document deprecated features

### 2. Development Phase

During development:
1. Update CHANGELOG.md under `[Unreleased]`
2. Add entries as features are completed
3. Link to issues and PRs
4. Categorize changes appropriately

### 3. Pre-release Phase

Before release:
1. Review all changes in `[Unreleased]`
2. Verify version number follows SemVer
3. Create pre-release versions for testing
4. Test upgrade paths

### 4. Release Phase

When releasing:
1. Move `[Unreleased]` entries to new version section
2. Add release date
3. Update version in `package.json`
4. Create git tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
5. Push tag: `git push origin v1.0.0`
6. Create GitHub release
7. Deploy to production

### 5. Post-release

After release:
1. Announce release to users
2. Update documentation
3. Monitor for issues
4. Prepare hotfix process if needed

## Branching Strategy

### Branch Naming
- `main`: Stable production code
- `develop`: Integration branch for next release
- `feature/feature-name`: New features
- `bugfix/bug-description`: Bug fixes
- `hotfix/issue-description`: Critical production fixes
- `release/v1.0.0`: Release preparation

### Version Branches
- Create release branches for major versions
- Maintain LTS (Long Term Support) versions
- Backport critical fixes to supported versions

## Hotfix Process

For critical bugs in production:

1. **Create hotfix branch** from `main`
   ```bash
   git checkout -b hotfix/v1.0.1 main
   ```

2. **Fix the issue**
   - Make minimal changes
   - Test thoroughly

3. **Update version** (increment PATCH)
   ```json
   {
     "version": "1.0.1"
   }
   ```

4. **Update CHANGELOG**
   ```markdown
   ## [1.0.1] - 2026-01-16
   
   ### Fixed
   - Critical bug description
   ```

5. **Merge and release**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

6. **Backport to develop**

## Deprecation Policy

### Deprecation Process

1. **Announce deprecation** in CHANGELOG
   ```markdown
   ### Deprecated
   - Feature X will be removed in v2.0.0. Use Feature Y instead.
   ```

2. **Add deprecation warnings** in code
   ```javascript
   console.warn('This function is deprecated. Use newFunction() instead.');
   ```

3. **Update documentation** with migration guide

4. **Minimum deprecation period**: 
   - MAJOR features: 2 versions or 6 months
   - MINOR features: 1 version or 3 months

5. **Remove in next MAJOR** version

### Breaking Change Communication

For breaking changes:
1. Announce in advance (blog post, email)
2. Provide migration guide
3. Offer support during transition
4. Maintain backward compatibility when possible

## Automation

### Version Bumping

Use npm version commands:
```bash
# Bump patch version
npm version patch

# Bump minor version
npm version minor

# Bump major version
npm version major

# Pre-release versions
npm version prerelease --preid=beta
```

### Changelog Generation

Use conventional commits for automatic changelog generation:
```bash
git commit -m "feat: add customer export feature"
git commit -m "fix: resolve search pagination issue"
git commit -m "chore: update dependencies"
```

### CI/CD Integration

Automated in GitHub Actions:
- Validate version follows SemVer
- Check CHANGELOG is updated
- Create release notes from CHANGELOG
- Tag releases automatically

## Version History

### Current Version
**v0.1.0** - MVP Release (Current)

### Future Versions
- **v0.2.0** - Advanced Analytics (Planned)
- **v0.3.0** - Mobile Responsive Enhancements (Planned)
- **v1.0.0** - Production Ready (Target: Q4 2026)

## References

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## FAQ

### Q: Do documentation updates require a version bump?
**A:** Documentation-only updates don't require a version bump unless they're part of a release with code changes.

### Q: What if I make multiple types of changes?
**A:** Use the highest-level change. If you add a feature (MINOR) and fix bugs (PATCH), bump MINOR.

### Q: When should I create a pre-release?
**A:** For testing new features with users before official release, or for release candidates.

### Q: How do I handle security fixes?
**A:** Release as PATCH immediately, even if other changes are pending. Document in Security section.

---

*Last Updated: 2026-01-08*  
*Version: 1.0.0*

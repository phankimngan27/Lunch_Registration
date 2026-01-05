# Source Code Cleanup Plan

## 📊 Current Status

### Root Directory Files (25 files)
Có quá nhiều documentation files, gây rối và khó maintain!

## 🗑️ Files to DELETE

### Duplicate/Redundant Documentation
1. ❌ `BUGFIX_CANCEL_REGISTRATION.md` - Temporary bugfix doc
2. ❌ `BUGFIX_SUMMARY.md` - Temporary bugfix doc
3. ❌ `BUGFIX_VEGETARIAN_DISPLAY.md` - Temporary bugfix doc
4. ❌ `SECURITY_FIX_VEGETARIAN_VALIDATION.md` - Temporary security doc
5. ❌ `PERFORMANCE_IMPROVEMENTS.md` - Duplicate of PERFORMANCE_SUMMARY
6. ❌ `PERFORMANCE_README.md` - Duplicate of PERFORMANCE_SUMMARY
7. ❌ `DEPLOYMENT_CHECKLIST.md` - Duplicate of DEPLOYMENT_GUIDE
8. ❌ `DEPLOYMENT_PERFORMANCE_UPGRADE.md` - Duplicate of DEPLOYMENT_GUIDE
9. ❌ `QUICK_PERFORMANCE_FIX.md` - Temporary performance doc
10. ❌ `TEST_PERFORMANCE.md` - Temporary testing doc
11. ❌ `START_HERE.md` - Redundant with README
12. ❌ `CODE_REVIEW_REPORT.md` - Temporary review doc
13. ❌ `QUICKSTART.md` - Duplicate of README

**Reason**: Các file này là temporary docs được tạo trong quá trình fix bugs và performance. Sau khi deploy xong, không cần giữ lại.

## ✅ Files to KEEP

### Essential Documentation
1. ✅ `README.md` - Main documentation
2. ✅ `DEPLOYMENT_GUIDE.md` - Production deployment guide
3. ✅ `SECURITY_GUIDE.md` - Security best practices
4. ✅ `TECH_STACK.md` - Technology stack reference
5. ✅ `BEST_PRACTICES.md` - Development best practices
6. ✅ `CONTRIBUTING.md` - Contribution guidelines
7. ✅ `DATA_CLEANUP_GUIDE.md` - Important for data maintenance
8. ✅ `PERFORMANCE_SUMMARY.md` - Keep as reference for performance work

### Essential Scripts
9. ✅ `start-website.bat` - Windows startup script
10. ✅ `stop-website.bat` - Windows stop script

### Assets
11. ✅ `logo_1.png` - Logo file

### Config
12. ✅ `.gitignore` - Git configuration

## 📁 Recommended Structure

After cleanup, root directory should have:

```
lunch-registration/
├── .git/
├── .kiro/
├── .vscode/
├── backend/
├── database/
├── frontend/
├── docs/                    # NEW: Move all docs here
│   ├── README.md           # Symlink to root README
│   ├── DEPLOYMENT_GUIDE.md
│   ├── SECURITY_GUIDE.md
│   ├── TECH_STACK.md
│   ├── BEST_PRACTICES.md
│   ├── CONTRIBUTING.md
│   ├── DATA_CLEANUP_GUIDE.md
│   └── PERFORMANCE_SUMMARY.md
├── .gitignore
├── README.md
├── logo_1.png
├── start-website.bat
└── stop-website.bat
```

## 🔧 Cleanup Commands

### Step 1: Delete temporary docs
```bash
# Delete bugfix docs
rm BUGFIX_CANCEL_REGISTRATION.md
rm BUGFIX_SUMMARY.md
rm BUGFIX_VEGETARIAN_DISPLAY.md
rm SECURITY_FIX_VEGETARIAN_VALIDATION.md

# Delete duplicate performance docs
rm PERFORMANCE_IMPROVEMENTS.md
rm PERFORMANCE_README.md
rm QUICK_PERFORMANCE_FIX.md
rm TEST_PERFORMANCE.md

# Delete duplicate deployment docs
rm DEPLOYMENT_CHECKLIST.md
rm DEPLOYMENT_PERFORMANCE_UPGRADE.md

# Delete redundant docs
rm START_HERE.md
rm CODE_REVIEW_REPORT.md
rm QUICKSTART.md
```

### Step 2: Create docs folder (Optional)
```bash
# Create docs folder
mkdir docs

# Move essential docs
mv DEPLOYMENT_GUIDE.md docs/
mv SECURITY_GUIDE.md docs/
mv TECH_STACK.md docs/
mv BEST_PRACTICES.md docs/
mv CONTRIBUTING.md docs/
mv DATA_CLEANUP_GUIDE.md docs/
mv PERFORMANCE_SUMMARY.md docs/

# Create symlink for README
ln -s ../README.md docs/README.md
```

### Step 3: Update README.md
Add links to docs folder:
```markdown
## 📚 Documentation

- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Security Guide](docs/SECURITY_GUIDE.md)
- [Tech Stack](docs/TECH_STACK.md)
- [Best Practices](docs/BEST_PRACTICES.md)
- [Contributing](docs/CONTRIBUTING.md)
- [Data Cleanup Guide](docs/DATA_CLEANUP_GUIDE.md)
- [Performance Summary](docs/PERFORMANCE_SUMMARY.md)
```

## 📊 Impact

### Before Cleanup
- 25 files in root directory
- Confusing and hard to navigate
- Many duplicate/temporary docs

### After Cleanup
- 4 files in root directory (README, logo, 2 bat files)
- 8 docs in docs/ folder
- Clean and organized
- Easy to maintain

## ⚠️ Important Notes

1. **Backup before cleanup**: `git commit -am "backup before cleanup"`
2. **Review each file**: Make sure no important info is lost
3. **Update links**: Update any links in README or other docs
4. **Test scripts**: Make sure bat files still work
5. **Commit after cleanup**: `git commit -am "chore: cleanup documentation files"`

## 🎯 Benefits

1. ✅ Cleaner root directory
2. ✅ Easier to find documentation
3. ✅ Better organization
4. ✅ Easier maintenance
5. ✅ Professional structure

## 📝 Checklist

- [ ] Backup current state
- [ ] Delete temporary docs (13 files)
- [ ] Create docs/ folder (optional)
- [ ] Move essential docs (optional)
- [ ] Update README.md
- [ ] Test bat files
- [ ] Commit changes
- [ ] Verify nothing is broken

---

**Estimated time**: 10 minutes
**Risk**: LOW (can rollback with git)
**Impact**: Better organization, easier maintenance

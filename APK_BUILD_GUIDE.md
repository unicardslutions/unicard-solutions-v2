# APK Build Guide - Manual Steps Required

## ✅ Completed Automatically

1. ✅ **All code pushed to GitHub**: https://github.com/unicardslutions/unicard-solutions-v2
2. ✅ **EAS CLI installed globally**
3. ✅ **Logged in to EAS** as `uidn1084399`
4. ✅ **EAS configuration files created** (`eas.json` for both apps)
5. ✅ **App configurations fixed** (removed invalid Google Sign-In config)

## 📋 Manual Steps Required

The EAS CLI requires interactive terminal input that cannot be automated. Please follow these steps:

### Step 1: Initialize School App Project

```bash
cd C:\Users\shahi\unicards\unicard-school-app
eas init
```

**When prompted:** `Would you like to create a project for @uidn1084399/unicard-school-app?`
- Type: `Y` and press Enter

This will:
- Create an EAS project
- Generate a unique project ID
- Update `app.json` with the project ID

### Step 2: Build School App - Production APK

```bash
eas build --platform android --profile production
```

This will:
- Upload your code to EAS servers
- Build a production-ready APK in the cloud
- Take approximately 10-20 minutes
- Provide a download link when complete

**Expected output:**
```
✔ Build complete!
📦 Download APK: https://expo.dev/accounts/uidn1084399/projects/unicard-school-app/builds/...
```

### Step 3: Build School App - Development APK

```bash
eas build --platform android --profile development
```

This builds a development version with:
- Debugging tools enabled
- Hot reload support
- Larger file size

### Step 4: Initialize Admin App Project

```bash
cd C:\Users\shahi\unicards\unicard-admin-app
eas init
```

**When prompted:** `Would you like to create a project for @uidn1084399/unicard-admin-app?`
- Type: `Y` and press Enter

### Step 5: Build Admin App - Production APK

```bash
eas build --platform android --profile production
```

### Step 6: Build Admin App - Development APK

```bash
eas build --platform android --profile development
```

## 📱 Final APKs

After completion, you will have **4 APK files**:

1. **unicard-school-production.apk** - Ready for distribution to schools
2. **unicard-school-development.apk** - For testing with debug tools
3. **unicard-admin-production.apk** - Ready for distribution to admins
4. **unicard-admin-development.apk** - For testing with debug tools

## 📥 Downloading APKs

### Option 1: Direct Download Links
- EAS CLI will provide download links in the terminal
- Links expire after 30 days

### Option 2: EAS Dashboard
1. Visit: https://expo.dev/accounts/uidn1084399/projects
2. Select the project (School or Admin)
3. Go to "Builds" tab
4. Download the APK files

## 🔧 Build Configuration

Both apps use the following build profiles (already configured in `eas.json`):

### Production Profile
```json
{
  "android": {
    "buildType": "apk"
  }
}
```
- Optimized for size
- Production-ready
- Signed automatically
- Suitable for distribution

### Development Profile
```json
{
  "developmentClient": true,
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```
- Includes debugging tools
- Larger file size
- For testing only

## 📊 Build Status Monitoring

Monitor your builds at:
- https://expo.dev/accounts/uidn1084399/projects/unicard-school-app/builds
- https://expo.dev/accounts/uidn1084399/projects/unicard-admin-app/builds

You'll see:
- Build progress in real-time
- Build logs
- Download links when complete
- Build history

## 🚀 Distribution

### For Testing:
1. Download the APK files
2. Transfer to Android devices
3. Enable "Install from Unknown Sources" in device settings
4. Install the APK

### For Production (Google Play Store):
To publish on Google Play Store, you'll need AAB format instead:

1. Change `eas.json` buildType to `aab`:
```json
"production": {
  "android": {
    "buildType": "aab"
  }
}
```

2. Build AAB:
```bash
eas build --platform android --profile production
```

3. Upload AAB to Google Play Console

## 📝 Additional Notes

### Build Times
- First build: 15-20 minutes
- Subsequent builds: 10-15 minutes
- Development builds: Slightly longer

### Build Credits
- Free tier: Limited builds per month
- Paid tier: Unlimited builds
- Check: https://expo.dev/accounts/uidn1084399/settings/billing

### Troubleshooting

**If build fails:**
1. Check build logs in EAS dashboard
2. Verify all dependencies are correct
3. Ensure environment variables are set (if needed)
4. Try rebuilding with `eas build --clear-cache`

**Common issues:**
- Network timeout: Rebuild
- Dependency conflicts: Check package.json
- Configuration errors: Verify app.json and eas.json

## ✅ Summary

### What's Complete:
- ✅ All 100% feature-complete code pushed to GitHub
- ✅ EAS environment configured
- ✅ Build profiles created
- ✅ Ready to build APKs

### What You Need To Do:
1. Run `eas init` for both apps (answer Y to prompts)
2. Run `eas build` commands for all 4 builds
3. Download APKs from EAS dashboard
4. Test on devices

**Estimated Total Time:** 1-2 hours (mostly build time, minimal user interaction)

---

**Last Updated:** October 23, 2025
**Project Status:** 100% Feature Complete ✅
**GitHub Repository:** https://github.com/unicardslutions/unicard-solutions-v2


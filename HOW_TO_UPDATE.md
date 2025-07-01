# How to Update Your Android App

This file contains the step-by-step workflow for creating a new version of your app for the Google Play Store after you have made changes to the code.

---

### The Update Workflow

Follow these steps in order every time you want to release an update.

**Step 1: Make Your Code Changes**
- Edit the pages, components, and styles in the `src` folder as you normally would.

**Step 2: Build Your Web App**
- After making your changes, you must compile the Next.js code into static files.
- **Run this command:**
  ```powershell
  npm run build
  ```

**Step 3: Sync Your Changes with the Android Project**
- This command copies your newly built web files into the native Android project.
- **Run this command:**
  ```powershell
  npx cap sync android
  ```

**Step 4: Build the New Signed `.aab` for the Play Store**
- This is the final step to create the app bundle file that you will upload. It will require your keystore password.
- **Run this command:**
  ```powershell
  npx cap run android --prod --release
  ```

---

### TL;DR - The Commands

1.  `npm run build`
2.  `npx cap sync android`
3.  `npx cap run android --prod --release`

The final file will be located at: `android/app/build/outputs/bundle/release/app-release.aab` 
# How to Update Your Android App

This file contains the step-by-step workflow for creating a new version of your app for the Google Play Store after you have made changes to the code.

**Important:** Before the final step, ensure your `doomlings-companion-key.keystore` is in the `android/app/` directory and that you have filled in your passwords in the `android/keystore.properties` file.

---

### The Update Workflow

Follow these steps in order every time you want to release an update.

**Step 1: Make Your Code Changes**
- Edit the pages, components, and styles in the `src` folder as you normally would.

**Step 2: Build Your Web App**
- Compile the Next.js code into static files.
- **Run this command:**
  ```powershell
  npm run build
  ```

**Step 3: Sync Your Changes with the Android Project**
- Copy your newly built web files into the native Android project.
- **Run this command:**
  ```powershell
  npx cap sync android
  ```

**Step 4: Build the New Signed `.aab` for the Play Store**
- This final step uses the Gradle wrapper to build and sign the app bundle.
- **First, navigate into the android directory:**
  ```powershell
  cd android
  ```
- **Next, run the build command:**
  ```powershell
  ./gradlew bundleRelease
  ```
- **After, navigate back out:**
  ```powershell
  cd ..
  ```
---

### TL;DR - The Commands (from project root)

1.  `npm run build`
2.  `npx cap sync android`
3.  `cd android`
4.  `./gradlew bundleRelease`
5.  `cd ..`

The final file will be located at: `android/app/build/outputs/bundle/release/app-release.aab` 
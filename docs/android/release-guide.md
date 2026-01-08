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

-**Step 5: Export the Files Google Play Asks For**
- This step only packages the Play signing artifacts; it reuses the `.aab` you built in Step 4.
- The automated scripts already call `pepk.jar` and `keytool` for you. After a successful run, check `builds/signing/` for:
  - `doomlings-companion-encrypted-private-key.zip`
  - `upload_certificate.pem`
- If you need to run it manually, copy and run this PowerShell block from the project root. It regenerates the encrypted private key ZIP using the Play-provided `encryption_public_key.pem` and refreshes the upload certificate:
  ```powershell
  # Remove any prior export to avoid reuse
  Remove-Item builds/signing/doomlings-companion-encrypted-private-key.zip -ErrorAction SilentlyContinue

  # Generate Google Play encrypted private key package
  java -jar android/signing/pepk.jar `
    --keystore android/app/doomlings-companion-key.keystore `
    --alias doomlings-companion `
    --output builds/signing/doomlings-companion-encrypted-private-key.zip `
    --keystore-pass doomlings123 `
    --key-pass doomlings123 `
    --include-cert `
    --rsa-aes-encryption `
    --encryption-key-path android/signing/encryption_public_key.pem

  # Refresh the upload certificate for Play Console
  keytool -export -rfc -keystore android/app/doomlings-companion-key.keystore `
    -alias doomlings-companion `
    -file builds/signing/upload_certificate.pem `
    -storepass doomlings123 `
    -keypass doomlings123
  ```
---

### TL;DR - The Commands (from project root)

1.  `npm run build`
2.  `npx cap sync android`
3.  `cd android`
4.  `./gradlew bundleRelease`
5.  `cd ..`
6.  (Optional) `./scripts/web/build-and-deploy.ps1 -SkipGit` or the `.bat` version to regenerate Play signing exports automatically.

The final file will be located at: `android/app/build/outputs/bundle/release/app-release.aab`

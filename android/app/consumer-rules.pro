# Consumer ProGuard rules for Android Security Crypto Library
# This file contains rules that should be applied when this library is consumed

# Google Crypto Tink
-keep class com.google.crypto.tink.** { *; }
-dontwarn com.google.crypto.tink.**

# Google Error Prone Annotations
-dontwarn com.google.errorprone.annotations.**
-keep class com.google.errorprone.annotations.** { *; }

# JSR 305 Annotations
-dontwarn javax.annotation.**
-keep class javax.annotation.** { *; }
-dontwarn javax.annotation.Nullable
-dontwarn javax.annotation.concurrent.GuardedBy

# Android Security Crypto
-keep class androidx.security.crypto.** { *; }
-dontwarn androidx.security.crypto.**

# Capacitor Preferences with encryption
-keep class com.capacitorjs.plugins.preferences.** { *; }
-dontwarn com.capacitorjs.plugins.preferences.**
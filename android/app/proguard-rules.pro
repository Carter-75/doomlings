# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Keep Capacitor classes
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.plugins.** { *; }
-dontwarn com.getcapacitor.**

# Keep WebView related classes
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, java.lang.String);
}
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, jav.lang.String);
}

# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Cordova classes
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**

# Keep AndroidX classes
-keep class androidx.** { *; }
-dontwarn androidx.**

# Keep JSON serialization
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod

# Keep file provider
-keep class androidx.core.content.FileProvider { *; }

# Keep splash screen
-keep class androidx.core.splashscreen.** { *; }

# Keep app-specific classes (adjust package name as needed)
-keep class com.doomlings.companion.** { *; }

# Remove debug logs in release builds
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Parcelable implementations
-keepclassmembers class * implements android.os.Parcelable {
  public static final android.os.Parcelable$Creator CREATOR;
}

# Keep Serializable implementations
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Google Crypto Tink Library Rules
-keep class com.google.crypto.tink.** { *; }
-dontwarn com.google.crypto.tink.**
-keepclassmembers class com.google.crypto.tink.** { *; }

# Google Error Prone Annotations
-dontwarn com.google.errorprone.annotations.**
-keep class com.google.errorprone.annotations.** { *; }

# JSR 305 Annotations (javax.annotation)
-dontwarn javax.annotation.**
-keep class javax.annotation.** { *; }

# JSR 305 Nullable annotations
-dontwarn javax.annotation.Nullable
-dontwarn javax.annotation.CheckForNull
-dontwarn javax.annotation.concurrent.GuardedBy

# Additional missing annotation classes
-dontwarn com.google.errorprone.annotations.CanIgnoreReturnValue
-dontwarn com.google.errorprone.annotations.CheckReturnValue
-dontwarn com.google.errorprone.annotations.Immutable
-dontwarn com.google.errorprone.annotations.RestrictedApi

# Keep all annotation classes to prevent R8 issues
-keep @interface * { *; }
-keepattributes RuntimeVisibleAnnotations
-keepattributes RuntimeInvisibleAnnotations
-keepattributes RuntimeVisibleParameterAnnotations
-keepattributes RuntimeInvisibleParameterAnnotations

# Capacitor Preferences Plugin (which uses Tink for encryption)
-keep class com.capacitorjs.plugins.preferences.** { *; }
-dontwarn com.capacitorjs.plugins.preferences.**

# Additional safety rules for crypto libraries
-keep class javax.crypto.** { *; }
-keep class java.security.** { *; }
-dontwarn javax.crypto.**
-dontwarn java.security.**

# R8 full mode compatibility
-keepattributes LineNumberTable,SourceFile
-renamesourcefileattribute SourceFile

# Don't optimize away classes that might be used by reflection
-keepclassmembers class * {
    @com.google.errorprone.annotations.** *;
    @javax.annotation.** *;
}

# Keep classes referenced from native code or through reflection
-keep class * extends java.lang.Exception
-keep class * extends java.lang.Error

# Preserve the special static methods that are required in all enumeration classes
-keepclassmembers class * extends java.lang.Enum {
    <fields>;
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Alternative approach - disable R8 full mode if issues persist (less optimal but safer)
# Add this to gradle.properties if still having issues: android.enableR8.fullMode=false
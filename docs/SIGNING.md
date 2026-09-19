# Android Signing & Clean Build Guide

This document explains how the Android app signs its builds and how to reproduce
a clean debug and release build. It was introduced during **Phase 2 hardening**,
when the upload-keystore passwords were removed from the committed
`android/gradle.properties`.

## How signing works now (no secrets in the repo)

The upload keystore (`android/app/keystore/todoreactnative.keystore`) and its
passwords are **never** part of the repository. `android/app/build.gradle`
resolves them in this order:

1. **Environment variables**
   - `TODO_UPLOAD_STORE_FILE`
   - `TODO_UPLOAD_KEY_ALIAS`
   - `TODO_UPLOAD_STORE_PASSWORD`
   - `TODO_UPLOAD_KEY_PASSWORD`
2. **`android/keystore.properties`** (gitignored local file). Copy
   `android/keystore.properties.example` to `android/keystore.properties` and
   fill in the real values.
3. **User-level `~/.gradle/gradle.properties`** with the classic React Native
   keys `MYAPP_UPLOAD_STORE_FILE`, `MYAPP_UPLOAD_KEY_ALIAS`,
   `MYAPP_UPLOAD_STORE_PASSWORD`, `MYAPP_UPLOAD_KEY_PASSWORD`:

   ```properties
   # example ~/.gradle/gradle.properties (user home, NOT this repo)
   MYAPP_UPLOAD_STORE_FILE=keystore/todoreactnative.keystore
   MYAPP_UPLOAD_KEY_ALIAS=todoreactnative
   MYAPP_UPLOAD_STORE_PASSWORD=your-real-password
   MYAPP_UPLOAD_KEY_PASSWORD=your-real-password
   ```

`MYAPP_UPLOAD_STORE_FILE` is resolved relative to `android/app/` first, then to
`android/`, and finally as an absolute path if nothing else matches.

## Behavior when the secrets are missing

- **Debug builds** fall back to the standard auto-generated debug keystore, so
  cloning the repo and running the app still works out of the box.
- **Release builds** are produced **unsigned** with a loud Gradle warning. An
  unsigned APK must never be published.

## First-time setup (owning developer)

The release keystore is a private file and is gitignored, so it is not in the
repository. To build signed release APKs on a machine:

1. Make sure the `.keystore` file sits at
   `android/app/keystore/todoreactnative.keystore` (or configure an absolute
   path).
2. Provide the passwords through any of the three methods above.
3. Verify Gradle picked them up — the build prints:
   `RELEASE SIGNING: using upload key alias 'todoreactnative' from '...'`

## Clean debug build

```sh
cd android
gradlew clean
gradlew :app:assembleDebug
```

Install on a device/emulator:

```sh
gradlew :app:installDebug
```

> **Signature mismatch?** If a previous debug build on your phone was signed
> with the release key and your current checkout does NOT have signing secrets
> configured (so debug now uses the debug keystore), Android will refuse the
> install. Uninstall the app once, then reinstall.

## Clean signed release build

```sh
cd android
gradlew clean
gradlew :app:assembleRelease
```

The release APK is written to
`android/app/build/outputs/apk/release/Todo.apk` (renamed to `Todo.apk` by
`android/app/build.gradle`).

## Notes / troubleshooting

- On Windows use `gradlew.bat` instead of `gradlew`.
- `local.properties` (SDK location) must exist in `android/` or `ANDROID_HOME`
  must point to the Android SDK.
- **Keystore backups:** keep the `.keystore` file and its passwords in a
  password manager. Losing them means you can never publish an update for users
  of the current release.
- The keystore and `keystore.properties` are ignored via `.gitignore`
  (`*.keystore`, `keystore.properties`). Re-adding passwords to
  `android/gradle.properties` would undo this hardening — please don't.
@echo off
echo Starting the React Native build and run process...

adb logcat *:E | findstr /i "com.callifyapp"


:: Display only React Native error logs
echo Displaying React Native error logs...
adb logcat *:S ReactNative:V ReactNativeJS:V

npx eslint . --ext .js,.jsx,.ts,.tsx
npx tsc --noEmit
npm test
npx prettier . --write
npx react-native doctor

:: Navigate to the android directory
cd android
call gradlew.bat clean
cd ..

:: Bundle the React Native project for Android
echo Bundling the React Native project...
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

npx react-native start --reset-cache

npx react-native run-android

echo Process completed.

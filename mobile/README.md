# StudentMoves Mobile App

Native mobile application for Android and iOS platforms using React Native.

## Features

- **Cross-Platform**: Single codebase for both iOS and Android
- **Property Search**: Browse student accommodations with advanced filtering
- **Property Details**: Detailed property information with image galleries
- **User Authentication**: Login and registration system
- **Saved Properties**: Save favorite properties for later viewing
- **Maps Integration**: View property locations on interactive maps
- **Native Performance**: Optimized for mobile devices

## Quick Setup

1. **Create the mobile directory structure**
2. **Install React Native CLI globally**
3. **Navigate to mobile directory and install dependencies**
4. **Configure API endpoint in src/services/api.ts**
5. **Run the application**

## Development Commands

```bash
# Start Metro bundler
npm start

# Run on Android (requires Android Studio)
npm run android

# Run on iOS (requires Xcode on macOS)
npm run ios

# Run tests
npm test
```

## Production Builds

```bash
# Android APK
npm run build:android

# iOS Archive (Xcode required)
npm run build:ios
```

## Configuration

1. **Update API Base URL** in `src/services/api.ts`
2. **Add Google Maps API key** for location features
3. **Configure app icons and splash screens**
4. **Set up push notifications** (optional)

## Platform Requirements

### Android
- Android Studio with SDK 28+
- Java 11+
- Android Virtual Device (AVD) or physical device

### iOS (macOS only)
- Xcode 14+
- iOS Simulator or physical device
- Apple Developer account for device testing

## App Structure

```
mobile/
├── src/
│   ├── screens/          # App screens
│   ├── components/       # Reusable components
│   ├── context/          # React Context providers
│   ├── services/         # API services
│   └── types/            # TypeScript definitions
├── android/              # Android configuration
├── ios/                  # iOS configuration
└── App.tsx               # Root component
```

## Key Screens

- **HomeScreen**: Welcome with featured properties
- **PropertiesScreen**: Property listings with search
- **PropertyDetailsScreen**: Detailed property view
- **SearchScreen**: Advanced search filters
- **LoginScreen**: User authentication
- **ProfileScreen**: User profile management

## Deployment

### Google Play Store (Android)
1. Generate signed APK/AAB
2. Create Google Play Console account
3. Upload build and configure store listing
4. Submit for review

### Apple App Store (iOS)
1. Create Apple Developer account
2. Configure certificates and provisioning
3. Archive in Xcode and upload to App Store Connect
4. Submit for review

## API Integration

The mobile app connects to the same backend API as the web application. Ensure your server:
- Has CORS configured for mobile requests
- Supports the same authentication system
- Returns mobile-optimized image sizes

## Performance Features

- **Image Optimization**: Lazy loading and caching
- **Offline Support**: Local data persistence
- **Push Notifications**: Real-time updates
- **Analytics**: User behavior tracking

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:e2e

# Performance testing
npm run test:performance
```

## Troubleshooting

### Common Issues
1. **Metro bundler cache**: `npx react-native start --reset-cache`
2. **Android build errors**: Clean with `cd android && ./gradlew clean`
3. **iOS build errors**: Clean derived data in Xcode
4. **Dependency issues**: Delete node_modules and reinstall

### Debug Mode
- Shake device for developer menu
- Enable remote debugging
- Use Flipper for advanced debugging

## Contributing

1. Follow React Native coding standards
2. Test on both platforms before submitting
3. Update documentation for new features
4. Ensure accessibility compliance

This mobile app provides a native experience for the StudentMoves platform, allowing users to search and view properties on their mobile devices with full native performance and features.
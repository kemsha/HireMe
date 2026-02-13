// Jest matchers are now built into @testing-library/react-native v12.4+

// Mock Firebase modules before any imports
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn((item) => item),
  where: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
}));

// Mock Firebase config
jest.mock('../src/config/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signOut: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
  },
  db: {},
  storage: {},
}));

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        FIREBASE_API_KEY: 'test-key',
        FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
        FIREBASE_PROJECT_ID: 'test-project',
        FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
        FIREBASE_MESSAGING_SENDER_ID: '123456',
        FIREBASE_APP_ID: '1:123456:web:abc',
      },
    },
  },
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

// Silence console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

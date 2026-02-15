import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';
const WEB_PREFIX = 'isb_';

async function getItem(key) {
  if (isWeb) {
    try {
      return (typeof window !== 'undefined' ? window.localStorage.getItem(WEB_PREFIX + key) : null) ?? null;
    } catch {
      return null;
    }
  }
  try {
    const SecureStore = require('expo-secure-store');
    const store = SecureStore?.default ?? SecureStore;
    if (store?.getItemAsync) return store.getItemAsync(key);
  } catch (e) {
    console.warn('SecureStore getItem:', e);
  }
  return null;
}

async function setItem(key, value) {
  if (isWeb) {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(WEB_PREFIX + key, value);
    } catch {}
    return;
  }
  try {
    const SecureStore = require('expo-secure-store');
    const store = SecureStore?.default ?? SecureStore;
    if (store?.setItemAsync) return store.setItemAsync(key, value);
  } catch (e) {
    console.warn('SecureStore setItem:', e);
  }
}

async function removeItem(key) {
  if (isWeb) {
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(WEB_PREFIX + key);
    } catch {}
    return;
  }
  try {
    const SecureStore = require('expo-secure-store');
    const store = SecureStore?.default ?? SecureStore;
    if (store?.deleteItemAsync) return store.deleteItemAsync(key);
  } catch (e) {
    console.warn('SecureStore removeItem:', e);
  }
}

export const storage = { getItem, setItem, removeItem };

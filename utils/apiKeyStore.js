// utils/apiKeyStore.js
import * as SecureStore from 'expo-secure-store';

export function keyName(userId) {
  return `openrouter_key_${userId}`;
}

export async function getApiKey(userId) {
  if (!userId) return null;
  try {
    return await SecureStore.getItemAsync(keyName(userId));
  } catch (error) {
    console.error('Failed to get API key from secure store:', error?.message);
    return null;
  }
}

export async function saveApiKey(userId, apiKey) {
  if (!userId || !apiKey) {
    throw new Error('User ID and API key are required');
  }
  try {
    await SecureStore.setItemAsync(keyName(userId), apiKey.trim());
  } catch (error) {
    console.error('Failed to save API key to secure store:', error?.message);
    throw error;
  }
}

export async function removeApiKey(userId) {
  if (!userId) return;
  try {
    await SecureStore.deleteItemAsync(keyName(userId));
  } catch (error) {
    console.error('Failed to remove API key from secure store:', error?.message);
    throw error;
  }
}


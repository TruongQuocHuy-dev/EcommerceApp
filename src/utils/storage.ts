import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

/**
 * Storage utility for AsyncStorage operations
 */
class Storage {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  static async set(key: string, value: any): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  static async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }

  static async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }

  // Auth specific methods
  static async getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    const accessToken = await this.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = await this.get<string>(STORAGE_KEYS.REFRESH_TOKEN);
    return { accessToken, refreshToken };
  }

  static async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await this.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  static async clearTokens(): Promise<void> {
    await this.remove(STORAGE_KEYS.ACCESS_TOKEN);
    await this.remove(STORAGE_KEYS.REFRESH_TOKEN);
    await this.remove(STORAGE_KEYS.USER_DATA);
  }
}

export default Storage;

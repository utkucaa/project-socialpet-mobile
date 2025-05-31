import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'access_token';
const USER_KEY = 'user_data';

export const storage = {
  // Token operations
  async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
      console.error('Token kaydetme hatası:', error);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Token alma hatası:', error);
      return null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Token silme hatası:', error);
    }
  },

  // User data operations
  async setUserData(userData: any): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Kullanıcı verisi kaydetme hatası:', error);
    }
  },

  async getUserData(): Promise<any | null> {
    try {
      const userData = await SecureStore.getItemAsync(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Kullanıcı verisi alma hatası:', error);
      return null;
    }
  },

  async removeUserData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (error) {
      console.error('Kullanıcı verisi silme hatası:', error);
    }
  },

  // Clear all stored data
  async clearAll(): Promise<void> {
    await this.removeToken();
    await this.removeUserData();
  }
}; 
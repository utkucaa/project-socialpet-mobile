import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface AuthResponse {
  accessToken: string;
  tokenType: string;
  userId: number;
  email: string;
  joinDate: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: string;
}

interface UserData {
  id: number;
  email: string;
  joinDate: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
}

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userName, setUserName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Sayfa yüklendiğinde token kontrolü yap
  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userString = await AsyncStorage.getItem('user');
      
      if (token && userString) {
        console.log('User already logged in, redirecting to home');
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error checking existing auth:', error);
    } finally {
      setCheckingAuth(false);
    }
  };

  const validateInputs = (): boolean => {
    if (!email.trim()) {
      Alert.alert('Hata', 'E-posta adresi gereklidir');
      return false;
    }

    if (!email.includes('@')) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi giriniz');
      return false;
    }

    if (!password.trim()) {
      Alert.alert('Hata', 'Şifre gereklidir');
      return false;
    }

    if (!isLogin) {
      if (!firstName.trim()) {
        Alert.alert('Hata', 'Ad gereklidir');
        return false;
      }

      if (!lastName.trim()) {
        Alert.alert('Hata', 'Soyad gereklidir');
        return false;
      }

      if (!userName.trim()) {
        Alert.alert('Hata', 'Kullanıcı adı gereklidir');
        return false;
      }

      if (!phoneNumber.trim()) {
        Alert.alert('Hata', 'Telefon numarası gereklidir');
        return false;
      }

      if (password !== confirmPassword) {
        Alert.alert('Hata', 'Şifreler eşleşmiyor');
        return false;
      }
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      console.log('Attempting login with:', { email });

      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Login failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(
          errorData?.message || 
          errorData?.error || 
          `Giriş işlemi başarısız (${response.status}). Lütfen tekrar deneyin.`
        );
      }

      const authData: AuthResponse = await response.json();
      console.log('Login successful:', authData);
      
      // JWT token'ı AsyncStorage'a kaydet
      await AsyncStorage.setItem('token', authData.accessToken);
      
      // Kullanıcı bilgilerini AsyncStorage'a kaydet
      const userData: UserData = {
        id: authData.userId,
        email: authData.email,
        joinDate: authData.joinDate,
        username: authData.username,
        firstName: authData.firstName,
        lastName: authData.lastName,
        role: authData.role,
        avatar: authData.avatarUrl
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      // Başarılı giriş mesajı
      Alert.alert(
        'Başarılı!', 
        `Hoş geldiniz ${authData.firstName}!`,
        [
          {
            text: 'Tamam',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      );

    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Giriş Hatası', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const registerData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        userName: userName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password: password.trim(),
        confirmPassword: confirmPassword.trim()
      };

      console.log('Attempting registration with:', registerData);

      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(registerData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Registration failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(
          errorData?.message || 
          errorData?.error || 
          `Kayıt işlemi başarısız (${response.status}). Lütfen tekrar deneyin.`
        );
      }

      const authData: AuthResponse = await response.json();
      console.log('Registration successful:', authData);
      
      // JWT token'ı AsyncStorage'a kaydet
      await AsyncStorage.setItem('token', authData.accessToken);
      
      // Kullanıcı bilgilerini AsyncStorage'a kaydet
      const userData: UserData = {
        id: authData.userId,
        email: authData.email,
        joinDate: authData.joinDate,
        username: authData.username,
        firstName: authData.firstName,
        lastName: authData.lastName,
        role: authData.role,
        avatar: authData.avatarUrl
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      // Başarılı kayıt mesajı
      Alert.alert(
        'Kayıt Başarılı!', 
        `Hoş geldiniz ${authData.firstName}! Hesabınız oluşturuldu.`,
        [
          {
            text: 'Tamam',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      );

    } catch (error: any) {
      console.error('Register error:', error);
      Alert.alert('Kayıt Hatası', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isLogin) {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  const clearInputs = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setUserName('');
    setPhoneNumber('');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearInputs();
  };

  // Auth kontrol edilirken loading göster
  if (checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#AB75C2" />
        <Text style={styles.loadingText}>Kontrol ediliyor...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#ffffff', '#ffffff']}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/social.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.taglineText}>
            Evcil hayvan severlerin sosyal ağı
          </Text>
        </View>

        <View style={styles.formContainer}>
          {!isLogin && (
            <>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Ad"
                  placeholderTextColor="#999"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Soyad"
                  placeholderTextColor="#999"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Kullanıcı Adı"
                  placeholderTextColor="#999"
                  value={userName}
                  onChangeText={setUserName}
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Telefon (+905551234567)"
                  placeholderTextColor="#999"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>
            </>
          )}
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="E-posta"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Şifre"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Şifre Tekrar"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>
          )}

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#d1d5db', '#9ca3af'] : ['#AB75C2', '#9B6BB0']}
              style={styles.buttonGradient}
            >
              {loading ? (
                <View style={styles.submitButtonLoadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.submitButtonText}>
                    {isLogin ? 'Giriş yapılıyor...' : 'Kayıt olunuyor...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton}
            onPress={toggleMode}
            disabled={loading}
          >
            <Text style={[styles.switchButtonText, loading && styles.disabledText]}>
              {isLogin 
                ? 'Hesabınız yok mu? Kayıt olun' 
                : 'Zaten hesabınız var mı? Giriş yapın'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
    marginTop: 40,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
  },
  taglineText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  formContainer: {
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  disabledButton: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  buttonGradient: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  submitButtonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  switchButtonText: {
    color: '#AB75C2',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledText: {
    color: '#9ca3af',
  },
}); 
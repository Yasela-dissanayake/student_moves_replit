import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {TextInput, Button, Card} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAuth} from '../context/AuthContext';

export default function LoginScreen({navigation}: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {login} = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        navigation.replace('MainTabs');
      } else {
        Alert.alert('Error', 'Invalid email or password');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Icon name="apartment" size={64} color="#2563eb" />
        <Text style={styles.appName}>StudentMoves</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
      </View>

      <Card style={styles.loginCard}>
        <Card.Content style={styles.cardContent}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            left={<TextInput.Icon icon="email" />}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
            contentStyle={styles.buttonContent}>
            Sign In
          </Button>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => Alert.alert('Reset Password', 'Feature coming soon!')}>
            <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      <View style={styles.signupSection}>
        <Text style={styles.signupText}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.signupLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* Demo Accounts */}
      <Card style={styles.demoCard}>
        <Card.Content>
          <Text style={styles.demoTitle}>Demo Accounts</Text>
          <Text style={styles.demoSubtitle}>Try the app with these test accounts:</Text>
          
          <TouchableOpacity
            style={styles.demoAccount}
            onPress={() => {
              setEmail('admin@demo.com');
              setPassword('demo123');
            }}>
            <View style={styles.demoAccountInfo}>
              <Text style={styles.demoAccountType}>Admin</Text>
              <Text style={styles.demoAccountEmail}>admin@demo.com</Text>
            </View>
            <Icon name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoAccount}
            onPress={() => {
              setEmail('tenant@demo.com');
              setPassword('demo123');
            }}>
            <View style={styles.demoAccountInfo}>
              <Text style={styles.demoAccountType}>Student</Text>
              <Text style={styles.demoAccountEmail}>tenant@demo.com</Text>
            </View>
            <Icon name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoAccount}
            onPress={() => {
              setEmail('landlord@demo.com');
              setPassword('demo123');
            }}>
            <View style={styles.demoAccountInfo}>
              <Text style={styles.demoAccountType}>Landlord</Text>
              <Text style={styles.demoAccountEmail}>landlord@demo.com</Text>
            </View>
            <Icon name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  loginCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    elevation: 4,
  },
  cardContent: {
    padding: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#2563eb',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signupText: {
    color: '#6b7280',
    fontSize: 14,
  },
  signupLink: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  demoCard: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 16,
    elevation: 2,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  demoSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  demoAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginBottom: 8,
  },
  demoAccountInfo: {
    flex: 1,
  },
  demoAccountType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  demoAccountEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
});
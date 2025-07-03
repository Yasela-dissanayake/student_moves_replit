import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import {Button} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function RegisterScreen({navigation}: any) {
  const handleRegister = () => {
    Alert.alert('Coming Soon', 'Registration feature will be available soon!', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Icon name="person-add" size={64} color="#2563eb" />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Registration feature coming soon! For now, you can use the demo accounts available on the login screen.
        </Text>
        
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          Back to Login
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
  },
});
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {Card, Button, Avatar} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAuth} from '../context/AuthContext';

export default function ProfileScreen({navigation}: any) {
  const {user, logout} = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      title: 'Saved Properties',
      icon: 'favorite',
      onPress: () => navigation.navigate('Saved'),
    },
    {
      title: 'Applications',
      icon: 'assignment',
      onPress: () => Alert.alert('Coming Soon', 'Applications feature coming soon!'),
    },
    {
      title: 'Messages',
      icon: 'message',
      onPress: () => Alert.alert('Coming Soon', 'Messages feature coming soon!'),
    },
    {
      title: 'Settings',
      icon: 'settings',
      onPress: () => Alert.alert('Coming Soon', 'Settings feature coming soon!'),
    },
    {
      title: 'Help & Support',
      icon: 'help',
      onPress: () => Alert.alert('Help', 'For support, contact us at support@studentmoves.com'),
    },
  ];

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.loginPrompt}>
          <Icon name="person-outline" size={64} color="#ccc" />
          <Text style={styles.loginPromptTitle}>Sign In Required</Text>
          <Text style={styles.loginPromptText}>
            Please sign in to access your profile and saved properties
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Login')}
            style={styles.loginButton}>
            Sign In
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar.Text 
          size={80} 
          label={user.name.charAt(0).toUpperCase()} 
          style={styles.avatar}
        />
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <Text style={styles.userType}>{user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}>
            <View style={styles.menuItemLeft}>
              <Icon name={item.icon} size={24} color="#374151" />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {/* App Info */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.infoTitle}>About StudentMoves</Text>
          <Text style={styles.infoText}>
            Your trusted platform for finding quality student accommodation across the UK.
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version:</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          icon="logout"
          textColor="#ef4444"
          style={styles.logoutButton}>
          Sign Out
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 32,
    paddingTop: 50,
  },
  avatar: {
    backgroundColor: '#2563eb',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  userType: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  menuSection: {
    backgroundColor: 'white',
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 16,
    fontWeight: '500',
  },
  infoCard: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  logoutSection: {
    padding: 16,
    paddingBottom: 32,
  },
  logoutButton: {
    borderColor: '#ef4444',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loginPromptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
  },
});
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {Card, Title} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {apiRequest} from '../services/api';

const {width} = Dimensions.get('window');

interface Property {
  id: number;
  title: string;
  description: string;
  address: string;
  city: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  propertyType: string;
}

export default function HomeScreen({navigation}: any) {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProperties();
  }, []);

  const loadFeaturedProperties = async () => {
    try {
      const properties = await apiRequest('/api/properties?limit=5');
      setFeaturedProperties(Array.isArray(properties) ? properties.slice(0, 5) : []);
    } catch (error) {
      console.error('Failed to load properties:', error);
      setFeaturedProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const quickSearchOptions = [
    {title: 'Studios', icon: 'bed', type: 'studio'},
    {title: '1 Bedroom', icon: 'home', type: '1-bed'},
    {title: '2 Bedroom', icon: 'apartment', type: '2-bed'},
    {title: 'Shared', icon: 'group', type: 'shared'},
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.appName}>StudentMoves</Text>
        <Text style={styles.subtitle}>Find your perfect student accommodation</Text>
      </View>

      {/* Quick Search */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Search</Text>
        <View style={styles.quickSearchGrid}>
          {quickSearchOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickSearchItem}
              onPress={() => navigation.navigate('Search', {type: option.type})}>
              <Icon name={option.icon} size={24} color="#2563eb" />
              <Text style={styles.quickSearchText}>{option.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Featured Properties */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Properties</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Properties')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {featuredProperties.map((property) => (
            <TouchableOpacity
              key={property.id}
              style={styles.propertyCard}
              onPress={() => navigation.navigate('PropertyDetails', {propertyId: property.id})}>
              <Card style={styles.card}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{
                      uri: property.images?.[0] || 'https://via.placeholder.com/300x200'
                    }}
                    style={styles.propertyImage}
                    resizeMode="cover"
                  />
                  <View style={styles.priceTag}>
                    <Text style={styles.priceText}>£{property.price}/month</Text>
                  </View>
                </View>
                <Card.Content style={styles.cardContent}>
                  <Title numberOfLines={2} style={styles.propertyTitle}>
                    {property.title}
                  </Title>
                  <View style={styles.locationRow}>
                    <Icon name="location-on" size={16} color="#666" />
                    <Text style={styles.locationText}>{property.city}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Icon name="bed" size={16} color="#666" />
                      <Text style={styles.detailText}>{property.bedrooms} bed</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Icon name="bathtub" size={16} color="#666" />
                      <Text style={styles.detailText}>{property.bathrooms} bath</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Popular Cities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Cities</Text>
        <View style={styles.citiesGrid}>
          {['London', 'Manchester', 'Birmingham', 'Edinburgh'].map((city, index) => (
            <TouchableOpacity
              key={index}
              style={styles.cityItem}
              onPress={() => navigation.navigate('Search', {city})}>
              <Text style={styles.cityText}>{city}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#2563eb',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeText: {
    color: '#e2e8f0',
    fontSize: 16,
  },
  appName: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  subtitle: {
    color: '#e2e8f0',
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  viewAllText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  quickSearchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickSearchItem: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickSearchText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  propertyCard: {
    marginRight: 16,
    width: width * 0.75,
  },
  card: {
    borderRadius: 12,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  priceTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 14,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 12,
  },
  citiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cityItem: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});
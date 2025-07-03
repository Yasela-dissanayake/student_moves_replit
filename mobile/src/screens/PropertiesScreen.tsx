import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import {Card, Searchbar, Chip} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {apiRequest} from '../services/api';

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
  furnished: boolean;
  university: string;
}

export default function PropertiesScreen({navigation}: any) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/api/properties');
      setProperties(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProperties();
    setRefreshing(false);
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = 
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const renderProperty = ({item}: {item: Property}) => (
    <TouchableOpacity
      style={styles.propertyItem}
      onPress={() => navigation.navigate('PropertyDetails', {propertyId: item.id})}>
      <Card style={styles.propertyCard}>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: item.images?.[0] || 'https://via.placeholder.com/300x200'
            }}
            style={styles.propertyImage}
            resizeMode="cover"
          />
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>£{item.price}/month</Text>
          </View>
          {item.furnished && (
            <View style={styles.furnishedTag}>
              <Text style={styles.furnishedText}>Furnished</Text>
            </View>
          )}
        </View>
        
        <Card.Content style={styles.cardContent}>
          <Text style={styles.propertyTitle} numberOfLines={2}>
            {item.title}
          </Text>
          
          <View style={styles.locationRow}>
            <Icon name="location-on" size={16} color="#666" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.address}, {item.city}
            </Text>
          </View>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Icon name="bed" size={16} color="#666" />
              <Text style={styles.detailText}>{item.bedrooms} bed</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="bathtub" size={16} color="#666" />
              <Text style={styles.detailText}>{item.bathrooms} bath</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="home" size={16} color="#666" />
              <Text style={styles.detailText}>{item.propertyType}</Text>
            </View>
          </View>
          
          {item.university && (
            <View style={styles.universityRow}>
              <Icon name="school" size={16} color="#2563eb" />
              <Text style={styles.universityText}>{item.university}</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Properties</Text>
        <Text style={styles.resultCount}>
          {filteredProperties.length} properties found
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search properties..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <FlatList
        data={filteredProperties}
        renderItem={renderProperty}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="search-off" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No properties found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  resultCount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f3f4f6',
  },
  listContainer: {
    padding: 16,
  },
  propertyItem: {
    marginBottom: 16,
  },
  propertyCard: {
    borderRadius: 12,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  priceTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  furnishedTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  furnishedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    marginLeft: 4,
    color: '#6b7280',
    fontSize: 14,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    marginLeft: 4,
    color: '#6b7280',
    fontSize: 13,
  },
  universityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  universityText: {
    marginLeft: 4,
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9ca3af',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
});
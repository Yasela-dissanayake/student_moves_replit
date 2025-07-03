import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import {Card, Button, Chip} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {apiRequest} from '../services/api';
import {useAuth} from '../context/AuthContext';

const {width} = Dimensions.get('window');

interface Property {
  id: number;
  title: string;
  description: string;
  address: string;
  city: string;
  postcode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  propertyType: string;
  furnished: boolean;
  university: string;
  features: string[];
  petsAllowed: boolean;
  smokingAllowed: boolean;
  parkingAvailable: boolean;
  billsIncluded: boolean;
  depositAmount: number;
  availableDate: string;
  epcRating: string;
}

export default function PropertyDetailsScreen({route, navigation}: any) {
  const {propertyId} = route.params;
  const {user} = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadProperty();
  }, [propertyId]);

  const loadProperty = async () => {
    try {
      const data = await apiRequest(`/api/properties/${propertyId}`);
      setProperty(data);
    } catch (error) {
      console.error('Failed to load property:', error);
      Alert.alert('Error', 'Failed to load property details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProperty = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    try {
      if (isSaved) {
        await apiRequest(`/api/saved-properties/${propertyId}`, 'DELETE');
        setIsSaved(false);
      } else {
        await apiRequest('/api/saved-properties', 'POST', {propertyId});
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Failed to save property:', error);
      Alert.alert('Error', 'Failed to save property');
    }
  };

  const handleApply = () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    Alert.alert(
      'Apply for Property',
      'Would you like to apply for this property?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Apply',
          onPress: () => {
            console.log('Apply for property:', propertyId);
          },
        },
      ]
    );
  };

  const handleContact = () => {
    Alert.alert(
      'Contact Options',
      'How would you like to contact about this property?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Call', onPress: () => Linking.openURL('tel:+44123456789')},
        {text: 'Email', onPress: () => Linking.openURL('mailto:info@studentmoves.com')},
      ]
    );
  };

  if (loading || !property) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Image Gallery */}
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}>
          {(property.images || []).map((image, index) => (
            <Image
              key={index}
              source={{uri: image || 'https://via.placeholder.com/400x300'}}
              style={styles.propertyImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        
        <View style={styles.imageOverlay}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveProperty}>
            <Icon 
              name={isSaved ? "favorite" : "favorite-border"} 
              size={24} 
              color={isSaved ? "#ef4444" : "white"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Property Details */}
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.propertyTitle}>{property.title}</Text>
          <Text style={styles.priceText}>£{property.price}/month</Text>
        </View>

        <View style={styles.locationSection}>
          <Icon name="location-on" size={18} color="#666" />
          <Text style={styles.addressText}>
            {property.address}, {property.city}, {property.postcode}
          </Text>
        </View>

        {/* Property Features */}
        <Card style={styles.featuresCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Property Details</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <Icon name="bed" size={20} color="#2563eb" />
                <Text style={styles.featureText}>{property.bedrooms} Bedrooms</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="bathtub" size={20} color="#2563eb" />
                <Text style={styles.featureText}>{property.bathrooms} Bathrooms</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="home" size={20} color="#2563eb" />
                <Text style={styles.featureText}>{property.propertyType}</Text>
              </View>
              {property.furnished && (
                <View style={styles.featureItem}>
                  <Icon name="chair" size={20} color="#2563eb" />
                  <Text style={styles.featureText}>Furnished</Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Description */}
        <Card style={styles.descriptionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{property.description}</Text>
          </Card.Content>
        </Card>

        {/* Features & Amenities */}
        {property.features && property.features.length > 0 && (
          <Card style={styles.amenitiesCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Features & Amenities</Text>
              <View style={styles.chipsContainer}>
                {property.features.map((feature, index) => (
                  <Chip key={index} style={styles.featureChip}>
                    {feature}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Additional Info */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Deposit:</Text>
              <Text style={styles.infoValue}>£{property.depositAmount}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bills:</Text>
              <Text style={styles.infoValue}>
                {property.billsIncluded ? 'Included' : 'Not Included'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Available:</Text>
              <Text style={styles.infoValue}>
                {new Date(property.availableDate).toLocaleDateString()}
              </Text>
            </View>
            {property.epcRating && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>EPC Rating:</Text>
                <Text style={styles.infoValue}>{property.epcRating}</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={handleContact}
          style={[styles.actionButton, styles.contactButton]}
          icon="phone">
          Contact
        </Button>
        <Button
          mode="contained"
          onPress={handleApply}
          style={[styles.actionButton, styles.applyButton]}
          icon="send">
          Apply Now
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  propertyImage: {
    width,
    height: 300,
  },
  imageOverlay: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  saveButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    padding: 20,
  },
  headerSection: {
    marginBottom: 16,
  },
  propertyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  addressText: {
    flex: 1,
    marginLeft: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  featuresCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 8,
    color: '#374151',
    fontSize: 14,
  },
  descriptionCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  descriptionText: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
  },
  amenitiesCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  infoCard: {
    marginBottom: 20,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  infoValue: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  contactButton: {
    borderColor: '#2563eb',
  },
  applyButton: {
    backgroundColor: '#2563eb',
  },
});
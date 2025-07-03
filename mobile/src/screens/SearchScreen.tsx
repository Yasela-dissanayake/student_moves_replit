import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Searchbar,
  Button,
  Card,
  Chip,
  SegmentedButtons,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function SearchScreen({navigation, route}: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(route?.params?.city || '');
  const [propertyType, setPropertyType] = useState(route?.params?.type || '');
  const [priceRange, setPriceRange] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [furnished, setFurnished] = useState('');
  const [billsIncluded, setBillsIncluded] = useState('');

  const cities = ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Leeds', 'Bristol'];
  
  const propertyTypes = [
    {value: 'studio', label: 'Studio'},
    {value: 'house', label: 'House'},
    {value: 'flat', label: 'Flat'},
    {value: 'shared', label: 'Shared'},
  ];

  const priceRanges = [
    {value: '0-400', label: 'Under £400'},
    {value: '400-600', label: '£400 - £600'},
    {value: '600-800', label: '£600 - £800'},
    {value: '800-1000', label: '£800 - £1000'},
    {value: '1000+', label: 'Over £1000'},
  ];

  const bedroomOptions = [
    {value: '1', label: '1 Bed'},
    {value: '2', label: '2 Beds'},
    {value: '3', label: '3 Beds'},
    {value: '4+', label: '4+ Beds'},
  ];

  const handleSearch = () => {
    const searchParams = {
      query: searchQuery,
      city: selectedCity,
      propertyType,
      priceRange,
      bedrooms,
      furnished,
      billsIncluded,
    };
    
    navigation.navigate('Properties', {searchParams});
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCity('');
    setPropertyType('');
    setPriceRange('');
    setBedrooms('');
    setFurnished('');
    setBillsIncluded('');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search Properties</Text>
        <Text style={styles.headerSubtitle}>Find your perfect student accommodation</Text>
      </View>

      {/* Search Bar */}
      <Card style={styles.searchCard}>
        <Card.Content>
          <Searchbar
            placeholder="Search properties, areas, universities..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            icon="search"
          />
        </Card.Content>
      </Card>

      {/* Location Filter */}
      <Card style={styles.filterCard}>
        <Card.Content>
          <Text style={styles.filterTitle}>Location</Text>
          <View style={styles.chipContainer}>
            {cities.map((city) => (
              <Chip
                key={city}
                selected={selectedCity === city}
                onPress={() => setSelectedCity(selectedCity === city ? '' : city)}
                style={styles.chip}>
                {city}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Property Type Filter */}
      <Card style={styles.filterCard}>
        <Card.Content>
          <Text style={styles.filterTitle}>Property Type</Text>
          <View style={styles.chipContainer}>
            {propertyTypes.map((type) => (
              <Chip
                key={type.value}
                selected={propertyType === type.value}
                onPress={() => setPropertyType(propertyType === type.value ? '' : type.value)}
                style={styles.chip}>
                {type.label}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Price Range Filter */}
      <Card style={styles.filterCard}>
        <Card.Content>
          <Text style={styles.filterTitle}>Price Range (per month)</Text>
          <View style={styles.chipContainer}>
            {priceRanges.map((range) => (
              <Chip
                key={range.value}
                selected={priceRange === range.value}
                onPress={() => setPriceRange(priceRange === range.value ? '' : range.value)}
                style={styles.chip}>
                {range.label}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Bedrooms Filter */}
      <Card style={styles.filterCard}>
        <Card.Content>
          <Text style={styles.filterTitle}>Bedrooms</Text>
          <View style={styles.chipContainer}>
            {bedroomOptions.map((option) => (
              <Chip
                key={option.value}
                selected={bedrooms === option.value}
                onPress={() => setBedrooms(bedrooms === option.value ? '' : option.value)}
                style={styles.chip}>
                {option.label}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Additional Filters */}
      <Card style={styles.filterCard}>
        <Card.Content>
          <Text style={styles.filterTitle}>Additional Filters</Text>
          
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Furnished</Text>
            <SegmentedButtons
              value={furnished}
              onValueChange={setFurnished}
              buttons={[
                {value: '', label: 'Any'},
                {value: 'yes', label: 'Yes'},
                {value: 'no', label: 'No'},
              ]}
              style={styles.segmentedButtons}
            />
          </View>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Bills Included</Text>
            <SegmentedButtons
              value={billsIncluded}
              onValueChange={setBillsIncluded}
              buttons={[
                {value: '', label: 'Any'},
                {value: 'yes', label: 'Yes'},
                {value: 'no', label: 'No'},
              ]}
              style={styles.segmentedButtons}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Popular Searches */}
      <Card style={styles.popularCard}>
        <Card.Content>
          <Text style={styles.filterTitle}>Popular Searches</Text>
          <View style={styles.popularSearches}>
            <TouchableOpacity
              style={styles.popularItem}
              onPress={() => {
                setSelectedCity('London');
                setPropertyType('studio');
              }}>
              <Icon name="trending-up" size={20} color="#2563eb" />
              <Text style={styles.popularText}>London Studios</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.popularItem}
              onPress={() => {
                setSelectedCity('Manchester');
                setBedrooms('2');
              }}>
              <Icon name="trending-up" size={20} color="#2563eb" />
              <Text style={styles.popularText}>Manchester 2 Bed</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.popularItem}
              onPress={() => {
                setPriceRange('400-600');
                setFurnished('yes');
              }}>
              <Icon name="trending-up" size={20} color="#2563eb" />
              <Text style={styles.popularText}>Furnished Under £600</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={clearFilters}
          style={styles.clearButton}
          icon="refresh">
          Clear Filters
        </Button>
        
        <Button
          mode="contained"
          onPress={handleSearch}
          style={styles.searchButton}
          icon="search">
          Search Properties
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
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  searchCard: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f3f4f6',
  },
  filterCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  toggleContainer: {
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  segmentedButtons: {
    marginVertical: 4,
  },
  popularCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    elevation: 2,
  },
  popularSearches: {
    gap: 12,
  },
  popularItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  popularText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    borderColor: '#6b7280',
  },
  searchButton: {
    flex: 2,
    backgroundColor: '#2563eb',
  },
});
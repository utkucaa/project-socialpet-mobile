import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Clock, Mail, MapPin, Phone, Search, Star } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

// Type definitions for the API response
type Photo = {
  height: number;
  width: number;
  photo_reference: string;
  html_attributions: string[];
  url?: string;
};

type Review = {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url: string;
};

type Business = {
  place_id: string;
  name: string;
  type: 'Veteriner' | 'Petshop';
  rating: number;
  vicinity: string;
  formatted_address?: string;
  city?: string;
  district?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  photos?: Photo[];
  location?: {
    lat: number;
    lng: number;
  };
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  services?: string[];
  reviews?: Review[];
  website?: string;
  mainPhotoUrl?: string;
};

type City = {
  il_adi: string;
  plaka_kodu: string;
  ilceler: District[];
};

type District = {
  ilce_adi: string;
  plaka_kodu: string;
  ilce_kodu: string;
  il_adi: string;
};

// API service functions
const fetchBusinessesByLocation = async (
  type: 'all' | 'Veteriner' | 'Petshop',
  city: string,
  district?: string
): Promise<Business[]> => {
  try {
    let endpoint: string;
    let params: Record<string, string> = {
      city: city,
      radius: '5000',
    };

    if (district) {
      params.district = district;
    }

    if (type === 'all') {
      endpoint = '/api/v1/places/pet-places-by-location';
    } else {
      endpoint = '/api/v1/places/nearby-by-location';
      params.type = type === 'Veteriner' ? 'veterinary_care' : 'pet_store';
    }

    // Build URL with proper encoding for Turkish characters
    // URLSearchParams automatically handles the encoding of special characters like 'Ç'
    // This ensures proper UTF-8 encoding (%C3%87 for 'Ç') instead of incorrect encoding
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    
    const url = `http://localhost:8080${endpoint}?${queryParams.toString()}`;
    console.log('API Request URL:', url); // Log the URL for debugging
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`API error: ${data.status}`);
    }

    return data.results.map((place: any) => transformPlaceData(place, type));
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return [];
  }
};

const fetchPlaceDetails = async (placeId: string): Promise<Business | null> => {
  try {
    const url = `http://localhost:8080/api/v1/places/details?placeId=${placeId}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`API error: ${data.status}`);
    }

    return transformPlaceDetailData(data.result);
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
};

// Helper function to transform place data
const transformPlaceData = (place: any, businessType: 'all' | 'Veteriner' | 'Petshop'): Business => {
  // Determine the business type based on types array or parameter
  let type: 'Veteriner' | 'Petshop';
  if (place.types && place.types.includes('veterinary_care')) {
    type = 'Veteriner';
  } else if (place.types && place.types.includes('pet_store')) {
    type = 'Petshop';
  } else {
    type = businessType === 'Veteriner' ? 'Veteriner' : 'Petshop';
  }

  // Extract city and district from vicinity
  const addressParts = place.vicinity ? place.vicinity.split(', ') : [];
  const district = addressParts.length > 1 ? addressParts[addressParts.length - 2] : '';
  const city = addressParts.length > 0 ? addressParts[addressParts.length - 1] : '';

  // Create a placeholder image URL if no photos are available
  const mainPhotoUrl = place.photos && place.photos.length > 0
    ? `http://localhost:8080/api/v1/places/photo?photoReference=${place.photos[0].photo_reference}&maxWidth=800`
    : 'https://via.placeholder.com/800x600?text=No+Image+Available';

  return {
    place_id: place.place_id,
    name: place.name,
    type,
    rating: place.rating || 0,
    vicinity: place.vicinity || '',
    city,
    district,
    location: place.geometry?.location,
    opening_hours: place.opening_hours,
    mainPhotoUrl,
  };
};

// Helper function to transform place detail data
const transformPlaceDetailData = (place: any): Business => {
  // Extract city and district from formatted address
  const addressParts = place.formatted_address ? place.formatted_address.split(', ') : [];
  const district = addressParts.length > 1 ? addressParts[addressParts.length - 3] : '';
  const city = addressParts.length > 2 ? addressParts[addressParts.length - 2] : '';

  // Determine the business type based on types array
  let type: 'Veteriner' | 'Petshop';
  if (place.types && place.types.includes('veterinary_care')) {
    type = 'Veteriner';
  } else {
    type = 'Petshop';
  }

  // Create service categories based on available types
  const services = place.types
    ? place.types
        .filter((t: string) => !['point_of_interest', 'establishment', 'health', 'store'].includes(t))
        .map((t: string) => {
          switch (t) {
            case 'veterinary_care':
              return 'Veteriner Hizmetleri';
            case 'pet_store':
              return 'Evcil Hayvan Ürünleri';
            default:
              return t.replace('_', ' ');
          }
        })
    : [];

  // Create a photos array with URLs
  const photos = place.photos
    ? place.photos.map((photo: Photo) => ({
        ...photo,
        url: `http://localhost:8080/api/v1/places/photo?photoReference=${photo.photo_reference}&maxWidth=800`,
      }))
    : [];

  // Create a mainPhotoUrl
  const mainPhotoUrl = photos.length > 0
    ? photos[0].url
    : 'https://via.placeholder.com/800x600?text=No+Image+Available';

  return {
    place_id: place.place_id,
    name: place.name,
    type,
    rating: place.rating || 0,
    vicinity: place.vicinity || '',
    formatted_address: place.formatted_address,
    city,
    district,
    formatted_phone_number: place.formatted_phone_number,
    international_phone_number: place.international_phone_number,
    location: place.geometry?.location,
    opening_hours: place.opening_hours,
    services,
    reviews: place.reviews || [],
    website: place.website,
    photos,
    mainPhotoUrl,
  };
};

export default function VeterinerPetshop() {
  const [selectedType, setSelectedType] = useState<'Veteriner' | 'Petshop'>('Veteriner');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBusinessDetail, setSelectedBusinessDetail] = useState<Business | null>(null);
  const [searchInitiated, setSearchInitiated] = useState<boolean>(false);

  // Fix Leaflet default icon issue
  useEffect(() => {
    // This is a workaround for the missing default icon in Leaflet when using webpack
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  // Fetch cities and districts from il-ilce.json
  useEffect(() => {
    const fetchCitiesAndDistricts = async () => {
      try {
        const response = await fetch('/assets/il-ilce.json');
        const data = await response.json();
        setCities(data.data);
      } catch (error) {
        console.error('Error fetching cities and districts:', error);
        setError('İl ve ilçe verileri yüklenirken bir hata oluştu.');
      }
    };

    fetchCitiesAndDistricts();
  }, []);

  // Update districts when city changes
  useEffect(() => {
    if (selectedCity) {
      const city = cities.find(city => city.il_adi === selectedCity);
      if (city) {
        setDistricts(city.ilceler);
      } else {
        setDistricts([]);
      }
    } else {
      setDistricts([]);
    }
  }, [selectedCity, cities]);

  // Function to handle search button click
  const handleSearch = async () => {
    if (!selectedCity || !selectedDistrict) {
      setError('Lütfen şehir ve ilçe seçiniz.');
      return;
    }

    setSearchInitiated(true);
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchBusinessesByLocation(
        selectedType,
        selectedCity,
        selectedDistrict
      );
      setBusinesses(data);
    } catch (err) {
      console.error('Error fetching businesses:', err);
      setError('İşletme verileri yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch business details when a business is selected
  useEffect(() => {
    const fetchBusinessDetail = async () => {
      if (!selectedBusiness) {
        setSelectedBusinessDetail(null);
        return;
      }

      try {
        const detail = await fetchPlaceDetails(selectedBusiness.place_id);
        setSelectedBusinessDetail(detail);
      } catch (err) {
        console.error('Error fetching business details:', err);
        // If detail fetching fails, use the basic data we already have
        setSelectedBusinessDetail(selectedBusiness);
      }
    };

    fetchBusinessDetail();
  }, [selectedBusiness]);

  // Filter businesses (this is a fallback, main filtering is done by the API)
  const filteredBusinesses = useMemo(() => {
    return businesses;
  }, [businesses]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-purple-300 py-16">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1587560699334-cc4ff634909a?w=1920&auto=format&fit=crop"
            alt="Background"
            className="h-full w-full object-cover opacity-10"
          />
        </div>
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Veteriner ve Petshop Rehberi
            </h1>
            <p className="text-xl text-purple-100 mb-8">
              Size en yakın veteriner ve petshopları keşfedin
            </p>
            
            {/* Selection Bar */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    İşletme Tipi
                  </label>
                  <select
                    className="w-full rounded-lg border-gray-300 focus:border-orange-300 focus:ring-orange-300"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as any)}
                  >
                    <option value="Veteriner">Veteriner</option>
                    <option value="Petshop">Petshop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şehir
                  </label>
                  <select
                    className="w-full rounded-lg border-gray-300 focus:border-orange-300 focus:ring-orange-300"
                    value={selectedCity}
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      setSelectedDistrict('');
                    }}
                  >
                    <option value="">Tüm Şehirler</option>
                    {cities.map(city => (
                      <option key={city.plaka_kodu} value={city.il_adi}>{city.il_adi}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    İlçe
                  </label>
                  <select
                    className="w-full rounded-lg border-gray-300 focus:border-orange-300 focus:ring-orange-300"
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    disabled={!selectedCity}
                  >
                    <option value="">İlçe Seçiniz</option>
                    {districts.map(district => (
                      <option key={district.ilce_kodu} value={district.ilce_adi}>{district.ilce_adi}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ara
                  </label>
                  <button
                    onClick={handleSearch}
                    disabled={!selectedCity || !selectedDistrict}
                    className={`w-full flex items-center justify-center rounded-lg px-4 py-2 text-white ${
                      !selectedCity || !selectedDistrict
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-purple-300 hover:bg-purple-400'
                    }`}
                  >
                    <Search className="mr-2 h-5 w-5" />
                    <span>Ara</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Results Summary */}
        {searchInitiated && (
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isLoading ? 'Yükleniyor...' : `${filteredBusinesses.length} sonuç bulundu`}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedCity && `${selectedCity}`}
                {selectedDistrict && `, ${selectedDistrict}`}
                {` - ${selectedType}`}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-300"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && searchInitiated && filteredBusinesses.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Sonuç Bulunamadı</h3>
            <p className="text-gray-600">
              Lütfen farklı bir şehir veya işletme tipi seçin.
            </p>
          </div>
        )}

        {/* Initial State - Before Search */}
        {!searchInitiated && !isLoading && !error && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Arama Yapınız</h3>
            <p className="text-gray-600">
              Lütfen şehir ve ilçe seçerek arama yapınız.
            </p>
          </div>
        )}

        {/* Results */}
        {!isLoading && searchInitiated && filteredBusinesses.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBusinesses.map((business) => (
              <BusinessCard
                key={business.place_id}
                business={business}
                onClick={() => setSelectedBusiness(business)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Business Detail Modal */}
      {selectedBusinessDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white">
            <BusinessDetail
              business={selectedBusinessDetail}
              onClose={() => {
                setSelectedBusiness(null);
                setSelectedBusinessDetail(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BusinessCard({ business, onClick }: { business: Business; onClick: () => void }) {
  return (
    <div className="group overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg">
      <div className="relative h-48 overflow-hidden">
        <img
          src={business.mainPhotoUrl || 'https://via.placeholder.com/800x600?text=No+Image+Available'}
          alt={business.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute top-4 right-4 rounded-full bg-white px-3 py-1 text-sm font-medium shadow-sm">
          {business.type}
        </div>
      </div>
      <div className="p-6">
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">{business.name}</h3>
            {business.rating > 0 && (
              <div className="flex items-center rounded-full bg-purple-50 px-2 py-1">
                <Star className="mr-1 h-4 w-4 fill-orange-300 text-purple-300" />
                <span className="font-medium text-purple-300">{business.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          {business.opening_hours?.open_now !== undefined && (
            <p className="mt-1 text-sm text-gray-500">
              {business.opening_hours.open_now ? 'Şu anda açık' : 'Kapalı'}
            </p>
          )}
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4 text-gray-400" />
            <span>{business.district ? `${business.district}, ${business.city}` : business.vicinity}</span>
          </div>
          {business.formatted_phone_number && (
            <div className="flex items-center">
              <Phone className="mr-2 h-4 w-4 text-gray-400" />
              <a href={`tel:${business.formatted_phone_number}`} className="hover:text-purple-300">
                {business.formatted_phone_number}
              </a>
            </div>
          )}
        </div>

        {business.services && business.services.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {business.services.slice(0, 3).map((service, index) => (
              <span
                key={index}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              >
                {service}
              </span>
            ))}
            {business.services.length > 3 && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                +{business.services.length - 3}
              </span>
            )}
          </div>
        )}
        
        <button
          onClick={onClick}
          className="mt-6 w-full rounded-lg bg-purple-300 px-4 py-2 text-white transition-colors hover:bg-purple-400"
        >
          Detayları Gör
        </button>
      </div>
    </div>
  );
}

function BusinessDetail({ business, onClose }: { business: Business; onClose: () => void }) {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [failedProfileImages, setFailedProfileImages] = useState<Set<string>>(new Set());
  
  // Default profile image for reviews
  const DEFAULT_PROFILE_IMAGE = 'https://via.placeholder.com/40x40?text=👤';
  
  useEffect(() => {
    if (business.location) {
      setCenter([business.location.lat, business.location.lng]);
    }
  }, [business]);

  // Handle image loading error
  const handleProfileImageError = (reviewId: string) => {
    setFailedProfileImages(prev => new Set(prev).add(reviewId));
  };

  return (
    <div>
      <div className="relative h-64">
        <img
          src={business.mainPhotoUrl || 'https://via.placeholder.com/800x600?text=No+Image+Available'}
          alt={business.name}
          className="h-full w-full object-cover"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-white/80 p-2 backdrop-blur-sm transition-colors hover:bg-white"
        >
          <span className="sr-only">Kapat</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{business.name}</h2>
            {business.rating > 0 && (
              <div className="flex items-center rounded-full bg-purple-50 px-3 py-1">
                <Star className="mr-1 h-5 w-5 fill-orange-300 text-purple-300" />
                <span className="font-medium text-purple-300">{business.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <p className="mt-1 text-gray-500">{business.type}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-lg font-semibold">İşletme Bilgileri</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <MapPin className="mr-3 h-5 w-5 text-gray-400" />
                <span>{business.formatted_address || business.vicinity}</span>
              </div>
              {business.formatted_phone_number && (
                <div className="flex items-center">
                  <Phone className="mr-3 h-5 w-5 text-gray-400" />
                  <a href={`tel:${business.formatted_phone_number}`} className="hover:text-purple-300">
                    {business.formatted_phone_number}
                  </a>
                </div>
              )}
              {business.website && (
                <div className="flex items-center">
                  <Mail className="mr-3 h-5 w-5 text-gray-400" />
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="hover:text-purple-300 truncate max-w-[250px]">
                    {business.website}
                  </a>
                </div>
              )}
              {business.opening_hours?.weekday_text && (
                <div className="flex">
                  <Clock className="mr-3 h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    {business.opening_hours.weekday_text.map((day, index) => (
                      <div key={index} className="text-sm">
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {business.services && business.services.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-4 text-lg font-semibold">Hizmetler</h3>
                <div className="flex flex-wrap gap-2">
                  {business.services.map((service, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {center && (
              <div className="mt-6">
                <h3 className="mb-4 text-lg font-semibold">Konum</h3>
                <div className="h-[200px] rounded-xl overflow-hidden">
                  <MapContainer
                    center={center}
                    zoom={15}
                    className="h-full w-full"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={center}>
                      <Popup>{business.name}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}
          </div>

          <div>
            {business.photos && business.photos.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-4 text-lg font-semibold">Fotoğraflar</h3>
                <div className="grid grid-cols-2 gap-2">
                  {business.photos.slice(0, 6).map((photo, index) => (
                    <div key={index} className="h-32 rounded-lg overflow-hidden">
                      <img 
                        src={photo.url}
                        alt={`${business.name} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Değerlendirmeler</h3>
                <button className="rounded-lg bg-purple-300 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400">
                  Değerlendirme Yap
                </button>
              </div>
            </div>

            {business.reviews && business.reviews.length > 0 ? (
              <div className="space-y-4">
                {business.reviews.map((review, index) => (
                  <div key={index} className="rounded-xl border p-4">
                    <div className="mb-3 flex items-center">
                      <img
                        src={failedProfileImages.has(review.id) ? DEFAULT_PROFILE_IMAGE : (review.profile_photo_url || DEFAULT_PROFILE_IMAGE)}
                        alt={review.author_name}
                        className="h-10 w-10 rounded-full object-cover"
                        onError={() => handleProfileImageError(review.id)}
                      />
                      <div className="ml-3">
                        <div className="font-medium">{review.author_name}</div>
                        <div className="flex items-center">
                          <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="mr-2">{review.rating}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(review.time * 1000).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600">{review.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Henüz değerlendirme bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
interface BreedDetectionResult {
  type: string;
  breed: string;
  confidence?: number;
}

// Mock cat breed detection function (can be replaced with real API)
export const analyzeCatBreed = async (imageData: string): Promise<BreedDetectionResult> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const catBreeds = [
    'Van Kedisi',
    'Ankara Kedisi', 
    'British Shorthair',
    'Persian',
    'Maine Coon',
    'Siamese',
    'Ragdoll',
    'Scottish Fold',
    'Russian Blue',
    'Bengal'
  ];
  
  const randomBreed = catBreeds[Math.floor(Math.random() * catBreeds.length)];
  const confidence = Math.floor(Math.random() * 30) + 70; // 70-100 arası
  
  return {
    type: 'Kedi',
    breed: randomBreed,
    confidence: confidence
  };
};

// Mock dog breed detection function (can be replaced with real API)
export const analyzeDogBreed = async (imageData: string): Promise<BreedDetectionResult> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const dogBreeds = [
    'Golden Retriever',
    'Labrador',
    'German Shepherd', 
    'Bulldog',
    'Poodle',
    'Husky',
    'Beagle',
    'Rottweiler',
    'Yorkshire Terrier',
    'Chihuahua',
    'Kangal',
    'Akbaş'
  ];
  
  const randomBreed = dogBreeds[Math.floor(Math.random() * dogBreeds.length)];
  const confidence = Math.floor(Math.random() * 30) + 70; // 70-100 arası
  
  return {
    type: 'Köpek',
    breed: randomBreed,
    confidence: confidence
  };
};

// Generic breed detection function
export const detectBreed = async (
  imageData: string, 
  animalType: 'cat' | 'dog'
): Promise<BreedDetectionResult> => {
  if (animalType === 'cat') {
    return analyzeCatBreed(imageData);
  } else {
    return analyzeDogBreed(imageData);
  }
};

export default {
  analyzeCatBreed,
  analyzeDogBreed,
  detectBreed
}; 
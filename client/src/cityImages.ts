// Direct imports of city images
import londonImg from './assets/images/london.jpg';
import manchesterImg from './assets/images/manchester.jpg';
import birminghamImg from './assets/images/birmingham.jpg';
import leedsImg from './assets/images/leeds.jpg';
import liverpoolImg from './assets/images/liverpool.jpg';

// Export all images for direct use
export { 
  londonImg, 
  manchesterImg, 
  birminghamImg, 
  leedsImg, 
  liverpoolImg 
};

// Export a mapping object for easy access
export const CITY_IMAGES = {
  'London': londonImg,
  'Manchester': manchesterImg,
  'Birmingham': birminghamImg,
  'Leeds': leedsImg,
  'Liverpool': liverpoolImg,
  'default': londonImg
};
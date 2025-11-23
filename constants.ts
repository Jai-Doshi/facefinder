export const APP_GRADIENT = "bg-gradient-to-br from-brand-primary to-brand-secondary";
export const APP_TEXT_GRADIENT = "bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-secondary font-bold";

// Admin Theme Colors
export const ADMIN_GRADIENT = "bg-gradient-to-br from-[#4a00e0] to-[#8e2de2]";
export const ADMIN_TEXT_GRADIENT = "bg-clip-text text-transparent bg-gradient-to-r from-[#4a00e0] to-[#8e2de2]";

export const MOCK_RESULTS_DATA = [
  { id: '1', imageUrl: 'https://picsum.photos/id/64/400/600', confidence: 98, isSaved: false },
  { id: '2', imageUrl: 'https://picsum.photos/id/91/400/600', confidence: 94, isSaved: false },
  { id: '3', imageUrl: 'https://picsum.photos/id/129/400/600', confidence: 89, isSaved: false },
  { id: '4', imageUrl: 'https://picsum.photos/id/177/400/600', confidence: 82, isSaved: false },
  { id: '5', imageUrl: 'https://picsum.photos/id/203/400/600', confidence: 76, isSaved: false },
  { id: '6', imageUrl: 'https://picsum.photos/id/331/400/600', confidence: 72, isSaved: false },
];

export const MOCK_GALLERY_DATA = [
  { id: '101', imageUrl: 'https://picsum.photos/id/449/400/600', confidence: 99, isSaved: true },
  { id: '102', imageUrl: 'https://picsum.photos/id/450/400/600', confidence: 95, isSaved: true },
  { id: '103', imageUrl: 'https://picsum.photos/id/551/400/600', confidence: 91, isSaved: true },
];

export const MOCK_ADMIN_ALL_IMAGES = [
  ...MOCK_RESULTS_DATA.map(i => ({...i, category: 'Portrait', uploadedAt: '2m ago'})),
  ...MOCK_GALLERY_DATA.map(i => ({...i, category: 'Candid', uploadedAt: '1h ago'})),
  { id: '201', imageUrl: 'https://picsum.photos/id/1005/400/600', confidence: 0, isSaved: false, category: 'Landscape', uploadedAt: '3h ago' },
  { id: '202', imageUrl: 'https://picsum.photos/id/1011/400/600', confidence: 0, isSaved: false, category: 'Portrait', uploadedAt: '5h ago' },
  { id: '203', imageUrl: 'https://picsum.photos/id/1027/400/600', confidence: 0, isSaved: false, category: 'Selfie', uploadedAt: '1d ago' },
  { id: '204', imageUrl: 'https://picsum.photos/id/106/400/600', confidence: 0, isSaved: false, category: 'Portrait', uploadedAt: '1d ago' },
];

export const MOCK_ADMIN_STATS = [
  { label: 'Total Images', value: '45.2k', change: '+12%', isPositive: true },
  { label: 'Active Users', value: '8,942', change: '+5%', isPositive: true },
  { label: 'Pending Review', value: '12', change: '-2', isPositive: true },
  { label: 'Server Load', value: '34%', change: '+4%', isPositive: false },
];
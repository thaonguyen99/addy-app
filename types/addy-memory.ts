export type MemoryImageSourceType = 'quick_snap' | 'uploaded';

export type AddyMemoryImage = {
  id: string;
  uri: string;
  sourceType: MemoryImageSourceType;
  createdAt: string;
};

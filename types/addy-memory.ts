export type MemoryImageSourceType = 'quick_snap' | 'uploaded';

export type AddyMemoryImage = {
  id: string;
  uri: string;
  sourceType: MemoryImageSourceType;
  /** When it was added to drafts (sorts the draft tray). */
  createdAt: string;
  /** When the photo was taken, from its EXIF — gallery picks only. */
  takenAt?: string;
};

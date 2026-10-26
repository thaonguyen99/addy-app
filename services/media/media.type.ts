export type MediaUploadResult = {
  imageUrl: string;
  imagePublicId: string;
};

export type MediaUploadMultipleResult = {
  images: MediaUploadResult[];
};

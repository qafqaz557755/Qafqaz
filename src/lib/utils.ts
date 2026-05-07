import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getYoutubeId = (url: string) => {
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[1].length === 11) ? match[1] : null;
};

export const isCloudinaryVideo = (url: string) => {
  return url.toLowerCase().includes('cloudinary.com') && 
    (url.toLowerCase().includes('/video/upload/') || 
     url.toLowerCase().endsWith('.mp4') || 
     url.toLowerCase().endsWith('.webm') || 
     url.toLowerCase().endsWith('.mov'));
};

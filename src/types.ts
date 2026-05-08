export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  discountPrice?: number;
  image: string;
  images?: string[];
  gallery?: string[];
  description?: string;
  stock?: number;
  videoUrl?: string;
  logoRequired?: boolean;
  isHidden?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

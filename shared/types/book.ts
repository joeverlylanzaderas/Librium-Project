// shared/types/book.ts
export interface Author {
  id: number;
  name: string;
  biography: string | null;
  nationality: string | null;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export interface Department {
  id: number;
  name: string;
  description: string | null;
}

export interface Book {
  id: number;
  title: string;
  isbn: string;
  author: Author;
  category: Category | null;
  department: Department | null;
  available: boolean;
  is_active: boolean;
  cover_image: string | null;
  description: string | null;
  publication_year: number;
}

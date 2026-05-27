// shared/types/user.ts
export type UserRole = 'admin' | 'librarian' | 'member';

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
  profile: UserProfile;
}

export interface UserProfile {
  id: number;
  profile_picture: string | null;
  phone_number: string;
  address: string;
  bio: string;
  birthday: string | null;
  sex: string;
  department: number | null;
  department_name: string | null;
  school_id: string;
  program: string;
  year_level: number | null;
  section: string;
  position: string;
}

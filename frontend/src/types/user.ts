export interface User {
  id: number;
  username: string;
  institute_email: string;
  roll_number: string;
  branch: string;
  hostel: string;
  gender: string;
  phone_number?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
}

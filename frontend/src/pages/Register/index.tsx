import React from 'react';
import { AuthPortal } from '@/components/auth/AuthPortal';

export const Register: React.FC = () => {
  return <AuthPortal initialMode="register" />;
};

export default Register;

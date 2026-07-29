import React from 'react';
import { AuthPortal } from '@/components/auth/AuthPortal';

export const Login: React.FC = () => {
  return <AuthPortal initialMode="login" />;
};

export default Login;

import React from 'react';
import { AuthPortal } from '@/components/auth/AuthPortal';

export const Home: React.FC = () => {
  return <AuthPortal initialMode="login" />;
};

export default Home;

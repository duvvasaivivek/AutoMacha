import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

interface PageTransitionProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -10,
  },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3,
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children, title, className = '' }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={`w-full flex-1 flex flex-col ${className}`}
    >
      {title && (
        <Helmet>
          <title>{title} | AutoMacha</title>
        </Helmet>
      )}
      {children}
    </motion.div>
  );
};

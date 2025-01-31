import React from 'react';
import { motion } from 'framer-motion';

const DurationDisplay = ({ months }) => {
  return (
    <motion.div 
      className="w-full rounded-lg bg-muted/20 p-6 flex flex-col items-center justify-center space-y-2"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 25,
        delay: 0.2 
      }}
    >
      <motion.div 
        className="text-4xl font-bold text-primary"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30,
          delay: 0.4
        }}
      >
        {months}
      </motion.div>
      <motion.div 
        className="text-sm text-muted-foreground"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30,
          delay: 0.5
        }}
      >
        {months === 1 ? 'month' : 'months'} sublease
      </motion.div>
    </motion.div>
  );
};

export default DurationDisplay;
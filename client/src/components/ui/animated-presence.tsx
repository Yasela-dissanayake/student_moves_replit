import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface AnimatedPresenceProps {
  children: React.ReactNode;
  isVisible?: boolean;
  variants?: Variants;
  className?: string;
}

export const FadeIn: React.FC<AnimatedPresenceProps> = ({
  children,
  isVisible = true,
  className = "",
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && isLoaded && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={fadeVariants}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const SlideIn: React.FC<AnimatedPresenceProps & { direction?: 'left' | 'right' | 'up' | 'down' }> = ({
  children,
  isVisible = true,
  className = "",
  direction = 'up'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const directionVariants = {
    left: {
      hidden: { x: -20, opacity: 0 },
      visible: { x: 0, opacity: 1, transition: { duration: 0.3 } },
      exit: { x: -20, opacity: 0, transition: { duration: 0.2 } }
    },
    right: {
      hidden: { x: 20, opacity: 0 },
      visible: { x: 0, opacity: 1, transition: { duration: 0.3 } },
      exit: { x: 20, opacity: 0, transition: { duration: 0.2 } }
    },
    up: {
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
      exit: { y: 20, opacity: 0, transition: { duration: 0.2 } }
    },
    down: {
      hidden: { y: -20, opacity: 0 },
      visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
      exit: { y: -20, opacity: 0, transition: { duration: 0.2 } }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && isLoaded && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={directionVariants[direction]}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const ScaleIn: React.FC<AnimatedPresenceProps> = ({
  children,
  isVisible = true,
  className = "",
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const scaleVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
    exit: { scale: 0.95, opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && isLoaded && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={scaleVariants}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const CardHover: React.FC<AnimatedPresenceProps> = ({
  children,
  className = ""
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const ButtonAnimation: React.FC<AnimatedPresenceProps> = ({
  children,
  className = ""
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerContainer: React.FC<AnimatedPresenceProps & { staggerChildren?: number, delayChildren?: number }> = ({
  children,
  className = "",
  staggerChildren = 0.1,
  delayChildren = 0
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren,
        staggerChildren,
      }
    }
  };
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<AnimatedPresenceProps> = ({
  children,
  className = "",
}) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200
      }
    }
  };
  
  return (
    <motion.div
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Pulse animation for highlighting new items or notifications
export const PulseAnimation: React.FC<AnimatedPresenceProps> = ({
  children,
  className = "",
}) => {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.8, 1, 0.8],
      }}
      transition={{
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Notification bell animation
export const NotificationBell: React.FC<{ hasNotifications?: boolean, className?: string }> = ({
  hasNotifications = false,
  className = ""
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`relative ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      
      {hasNotifications && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 10
          }}
          className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"
        />
      )}
    </motion.div>
  );
};
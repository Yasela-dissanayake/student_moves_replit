import React, { useEffect, useState } from 'react';
import { motion, useAnimation, AnimatePresence, useInView } from 'framer-motion';

type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * ScaleIn animation component for smooth scaling entrance effects
 */
export const ScaleIn: React.FC<{ children: React.ReactNode; delay?: number }> = ({ 
  children, 
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delay: delay,
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * FadeIn animation component for smooth fade entrance effects
 */
export const FadeIn: React.FC<{ children: React.ReactNode; delay?: number }> = ({ 
  children, 
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.5,
        delay: delay,
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * SlideIn animation component for smooth slide entrance effects
 */
export const SlideIn: React.FC<{ 
  children: React.ReactNode; 
  delay?: number;
  direction?: Direction;
  distance?: number;
}> = ({ 
  children, 
  delay = 0,
  direction = 'up',
  distance = 20 
}) => {
  // Determine initial position based on direction
  const initialPosition = () => {
    switch (direction) {
      case 'up':
        return { y: distance, opacity: 0 };
      case 'down':
        return { y: -distance, opacity: 0 };
      case 'left':
        return { x: distance, opacity: 0 };
      case 'right':
        return { x: -distance, opacity: 0 };
      default:
        return { y: distance, opacity: 0 };
    }
  };

  // Determine animation target
  const animateTo = () => {
    switch (direction) {
      case 'up':
      case 'down':
        return { y: 0, opacity: 1 };
      case 'left':
      case 'right':
        return { x: 0, opacity: 1 };
      default:
        return { y: 0, opacity: 1 };
    }
  };

  return (
    <motion.div
      initial={initialPosition()}
      animate={animateTo()}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delay: delay,
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerContainer animation for parent elements with staggered children
 */
export const StaggerContainer: React.FC<{ 
  children: React.ReactNode; 
  className?: string; 
  delay?: number;
  staggerDelay?: number;
}> = ({ 
  children, 
  className = "", 
  delay = 0,
  staggerDelay = 0.1
}) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerItem animation for children elements in a stagger container
 */
export const StaggerItem: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { 
          opacity: 1, 
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * PulseAnimation component for subtle attention-grabbing effects
 */
export const PulseAnimation: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      animate={{ 
        scale: [1, 1.03, 1],
      }}
      transition={{
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse"
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Hover animation wrapper for elements 
 */
export const HoverAnimation: React.FC<{ 
  children: React.ReactNode;
  scale?: number;
  translateY?: number;
}> = ({ 
  children,
  scale = 1.03,
  translateY = -3
}) => {
  return (
    <motion.div
      whileHover={{ 
        scale: scale, 
        y: translateY,
        transition: { duration: 0.2 } 
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * ScrollReveal animation - reveals content when scrolled into view
 */
export const ScrollReveal: React.FC<{ 
  children: React.ReactNode;
  direction?: Direction;
  distance?: number;
  delay?: number;
  once?: boolean;
}> = ({ 
  children,
  direction = 'up',
  distance = 30,
  delay = 0,
  once = true
}) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: once,
    rootMargin: '-50px 0px',
  });
  
  // Determine initial position based on direction
  const initialPosition = () => {
    switch (direction) {
      case 'up':
        return { y: distance, opacity: 0 };
      case 'down':
        return { y: -distance, opacity: 0 };
      case 'left':
        return { x: distance, opacity: 0 };
      case 'right':
        return { x: -distance, opacity: 0 };
      default:
        return { y: distance, opacity: 0 };
    }
  };
  
  // Determine animation target
  const animateTo = () => {
    switch (direction) {
      case 'up':
      case 'down':
        return { y: 0, opacity: 1 };
      case 'left':
      case 'right':
        return { x: 0, opacity: 1 };
      default:
        return { y: 0, opacity: 1 };
    }
  };

  useEffect(() => {
    if (inView) {
      controls.start(animateTo());
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      initial={initialPosition()}
      animate={controls}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 20,
        delay: delay,
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Bounce animation component
 */
export const Bounce: React.FC<{ 
  children: React.ReactNode;
  delay?: number;
  height?: number;
  repeat?: number | boolean;
}> = ({ 
  children,
  delay = 0,
  height = 10,
  repeat = Infinity
}) => {
  return (
    <motion.div
      animate={{ y: [0, -height, 0] }}
      transition={{
        duration: 0.6,
        ease: "easeInOut",
        delay: delay,
        repeat: repeat,
        repeatType: "loop"
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * HOC to add animation props to any component
 */
export function withAnimation<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & { animation?: 'fade' | 'slide' | 'scale'; delay?: number; direction?: Direction }> {
  return (props: P) => (
    props.animation === 'fade' ? (
      <FadeIn delay={props.delay}>
        <Component {...(props as P)} />
      </FadeIn>
    ) : props.animation === 'slide' ? (
      <SlideIn delay={props.delay} direction={props.direction}>
        <Component {...(props as P)} />
      </SlideIn>
    ) : props.animation === 'scale' ? (
      <ScaleIn delay={props.delay}>
        <Component {...(props as P)} />
      </ScaleIn>
    ) : (
      <Component {...(props as P)} />
    )
  );
}
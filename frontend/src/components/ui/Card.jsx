import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '',
  hover = true,
  padding = 'md',
  onClick,
  ...props 
}) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const Component = onClick ? motion.div : 'div';
  const motionProps = onClick ? {
    whileHover: hover ? { y: -4, shadow: '0 20px 40px -12px rgba(22, 163, 74, 0.15)' } : {},
    whileTap: { scale: 0.98 },
  } : {};

  return (
    <Component
      className={`
        bg-white rounded-2xl
        border border-gray-100
        shadow-sm
        ${hover ? 'transition-all duration-300' : ''}
        ${paddings[padding]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;


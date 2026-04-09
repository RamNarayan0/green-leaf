import React from 'react';
import { motion } from 'framer-motion';
import { Check, Package, ChefHat, Truck, Home, XCircle, Clock } from 'lucide-react';

const OrderStepper = ({ status }) => {
  // Define the ordered steps
  const steps = [
    { id: 'pending', label: 'Order Received', icon: Clock },
    { id: 'confirmed', label: 'Confirmed', icon: Check },
    { id: 'preparing', label: 'Preparing', icon: Package },
    { id: 'picked_up', label: 'Picked Up', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: Home }
  ];

  // Map status to current step index
  const getStepIndex = () => {
    switch (status) {
      case 'pending': return 0;
      case 'confirmed': return 1;
      case 'preparing': return 2;
      case 'picked_up': case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      default: return -1;
    }
  };

  const currentIndex = getStepIndex();
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4 border border-destructive/20">
          <XCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Order Cancelled</h3>
        <p className="text-muted-foreground mt-1">This order was cancelled and will not be delivered.</p>
      </div>
    );
  }

  return (
    <div className="w-full py-8 md:py-10 px-2 sm:px-4">
      <div className="relative flex justify-between">
        {/* Background Track Line */}
        <div className="absolute left-[10%] sm:left-0 right-[10%] sm:right-0 top-6 sm:top-7 h-1.5 bg-muted rounded-full" />
        
        {/* Active Progress Line */}
        {currentIndex >= 0 && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute left-[10%] sm:left-0 top-6 sm:top-7 h-1.5 bg-primary rounded-full z-0"
            style={{ 
              width: currentIndex === 0 ? '0%' : '100%', 
              marginRight: currentIndex === steps.length - 1 ? '0%' : '10%' 
            }}
          />
        )}

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isActive = index === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center w-1/5">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-[3px] shadow-sm transition-colors duration-500 relative
                  ${isCompleted 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'bg-card border-muted text-muted-foreground'
                  }
                  ${isActive ? 'ring-4 ring-primary/20 scale-110' : ''}
                `}
              >
                {isActive && (
                  <motion.div
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 rounded-full bg-primary-foreground/20"
                  />
                )}
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive && !isCompleted ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
              </motion.div>
              
              <div className="mt-3 sm:mt-4 text-center">
                <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider block transition-colors duration-500
                  ${isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}
                `}>
                  {step.label}
                </span>
                {isActive && (
                  <motion.span 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-1 hidden sm:block"
                  >
                    Processing...
                  </motion.span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStepper;

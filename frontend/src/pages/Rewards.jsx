import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf as EcoLeaf, Award, TrendingUp, TreeDeciduous, Wind, Droplets, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../state/authStore';
import { api } from '../services/api';

const Rewards = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalCo2Saved: 0,
    treesEquivalent: 0,
    ecoOrders: 0,
    points: 0
  });
  const [loading, setLoading] = useState(true);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  useEffect(() => {
    if (user) {
      const totalCO2Grams = user.totalCarbonSaved || 0;
      const totalCO2Kg = parseFloat((totalCO2Grams / 1000).toFixed(2));
      
      setStats({
        totalCo2Saved: totalCO2Kg,
        treesEquivalent: Math.floor(totalCO2Kg / 21),
        ecoOrders: user.ecoScore || 0, // Using ecoScore as a proxy for engagement for now
        points: user.leafPoints || 0
      });
      setLoading(false);
    }
  }, [user]);

  const progressPercentage = Math.min((stats.points % 1000) / 10, 100);
  const currentRank = stats.points >= 5000 ? 'Carbon Neutral Hero' : stats.points >= 1000 ? 'Eco Warrior' : 'Green Starter';

  if (loading) return (
    <div className="min-h-screen pt-[72px] flex items-center justify-center bg-background">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen pt-[72px] bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-900 via-green-800 to-green-950 py-16 md:py-24 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-12 opacity-10 blur-[2px]">
          <EcoLeaf className="w-64 h-64 text-white rotate-12" />
        </div>
        <div className="absolute -bottom-10 -left-10 p-12 opacity-10 blur-[2px]">
          <TreeDeciduous className="w-64 h-64 text-white -rotate-12" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-green-100 text-sm font-bold mb-6 border border-white/20">
                <Award className="w-4 h-4 text-emerald-300" /> {currentRank}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
                Your Green <span className="text-emerald-400">Impact</span>
              </h1>
              <p className="text-lg text-green-100/80 max-w-xl font-medium">
                Every delivery you choose with GreenRoute actively reduces global carbon emissions. Your <span className="text-emerald-300 font-bold">Eco Score is {user?.ecoScore || 0}%</span>.
              </p>
            </div>

            {/* Total Points Card */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shrink-0 w-full md:w-[360px] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-transparent" />
              <div className="relative z-10">
                <p className="text-green-100 font-bold mb-1 uppercase tracking-wider text-sm flex items-center gap-2">
                  <EcoLeaf className="w-4 h-4 text-emerald-400" />
                  Green Points
                </p>
                <h2 className="text-6xl font-black text-white mb-2">{stats.points}</h2>
                
                <div className="mt-6">
                  <div className="flex justify-between text-xs font-bold text-green-100 mb-2">
                    <span>Rank Progress</span>
                    <span>{stats.points % 1000} / 1000 to next tier</span>
                  </div>
                  <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-emerald-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="container mx-auto px-4 py-16 -mt-8 relative z-20">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* CO2 Saved */}
          <motion.div variants={itemVariants} className="bg-card glass p-8 rounded-3xl border border-border/50 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
            <Wind className="w-10 h-10 text-blue-500 mb-6" />
            <h3 className="text-5xl font-black text-foreground mb-2">{stats.totalCo2Saved} <span className="text-xl text-muted-foreground font-semibold">kg</span></h3>
            <p className="font-bold text-muted-foreground uppercase tracking-wider text-sm flex items-center gap-2">
              Total CO₂ Prevented
            </p>
          </motion.div>

          {/* Trees Equivalent */}
          <motion.div variants={itemVariants} className="bg-card glass p-8 rounded-3xl border border-border/50 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
            <TreeDeciduous className="w-10 h-10 text-emerald-500 mb-6" />
            <h3 className="text-5xl font-black text-foreground mb-2">{stats.treesEquivalent} <span className="text-xl text-muted-foreground font-semibold">trees</span></h3>
            <p className="font-bold text-muted-foreground uppercase tracking-wider text-sm flex items-center gap-2">
              Forest Equivalent
            </p>
          </motion.div>

          {/* Eco Orders */}
          <motion.div variants={itemVariants} className="bg-card glass p-8 rounded-3xl border border-border/50 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
            <TrendingUp className="w-10 h-10 text-amber-500 mb-6" />
            <h3 className="text-5xl font-black text-foreground mb-2">{stats.ecoOrders} <span className="text-xl text-muted-foreground font-semibold">orders</span></h3>
            <p className="font-bold text-muted-foreground uppercase tracking-wider text-sm flex items-center gap-2">
              Eco-Deliveries Made
            </p>
          </motion.div>
        </motion.div>

        {/* Badges Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Badges & Achievements</h2>
          <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
            <div className="flex flex-wrap gap-6">
              {[
                { title: 'First Drop', desc: 'Placed your first green order', icon: <Droplets />, earned: stats.ecoOrders >= 1, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { title: 'Eco Starter', desc: 'Prevented 10kg of CO₂', icon: <EcoLeaf />, earned: stats.totalCo2Saved >= 10, color: 'text-green-500', bg: 'bg-green-500/10' },
                { title: 'Tree Hugger', desc: 'Equivalent to 1 tree planted', icon: <TreeDeciduous />, earned: stats.treesEquivalent >= 1, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { title: 'Carbon Neutralizer', desc: 'Reached 1,000 Green Points', icon: <Award />, earned: stats.points >= 1000, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { title: 'Climate Hero', desc: '100 Eco-Deliveries', icon: <Wind />, earned: stats.ecoOrders >= 100, color: 'text-purple-500', bg: 'bg-purple-500/10' },
              ].map((badge, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col items-center p-6 rounded-2xl border ${badge.earned ? 'border-border bg-background shadow-xs hover:border-primary/50 cursor-default transition-colors' : 'border-dashed border-border/50 bg-muted/30 opacity-60 grayscale'}`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${badge.earned ? badge.bg : 'bg-muted'} ${badge.earned ? badge.color : 'text-muted-foreground'}`}>
                    {React.cloneElement(badge.icon, { className: 'w-8 h-8' })}
                  </div>
                  <h4 className="font-bold text-foreground text-center">{badge.title}</h4>
                  <p className="text-xs text-muted-foreground text-center mt-1">{badge.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rewards;

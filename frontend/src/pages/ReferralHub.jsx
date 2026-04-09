import React, { useState } from 'react';
import { Gift, Share2, Copy, Check, Users, Leaf as EcoLeaf, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../state/authStore';

export default function ReferralHub() {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const referralCode = user?.referralCode || 'GREEN-ALPHA';
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join GreenRoute!',
          text: `Join me on GreenRoute and get 200 Leaf Points on your first eco-friendly order! Use my code: ${referralCode}`,
          url: referralLink,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <main className="min-h-screen bg-background pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Hero Section */}
        <div className="relative bg-primary rounded-[2rem] p-8 lg:p-12 overflow-hidden shadow-eco mb-10 text-primary-foreground">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-center md:text-left">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-xs font-black uppercase tracking-widest mb-6"
              >
                <Gift className="w-3.5 h-3.5" /> Invite & Earn
              </motion.div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">Share the Green, Get the Gold!</h1>
              <p className="text-lg opacity-90 font-medium max-w-md">
                Invite your friends to switch to eco-friendly delivery and earn <span className="font-black">500 Leaf Points</span> for every referral.
              </p>
            </div>
            <div className="w-48 h-48 lg:w-64 lg:h-64 relative">
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-20" />
              <div className="absolute inset-4 bg-white/30 rounded-full animate-pulse" />
              <div className="absolute inset-8 bg-white rounded-full shadow-2xl flex items-center justify-center">
                 <span className="text-7xl">🎁</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Referral Card */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
              <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-3">
                <Share2 className="w-6 h-6 text-primary" /> Your Referral Code
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 h-16 bg-muted rounded-2xl border-2 border-dashed border-primary/30 flex items-center justify-center relative overflow-hidden group">
                  <span className="text-3xl font-black tracking-widest text-primary">{referralCode}</span>
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <button 
                  onClick={handleCopy}
                  className="h-16 px-8 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-eco hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              <div className="mt-10 pt-8 border-t border-border">
                 <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6 px-1">How it works</p>
                 <div className="grid sm:grid-cols-3 gap-6">
                    <div className="space-y-3">
                       <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-secondary-foreground font-black">1</div>
                       <p className="text-sm font-bold leading-tight">Share your unique code with friends.</p>
                    </div>
                    <div className="space-y-3">
                       <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-secondary-foreground font-black">2</div>
                       <p className="text-sm font-bold leading-tight">They get 200 points on their first order.</p>
                    </div>
                    <div className="space-y-3">
                       <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-secondary-foreground font-black">3</div>
                       <p className="text-sm font-bold leading-tight">You get 500 points when they complete it!</p>
                    </div>
                 </div>
              </div>
            </div>

            <button 
              onClick={handleShare}
              className="w-full py-5 bg-secondary text-secondary-foreground rounded-3xl font-black text-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 group"
            >
              <Share2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              Share Referral Link
            </button>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <div className="bg-card rounded-3xl p-6 border border-border shadow-sm text-center">
               <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <EcoLeaf className="w-8 h-8 text-primary" />
               </div>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Total Earned</p>
               <h3 className="text-4xl font-black text-foreground">{user?.leafPoints || 0}</h3>
               <p className="text-xs font-bold text-primary mt-2">LEAF POINTS</p>
            </div>

            <div className="bg-card rounded-3xl p-6 border border-border shadow-sm text-center">
               <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-secondary" />
               </div>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Total Invites</p>
               <h3 className="text-4xl font-black text-foreground">12</h3>
               <p className="text-xs font-bold text-secondary mt-2">FRIENDS JOINED</p>
            </div>

            <div className="bg-primary/5 rounded-3xl p-6 border border-primary/20 relative overflow-hidden group cursor-pointer hover:bg-primary/10 transition-colors">
               <Sparkles className="w-5 h-5 text-primary absolute top-4 right-4 animate-pulse" />
               <h4 className="font-extrabold text-primary mb-2">Redeem Points</h4>
               <p className="text-xs font-medium text-muted-foreground leading-relaxed">Convert your leaf points into cash or tree-planting certificates!</p>
               <div className="mt-4 flex items-center gap-1 text-[10px] font-black text-primary uppercase">
                  Go to Rewards <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

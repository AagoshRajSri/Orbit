import React from "react";
import { motion } from "framer-motion";

const Saturn = ({ size = 48, className = "", tilt = -25 }) => {
  return (
    <motion.div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      initial={{ rotate: tilt }}
      whileHover="hover"
      animate={{ rotate: tilt }}
      variants={{
        hover: { 
          rotate: tilt + 15,
          transition: { duration: 1.2, ease: "easeInOut" }
        }
      }}
    >
      {/* Rings Backdrop (behind planet) */}
      <motion.div
        className="absolute w-[180%] h-[40%] rounded-[100%] border-[3px] border-[#b08d57]/40 shadow-[0_0_15px_rgba(176,141,87,0.3)]"
        style={{ 
          transform: "rotateX(75deg) rotateY(-15deg)",
          zIndex: 0
        }}
        variants={{
          hover: { 
            rotateY: 15,
            scale: 1.1,
            transition: { duration: 0.8, ease: "easeInOut" }
          }
        }}
      />

      {/* The Planet Body */}
      <motion.div
        className="relative rounded-full shadow-[inset_-8px_-8px_20px_rgba(0,0,0,0.4),0_0_20px_rgba(176,141,87,0.2)]"
        style={{ 
          width: "100%", 
          height: "100%", 
          background: "radial-gradient(circle at 30% 30%, #e8d0a0 0%, #b08d57 70%, #6b502a 100%)",
          zIndex: 10
        }}
        variants={{
          hover: { 
            scale: 1.05,
            transition: { duration: 0.8, ease: "easeInOut" }
          }
        }}
      >
        {/* Atmosphere/Glow */}
        <motion.div 
          className="absolute inset-0 rounded-full bg-[#b08d57]/20 blur-[4px]" 
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Subtle Surface Lines */}
        <div className="absolute inset-0 rounded-full overflow-hidden opacity-30">
          <div className="absolute top-[20%] w-full h-1 bg-black/20" />
          <div className="absolute top-[40%] w-full h-1.5 bg-white/10" />
          <div className="absolute top-[60%] w-full h-1 bg-black/20" />
          <div className="absolute top-[75%] w-full h-1 bg-white/10" />
        </div>
      </motion.div>

      {/* Rings Front Layer (to create depth, though harder with simple CSS, we use a clip or just rely on the illusion) */}
      <motion.div
        className="absolute w-[180%] h-[40%] rounded-[100%] border-[2px] border-[#b08d57]/60"
        style={{ 
          transform: "rotateX(75deg) rotateY(-15deg)",
          zIndex: 20,
          clipPath: "inset(50% 0 0 0)" // Shows only the bottom half of the ring in front
        }}
        variants={{
          hover: { 
            rotateY: 15,
            scale: 1.1,
            transition: { duration: 0.8, ease: "easeInOut" }
          }
        }}
      />

      {/* Subtle Moon */}
      <motion.div
        className="absolute size-1.5 rounded-full bg-white/80"
        animate={{
          x: [-40, 40, -40],
          z: [-10, 10, -10],
          opacity: [0.4, 1, 0.4],
          scale: [0.8, 1.2, 0.8]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{ zIndex: 15 }}
      />
    </motion.div>
  );
};

export default Saturn;

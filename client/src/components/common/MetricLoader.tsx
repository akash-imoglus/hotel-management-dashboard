import { motion } from "framer-motion";
import { Plane } from "lucide-react";

interface MetricLoaderProps {
  className?: string;
}

const MetricLoader = ({ className = "" }: MetricLoaderProps) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        animate={{
          x: [0, 20, 0],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        <motion.div
          animate={{
            rotate: [0, 5, 0, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Plane className="h-8 w-8 text-blue-400" strokeWidth={2} />
        </motion.div>
        
        {/* Trail effect */}
        <motion.div
          className="absolute -right-6 top-1/2 -translate-y-1/2 flex gap-1"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-blue-300"
              animate={{
                opacity: [0.2, 0.6, 0.2],
                scale: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MetricLoader;

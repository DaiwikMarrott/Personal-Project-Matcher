import { motion } from "motion/react";

export default function Splash() {
  const letters = "ProjectsMatcher".split("");

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-[#fdfbf7] z-50"
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="flex space-x-1">
        {letters.map((letter, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              x: (Math.random() - 0.5) * 400,
              y: (Math.random() - 0.5) * 400,
              rotate: (Math.random() - 0.5) * 180,
              transition: { duration: 0.8, ease: "easeOut" },
            }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-emerald-500"
          >
            {letter}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}

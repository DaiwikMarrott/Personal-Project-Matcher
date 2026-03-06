import React from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export default function Landing({
  onNext,
}: {
  onNext: () => void;
  key?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-3xl"
      >
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-stone-800 mb-6 leading-tight">
          Build the <span className="text-emerald-500">future</span> together.
        </h1>
        <p className="text-xl md:text-2xl text-stone-500 mb-12 leading-relaxed font-medium max-w-2xl mx-auto">
          collabb is the premier platform for passionate creators, developers,
          and designers to find their perfect project match. Stop building
          alone.
        </p>
        <button
          onClick={onNext}
          className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-white bg-emerald-500 rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95 text-lg shadow-xl shadow-emerald-500/20"
        >
          <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
          <span className="relative flex items-center gap-3">
            Get Started{" "}
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>
      </motion.div>
    </motion.div>
  );
}

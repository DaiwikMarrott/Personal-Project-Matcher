import React from "react";
import { motion } from "motion/react";
import { Input } from "./ui/Input";
import { ArrowRight, ArrowLeft } from "lucide-react";

export default function SignUp1({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
  key?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen flex items-center justify-center p-6 py-12"
    >
      <div className="w-full max-w-xl bg-white/60 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl shadow-emerald-900/5 border border-white/50">
        <button
          onClick={onBack}
          className="mb-6 text-stone-400 hover:text-stone-800 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-4xl font-black tracking-tight text-stone-800 mb-2">
          Create Account
        </h2>
        <p className="text-stone-500 font-medium mb-8">
          Let's get to know you better.
        </p>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" placeholder="Jane" />
            <Input label="Last Name" placeholder="Doe" />
          </div>
          <Input label="Date of Birth" type="date" />
          <Input label="Email" type="email" placeholder="jane@university.edu" />
          <Input label="Password" type="password" placeholder="••••••••" />
          <Input label="Institution" placeholder="e.g. Stanford University" />
          <Input label="Major" placeholder="e.g. Computer Science" />

          <div className="pt-6 mt-6 border-t border-emerald-100">
            <h3 className="text-xl font-bold text-stone-800 mb-1">
              Social Links
            </h3>
            <p className="text-sm text-emerald-600/80 font-medium mb-6">
              These links are useful to connect with people and are recommended
              for computer science and engineering students.
            </p>
            <div className="space-y-4">
              <Input label="GitHub URL" placeholder="https://github.com/..." />
              <Input
                label="LinkedIn URL"
                placeholder="https://linkedin.com/in/..."
              />
              <Input label="Discord Username" placeholder="username#1234" />
              <Input
                label="Instagram URL"
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>

          <div className="pt-8 flex justify-end">
            <button
              onClick={onNext}
              className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-emerald-500/20 text-lg"
            >
              Next <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

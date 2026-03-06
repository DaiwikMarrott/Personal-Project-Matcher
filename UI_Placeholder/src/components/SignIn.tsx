import React from "react";
import { motion } from "motion/react";
import { Input } from "./ui/Input";

export default function SignIn({
  onSignUp,
  onSignIn,
}: {
  onSignUp: () => void;
  onSignIn: () => void;
  key?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="min-h-screen flex items-center justify-center p-6"
    >
      <div className="w-full max-w-md bg-white/60 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl shadow-emerald-900/5 border border-white/50">
        <h2 className="text-4xl font-black tracking-tight text-stone-800 mb-8 text-center">
          Welcome back
        </h2>
        <div className="space-y-5">
          <Input label="Email" type="email" placeholder="you@example.com" />
          <Input label="Password" type="password" placeholder="••••••••" />
          <div className="pt-4">
            <button
              onClick={onSignIn}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-emerald-500/20 text-lg"
            >
              Sign In
            </button>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-stone-500 font-medium">
            Don't have an account?{" "}
            <button
              onClick={onSignUp}
              className="text-emerald-600 font-bold hover:underline"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

import React, { useState } from "react";
import { motion } from "motion/react";
import { Input } from "./ui/Input";
import { ArrowLeft, X, Plus } from "lucide-react";

export default function SignUp2({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
  key?: string;
}) {
  const [interests, setInterests] = useState(["Coding", "Research"]);
  const [newInterest, setNewInterest] = useState("");

  const [expertise, setExpertise] = useState(["Frontend", "AI"]);
  const [newExpertise, setNewExpertise] = useState("");

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const addExpertise = () => {
    if (newExpertise.trim() && !expertise.includes(newExpertise.trim())) {
      setExpertise([...expertise, newExpertise.trim()]);
      setNewExpertise("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen flex items-center justify-center p-6 py-12"
    >
      <div className="w-full max-w-xl bg-white/60 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl shadow-emerald-900/5 border border-white/50">
        <h2 className="text-4xl font-black tracking-tight text-stone-800 mb-2">
          Your Skills
        </h2>
        <p className="text-stone-500 font-medium mb-10">
          What are you passionate about?
        </p>

        <div className="space-y-10">
          {/* Interests */}
          <div>
            <label className="text-sm font-semibold text-stone-600 ml-1 mb-3 block">
              Interests
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {interests.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-100/80 text-emerald-800 rounded-xl text-sm font-bold border border-emerald-200/50"
                >
                  {item}
                  <button
                    onClick={() =>
                      setInterests(interests.filter((i) => i !== item))
                    }
                    className="hover:bg-emerald-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Add an interest (e.g. UI Design)"
                  value={newInterest}
                  onChange={(e: any) => setNewInterest(e.target.value)}
                  onKeyDown={(e: any) => e.key === "Enter" && addInterest()}
                />
              </div>
              <button
                onClick={addInterest}
                className="px-5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-2xl transition-colors font-bold"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Expertise */}
          <div>
            <label className="text-sm font-semibold text-stone-600 ml-1 mb-3 block">
              Expertise
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {expertise.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 text-stone-800 rounded-xl text-sm font-bold border border-stone-200"
                >
                  {item}
                  <button
                    onClick={() =>
                      setExpertise(expertise.filter((i) => i !== item))
                    }
                    className="hover:bg-stone-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Add expertise (e.g. AI, ML, Backend)"
                  value={newExpertise}
                  onChange={(e: any) => setNewExpertise(e.target.value)}
                  onKeyDown={(e: any) => e.key === "Enter" && addExpertise()}
                />
              </div>
              <button
                onClick={addExpertise}
                className="px-5 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-2xl transition-colors font-bold"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-emerald-100 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-4 text-stone-500 hover:text-stone-800 font-bold transition-colors text-lg"
            >
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
            <button
              onClick={onNext}
              className="px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-emerald-500/20 text-lg"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

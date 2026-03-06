import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send } from "lucide-react";
import { Input } from "../ui/Input";

export default function ProjectModal({
  project,
  onClose,
}: {
  project: any;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"details" | "apply" | "success">("details");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-stone-900/30 backdrop-blur-md"
        onClick={onClose}
      />

      <AnimatePresence mode="wait">
        {step === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-emerald-100"
          >
            <div className="p-10">
              <button
                onClick={onClose}
                className="absolute top-8 right-8 text-stone-400 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-full p-2.5 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-4xl font-black tracking-tight text-stone-800 mb-3 pr-12">
                {project.title}
              </h2>
              <p className="text-lg font-medium text-stone-500 mb-8">
                Project by{" "}
                <span className="font-bold text-stone-800">
                  {project.owner}
                </span>
              </p>

              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-3">
                    Description
                  </h4>
                  <p className="text-stone-700 font-medium leading-relaxed text-lg">
                    {project.description}
                  </p>
                </div>

                <div className="bg-emerald-50/80 p-6 rounded-2xl border-2 border-emerald-100/50">
                  <h4 className="text-sm font-black text-emerald-800 uppercase tracking-widest mb-4">
                    Requirements
                  </h4>
                  <ul className="space-y-3 text-emerald-800 font-medium">
                    <li className="flex justify-between items-center">
                      <span className="text-emerald-600">Availability:</span>{" "}
                      <span className="font-bold text-lg">10 hrs/week</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-emerald-600">Duration:</span>{" "}
                      <span className="font-bold text-lg">~3 months</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-emerald-600">Format:</span>{" "}
                      <span className="font-bold text-lg">Remote</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-3">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-sm font-bold border border-stone-200/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-stone-100">
                <button
                  onClick={() => setStep("apply")}
                  className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-emerald-500/20 text-xl"
                >
                  Apply to Join
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "apply" && (
          <motion.div
            key="apply"
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -20 }}
            className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-emerald-100"
          >
            <div className="p-10">
              <button
                onClick={onClose}
                className="absolute top-8 right-8 text-stone-400 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-full p-2.5 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-3xl font-black tracking-tight text-stone-800 mb-8 pr-12">
                Send a note to {project.owner}
              </h2>

              <div className="space-y-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-stone-600 ml-1">
                    Introduce yourself & why you're interested
                  </label>
                  <textarea
                    rows={5}
                    className="w-full px-4 py-3.5 bg-stone-50 border-2 border-emerald-200 rounded-2xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 transition-all placeholder:text-stone-400 text-stone-800 font-medium resize-none"
                    placeholder="Hi! I'd love to help build this because..."
                  ></textarea>
                </div>

                <Input
                  label="Your Availability"
                  placeholder="e.g. Weekends, 10 hrs/week"
                />
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  onClick={() => setStep("details")}
                  className="px-8 py-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-2xl transition-colors text-lg"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("success")}
                  className="flex-1 flex items-center justify-center gap-3 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-emerald-500/20 text-lg"
                >
                  Send Request <Send className="w-6 h-6" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-emerald-100 text-center p-10"
          >
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500">
              <Send className="w-12 h-12 ml-1" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-stone-800 mb-4">
              Request Sent!
            </h2>
            <p className="text-lg font-medium text-stone-500 mb-10">
              We'll let you know when the project owner accepts.
            </p>
            <button
              onClick={onClose}
              className="w-full py-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-2xl transition-colors text-lg"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

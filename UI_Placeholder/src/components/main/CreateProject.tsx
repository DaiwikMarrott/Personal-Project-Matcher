import { Input } from "../ui/Input";

export default function CreateProject() {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-4xl font-black tracking-tight text-stone-800 mb-10">
        Post a Project Idea
      </h2>

      <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl shadow-emerald-900/5 border border-white/50 space-y-8">
        <Input label="Project Name" placeholder="e.g. AI Study Buddy" />
        <Input label="Field" placeholder="e.g. Education Tech, AI" />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-600 ml-1">
            Description
          </label>
          <textarea
            rows={5}
            className="w-full px-4 py-3.5 bg-white/80 border-2 border-emerald-200 rounded-2xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 transition-all placeholder:text-stone-400 text-stone-800 font-medium resize-none"
            placeholder="Describe your project, goals, and what you are looking for..."
          ></textarea>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Input label="Availability Needed" placeholder="e.g. 10 hrs/week" />
          <Input label="Approximate Duration" placeholder="e.g. 3 months" />
        </div>

        <Input
          label="Tags (comma separated)"
          placeholder="React, Python, Design"
        />

        <div className="pt-8 mt-8 border-t border-emerald-100">
          <button className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-emerald-500/20 text-xl">
            Post Project
          </button>
        </div>
      </div>
    </div>
  );
}

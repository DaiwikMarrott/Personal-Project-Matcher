export default function Profile() {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[2rem] border-2 border-emerald-100/50 flex items-start gap-10 shadow-xl shadow-emerald-900/5">
        <div className="w-36 h-36 rounded-full bg-emerald-200 flex items-center justify-center text-5xl text-emerald-800 font-black border-4 border-white shadow-xl shrink-0">
          JD
        </div>
        <div className="flex-1 pt-2">
          <h2 className="text-4xl font-black tracking-tight text-stone-800 mb-2">
            Jane Doe
          </h2>
          <p className="text-lg font-medium text-stone-500 mb-6">
            Computer Science @ Stanford University
          </p>

          <div className="flex gap-6 text-sm font-bold text-emerald-700">
            <a href="#" className="hover:text-emerald-500 transition-colors">
              GitHub
            </a>
            <a href="#" className="hover:text-emerald-500 transition-colors">
              LinkedIn
            </a>
            <a href="#" className="hover:text-emerald-500 transition-colors">
              Portfolio
            </a>
          </div>
        </div>
        <button className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-2xl font-bold transition-colors">
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-3 gap-10">
        <div className="col-span-2 space-y-10">
          <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[2rem] border-2 border-emerald-100/50 shadow-xl shadow-emerald-900/5">
            <h3 className="text-2xl font-black tracking-tight text-stone-800 mb-6">
              About Me
            </h3>
            <p className="text-stone-600 font-medium leading-relaxed text-lg">
              Passionate frontend developer with a keen eye for design. I love
              building intuitive user interfaces and exploring the intersection
              of AI and web development. Always looking for exciting projects to
              collaborate on!
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[2rem] border-2 border-emerald-100/50 shadow-xl shadow-emerald-900/5">
            <h3 className="text-2xl font-black tracking-tight text-stone-800 mb-6">
              My Projects (2)
            </h3>
            <div className="space-y-4">
              <div className="p-6 border-2 border-emerald-100 rounded-2xl bg-white/50 hover:border-emerald-200 transition-colors cursor-pointer">
                <h4 className="text-xl font-bold text-stone-800 mb-1">
                  Portfolio Generator
                </h4>
                <p className="text-sm font-medium text-stone-500">
                  Active • 3 collaborators
                </p>
              </div>
              <div className="p-6 border-2 border-emerald-100 rounded-2xl bg-white/50 hover:border-emerald-200 transition-colors cursor-pointer">
                <h4 className="text-xl font-bold text-stone-800 mb-1">
                  Campus Maps App
                </h4>
                <p className="text-sm font-medium text-stone-500">Completed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border-2 border-emerald-100/50 shadow-xl shadow-emerald-900/5">
            <h3 className="text-xl font-black tracking-tight text-stone-800 mb-6">
              Preferences
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-4 text-stone-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-6 h-6 rounded-md text-emerald-500 focus:ring-emerald-500 border-emerald-200"
                />
                Remote Work
              </label>
              <label className="flex items-center gap-4 text-stone-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-6 h-6 rounded-md text-emerald-500 focus:ring-emerald-500 border-emerald-200"
                />
                Open Source
              </label>
              <label className="flex items-center gap-4 text-stone-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  className="w-6 h-6 rounded-md text-emerald-500 focus:ring-emerald-500 border-emerald-200"
                />
                Hackathons
              </label>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border-2 border-emerald-100/50 shadow-xl shadow-emerald-900/5">
            <h3 className="text-xl font-black tracking-tight text-stone-800 mb-6">
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {["React", "TypeScript", "Tailwind", "Figma", "Node.js"].map(
                (skill) => (
                  <span
                    key={skill}
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold border border-emerald-100/50"
                  >
                    {skill}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

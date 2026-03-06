import { Check } from "lucide-react";

export default function Notifications() {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-4xl font-black tracking-tight text-stone-800 mb-10">
        Notifications
      </h2>

      <div className="space-y-6">
        {/* Match Notification */}
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border-2 border-emerald-200 shadow-xl shadow-emerald-900/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-xl text-emerald-600 font-black shrink-0 border-4 border-white shadow-sm">
              95%
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-black tracking-tight text-stone-800 mb-4">
                Best match for your project "AI Study Buddy"
              </h4>
              <div className="p-6 bg-stone-50/80 rounded-2xl border-2 border-stone-100/80">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-stone-800">
                    Michael Chang
                  </span>
                  <span className="text-sm font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200/50">
                    95% Match
                  </span>
                </div>
                <p className="text-stone-600 font-medium mb-4 leading-relaxed">
                  Strong background in Python and ML. Looking for education tech
                  projects.
                </p>
                <div className="flex gap-6 text-sm font-bold text-stone-400 mb-6">
                  <span>• 3 yrs experience</span>
                  <span>• Stanford Univ.</span>
                </div>
                <div className="flex gap-4">
                  <button className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20">
                    Chat
                  </button>
                  <button className="flex-1 py-3 bg-stone-200 text-stone-700 rounded-xl font-bold hover:bg-stone-300 transition-colors">
                    Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Regular Notification */}
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border-2 border-stone-100/80 flex items-center gap-6 shadow-lg shadow-stone-900/5">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 shrink-0 border-4 border-white shadow-sm">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <p className="text-stone-800 text-lg font-medium">
              <span className="font-bold">Sarah Miller</span> accepted your
              request for EcoTrack App.
            </p>
            <p className="text-sm font-bold text-stone-400 mt-1">2 hours ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}

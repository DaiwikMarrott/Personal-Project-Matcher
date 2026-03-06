import { ArrowRight, Sparkles } from "lucide-react";

export default function HomePage({
  onProjectClick,
  onFindMatch,
}: {
  onProjectClick: (p: any) => void;
  onFindMatch: () => void;
}) {
  const recommendedProjects = [
    {
      id: 1,
      title: "AI Study Buddy",
      owner: "Alex Chen",
      tags: ["AI", "React", "Python"],
      description:
        "Building an AI assistant to help students summarize lectures and generate quizzes.",
    },
    {
      id: 2,
      title: "EcoTrack App",
      owner: "Sarah Miller",
      tags: ["Mobile", "Flutter", "Firebase"],
      description:
        "A mobile app to track daily carbon footprint and suggest eco-friendly alternatives.",
    },
    {
      id: 3,
      title: "Web3 Marketplace",
      owner: "David Kim",
      tags: ["Blockchain", "Solidity", "Next.js"],
      description: "Decentralized marketplace for digital art and assets.",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-400 rounded-[2rem] p-10 text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-black mb-6 flex items-center gap-3 tracking-tight">
            <Sparkles className="w-10 h-10 text-emerald-200" /> Find the best
            match for your project
          </h2>
          <p className="text-emerald-50 mb-8 text-xl font-medium leading-relaxed">
            Our algorithm connects you with peers who share your interests and
            complement your skills.
          </p>
          <button
            onClick={onFindMatch}
            className="bg-white text-emerald-600 px-8 py-4 rounded-2xl font-bold hover:bg-emerald-50 transition-colors flex items-center gap-3 text-lg shadow-xl shadow-black/5"
          >
            Discover Matches <ArrowRight className="w-6 h-6" />
          </button>
        </div>
        <div className="absolute right-0 top-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
      </div>

      {/* Recommended Projects */}
      <div>
        <h3 className="text-3xl font-black tracking-tight text-stone-800 mb-8">
          Recommended Projects
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => onProjectClick(project)}
              className="bg-white/80 backdrop-blur-sm border-2 border-emerald-100/50 p-8 rounded-3xl hover:shadow-2xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col"
            >
              <h4 className="text-2xl font-bold text-stone-800 mb-2 group-hover:text-emerald-600 transition-colors tracking-tight">
                {project.title}
              </h4>
              <p className="text-sm font-medium text-stone-500 mb-6">
                by {project.owner}
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-100/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-stone-600 font-medium leading-relaxed line-clamp-2 mt-auto">
                {project.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

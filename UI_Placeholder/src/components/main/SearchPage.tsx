export default function SearchPage({
  searchQuery,
  onProjectClick,
}: {
  searchQuery: string;
  onProjectClick: (p: any) => void;
}) {
  // Mock search results
  const results = [
    {
      id: 4,
      title: "Machine Learning Dashboard",
      owner: "Emily Wong",
      tags: ["ML", "Python", "Vue"],
      description:
        "A dashboard to visualize ML model training metrics in real-time.",
    },
    {
      id: 5,
      title: "Open Source UI Library",
      owner: "James Smith",
      tags: ["Frontend", "React", "CSS"],
      description:
        "Creating a highly accessible and customizable UI component library.",
    },
  ];

  return (
    <div>
      <h2 className="text-4xl font-black tracking-tight text-stone-800 mb-3">
        Search Results
      </h2>
      <p className="text-stone-500 font-medium text-lg mb-10">
        Showing results for "{searchQuery || "all projects"}"
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((project) => (
          <div
            key={project.id}
            onClick={() => onProjectClick(project)}
            className="bg-white/80 backdrop-blur-sm border-2 border-emerald-100/50 p-8 rounded-3xl hover:shadow-2xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col"
          >
            <div className="flex-1">
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
              <p className="text-stone-600 font-medium leading-relaxed">
                {project.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

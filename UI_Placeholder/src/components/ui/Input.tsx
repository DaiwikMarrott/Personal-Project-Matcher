export function Input({ label, ...props }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-stone-600 ml-1">
          {label}
        </label>
      )}
      <input
        className="w-full px-4 py-3.5 bg-white/80 border-2 border-emerald-200 rounded-2xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 transition-all placeholder:text-stone-400 text-stone-800 font-medium"
        {...props}
      />
    </div>
  );
}

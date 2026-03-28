interface Props {
  message: string;
  onClose: () => void;
}

export default function GeminiWarningToast({ message, onClose }: Props) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
      <div className="bg-amber-900/90 border border-amber-500/50 rounded-lg px-4 py-3 shadow-lg flex items-start gap-3">
        <span className="text-amber-400 text-lg leading-none mt-0.5">⚠</span>
        <div className="flex-1">
          <p className="text-amber-200 text-sm font-medium">Skill auto-detection unavailable</p>
          <p className="text-amber-300/80 text-xs mt-0.5">{message}</p>
          <p className="text-amber-400/60 text-xs mt-1">Task saved. Redirecting to task list…</p>
        </div>
        <button
          onClick={onClose}
          className="text-amber-400/60 hover:text-amber-300 text-lg leading-none transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}

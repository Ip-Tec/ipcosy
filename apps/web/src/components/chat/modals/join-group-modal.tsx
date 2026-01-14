"use client";

interface JoinGroupModalProps {
  show: boolean;
  setShow: (show: boolean) => void;
  joinCodeInput: string;
  setJoinCodeInput: (code: string) => void;
  handleJoinGroup: () => void;
  isPremium: boolean;
}

export function JoinGroupModal({
  show,
  setShow,
  joinCodeInput,
  setJoinCodeInput,
  handleJoinGroup,
  isPremium,
}: JoinGroupModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-sidebar w-full max-w-sm rounded-[2rem] border border-border p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black">Join a Group</h2>
          <p className="text-xs text-muted">Enter the 6-character join code.</p>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
            placeholder="Code (e.g. AB12XY)"
            maxLength={6}
            className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-center text-lg font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              onClick={() => setShow(false)}
              className="flex-1 py-4 text-sm font-bold text-muted hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleJoinGroup}
              disabled={joinCodeInput.length < 4}
              className="cursor-pointer flex-1 py-4 text-sm font-bold bg-primary text-white rounded-2xl shadow-lg hover:opacity-90 disabled:opacity-50 transition-all"
            >
              Join
            </button>
          </div>
          <p className="text-[10px] text-center text-muted">
            {isPremium
              ? "You have unlimited joins."
              : "Free users can join up to 2 groups."}
          </p>
        </div>
      </div>
    </div>
  );
}

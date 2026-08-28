import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/couple";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Gamepad2,
  RotateCcw,
  Hand,
  Hash,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  DoorOpen,
  LogIn,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/_app/games")({
  component: GamesPage,
});

type Kind = "rps" | "ttt" | "wyr" | "tod";

type GameRow = {
  couple_id: string;
  kind: Kind;
  state: any;
  updated_at: string;
  updated_by: string | null;
};

type LobbyMeta = {
  players?: string[];
  started?: boolean;
};

const META: Record<Kind, { label: string; icon: any; emoji: string; tagline: string }> = {
  rps: { label: "Rock Paper Scissors", icon: Hand, emoji: "✊", tagline: "Best of forever" },
  ttt: { label: "Tic Tac Toe", icon: Hash, emoji: "❌", tagline: "Classic 3x3" },
  wyr: { label: "Would You Rather", icon: HelpCircle, emoji: "🤔", tagline: "Do you both agree?" },
  tod: { label: "Truth or Dare", icon: Sparkles, emoji: "🔥", tagline: "Dare to share" },
};


function useGameSession(kind: Kind) {
  const { couple } = useCouple();
  const { user } = useAuth();
  const [row, setRow] = useState<GameRow | null>(null);
  const [loading, setLoading] = useState(true);
  const coupleId = couple?.id;

  useEffect(() => {
    if (!coupleId) return;
    let active = true;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("couple_id", coupleId)
        .eq("kind", kind)
        .maybeSingle();
      if (!active) return;
      setRow(data as GameRow | null);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`game:${coupleId}:${kind}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_sessions", filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          const next = (payload.new ?? payload.old) as GameRow | null;
          if (next?.kind !== kind) return;
          if (payload.eventType === "DELETE") setRow(null);
          else setRow(payload.new as GameRow);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [coupleId, kind]);

  const setState = async (state: any) => {
    if (!coupleId || !user) return;
    setRow({
      couple_id: coupleId,
      kind,
      state,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    });
    await supabase
      .from("game_sessions")
      .upsert(
        { couple_id: coupleId, kind, state, updated_by: user.id, updated_at: new Date().toISOString() },
        { onConflict: "couple_id,kind" },
      );
  };

  const reset = async () => {
    if (!coupleId) return;
    await supabase.from("game_sessions").delete().eq("couple_id", coupleId).eq("kind", kind);
    setRow(null);
  };

  return { state: (row?.state ?? null) as (any & LobbyMeta) | null, loading, setState, reset };
}

function lobbyStatus(state: any, userId?: string): "idle" | "waiting" | "active" | "joinable" {
  if (!state || !state.players?.length) return "idle";
  if (state.started) return "active";
  if (userId && state.players.includes(userId)) return "waiting";
  return "joinable";
}

function GamesPage() {
  const [openKind, setOpenKind] = useState<Kind | null>(null);

  if (openKind) {
    return <GameRoom kind={openKind} onBack={() => setOpenKind(null)} />;
  }

  return (
    <div className="px-4 pt-6 pb-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Gamepad2 className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold">Game Lobby</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Pick a game and wait for your partner to join.
      </p>


      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(Object.keys(META) as Kind[]).map((k) => (
          <LobbyCard key={k} kind={k} onOpen={() => setOpenKind(k)} />
        ))}
      </div>
    </div>
  );
}

function LobbyCard({ kind, onOpen }: { kind: Kind; onOpen: () => void }) {
  const { user } = useAuth();
  const { state } = useGameSession(kind);
  const status = lobbyStatus(state, user?.id);
  const Icon = META[kind].icon;

  const badge =
    status === "active"
      ? { text: "In progress", cls: "bg-primary/15 text-primary" }
      : status === "waiting"
        ? { text: "Waiting for partner", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" }
        : status === "joinable"
          ? { text: "Partner invited you", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" }
          : { text: "Idle", cls: "bg-muted text-muted-foreground" };

  return (
    <button
      onClick={onOpen}
      className="text-left p-4 rounded-2xl border bg-card hover:bg-muted/40 transition shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold leading-tight">{META[kind].label}</div>
            <div className="text-xs text-muted-foreground">{META[kind].tagline}</div>
          </div>
        </div>
        <span className="text-2xl">{META[kind].emoji}</span>
      </div>
      <div className={`mt-3 inline-flex text-[11px] px-2 py-0.5 rounded-full ${badge.cls}`}>
        {badge.text}
      </div>
    </button>
  );
}

function GameRoom({ kind, onBack }: { kind: Kind; onBack: () => void }) {
  return (
    <div className="px-4 pt-6 pb-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <span>{META[kind].emoji}</span> {META[kind].label}
        </h1>
      </div>
      {kind === "rps" && <RPS />}
      {kind === "ttt" && <TTT />}
      {kind === "wyr" && <WYR />}
      {kind === "tod" && <ToD />}
    </div>
  );
}

/* ============ Lobby gate ============ */

function LobbyGate({
  kind,
  state,
  setState,
  reset,
  initialGameState,
  children,
}: {
  kind: Kind;
  state: any;
  setState: (s: any) => Promise<void>;
  reset: () => Promise<void>;
  initialGameState?: any;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const { partner, me } = useCouple();

  if (state?.started) return <>{children}</>;

  const players: string[] = state?.players ?? [];
  const iAmIn = user ? players.includes(user.id) : false;
  const partnerName = partner?.display_name ?? "your partner";

  const host = async () => {
    if (!user) return;
    await setState({ ...(initialGameState ?? {}), players: [user.id], started: false });
  };

  const join = async () => {
    if (!user) return;
    const nextPlayers = Array.from(new Set([...(players ?? []), user.id]));
    await setState({
      ...(initialGameState ?? {}),
      ...(state ?? {}),
      players: nextPlayers,
      started: nextPlayers.length >= 2,
    });
  };

  if (!state) {
    return (
      <Card className="p-6 text-center space-y-4">
        <div className="text-5xl">{META[kind].emoji}</div>
        <div className="space-y-1">
          <div className="font-semibold">{META[kind].label}</div>
          <p className="text-sm text-muted-foreground">
            Open a room. We'll wait for {partnerName} before starting.
          </p>
        </div>
        <Button className="w-full" onClick={host} disabled={!partner}>
          <DoorOpen className="w-4 h-4 mr-2" /> Open room
        </Button>
        {!partner && (
          <p className="text-xs text-muted-foreground">No partner yet — connect in Settings first.</p>
        )}
      </Card>
    );
  }

  if (iAmIn) {
    return (
      <Card className="p-6 text-center space-y-4">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
        <div>
          <div className="font-semibold">Waiting for {partnerName}...</div>
          <p className="text-sm text-muted-foreground mt-1">
            Ask them to open {META[kind].label} too.
          </p>
        </div>
        <Button variant="outline" className="w-full" onClick={reset}>
          Cancel room
        </Button>
      </Card>
    );
  }

  // partner created → I can join
  return (
    <Card className="p-6 text-center space-y-4">
      <div className="text-5xl">{META[kind].emoji}</div>
      <div>
        <div className="font-semibold">{partnerName} is inviting you</div>
        <p className="text-sm text-muted-foreground mt-1">
          Join {META[kind].label} to start.
        </p>
      </div>
      <Button className="w-full" onClick={join}>
        <LogIn className="w-4 h-4 mr-2" /> Join and start
      </Button>
      <Button variant="ghost" size="sm" className="w-full" onClick={reset}>
        Not now
      </Button>
    </Card>
  );
}


/* ============ Bato Bato Pick ============ */

type Choice = "rock" | "paper" | "scissors";
const CHOICES: { v: Choice; emoji: string; label: string }[] = [
  { v: "rock", emoji: "🪨", label: "Rock" },
  { v: "paper", emoji: "📄", label: "Paper" },
  { v: "scissors", emoji: "✂️", label: "Scissors" },
];


function rpsWinner(a: Choice, b: Choice) {
  if (a === b) return 0;
  if (
    (a === "rock" && b === "scissors") ||
    (a === "paper" && b === "rock") ||
    (a === "scissors" && b === "paper")
  )
    return 1;
  return -1;
}

function RPS() {
  const { user } = useAuth();
  const { partner, me } = useCouple();
  const session = useGameSession("rps");

  return (
    <LobbyGate
      kind="rps"
      state={session.state}
      setState={session.setState}
      reset={session.reset}
      initialGameState={{ round: 1, picks: {}, scores: {} }}
    >
      <RPSBoard session={session} user={user} partner={partner} me={me} />
    </LobbyGate>
  );
}

function RPSBoard({ session, user, partner, me }: any) {
  const { state, setState, reset } = session;
  const picks: Record<string, Choice> = state?.picks ?? {};
  const scores: Record<string, number> = state?.scores ?? {};
  const round: number = state?.round ?? 1;
  const myPick = user ? picks[user.id] : undefined;
  const partnerPicked = partner ? !!picks[partner.id] : false;
  const both = user && partner && picks[user.id] && picks[partner.id];

  const result = useMemo(() => {
    if (!both || !user || !partner) return null;
    return rpsWinner(picks[user.id], picks[partner.id]);
  }, [both, picks, user, partner]);

  const pick = async (c: Choice) => {
    if (!user || myPick) return;
    await setState({ ...state, picks: { ...picks, [user.id]: c } });
  };

  const nextRound = async () => {
    if (!user || !partner || result === null) return;
    const newScores = { ...scores };
    if (result === 1) newScores[user.id] = (newScores[user.id] ?? 0) + 1;
    else if (result === -1) newScores[partner.id] = (newScores[partner.id] ?? 0) + 1;
    await setState({ ...state, round: round + 1, picks: {}, scores: newScores });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between text-sm">
        <div>Round <b>{round}</b></div>
        <div className="flex gap-3">
          <span>{me?.display_name ?? "You"}: <b>{user ? scores[user.id] ?? 0 : 0}</b></span>
          <span>{partner?.display_name ?? "Partner"}: <b>{partner ? scores[partner.id] ?? 0 : 0}</b></span>
        </div>
      </div>

      {!both ? (
        <>
          <div className="text-center text-sm text-muted-foreground">
            {myPick ? "Waiting for your partner..." : "Make your move:"}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {CHOICES.map((c) => (
              <button
                key={c.v}
                onClick={() => pick(c.v)}
                disabled={!!myPick}
                className={`flex flex-col items-center p-4 rounded-xl border transition ${
                  myPick === c.v ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                } ${myPick && myPick !== c.v ? "opacity-40" : ""}`}
              >
                <span className="text-4xl">{c.emoji}</span>
                <span className="text-xs mt-1">{c.label}</span>
              </button>
            ))}
          </div>
          <div className="text-center text-xs text-muted-foreground">
            {partnerPicked ? "Partner picked ✓" : "Partner hasn't picked yet..."}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl bg-muted">
              <div className="text-xs">{me?.display_name ?? "You"}</div>
              <div className="text-5xl my-2">{CHOICES.find((c) => c.v === picks[user!.id])?.emoji}</div>
            </div>
            <div className="p-3 rounded-xl bg-muted">
              <div className="text-xs">{partner?.display_name ?? "Partner"}</div>
              <div className="text-5xl my-2">{CHOICES.find((c) => c.v === picks[partner!.id])?.emoji}</div>
            </div>
          </div>
          <div className="text-center text-lg font-semibold">
            {result === 0 ? "It's a tie! 🤝" : result === 1 ? "You win! 🎉" : "You lose 😅"}
          </div>
          <Button className="w-full" onClick={nextRound}>Next Round</Button>
        </div>
      )}

      <Button variant="ghost" size="sm" className="w-full" onClick={reset}>
        <RotateCcw className="w-4 h-4 mr-1" /> End room
      </Button>
    </Card>
  );
}


/* ============ Tic Tac Toe ============ */

const TTT_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function tttWinner(b: (string | null)[]) {
  for (const [a, c, d] of TTT_LINES) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  if (b.every(Boolean)) return "draw";
  return null;
}

function TTT() {
  const { user } = useAuth();
  const { partner, me } = useCouple();
  const session = useGameSession("ttt");
  const { state, setState, reset } = session;

  // Lazy init game-specific fields once both players are in (started=true)
  useEffect(() => {
    if (!state?.started) return;
    if (state.board) return;
    if (!user || !partner) return;
    const host = state.players?.[0] ?? user.id;
    const guest = state.players?.find((p: string) => p !== host) ?? partner.id;
    setState({
      ...state,
      board: Array(9).fill(null),
      turn: host,
      x: host,
      o: guest,
      scores: { [host]: 0, [guest]: 0 },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.started, state?.board]);

  return (
    <LobbyGate
      kind="ttt"
      state={state}
      setState={setState}
      reset={reset}
      initialGameState={{}}
    >
      {state?.board ? (
        <TTTBoard session={session} user={user} partner={partner} me={me} />
      ) : (
        <Card className="p-6 text-center">
          <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-2">Setting up the board...</p>

        </Card>
      )}
    </LobbyGate>
  );
}

function TTTBoard({ session, user, partner, me }: any) {
  const { state, setState, reset } = session;
  const { board, turn, x, o, scores } = state as {
    board: (string | null)[];
    turn: string;
    x: string;
    o: string;
    scores: Record<string, number>;
  };
  const winner = tttWinner(board);
  const myMark = user?.id === x ? "X" : "O";

  const move = async (i: number) => {
    if (winner || board[i] || turn !== user?.id) return;
    const mark = user.id === x ? "X" : "O";
    const next = [...board];
    next[i] = mark;
    const w = tttWinner(next);
    let nextScores = scores;
    if (w && w !== "draw") {
      const winnerId = w === "X" ? x : o;
      nextScores = { ...scores, [winnerId]: (scores[winnerId] ?? 0) + 1 };
    }
    await setState({ ...state, board: next, turn: turn === x ? o : x, scores: nextScores });
  };

  const newRound = async () => {
    await setState({
      ...state,
      board: Array(9).fill(null),
      turn: winner === "X" ? o : winner === "O" ? x : turn,
    });
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span>You ({myMark}): <b>{user ? scores[user.id] ?? 0 : 0}</b></span>
        <span>{partner?.display_name ?? "Partner"}: <b>{partner ? scores[partner.id] ?? 0 : 0}</b></span>
      </div>
      <div className="text-center text-sm">
        {winner
          ? winner === "draw"
            ? "It's a draw 🤝"
            : (winner === myMark ? "You win! 🎉" : "You lose 😅")
          : turn === user?.id ? "Your turn" : `${partner?.display_name ?? "Partner"}'s turn`}
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => move(i)}
            disabled={!!cell || !!winner || turn !== user?.id}
            className="aspect-square rounded-xl border text-3xl font-bold bg-muted/40 hover:bg-muted disabled:opacity-100"
          >
            {cell === "X" ? "❌" : cell === "O" ? "⭕" : ""}
          </button>
        ))}
      </div>
      {winner && <Button className="w-full" onClick={newRound}>Next Round</Button>}
      <Button variant="ghost" size="sm" className="w-full" onClick={reset}>
        <RotateCcw className="w-4 h-4 mr-1" /> End room
      </Button>

    </Card>
  );
}

/* ============ Would You Rather ============ */

const WYR_POOL: [string, string][] = [
  ["Massage forever", "Cuddle forever"],
  ["Beach trip", "Mountain trip"],
  ["Early to bed, early to rise", "Late to bed, late to rise"],
  ["Cook together", "Order food in"],
  ["Movie night at home", "Date night out"],
  ["I always drive", "You always drive"],
  ["Learn a new language", "Learn a new instrument"],
  ["Have a pet dog", "Have a pet cat"],
  ["Forever summer", "Forever winter"],
  ["Sweet texts all day", "One long call at night"],
  ["No wifi for a week", "No AC for a week"],
  ["Have a baby right away", "Travel first for 5 years"],
];


const pickWYR = () => WYR_POOL[Math.floor(Math.random() * WYR_POOL.length)];

function WYR() {
  const { user } = useAuth();
  const { partner, me } = useCouple();
  const session = useGameSession("wyr");
  const { state, setState, reset } = session;

  // Init question once both joined
  useEffect(() => {
    if (!state?.started) return;
    if (state.a) return;
    const [a, b] = pickWYR();
    setState({ ...state, a, b, picks: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.started, state?.a]);

  return (
    <LobbyGate kind="wyr" state={state} setState={setState} reset={reset} initialGameState={{}}>
      {state?.a ? (
        <WYRBoard session={session} user={user} partner={partner} me={me} />
      ) : (
        <Card className="p-6 text-center">
          <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
        </Card>
      )}
    </LobbyGate>
  );
}

function WYRBoard({ session, user, partner, me }: any) {
  const { state, setState, reset } = session;
  const picks: Record<string, "a" | "b"> = state.picks ?? {};
  const myPick = user ? picks[user.id] : undefined;
  const both = user && partner && picks[user.id] && picks[partner.id];
  const sameAnswer = both && picks[user.id] === picks[partner.id];

  const pick = async (which: "a" | "b") => {
    if (!user || myPick) return;
    await setState({ ...state, picks: { ...picks, [user.id]: which } });
  };

  const newQ = async () => {
    const [a, b] = pickWYR();
    await setState({ ...state, a, b, picks: {} });
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="text-center text-sm text-muted-foreground">Would you rather...</div>
      <div className="grid gap-2">
        {(["a", "b"] as const).map((k) => (
          <button
            key={k}
            onClick={() => pick(k)}
            disabled={!!myPick}
            className={`p-4 rounded-xl border text-left transition ${
              myPick === k ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
            } ${myPick && myPick !== k ? "opacity-50" : ""}`}
          >
            <div className="font-medium">{state[k]}</div>
            {both && (
              <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                {user && picks[user.id] === k && <span>• {me?.display_name ?? "You"}</span>}
                {partner && picks[partner.id] === k && <span>• {partner?.display_name ?? "Partner"}</span>}
              </div>
            )}
          </button>
        ))}
      </div>
      {both && (
        <div className="text-center text-sm">
          {sameAnswer ? "You agree! 💖" : "Different answers 😄"}
        </div>
      )}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={newQ}>New question</Button>
        <Button variant="ghost" size="icon" onClick={reset} aria-label="Reset">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

    </Card>
  );
}

/* ============ Truth or Dare ============ */

const TRUTHS = [
  "What was your first thought when you saw me?",
  "What's the most cringe moment in our relationship?",
  "What's a secret you haven't told me yet?",
  "When was the last time you cried because of me?",
  "Who was the last person to text you besides me?",
  "What did you miss yesterday that you didn't say?",
  "What's one habit of mine you'd like me to stop?",
  "What's my cutest habit?",
];
const DARES = [
  "Send a voice message singing a song for me.",
  "Take a selfie right now and send it here.",
  "Tell me 3 things you love about me.",
  "Imitate my favorite celebrity.",
  "Text your parent 'I love you'.",
  "Send a funny meme right now.",
  "Say out loud: 'I love you so much!' (record it).",
  "Dance for 10 seconds, record it.",
];


function ToD() {
  const { user } = useAuth();
  const { partner, me } = useCouple();
  const session = useGameSession("tod");
  const { state, setState, reset } = session;

  return (
    <LobbyGate kind="tod" state={state} setState={setState} reset={reset} initialGameState={{}}>
      <ToDBoard session={session} user={user} partner={partner} me={me} />
    </LobbyGate>
  );
}

function ToDBoard({ session, user, partner, me }: any) {
  const { state, setState, reset } = session;

  const start = async (kind: "truth" | "dare", target: "me" | "partner") => {
    if (!user || !partner) return;
    const pool = kind === "truth" ? TRUTHS : DARES;
    const prompt = pool[Math.floor(Math.random() * pool.length)];
    const forId = target === "me" ? user.id : partner.id;
    await setState({ ...state, prompt: { kind, text: prompt, for: forId, picked_by: user.id } });
  };

  const clearPrompt = async () => {
    await setState({ ...state, prompt: null });
  };

  const prompt = state?.prompt;

  if (!prompt) {
    return (
      <Card className="p-4 space-y-3">
        <p className="text-sm text-center text-muted-foreground">Pick for whom and what:</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => start("truth", "partner")}>
            Truth for {partner?.display_name ?? "Partner"}
          </Button>
          <Button variant="outline" onClick={() => start("dare", "partner")}>
            Dare for {partner?.display_name ?? "Partner"}
          </Button>
          <Button variant="outline" onClick={() => start("truth", "me")}>Truth for me</Button>
          <Button variant="outline" onClick={() => start("dare", "me")}>Dare for me</Button>
        </div>
        <Button variant="ghost" size="sm" className="w-full" onClick={reset}>
          <RotateCcw className="w-4 h-4 mr-1" /> End room
        </Button>
      </Card>
    );
  }

  const forMe = prompt.for === user?.id;
  const forName = forMe ? (me?.display_name ?? "You") : (partner?.display_name ?? "Partner");

  return (
    <Card className="p-4 space-y-3 text-center">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {prompt.kind === "truth" ? "Truth" : "Dare"} for {forName}
      </div>
      <div className="text-lg font-medium py-4 px-2">{prompt.text}</div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={clearPrompt}>Done</Button>
        <Button variant="ghost" size="icon" onClick={reset} aria-label="Reset">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}


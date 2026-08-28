import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/couple";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Heart, Check, Upload, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({ component: Settings });

const MOODS = ["💛 happy", "🥰 in love", "🌧️ tender", "✨ dreamy", "🌙 sleepy", "☀️ bright"];

function Settings() {
  const { signOut, user } = useAuth();
  const { couple, me, refresh } = useCouple();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [name, setName] = useState("");
  const [mood, setMood] = useState("");
  const [startedAt, setStartedAt] = useState<string>("");
  const [bucket, setBucket] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [bgBlur, setBgBlur] = useState(0);
  const [bgDim, setBgDim] = useState(30);
  const [bgTheme, setBgTheme] = useState<"auto" | "light" | "dark">("auto");
  const [uploadingBg, setUploadingBg] = useState(false);

  useEffect(() => {
    if (me) {
      setNickname(me.nickname ?? "");
      setName(me.display_name ?? "");
      setMood(me.mood ?? "");
    }
    if (couple) {
      setStartedAt(couple.started_at ?? "");
      setBgUrl(couple.bg_url ?? null);
      setBgBlur(couple.bg_blur ?? 0);
      setBgDim(couple.bg_dim ?? 30);
      setBgTheme((couple.bg_text_theme as any) ?? "auto");
    }
  }, [me?.id, couple?.id, couple?.bg_url, couple?.bg_blur, couple?.bg_dim, couple?.bg_text_theme]);

  async function saveBg(patch: Partial<{ bg_url: string | null; bg_blur: number; bg_dim: number; bg_text_theme: string }>) {
    if (!couple) return;
    await supabase.from("couples").update(patch as any).eq("id", couple.id);
    refresh();
  }

  async function onBgFile(file: File) {
    if (!user || !couple) return;
    setUploadingBg(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/bg/${couple.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setBgUrl(data.publicUrl);
      await saveBg({ bg_url: data.publicUrl });
      toast.success("Shared background updated");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploadingBg(false);
    }
  }

  async function removeBg() {
    setBgUrl(null);
    await saveBg({ bg_url: null });
  }


  useEffect(() => {
    if (!couple) return;
    supabase.from("bucket_list").select("*").eq("couple_id", couple.id).order("created_at")
      .then(({ data }) => setBucket((data as any) || []));
  }, [couple?.id]);

  async function saveProfile() {
    if (!user) return;
    await supabase.from("profiles").update({ nickname, display_name: name, mood }).eq("id", user.id);
    if (couple) await supabase.from("couples").update({ started_at: startedAt || null }).eq("id", couple.id);
    toast.success("Saved");
    refresh();
  }

  async function addGoal() {
    if (!couple || !newGoal.trim()) return;
    const { data } = await supabase.from("bucket_list").insert({ couple_id: couple.id, title: newGoal.trim() }).select().single();
    if (data) setBucket((b) => [...b, data as any]);
    setNewGoal("");
  }
  async function toggleGoal(id: string, completed: boolean) {
    await supabase.from("bucket_list").update({ completed: !completed }).eq("id", id);
    setBucket((b) => b.map((x) => x.id === id ? { ...x, completed: !completed } : x));
  }

  return (
    <div className="px-5 pt-10 pb-6 max-w-xl mx-auto space-y-5">
      <header>
        <p className="font-script text-xl text-primary">just for you two</p>
        <h1 className="font-serif text-3xl">Settings</h1>
      </header>

      <section className="paper p-5 space-y-3">
        <h2 className="font-serif text-xl">Your profile</h2>
        <Field label="Display name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Nickname (what they call you)"><input className="input" value={nickname} onChange={(e) => setNickname(e.target.value)} /></Field>
        <Field label="Today's mood">
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button key={m} onClick={() => setMood(m)} className={`text-xs px-3 py-1.5 rounded-full border ${mood === m ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card"}`}>{m}</button>
            ))}
          </div>
        </Field>
        <Field label="Anniversary / start date"><input type="date" className="input" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} /></Field>
        <button onClick={saveProfile} className="w-full py-2.5 rounded-2xl bg-primary text-primary-foreground font-medium">Save</button>
      </section>

      <section className="paper p-5 space-y-4">
        <h2 className="font-serif text-xl">Shared background</h2>
        <p className="text-xs text-muted-foreground -mt-2">Both of you will see this wallpaper.</p>

        <div className="relative h-32 rounded-2xl overflow-hidden border border-border bg-secondary">
          {bgUrl ? (
            <>
              <img src={bgUrl} alt="" className="w-full h-full object-cover" style={{ filter: bgBlur ? `blur(${bgBlur / 2}px)` : undefined }} />
              <div className="absolute inset-0" style={{ background: (bgTheme === "dark") ? `rgba(0,0,0,${bgDim / 100})` : `rgba(255,255,255,${bgDim / 100})` }} />
              <button onClick={removeBg} className="absolute top-2 right-2 bg-background/80 backdrop-blur rounded-full p-1.5 hover:bg-background">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No custom background</div>
          )}
        </div>
        <label className="block">
          <div className="w-full py-2.5 rounded-2xl bg-primary text-primary-foreground font-medium text-center text-sm flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            {uploadingBg ? "Uploading…" : bgUrl ? "Change background" : "Upload background"}
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploadingBg}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onBgFile(f); e.target.value = ""; }}
          />
        </label>
        {bgUrl && (
          <>
            <Field label={`Blur · ${bgBlur}px`}>
              <input type="range" min={0} max={40} value={bgBlur} onChange={(e) => setBgBlur(+e.target.value)} onPointerUp={() => saveBg({ bg_blur: bgBlur })} className="w-full" />
            </Field>
            <Field label={`Dim · ${bgDim}%`}>
              <input type="range" min={0} max={80} value={bgDim} onChange={(e) => setBgDim(+e.target.value)} onPointerUp={() => saveBg({ bg_dim: bgDim })} className="w-full" />
            </Field>
            <Field label="Text color">
              <div className="flex gap-2">
                {(["auto", "light", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setBgTheme(t); saveBg({ bg_text_theme: t }); }}
                    className={`flex-1 text-xs py-2 rounded-full border capitalize ${bgTheme === t ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}
      </section>

      {couple && (
        <section className="paper p-5">
          <h2 className="font-serif text-xl mb-2">Your invite code</h2>
          <p className="font-serif text-3xl tracking-[0.3em] text-center bg-secondary py-3 rounded-2xl">{couple.invite_code}</p>
          <p className="text-xs text-muted-foreground text-center mt-2">Only one other account can join.</p>
        </section>
      )}

      <section className="paper p-5">
        <h2 className="font-serif text-xl mb-3">Bucket list</h2>
        <div className="flex gap-2 mb-3">
          <input className="input flex-1" placeholder="A trip, a recipe, a concert…" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} />
          <button onClick={addGoal} className="px-4 rounded-2xl bg-primary text-primary-foreground text-sm">Add</button>
        </div>
        <ul className="space-y-2">
          {bucket.map((g) => (
            <li key={g.id}>
              <button onClick={() => toggleGoal(g.id, g.completed)} className="w-full flex items-center gap-3 py-2">
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${g.completed ? "bg-primary border-primary" : "border-border"}`}>
                  {g.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                </span>
                <span className={`text-sm ${g.completed ? "line-through text-muted-foreground" : ""}`}>{g.title}</span>
              </button>
            </li>
          ))}
          {bucket.length === 0 && <p className="text-sm text-muted-foreground">No goals yet. Dream together.</p>}
        </ul>
      </section>

      <button onClick={async () => { await signOut(); navigate({ to: "/" }); }} className="w-full py-3 rounded-2xl border border-border flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <LogOut className="w-4 h-4" /> Sign out
      </button>

      <style>{`.input{width:100%;padding:.7rem 1rem;border-radius:1rem;background:var(--input);border:1px solid var(--border);font-size:.875rem;outline:none}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

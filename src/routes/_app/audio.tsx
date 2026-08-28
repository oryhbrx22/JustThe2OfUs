import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/couple";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Mic, Pause, Play, Heart, Square, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/audio")({ component: Audio });

type Item = { id: string; url: string; title: string | null; is_favorite: boolean; created_at: string };

function Audio() {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [items, setItems] = useState<Item[]>([]);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function extractAudioPath(url: string | null): string | null {
    if (!url) return null;
    const marker = "/audio/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.slice(idx + marker.length).split("?")[0];
  }

  async function signAudio(rows: Item[]): Promise<Item[]> {
    const paths = rows.map((r) => extractAudioPath(r.url)).filter((p): p is string => !!p);
    if (paths.length === 0) return rows;
    const { data } = await supabase.storage.from("audio").createSignedUrls(paths, 60 * 60 * 6);
    const map = new Map<string, string>();
    data?.forEach((d) => { if (d.path && d.signedUrl) map.set(d.path, d.signedUrl); });
    return rows.map((r) => {
      const p = extractAudioPath(r.url);
      const signed = p ? map.get(p) : null;
      return signed ? { ...r, url: signed } : r;
    });
  }

  useEffect(() => {
    if (!couple) return;
    (async () => {
      const { data } = await supabase.from("audio_items").select("*").eq("couple_id", couple.id).order("created_at", { ascending: false });
      const signed = await signAudio((data as Item[]) || []);
      setItems(signed);
    })();
  }, [couple?.id]);

  async function uploadBlob(blob: Blob, title: string) {
    if (!user || !couple) return;
    setBusy(true);
    const ext = blob.type.includes("mp3") ? "mp3" : blob.type.includes("wav") ? "wav" : "webm";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("audio").upload(path, blob, { contentType: blob.type });
    if (error) { toast.error(error.message); setBusy(false); return; }
    const { data } = supabase.storage.from("audio").getPublicUrl(path);
    const { data: row, error: insErr } = await supabase.from("audio_items").insert({
      couple_id: couple.id, uploader_id: user.id, url: data.publicUrl, title,
    }).select().single();
    if (insErr) toast.error(insErr.message);
    else {
      const [signed] = await signAudio([row as Item]);
      setItems((prev) => [signed, ...prev]);
    }
    setBusy(false);
  }


  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        await uploadBlob(blob, `Voice memory · ${new Date().toLocaleString()}`);
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch {
      toast.error("Could not access microphone");
    }
  }
  function stopRec() {
    recRef.current?.stop();
    setRecording(false);
  }

  async function toggleFav(it: Item) {
    await supabase.from("audio_items").update({ is_favorite: !it.is_favorite }).eq("id", it.id);
    setItems((p) => p.map((x) => (x.id === it.id ? { ...x, is_favorite: !it.is_favorite } : x)));
  }

  async function renameItem(it: Item, title: string) {
    const trimmed = title.trim();
    if (!trimmed || trimmed === it.title) return;
    const { error } = await supabase.from("audio_items").update({ title: trimmed }).eq("id", it.id);
    if (error) { toast.error(error.message); return; }
    setItems((p) => p.map((x) => (x.id === it.id ? { ...x, title: trimmed } : x)));
  }

  async function deleteItem(it: Item) {
    if (!confirm("Delete this recording? This cannot be undone.")) return;
    const { error } = await supabase.from("audio_items").delete().eq("id", it.id);
    if (error) { toast.error(error.message); return; }
    try {
      const marker = "/audio/";
      const idx = it.url.indexOf(marker);
      if (idx !== -1) {
        const path = it.url.slice(idx + marker.length);
        await supabase.storage.from("audio").remove([path]);
      }
    } catch {}
    setItems((p) => p.filter((x) => x.id !== it.id));
  }

  return (
    <div className="px-5 pt-10 pb-6 max-w-xl mx-auto">
      <header className="flex items-end justify-between mb-5">
        <div>
          <p className="font-script text-xl text-primary">echoes & whispers</p>
          <h1 className="font-serif text-3xl">Audio vault</h1>
        </div>
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadBlob(e.target.files[0], e.target.files[0].name)} />
        <button onClick={() => fileRef.current?.click()} className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center">
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <div className="paper p-6 text-center mb-6">
        <button
          onClick={recording ? stopRec : startRec}
          disabled={busy}
          className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center shadow-soft transition ${
            recording ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary text-primary-foreground"
          }`}
        >
          {recording ? <Square className="w-7 h-7" fill="currentColor" /> : <Mic className="w-7 h-7" />}
        </button>
        <p className="text-sm text-muted-foreground mt-3">{recording ? "Recording… tap to stop" : "Tap to record a voice memory"}</p>
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No recordings yet. Leave them a voice note.</p>
        )}
        {items.map((it) => (
          <Player key={it.id} item={it} onFav={() => toggleFav(it)} onRename={(t) => renameItem(it, t)} onDelete={() => deleteItem(it)} />
        ))}
      </div>
    </div>
  );
}

function Player({ item, onFav, onRename, onDelete }: { item: Item; onFav: () => void; onRename: (title: string) => void; onDelete: () => void }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title || "");
  return (
    <div className="paper p-4 flex items-center gap-3">
      <button
        onClick={() => {
          if (!ref.current) return;
          if (playing) { ref.current.pause(); } else { ref.current.play(); }
        }}
        className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0"
      >
        {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { onRename(title); setEditing(false); }
                if (e.key === "Escape") { setTitle(item.title || ""); setEditing(false); }
              }}
              className="flex-1 min-w-0 text-sm bg-transparent border-b border-border outline-none py-0.5"
            />
            <button onClick={() => { onRename(title); setEditing(false); }} className="p-1 text-primary"><Check className="w-4 h-4" /></button>
            <button onClick={() => { setTitle(item.title || ""); setEditing(false); }} className="p-1 text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-left w-full group flex items-center gap-1.5">
            <span className="text-sm truncate">{item.title || "Untitled"}</span>
            <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
          </button>
        )}
        <p className="text-[11px] text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
        <audio
          ref={ref}
          src={item.url}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          className="w-full mt-1"
          preload="none"
        />
      </div>
      <div className="flex flex-col gap-2 shrink-0">
        <button onClick={onFav} className="text-muted-foreground">
          <Heart className={`w-5 h-5 ${item.is_favorite ? "text-primary" : ""}`} fill={item.is_favorite ? "currentColor" : "none"} />
        </button>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/couple";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Lock, BookHeart, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/notes")({ component: Notes });

type Note = {
  id: string; author_id: string; title: string | null; content: string;
  mood: string | null; is_private: boolean; handwritten: boolean; created_at: string;
};

const MOODS = ["💛", "🥰", "🌧️", "✨", "🌙", "☀️"];

function Notes() {
  const { user } = useAuth();
  const { couple, partner, me } = useCouple();
  const [notes, setNotes] = useState<Note[]>([]);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({ title: "", content: "", mood: "💛", is_private: false, handwritten: false });

  useEffect(() => {
    if (!couple) return;
    supabase.from("notes").select("*").eq("couple_id", couple.id).order("created_at", { ascending: false })
      .then(({ data }) => setNotes((data as Note[]) || []));
  }, [couple?.id]);

  async function save() {
    if (!couple || !user || !draft.content.trim()) return;
    const { data, error } = await supabase.from("notes").insert({
      couple_id: couple.id, author_id: user.id, ...draft,
    }).select().single();
    if (error) return toast.error(error.message);
    setNotes((n) => [data as Note, ...n]);
    setDraft({ title: "", content: "", mood: "💛", is_private: false, handwritten: false });
    setComposing(false);
    toast.success("Note saved");
  }

  async function remove(id: string) {
    await supabase.from("notes").delete().eq("id", id);
    setNotes((n) => n.filter((x) => x.id !== id));
  }

  return (
    <div className="px-5 pt-10 pb-6 max-w-xl mx-auto">
      <header className="flex items-end justify-between mb-5">
        <div>
          <p className="font-script text-xl text-primary">love, in writing</p>
          <h1 className="font-serif text-3xl">Notes</h1>
        </div>
        <button onClick={() => setComposing(true)} className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft">
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {composing && (
        <div className="paper p-5 mb-5">
          <input
            placeholder="Title (optional)"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="w-full bg-transparent font-serif text-2xl outline-none placeholder:text-muted-foreground/60"
          />
          <textarea
            placeholder="What do you want to say to them?"
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            rows={5}
            className={`w-full bg-transparent mt-2 outline-none text-sm resize-none ${draft.handwritten ? "font-script text-2xl leading-snug" : ""}`}
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {MOODS.map((m) => (
              <button key={m} onClick={() => setDraft({ ...draft, mood: m })} className={`w-9 h-9 rounded-full text-lg ${draft.mood === m ? "bg-accent" : "bg-secondary"}`}>{m}</button>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <label className="flex items-center gap-2"><input type="checkbox" checked={draft.is_private} onChange={(e) => setDraft({ ...draft, is_private: e.target.checked })} /> Private draft</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={draft.handwritten} onChange={(e) => setDraft({ ...draft, handwritten: e.target.checked })} /> Handwritten</label>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setComposing(false)} className="flex-1 py-2.5 rounded-2xl border border-border text-sm">Cancel</button>
            <button onClick={save} className="flex-1 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-medium">Save</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {notes.length === 0 && !composing && (
          <div className="paper p-10 text-center">
            <BookHeart className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-serif text-xl">Write your first note</p>
            <p className="text-sm text-muted-foreground mt-1">Little messages they can read whenever.</p>
          </div>
        )}
        {notes.map((n) => {
          const author = n.author_id === user?.id ? me : partner;
          return (
            <article key={n.id} className="paper p-5 relative">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{n.mood}</span>
                <div className="flex-1">
                  {n.title && <h3 className="font-serif text-xl">{n.title}</h3>}
                  <p className={`mt-1 ${n.handwritten ? "font-script text-2xl leading-snug" : "text-sm"} whitespace-pre-wrap text-foreground/90`}>
                    {n.content}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-3">
                    {author?.nickname || author?.display_name || "anon"} · {new Date(n.created_at).toLocaleDateString()}
                    {n.is_private && <span className="ml-2 inline-flex items-center gap-1"><Lock className="w-3 h-3" />private</span>}
                  </p>
                </div>
                {n.author_id === user?.id && (
                  <button onClick={() => remove(n.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

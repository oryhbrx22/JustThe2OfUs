import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/couple";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Heart, X, Trash2, Folder, FolderPlus, ChevronLeft, Pencil, Calendar, FolderInput, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import useEmblaCarousel from "embla-carousel-react";

export const Route = createFileRoute("/_app/gallery")({ component: Gallery });

type Item = {
  id: string;
  url: string;
  caption: string | null;
  album: string | null;
  album_id: string | null;
  is_favorite: boolean;
  created_at: string;
};

type Album = {
  id: string;
  name: string;
  album_date: string | null;
  created_at: string;
};

const PAGE_SIZE = 12;
const MAX_UPLOAD_DIMENSION = 1400;

function galleryImageUrl(url: string, _width: number, _height?: number, _quality = 70) {
  // Signed URLs are pre-generated; just return as-is.
  return url;
}

function extractGalleryPath(url: string): string | null {
  const marker = "/gallery/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length).split("?")[0];
}

async function signItems(items: Item[]): Promise<Item[]> {
  const paths = items
    .map((it) => extractGalleryPath(it.url))
    .filter((p): p is string => !!p);
  if (paths.length === 0) return items;
  const { data, error } = await supabase.storage
    .from("gallery")
    .createSignedUrls(paths, 60 * 60 * 6);
  if (error || !data) return items;
  const map = new Map<string, string>();
  data.forEach((d) => {
    if (d.path && d.signedUrl) map.set(d.path, d.signedUrl);
  });
  return items.map((it) => {
    const p = extractGalleryPath(it.url);
    const signed = p ? map.get(p) : null;
    return signed ? { ...it, url: signed } : it;
  });
}

async function compressImage(file: File) {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size < 900_000)
    return file;
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = objectUrl;
    });
    const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.78),
    );
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${name}.webp`, { type: "image/webp" });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function Gallery() {
  const { user } = useAuth();
  const { couple } = useCouple();
  const coupleId = couple?.id;
  const [items, setItems] = useState<Item[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [currentAlbum, setCurrentAlbum] = useState<string | null>(null); // null = home (album list), "all" = all photos, id = album
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [movingItem, setMovingItem] = useState<Item | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!coupleId) {
      setItems([]); setAlbums([]); setHasMore(false); return;
    }
    let cancelled = false;
    setInitialLoading(true);
    Promise.all([
      supabase.from("gallery_items").select("id,url,caption,album,album_id,is_favorite,created_at")
        .eq("couple_id", coupleId).order("created_at", { ascending: false }).range(0, PAGE_SIZE - 1),
      supabase.from("gallery_albums").select("id,name,album_date,created_at")
        .eq("couple_id", coupleId).order("created_at", { ascending: false }),
    ]).then(async ([itRes, alRes]) => {
      if (cancelled) return;
      if (itRes.error) toast.error(itRes.error.message);
      if (alRes.error) toast.error(alRes.error.message);
      const rawRows = (itRes.data as Item[]) || [];
      const rows = await signItems(rawRows);
      if (cancelled) return;
      setItems(rows);
      setAlbums((alRes.data as Album[]) || []);
      setHasMore(rawRows.length === PAGE_SIZE);
      setInitialLoading(false);
    });
    return () => { cancelled = true; };
  }, [coupleId]);

  async function loadMore() {
    if (!couple || loadingMore) return;
    setLoadingMore(true);
    const { data, error } = await supabase
      .from("gallery_items")
      .select("id,url,caption,album,album_id,is_favorite,created_at")
      .eq("couple_id", couple.id)
      .order("created_at", { ascending: false })
      .range(items.length, items.length + PAGE_SIZE - 1);
    if (error) toast.error(error.message);
    else {
      const rawRows = (data as Item[]) || [];
      const rows = await signItems(rawRows);
      setItems((prev) => [...prev, ...rows]);
      setHasMore(rawRows.length === PAGE_SIZE);
    }
    setLoadingMore(false);
  }

  async function upload(files: FileList) {
    if (!user || !couple) return;
    setBusy(true);
    const targetAlbumId = currentAlbum && currentAlbum !== "all" ? currentAlbum : null;
    for (const file of Array.from(files)) {
      const optimizedFile = await compressImage(file);
      const safeName = optimizedFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from("gallery").upload(path, optimizedFile);
      if (error) { toast.error(error.message); continue; }
      const { data } = supabase.storage.from("gallery").getPublicUrl(path);
      const { data: row, error: insErr } = await supabase.from("gallery_items").insert({
        couple_id: couple.id, uploader_id: user.id, url: data.publicUrl, album_id: targetAlbumId,
      }).select().single();
      if (insErr) { toast.error(insErr.message); continue; }
      const [signed] = await signItems([row as Item]);
      setItems((prev) => [signed, ...prev]);
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function toggleFav(it: Item) {
    const { error } = await supabase.from("gallery_items").update({ is_favorite: !it.is_favorite }).eq("id", it.id);
    if (!error) setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, is_favorite: !it.is_favorite } : x)));
  }

  async function setCaption(it: Item, caption: string) {
    await supabase.from("gallery_items").update({ caption }).eq("id", it.id);
    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, caption } : x)));
  }

  async function deleteItem(it: Item) {
    if (!confirm("Delete this photo? This cannot be undone.")) return;
    const { error } = await supabase.from("gallery_items").delete().eq("id", it.id);
    if (error) { toast.error(error.message); return; }
    try {
      const marker = "/gallery/";
      const idx = it.url.indexOf(marker);
      if (idx !== -1) await supabase.storage.from("gallery").remove([it.url.slice(idx + marker.length)]);
    } catch (e) { console.warn("storage cleanup failed", e); }
    setItems((prev) => prev.filter((x) => x.id !== it.id));
    setViewerIndex(null);
  }

  async function createAlbum() {
    if (!couple) return;
    const name = prompt("Album name?");
    if (!name?.trim()) return;
    const { data, error } = await supabase.from("gallery_albums").insert({
      couple_id: couple.id, name: name.trim(),
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setAlbums((prev) => [data as Album, ...prev]);
  }

  async function saveAlbum(album: Album, name: string, date: string) {
    const { error } = await supabase.from("gallery_albums")
      .update({ name: name.trim() || album.name, album_date: date || null })
      .eq("id", album.id);
    if (error) { toast.error(error.message); return; }
    setAlbums((prev) => prev.map((a) => a.id === album.id ? { ...a, name: name.trim() || a.name, album_date: date || null } : a));
    setEditingAlbum(null);
  }

  async function deleteAlbum(album: Album) {
    if (!confirm(`Delete album "${album.name}"? Photos inside will move back to All Photos.`)) return;
    const { error } = await supabase.from("gallery_albums").delete().eq("id", album.id);
    if (error) { toast.error(error.message); return; }
    setAlbums((prev) => prev.filter((a) => a.id !== album.id));
    setItems((prev) => prev.map((x) => x.album_id === album.id ? { ...x, album_id: null } : x));
    if (currentAlbum === album.id) setCurrentAlbum(null);
  }

  async function moveItemToAlbum(it: Item, albumId: string | null) {
    const { error } = await supabase.from("gallery_items").update({ album_id: albumId }).eq("id", it.id);
    if (error) { toast.error(error.message); return; }
    setItems((prev) => prev.map((x) => x.id === it.id ? { ...x, album_id: albumId } : x));
    setMovingItem(null);
    toast.success("Moved");
  }

  const visibleItems = useMemo(() => {
    if (currentAlbum === null) return [];
    if (currentAlbum === "all") return items;
    return items.filter((it) => it.album_id === currentAlbum);
  }, [items, currentAlbum]);

  const currentAlbumObj = currentAlbum && currentAlbum !== "all"
    ? albums.find((a) => a.id === currentAlbum) : null;

  function albumCover(albumId: string) {
    return items.find((it) => it.album_id === albumId);
  }

  return (
    <div className="px-5 pt-10 pb-6 max-w-3xl mx-auto">
      <header className="flex items-end justify-between mb-5 gap-3">
        <div className="min-w-0">
          {currentAlbum !== null ? (
            <>
              <button onClick={() => setCurrentAlbum(null)} className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                <ChevronLeft className="w-4 h-4" /> Albums
              </button>
              <h1 className="font-serif text-3xl truncate">
                {currentAlbum === "all" ? "All Photos" : currentAlbumObj?.name ?? "Album"}
              </h1>
              {currentAlbumObj?.album_date && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(currentAlbumObj.album_date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="font-script text-xl text-primary">memories, framed</p>
              <h1 className="font-serif text-3xl">Gallery</h1>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {currentAlbum !== null && currentAlbumObj && (
            <button onClick={() => setEditingAlbum(currentAlbumObj)}
              className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center">
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {currentAlbum === null ? (
            <button onClick={createAlbum}
              className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </button>
          ) : null}
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => e.target.files && upload(e.target.files)} />
          <button onClick={() => fileRef.current?.click()} disabled={busy}
            className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft disabled:opacity-50">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {initialLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-secondary animate-pulse" />
          ))}
        </div>
      ) : currentAlbum === null ? (
        // Album list view
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button onClick={() => setCurrentAlbum("all")}
            className="aspect-square rounded-2xl bg-card border border-border p-4 flex flex-col items-center justify-center gap-2 hover:bg-muted transition">
            <Folder className="w-8 h-8 text-primary" />
            <span className="font-serif text-lg">All Photos</span>
            <span className="text-xs text-muted-foreground">{items.length}+</span>
          </button>
          {albums.map((al) => {
            const cover = albumCover(al.id);
            const count = items.filter((it) => it.album_id === al.id).length;
            return (
              <button key={al.id} onClick={() => setCurrentAlbum(al.id)}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-secondary border border-border">
                {cover ? (
                  <img src={galleryImageUrl(cover.url, 320, 320, 70)} alt={al.name}
                    loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Folder className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left">
                  <div className="font-serif text-white text-base truncate">{al.name}</div>
                  <div className="text-[11px] text-white/80 flex items-center gap-1.5">
                    <span>{count} photo{count === 1 ? "" : "s"}</span>
                    {al.album_date && <span>· {new Date(al.album_date).toLocaleDateString()}</span>}
                  </div>
                </div>
              </button>
            );
          })}
          {albums.length === 0 && items.length === 0 && (
            <div className="col-span-full paper p-10 text-center">
              <p className="font-serif text-xl">Your scrapbook is waiting.</p>
              <p className="text-sm text-muted-foreground mt-1">Create an album or upload a photo to begin.</p>
            </div>
          )}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="paper p-10 text-center">
          <p className="font-serif text-xl">No photos here yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Tap + to add photos to this album.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-3">
            {visibleItems.map((it, index) => {
              const thumbUrl = galleryImageUrl(it.url, 220, 220, 68);
              return (
                <button key={it.id} onClick={() => setViewerIndex(index)}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-secondary contain-layout contain-paint">
                  <img src={thumbUrl}
                    srcSet={`${galleryImageUrl(it.url, 160, 160, 64)} 160w, ${thumbUrl} 220w, ${galleryImageUrl(it.url, 320, 320, 68)} 320w`}
                    sizes="(min-width: 640px) 168px, calc((100vw - 52px) / 3)"
                    alt={it.caption ?? "Shared gallery memory"}
                    loading={index < 2 ? "eager" : "lazy"} decoding="async"
                    fetchPriority={index === 0 ? "high" : "auto"}
                    className="w-full h-full object-cover sm:group-hover:scale-105 sm:transition-transform sm:duration-300" />
                  {it.is_favorite && (
                    <Heart className="absolute top-2 right-2 w-4 h-4 text-primary drop-shadow" fill="currentColor" />
                  )}
                </button>
              );
            })}
          </div>
          {currentAlbum === "all" && hasMore && (
            <button onClick={loadMore} disabled={loadingMore}
              className="mt-5 w-full rounded-full bg-card border border-border py-3 text-sm disabled:opacity-60">
              {loadingMore ? "Loading…" : "Load more photos"}
            </button>
          )}
        </>
      )}

      {/* Edit album modal */}
      {editingAlbum && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-6"
          onClick={() => setEditingAlbum(null)}>
          <div className="paper p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl">Edit album</h3>
            <div>
              <label className="text-xs text-muted-foreground">Name</label>
              <input id="al-name" defaultValue={editingAlbum.name}
                className="w-full mt-1 bg-transparent border-b border-border py-2 outline-none font-serif text-lg" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date
              </label>
              <input id="al-date" type="date" defaultValue={editingAlbum.album_date ?? ""}
                className="w-full mt-1 bg-transparent border-b border-border py-2 outline-none" />
            </div>
            <div className="flex justify-between items-center gap-2 pt-2">
              <button onClick={() => deleteAlbum(editingAlbum)}
                className="px-3 py-2 rounded-full text-sm text-destructive flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              <div className="flex gap-2">
                <button onClick={() => setEditingAlbum(null)}
                  className="px-4 py-2 rounded-full bg-card border border-border text-sm">Cancel</button>
                <button onClick={() => {
                  const n = (document.getElementById("al-name") as HTMLInputElement).value;
                  const d = (document.getElementById("al-date") as HTMLInputElement).value;
                  saveAlbum(editingAlbum, n, d);
                }} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move to album modal */}
      {movingItem && (
        <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-md flex items-center justify-center p-6"
          onClick={() => setMovingItem(null)}>
          <div className="paper p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl mb-3">Move to album</h3>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              <button onClick={() => moveItemToAlbum(movingItem, null)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted flex items-center gap-2">
                <Folder className="w-4 h-4 text-muted-foreground" /> No album
              </button>
              {albums.map((a) => (
                <button key={a.id} onClick={() => moveItemToAlbum(movingItem, a.id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted flex items-center gap-2">
                  <Folder className="w-4 h-4 text-primary" /> {a.name}
                </button>
              ))}
            </div>
            <button onClick={() => setMovingItem(null)}
              className="mt-3 w-full px-4 py-2 rounded-full bg-card border border-border text-sm">Cancel</button>
          </div>
        </div>
      )}

      {viewerIndex !== null && visibleItems[viewerIndex] && (
        <SwipeViewer
          items={visibleItems}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onIndexChange={setViewerIndex}
          onToggleFav={toggleFav}
          onSetCaption={setCaption}
          onMove={(it) => setMovingItem(it)}
          onDelete={deleteItem}
        />
      )}
    </div>
  );
}

function SwipeViewer({
  items, startIndex, onClose, onIndexChange,
  onToggleFav, onSetCaption, onMove, onDelete,
}: {
  items: Item[];
  startIndex: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  onToggleFav: (it: Item) => void;
  onSetCaption: (it: Item, caption: string) => void;
  onMove: (it: Item) => void;
  onDelete: (it: Item) => void;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ startIndex, loop: false });
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const i = emblaApi.selectedScrollSnap();
      setIndex(i);
      onIndexChange(i);
    };
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onIndexChange]);

  const current = items[index];
  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 sm:backdrop-blur-md flex flex-col">
      <button className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-card flex items-center justify-center"
        onClick={onClose}>
        <X className="w-5 h-5" />
      </button>
      {index > 0 && (
        <button onClick={() => emblaApi?.scrollPrev()}
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {index < items.length - 1 && (
        <button onClick={() => emblaApi?.scrollNext()}
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card items-center justify-center">
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
      <div className="flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {items.map((it) => (
            <div key={it.id} className="min-w-0 shrink-0 grow-0 basis-full h-full overflow-y-auto overscroll-contain">
              <div className="min-h-full flex items-start sm:items-center justify-center p-6">
                <img src={it.url} alt={it.caption ?? "Selected gallery memory"}
                  draggable={false}
                  className="max-w-full h-auto object-contain rounded-2xl select-none pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-5 max-w-xl mx-auto w-full">
        <div className="text-center text-xs text-muted-foreground mb-2">{index + 1} / {items.length}</div>
        <input key={current.id} defaultValue={current.caption ?? ""} placeholder="Add a caption…"
          onBlur={(e) => onSetCaption(current, e.target.value)}
          className="w-full bg-transparent border-b border-border py-2 text-center font-serif text-lg outline-none" />
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <button onClick={() => onToggleFav(current)}
            className="px-4 py-2 rounded-full bg-card border border-border flex items-center gap-2 text-sm">
            <Heart className={`w-4 h-4 ${current.is_favorite ? "text-primary" : ""}`}
              fill={current.is_favorite ? "currentColor" : "none"} />
            {current.is_favorite ? "Favorite" : "Mark favorite"}
          </button>
          <button onClick={() => onMove(current)}
            className="px-4 py-2 rounded-full bg-card border border-border flex items-center gap-2 text-sm">
            <FolderInput className="w-4 h-4" /> Move
          </button>
          <button onClick={() => onDelete(current)}
            className="px-4 py-2 rounded-full bg-card border border-border flex items-center gap-2 text-sm text-destructive">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

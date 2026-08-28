import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/couple";
import { Button } from "@/components/ui/button";
import {
  Camera,
  RefreshCw,
  Loader2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Heart,
  RotateCcw,
  PictureInPicture2,
  Minimize2,
} from "lucide-react";
import { toast } from "sonner";


export const Route = createFileRoute("/_app/photobooth")({
  component: PhotoBooth,
});

type Phase = "idle" | "countdown" | "capturing" | "processing" | "done";

type SnapPayload = {
  sessionId: string;
  userId: string;
  path: string;
};

type TemplateId = "minimal";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// ---------- Template registry (future-ready) ----------
type TemplateRenderInput = {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  meImg: HTMLImageElement;
  partnerImg: HTMLImageElement;
  meName: string;
  partnerName: string;
  dateStr: string;
};

type Template = {
  id: TemplateId;
  label: string;
  aspect: number; // width / height for a single panel (portrait 3/4)
  render: (i: TemplateRenderInput) => void;
};

function getMediaErrorMessage(e: any) {
  if (e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError") {
    return "Camera or mic permission was blocked. Please allow access to use Couple Mirror.";
  }
  if (e?.name === "NotReadableError" || String(e?.message ?? "").toLowerCase().includes("audio source")) {
    return "Your mic could not start. I started the camera first — tap the mic again to retry voice.";
  }
  if (e?.name === "NotFoundError") {
    return "No camera or mic was found on this device.";
  }
  return e?.message ?? "Camera / mic access could not start.";
}

function waitForVideoFrame(video: HTMLVideoElement) {
  return new Promise<void>((resolve) => {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
      resolve();
      return;
    }
    const done = () => resolve();
    video.addEventListener("loadedmetadata", done, { once: true });
    video.addEventListener("canplay", done, { once: true });
    setTimeout(done, 900);
  });
}

async function attachStreamToVideo(video: HTMLVideoElement | null, stream: MediaStream | null) {
  if (!video || !stream) return;
  if (video.srcObject !== stream) video.srcObject = stream;
  await waitForVideoFrame(video);
  await video.play().catch(() => {});
}

const TEMPLATES: Record<TemplateId, Template> = {
  minimal: {
    id: "minimal",
    label: "Minimal",
    aspect: 3 / 4,
    render: ({ ctx, canvas, meImg, partnerImg, meName, partnerName, dateStr }) => {
      // Paper background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const pad = Math.round(canvas.width * 0.05);
      const labelH = Math.round(canvas.width * 0.09);
      const footerH = Math.round(canvas.width * 0.14);
      const gap = Math.round(canvas.width * 0.035);
      const innerW = canvas.width - pad * 2;
      const panelH = (canvas.height - pad * 2 - footerH - gap - labelH * 2) / 2;
      const radius = Math.round(canvas.width * 0.04);

      const drawPanel = (img: HTMLImageElement, x: number, y: number, w: number, h: number, label: string) => {
        // label
        ctx.fillStyle = "#8a6b5c";
        ctx.font = `500 ${Math.round(labelH * 0.55)}px "Georgia", serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(label, x + 4, y + labelH / 2);

        const py = y + labelH;
        // frame shadow
        ctx.save();
        ctx.shadowColor = "rgba(120, 80, 60, 0.18)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 6;
        roundRect(ctx, x, py, w, h, radius);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.restore();

        // clip photo
        ctx.save();
        roundRect(ctx, x + 6, py + 6, w - 12, h - 12, radius - 4);
        ctx.clip();
        // cover fit
        const ir = img.width / img.height;
        const tr = (w - 12) / (h - 12);
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (ir > tr) {
          sw = img.height * tr;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / tr;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, x + 6, py + 6, w - 12, h - 12);
        ctx.restore();
      };

      drawPanel(meImg, pad, pad, innerW, panelH, meName);
      drawPanel(
        partnerImg,
        pad,
        pad + labelH + panelH + gap,
        innerW,
        panelH,
        partnerName,
      );

      // Footer: date + Solace branding
      const fy = canvas.height - pad - footerH;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#8a6b5c";
      ctx.font = `italic 400 ${Math.round(footerH * 0.28)}px "Georgia", serif`;
      ctx.fillText(dateStr, canvas.width / 2, fy + footerH * 0.35);

      ctx.fillStyle = "#c96a6a";
      ctx.font = `700 ${Math.round(footerH * 0.32)}px "Georgia", serif`;
      ctx.fillText("♥  Solace", canvas.width / 2, fy + footerH * 0.78);
    },
  },
};

function PhotoBooth() {
  const { user } = useAuth();
  const { couple, partner, me } = useCouple();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const snapsRef = useRef<Record<string, SnapPayload>>({});
  const sessionRef = useRef<string | null>(null);
  const negotiatingRef = useRef(false);
  const floatContainerRef = useRef<HTMLDivElement>(null);
  const pipWindowRef = useRef<Window | null>(null);


  const [camReady, setCamReady] = useState(false);
  const [partnerReady, setPartnerReady] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [composed, setComposed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [mediaStarted, setMediaStarted] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [template] = useState<TemplateId>("minimal");
  const [panelHeight, setPanelHeight] = useState<number>(280); // px, per panel (manual mode)
  const [autoFit, setAutoFit] = useState<boolean>(true);
  const [fit, setFit] = useState<"contain" | "cover">("contain");
  const [floating, setFloating] = useState(false);
  const [meHidden, setMeHidden] = useState(false);
  const [partnerHidden, setPartnerHidden] = useState(false);

  // Swipe-to-hide handler factory (horizontal swipe > 60px hides panel)
  const makeSwipeHandlers = (onHide: () => void) => {
    let startX = 0;
    let startY = 0;
    let tracking = false;
    return {
      onPointerDown: (e: React.PointerEvent) => {
        // Only react to touch/pen swipes so mouse clicks on controls aren't hijacked
        if (e.pointerType === "mouse") return;
        startX = e.clientX;
        startY = e.clientY;
        tracking = true;
      },
      onPointerUp: (e: React.PointerEvent) => {
        if (!tracking) return;
        tracking = false;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
          onHide();
        }
      },
      onPointerCancel: () => {
        tracking = false;
      },
    };
  };


  const meName = me?.nickname || me?.display_name || "Me";
  const partnerName = partner?.nickname || partner?.display_name || "Partner";

  // ------- camera + mic -------
  const syncTracksToPeer = useCallback((s: MediaStream) => {
    const pc = pcRef.current;
    if (!pc) return;
    s.getTracks().forEach((track) => {
      const transceiver = pc
        .getTransceivers()
        .find((tr) => tr.sender.track?.kind === track.kind || tr.receiver.track?.kind === track.kind);
      const sender = transceiver?.sender ?? pc.getSenders().find((sn) => sn.track?.kind === track.kind);
      if (sender) sender.replaceTrack(track);
      else pc.addTrack(track, s);
    });
  }, []);

  const stopStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setCamReady(false);
  }, []);

  const startMedia = useCallback(async (options?: { withAudio?: boolean; nextFacing?: "user" | "environment" }) => {
    setError(null);
    const wantedFacing = options?.nextFacing ?? facing;
    const wantsAudio = options?.withAudio ?? micOn;
    try {
      stopStream();
      const videoConstraints: MediaTrackConstraints | false = camOn
        ? { facingMode: wantedFacing, width: { ideal: 720 }, height: { ideal: 960 } }
        : false;
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };
      const videoPromise = navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: !videoConstraints && wantsAudio ? audioConstraints : false,
      });
      const audioPromise = videoConstraints && wantsAudio
        ? navigator.mediaDevices
            .getUserMedia({ audio: audioConstraints, video: false })
            .catch((audioError) => audioError)
        : Promise.resolve(null);
      const s = await videoPromise;
      localStreamRef.current = s;
      await attachStreamToVideo(localVideoRef.current, s);
      syncTracksToPeer(s);
      setCamReady(camOn);
      setMediaStarted(true);
      if (wantedFacing !== facing) setFacing(wantedFacing);
      if (videoConstraints && wantsAudio) {
        const audioOnly = await audioPromise;
        if (audioOnly instanceof MediaStream) {
          audioOnly.getAudioTracks().forEach((track) => s.addTrack(track));
          syncTracksToPeer(s);
          setMicOn(true);
        } else {
          setMicOn(false);
          setError(getMediaErrorMessage(audioOnly));
        }
      } else {
        setMicOn(wantsAudio && s.getAudioTracks().length > 0);
      }
      return s;
    } catch (e: any) {
      setError(getMediaErrorMessage(e));
      setCamReady(false);
      return null;
    }
  }, [camOn, facing, micOn, stopStream, syncTracksToPeer]);

  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = micOn));
  }, [micOn]);

  useEffect(() => {
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = camOn));
    setCamReady(mediaStarted && camOn && (localStreamRef.current?.getVideoTracks().length ?? 0) > 0);
  }, [camOn, mediaStarted]);

  // ------- WebRTC helpers -------
  const sendSignal = (event: string, payload: any) => {
    channelRef.current?.send({
      type: "broadcast",
      event,
      payload: { ...payload, from: user?.id },
    });
  };

  const createPeer = useCallback(() => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    pc.addTransceiver("video", { direction: "sendrecv" });
    pc.addTransceiver("audio", { direction: "sendrecv" });

    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal("webrtc-ice", { candidate: e.candidate });
    };
    pc.ontrack = (e) => {
      const [stream] = e.streams;
      if (remoteVideoRef.current && stream) {
        attachStreamToVideo(remoteVideoRef.current, stream);
      }
      setRemoteConnected(true);
    };
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === "failed" || st === "disconnected" || st === "closed") {
        setRemoteConnected(false);
      }
    };
    const s = localStreamRef.current;
    if (s) syncTracksToPeer(s);
    return pc;
  }, [syncTracksToPeer]);

  const closePeer = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setRemoteConnected(false);
  }, []);

  const startCall = useCallback(async () => {
    if (!user || !partner) return;
    if (user.id > partner.id) return;
    if ((localStreamRef.current?.getTracks().length ?? 0) === 0) return;
    if (pcRef.current && pcRef.current.signalingState !== "stable") return;
    if (negotiatingRef.current) return;
    negotiatingRef.current = true;
    try {
      const pc = createPeer();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal("webrtc-offer", { sdp: offer });
    } finally {
      negotiatingRef.current = false;
    }
  }, [user, partner, createPeer]);

  useEffect(() => {
    if (mediaStarted && partnerReady) startCall();
  }, [mediaStarted, partnerReady, startCall]);

  // ------- signaling / presence channel -------
  useEffect(() => {
    if (!couple?.id || !user?.id) return;
    const ch = supabase.channel(`booth:${couple.id}`, {
      config: { presence: { key: user.id }, broadcast: { self: false } },
    });
    channelRef.current = ch;

    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState();
      const others = Object.keys(state).filter((k) => k !== user.id);
      const wasReady = partnerReady;
      const nowReady = others.length > 0;
      setPartnerReady(nowReady);
      if (nowReady && !wasReady) {
        setTimeout(() => startCall(), 400);
      }
      if (!nowReady) closePeer();
    });

    ch.on("broadcast", { event: "start" }, (msg) => {
      const { sessionId, at } = msg.payload as { sessionId: string; at: number };
      sessionRef.current = sessionId;
      snapsRef.current = {};
      setComposed(null);
      runCountdown(at);
    });

    ch.on("broadcast", { event: "snap" }, async (msg) => {
      const p = msg.payload as SnapPayload;
      if (p.sessionId !== sessionRef.current) return;
      snapsRef.current[p.userId] = p;
      await maybeCompose();
    });

    ch.on("broadcast", { event: "webrtc-offer" }, async (msg) => {
      const { sdp, from } = msg.payload as any;
      if (from === user.id) return;
      const pc = createPeer();
      if (pc.signalingState !== "stable") return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal("webrtc-answer", { sdp: answer });
    });

    ch.on("broadcast", { event: "webrtc-answer" }, async (msg) => {
      const { sdp, from } = msg.payload as any;
      if (from === user.id) return;
      const pc = pcRef.current;
      if (pc && pc.signalingState === "have-local-offer" && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    });

    ch.on("broadcast", { event: "webrtc-ice" }, async (msg) => {
      const { candidate, from } = msg.payload as any;
      if (from === user.id) return;
      try {
        await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        /* ignore */
      }
    });

    ch.on("broadcast", { event: "hangup" }, () => closePeer());

    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ online_at: new Date().toISOString() });
      }
    });

    return () => {
      sendSignal("hangup", {});
      closePeer();
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couple?.id, user?.id]);

  // ------- countdown + capture -------
  function runCountdown(startAt: number) {
    setPhase("countdown");
    const tick = () => {
      const remain = Math.ceil((startAt - Date.now()) / 1000);
      if (remain > 0) {
        setCountdown(remain);
        setTimeout(tick, 200);
      } else {
        setCountdown(null);
        capture();
      }
    };
    tick();
  }

  async function capture() {
    if (!localVideoRef.current || !user || !couple || !sessionRef.current) return;
    setPhase("capturing");
    const v = localVideoRef.current;
    const tmpl = TEMPLATES[template];
    // Capture at panel aspect (portrait 3:4)
    const targetW = 720;
    const targetH = Math.round(targetW / tmpl.aspect);
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d")!;

    const vr = v.videoWidth / v.videoHeight;
    const tr = targetW / targetH;
    let sx = 0, sy = 0, sw = v.videoWidth, sh = v.videoHeight;
    if (vr > tr) {
      sw = v.videoHeight * tr;
      sx = (v.videoWidth - sw) / 2;
    } else {
      sh = v.videoWidth / tr;
      sy = (v.videoHeight - sh) / 2;
    }
    if (facing === "user") {
      ctx.translate(targetW, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, sx, sy, sw, sh, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob>((res) =>
      canvas.toBlob((b) => res(b!), "image/jpeg", 0.9),
    );
    const path = `${user.id}/booth/${sessionRef.current}-${user.id}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("gallery")
      .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (upErr) {
      toast.error("Upload failed: " + upErr.message);
      setPhase("idle");
      return;
    }
    const payload: SnapPayload = { sessionId: sessionRef.current, userId: user.id, path };
    snapsRef.current[user.id] = payload;
    channelRef.current?.send({ type: "broadcast", event: "snap", payload });
    setPhase("processing");
    await maybeCompose();
  }

  async function maybeCompose() {
    if (!user || !couple || !partner) return;
    const mine = snapsRef.current[user.id];
    const theirs = snapsRef.current[partner.id];
    if (!mine || !theirs) return;
    const isHost = user.id < partner.id;
    if (!isHost) {
      setPhase("done");
      const { data } = await supabase.storage.from("gallery").createSignedUrl(mine.path, 3600);
      if (data?.signedUrl) setComposed(data.signedUrl);
      return;
    }

    setPhase("processing");
    const { data: signed, error: sErr } = await supabase.storage
      .from("gallery")
      .createSignedUrls([mine.path, theirs.path], 3600);
    if (sErr || !signed) {
      toast.error("Could not load photos");
      setPhase("idle");
      return;
    }
    const [meUrl, partnerUrl] = signed.map((s) => s.signedUrl!);
    const [meImg, partnerImg] = await Promise.all([loadImg(meUrl), loadImg(partnerUrl)]);

    // Compose via template
    const tmpl = TEMPLATES[template];
    const panelW = 900;
    const panelH = Math.round(panelW / tmpl.aspect);
    const canvas = document.createElement("canvas");
    canvas.width = panelW + 100;
    canvas.height = panelH * 2 + 320;
    const ctx = canvas.getContext("2d")!;

    const dateStr = new Date().toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    tmpl.render({
      ctx,
      canvas,
      meImg,
      partnerImg,
      meName,
      partnerName,
      dateStr,
    });

    const blob = await new Promise<Blob>((res) =>
      canvas.toBlob((b) => res(b!), "image/jpeg", 0.92),
    );
    const compositePath = `${user.id}/booth/${sessionRef.current}-combined.jpg`;
    const { error: upErr } = await supabase.storage
      .from("gallery")
      .upload(compositePath, blob, { upsert: true, contentType: "image/jpeg" });
    if (upErr) {
      toast.error("Compose upload failed");
      setPhase("idle");
      return;
    }
    const { data: pub } = supabase.storage.from("gallery").getPublicUrl(compositePath);
    const { error: insErr } = await supabase.from("gallery_items").insert({
      couple_id: couple.id,
      uploader_id: user.id,
      url: pub.publicUrl,
      caption: "Couple Mirror 💖",
      album: "Photo Booth",
    });
    if (insErr) toast.error("Save failed: " + insErr.message);
    else toast.success("Saved to gallery!");

    const { data: prev } = await supabase.storage.from("gallery").createSignedUrl(compositePath, 3600);
    if (prev?.signedUrl) setComposed(prev.signedUrl);
    setPhase("done");
  }

  function loadImg(src: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });
  }

  function startShot() {
    if (!partnerReady) {
      toast.error("Waiting for your partner to open the mirror");
      return;
    }
    const sessionId = crypto.randomUUID();
    const at = Date.now() + 3200;
    sessionRef.current = sessionId;
    snapsRef.current = {};
    setComposed(null);
    channelRef.current?.send({
      type: "broadcast",
      event: "start",
      payload: { sessionId, at },
    });
    runCountdown(at);
  }

  function resetAll() {
    setPhase("idle");
    setCountdown(null);
    setComposed(null);
    snapsRef.current = {};
    sessionRef.current = null;
  }

  // Re-attach the local stream whenever the video element mounts (e.g. after
  // toggling camOn or hiding for the composed preview).
  const attachLocalVideo = useCallback((el: HTMLVideoElement | null) => {
    (localVideoRef as any).current = el;
    if (el && localStreamRef.current) attachStreamToVideo(el, localStreamRef.current);
  }, []);

  const attachRemoteVideo = useCallback((el: HTMLVideoElement | null) => {
    (remoteVideoRef as any).current = el;
    if (el) {
      // If we already have a remote stream on the peer connection, reattach it.
      const pc = pcRef.current;
      const receivers = pc?.getReceivers?.() ?? [];
      const tracks = receivers.map((r) => r.track).filter(Boolean) as MediaStreamTrack[];
      if (tracks.length) {
        attachStreamToVideo(el, new MediaStream(tracks));
      }
    }
  }, []);

  const handleStartMirror = useCallback(async () => {
    await startMedia({ withAudio: micOn });
  }, [micOn, startMedia]);

  const handleToggleMic = useCallback(async () => {
    if (!mediaStarted) {
      await startMedia({ withAudio: true });
      return;
    }
    const audioTracks = localStreamRef.current?.getAudioTracks() ?? [];
    if (!micOn && audioTracks.length === 0) {
      const previousStream = localStreamRef.current;
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false,
        });
        const audioTrack = audioOnly.getAudioTracks()[0];
        if (audioTrack && previousStream) {
          previousStream.addTrack(audioTrack);
          syncTracksToPeer(previousStream);
          setMicOn(true);
          setError(null);
        }
      } catch (e: any) {
        setError(getMediaErrorMessage(e));
      }
      return;
    }
    setMicOn((m) => !m);
  }, [mediaStarted, micOn, startMedia, syncTracksToPeer]);

  const handleToggleCam = useCallback(async () => {
    if (!mediaStarted) {
      await startMedia({ withAudio: micOn });
      return;
    }
    setCamOn((c) => !c);
  }, [mediaStarted, micOn, startMedia]);

  const handleSwitchCamera = useCallback(async () => {
    if (!mediaStarted || !camOn || (phase !== "idle" && phase !== "done")) return;
    const nextFacing = facing === "user" ? "environment" : "user";
    await startMedia({ withAudio: micOn, nextFacing });
  }, [camOn, facing, mediaStarted, micOn, phase, startMedia]);

  const exitFloat = useCallback(() => {
    const win = pipWindowRef.current;
    if (win && !win.closed) {
      try { win.close(); } catch { /* ignore */ }
    }
    pipWindowRef.current = null;
    setFloating(false);
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    }
  }, []);

  const handleFloat = useCallback(async () => {
    if (floating) {
      exitFloat();
      return;
    }
    const dpip = (window as any).documentPictureInPicture;
    const node = floatContainerRef.current;
    if (dpip && node) {
      try {
        const pipWin: Window = await dpip.requestWindow({
          width: 340,
          height: Math.min(720, panelHeight * 2 + 40),
        });
        pipWindowRef.current = pipWin;
        // Copy styles from the main document so Tailwind classes render.
        [...document.styleSheets].forEach((ss) => {
          try {
            const css = [...(ss.cssRules as any)].map((r: any) => r.cssText).join("");
            const style = pipWin.document.createElement("style");
            style.textContent = css;
            pipWin.document.head.appendChild(style);
          } catch {
            if (ss.href) {
              const link = pipWin.document.createElement("link");
              link.rel = "stylesheet";
              link.href = ss.href;
              pipWin.document.head.appendChild(link);
            }
          }
        });
        pipWin.document.body.style.margin = "0";
        pipWin.document.body.style.background = "#000";
        const parent = node.parentElement!;
        const placeholder = document.createComment("pip-placeholder");
        parent.replaceChild(placeholder, node);
        pipWin.document.body.appendChild(node);
        setFloating(true);
        pipWin.addEventListener("pagehide", () => {
          if (placeholder.parentNode) placeholder.parentNode.replaceChild(node, placeholder);
          pipWindowRef.current = null;
          setFloating(false);
        });
        return;
      } catch (e: any) {
        toast.error("Could not open floating window");
      }
    }
    // Fallback: standard video PiP on the partner video
    const v = remoteConnected ? remoteVideoRef.current : localVideoRef.current;
    if (v && (document as any).pictureInPictureEnabled) {
      try {
        await (v as any).requestPictureInPicture();
        setFloating(true);
        v.addEventListener("leavepictureinpicture", () => setFloating(false), { once: true });
      } catch {
        toast.error("Picture-in-picture not available");
      }
    } else {
      toast.error("Your browser doesn't support floating windows");
    }
  }, [floating, exitFloat, panelHeight, remoteConnected]);

  useEffect(() => () => exitFloat(), [exitFloat]);



  return (
    <div className="px-4 pt-6 pb-28 max-w-md mx-auto">
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 mb-1">
          <Heart className="w-5 h-5 text-primary" fill="currentColor" />
          <h1 className="text-2xl font-serif font-semibold">Couple Mirror</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Two hearts, one frame — even miles apart.
        </p>
      </div>

      {composed ? (
        <div className="rounded-3xl overflow-hidden bg-white shadow-soft border border-white/60">
          <img src={composed} alt="Couple mirror keepsake" className="w-full h-auto block" />
        </div>
      ) : (
        <div className="space-y-3">
          <div
            ref={floatContainerRef}
            className={`bg-black/0 ${autoFit ? "flex flex-col gap-3" : "space-y-3"}`}
            style={autoFit ? { height: "calc(100svh - 340px)", minHeight: 320 } : undefined}
          >
            {floating && (
              <div className="rounded-2xl bg-primary/10 border border-primary/30 px-3 py-2 text-center text-xs text-primary">
                Mirror is floating in its own window. Tap Unfloat to bring it back.
              </div>
            )}

          {/* Me */}
          {meHidden ? (
            <button
              type="button"
              onClick={() => setMeHidden(false)}
              className="w-full h-8 rounded-full bg-white/70 backdrop-blur border border-white/60 text-[11px] text-muted-foreground shadow-soft flex items-center justify-center gap-2 shrink-0"
            >
              <span className="w-8 h-1 rounded-full bg-muted-foreground/40" />
              Show {meName}
            </button>
          ) : (
          <div
            {...makeSwipeHandlers(() => setMeHidden(true))}
            className={`relative w-full rounded-2xl overflow-hidden bg-black shadow-soft border border-white/60 touch-pan-y select-none ${autoFit ? "flex-1 min-h-0" : ""}`}
            style={autoFit ? undefined : { height: `${panelHeight}px` }}
          >
            {camOn && mediaStarted ? (
              <video
                ref={attachLocalVideo}
                playsInline
                muted
                autoPlay
                className={`w-full h-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
                style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }}
              />
            ) : !mediaStarted ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-black/70 text-white/90 text-xs gap-3 px-6 text-center">
                <Button onClick={handleStartMirror} className="rounded-full h-11 px-5 shadow-soft">
                  <Camera className="w-4 h-4 mr-2" /> Start mirror
                </Button>
                <span>Tap once to start camera and voice.</span>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted/60 text-muted-foreground text-xs gap-2">
                <VideoOff className="w-4 h-4" /> Camera off
              </div>
            )}
            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[11px] font-medium text-foreground/80 flex items-center gap-1">
              <Heart className="w-3 h-3 text-primary" fill="currentColor" />
              {meName}
            </div>
            <button
              type="button"
              onClick={() => setMeHidden(true)}
              className="absolute top-2 right-2 h-7 px-2 rounded-full bg-black/40 text-white/90 text-[10px] backdrop-blur hover:bg-black/60"
              aria-label="Hide my panel"
              title="Swipe to hide"
            >
              Hide
            </button>
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <span className="text-white font-serif text-7xl drop-shadow-lg animate-pulse">
                  {countdown}
                </span>
              </div>
            )}
            {phase === "capturing" && (
              <div className="absolute inset-0 bg-white animate-[flash_0.4s_ease-out]" />
            )}
            {error && (
              <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-black/70 px-3 py-2 text-center text-white/90 text-xs backdrop-blur">
                {error}
              </div>
            )}
          </div>
          )}

          {/* Partner */}
          {partnerHidden ? (
            <button
              type="button"
              onClick={() => setPartnerHidden(false)}
              className="w-full h-8 rounded-full bg-white/70 backdrop-blur border border-white/60 text-[11px] text-muted-foreground shadow-soft flex items-center justify-center gap-2 shrink-0"
            >
              <span className="w-8 h-1 rounded-full bg-muted-foreground/40" />
              Show {partnerName}
            </button>
          ) : (
          <div
            {...makeSwipeHandlers(() => setPartnerHidden(true))}
            className={`relative w-full rounded-2xl overflow-hidden bg-black shadow-soft border border-white/60 touch-pan-y select-none ${autoFit ? "flex-1 min-h-0" : ""}`}
            style={autoFit ? undefined : { height: `${panelHeight}px` }}
          >
            <video
              ref={attachRemoteVideo}
              playsInline
              autoPlay
              className={`w-full h-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
            />
            {!remoteConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white/80 text-xs text-center px-3">
                {partnerReady ? "Connecting to your love…" : "Waiting for your partner to join…"}
              </div>
            )}
            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[11px] font-medium text-foreground/80 flex items-center gap-1">
              <Heart className="w-3 h-3 text-primary" fill="currentColor" />
              {partnerName}
            </div>
            <button
              type="button"
              onClick={() => setPartnerHidden(true)}
              className="absolute top-2 right-2 h-7 px-2 rounded-full bg-black/40 text-white/90 text-[10px] backdrop-blur hover:bg-black/60"
              aria-label="Hide partner panel"
              title="Swipe to hide"
            >
              Hide
            </button>
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <span className="text-white font-serif text-7xl drop-shadow-lg animate-pulse">
                  {countdown}
                </span>
              </div>
            )}
          </div>
          )}
          </div>

          {/* Resize + fit controls */}
          <div className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 px-4 py-3 shadow-soft space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Frame</span>
              <div className="flex gap-1 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => setAutoFit(true)}
                  className={`px-2 py-0.5 rounded-full text-[10px] border ${autoFit ? "bg-primary text-primary-foreground border-primary" : "bg-white/60 border-white/60"}`}
                >
                  Auto fit
                </button>
                <button
                  type="button"
                  onClick={() => setAutoFit(false)}
                  className={`px-2 py-0.5 rounded-full text-[10px] border ${!autoFit ? "bg-primary text-primary-foreground border-primary" : "bg-white/60 border-white/60"}`}
                >
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setFit("contain")}
                  className={`px-2 py-0.5 rounded-full text-[10px] border ${fit === "contain" ? "bg-primary text-primary-foreground border-primary" : "bg-white/60 border-white/60"}`}
                >
                  Full frame
                </button>
                <button
                  type="button"
                  onClick={() => setFit("cover")}
                  className={`px-2 py-0.5 rounded-full text-[10px] border ${fit === "cover" ? "bg-primary text-primary-foreground border-primary" : "bg-white/60 border-white/60"}`}
                >
                  Fill
                </button>
              </div>
            </div>
            {!autoFit && (
              <input
                type="range"
                min={180}
                max={520}
                step={10}
                value={panelHeight}
                onChange={(e) => setPanelHeight(Number(e.target.value))}
                className="w-full accent-primary"
                aria-label="Resize frame"
              />
            )}
            <p className="text-[10px] text-muted-foreground/80 text-center">
              Tip: swipe a panel left or right to hide it — tap the slim bar to bring it back.
            </p>
          </div>
        </div>


      )}

      {/* Status strip */}
      <div className="mt-4 rounded-2xl bg-white/70 backdrop-blur border border-white/60 px-4 py-3 flex items-center justify-between shadow-soft">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              partnerReady ? "bg-primary animate-pulse" : "bg-muted-foreground/40"
            }`}
          />
          <Heart
            className={`w-4 h-4 ${partnerReady ? "text-primary" : "text-muted-foreground/50"}`}
            fill={partnerReady ? "currentColor" : "none"}
          />
          <span className={partnerReady ? "text-foreground" : "text-muted-foreground"}>
            {partnerReady
              ? remoteConnected
                ? "Connected"
                : "Connecting…"
              : "Waiting for your partner"}
          </span>
        </div>
        {countdown !== null && (
          <span className="text-lg font-serif text-primary tabular-nums">
            {countdown}…
          </span>
        )}
        {phase === "processing" && !composed && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Capture / Retake */}
      <div className="mt-4 flex items-center justify-center">
        {phase === "done" ? (
          <Button onClick={resetAll} className="rounded-full h-14 px-8 text-base shadow-soft">
            <RotateCcw className="w-5 h-5 mr-2" /> Retake
          </Button>
        ) : (
          <Button
            onClick={startShot}
            disabled={!camReady || phase !== "idle" || !partnerReady}
            className="rounded-full h-16 px-10 text-base shadow-soft"
          >
            <Camera className="w-6 h-6 mr-2" />
            Capture together
          </Button>
        )}
      </div>

      {/* Secondary controls */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-11 w-11"
          onClick={handleToggleMic}
          aria-label={micOn ? "Mute mic" : "Unmute mic"}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-muted-foreground" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-11 w-11"
          onClick={handleToggleCam}
          aria-label={camOn ? "Turn camera off" : "Turn camera on"}
        >
          {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-muted-foreground" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-11 w-11"
          onClick={handleSwitchCamera}
          disabled={!mediaStarted || !camOn || (phase !== "idle" && phase !== "done")}
          aria-label="Switch camera"
        >
          <RefreshCw className="w-5 h-5" />
        </Button>
        <Button
          variant={floating ? "default" : "outline"}
          size="icon"
          className="rounded-full h-11 w-11"
          onClick={handleFloat}
          disabled={!mediaStarted || !!composed}
          aria-label={floating ? "Bring mirror back" : "Float mirror over other apps"}
          title={floating ? "Unfloat" : "Float over other apps"}
        >
          {floating ? <Minimize2 className="w-5 h-5" /> : <PictureInPicture2 className="w-5 h-5" />}
        </Button>
      </div>


      {phase === "done" && composed && (
        <p className="text-center text-xs text-muted-foreground mt-4">
          Saved to your shared Gallery under "Photo Booth" 💌
        </p>
      )}

      <style>{`
        @keyframes flash {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "./ui";

type Props = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
};

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function VoiceDictation({ onTranscript, disabled }: Props) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"webspeech" | "whisper" | "none">("none");
  const recRef = useRef<SpeechRec | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const Ctor = getSpeechRecognition();
    setMode(Ctor ? "webspeech" : "whisper");
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
      mediaRef.current?.stop();
    };
  }, []);

  async function startWhisper() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const form = new FormData();
        form.append("audio", blob, "dictée.webm");
        const res = await fetch("/api/ai/transcribe", {
          method: "POST",
          body: form,
        });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok) {
          setError(
            data.error ||
              "Transcription serveur indisponible. Configurez OPENAI_API_KEY ou utilisez Chrome (Web Speech).",
          );
          return;
        }
        if (data.text) onTranscript(data.text);
      };
      mediaRef.current = recorder;
      recorder.start();
      setListening(true);
    } catch {
      setError(
        "Micro refusé ou indisponible. Autorisez le micro ou saisissez le texte.",
      );
    }
  }

  function stopWhisper() {
    mediaRef.current?.stop();
    setListening(false);
  }

  function startWebSpeech() {
    setError(null);
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      void startWhisper();
      return;
    }
    const rec = new Ctor();
    rec.lang = "fr-FR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (ev) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      setInterim(interimText);
      if (finalText.trim()) onTranscript(finalText.trim());
    };
    rec.onerror = (ev) => {
      setListening(false);
      setError(`Dictée interrompue (${ev.error}). Vous pouvez saisir le texte.`);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  function stopWebSpeech() {
    recRef.current?.stop();
    setListening(false);
  }

  function toggle() {
    if (disabled) return;
    if (listening) {
      if (mode === "webspeech") stopWebSpeech();
      else stopWhisper();
      return;
    }
    if (mode === "webspeech") startWebSpeech();
    else void startWhisper();
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={`btn-secondary w-full ${listening ? "border-accent text-accent" : ""}`}
        onClick={toggle}
        disabled={disabled}
        aria-pressed={listening}
      >
        {listening ? "Arrêter le micro" : "Dicter avec le micro"}
      </button>
      {interim && (
        <p className="text-xs text-muted" aria-live="polite">
          En cours : {interim}
        </p>
      )}
      {error && <Toast tone="warn">{error}</Toast>}
      <p className="text-[11px] text-muted">
        {mode === "webspeech"
          ? "Transcription navigateur (Web Speech) — réelle, pas simulée."
          : "Sur ce navigateur : enregistrement puis Whisper serveur si OPENAI_API_KEY est configurée."}
      </p>
    </div>
  );
}

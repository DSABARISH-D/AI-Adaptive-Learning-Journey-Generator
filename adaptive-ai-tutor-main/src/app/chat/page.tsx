"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Brain,
  Send,
  LayoutDashboard,
  Plus,
  BookOpen,
  Loader2,
  PlaySquare,
  Search,
  Paperclip,
  Sparkles,
  Lightbulb,
  Code2,
  ClipboardCheck,
} from "lucide-react";
import { parseArtifacts } from "@/lib/tutor/artifact-parser";
import { ArtifactRenderer } from "@/components/artifact-renderer";
import { VoicePlayer } from "@/components/voice-player";
import { ModalitySwitcher } from "@/components/modality-switcher";
import type { ModalityMode, ModalityWeights } from "@/lib/tutor/modality";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  useVoice?: boolean;
}

function MessageContent({ content, showVoice }: { content: string; showVoice?: boolean }) {
  const parsed = parseArtifacts(content);

  return (
    <>
      {parsed.segments.map((seg, i) => {
        if (seg.kind === "text") {
          return (
            <div key={i} className="text-sm whitespace-pre-wrap leading-relaxed">
              {seg.text}
            </div>
          );
        }
        return <ArtifactRenderer key={seg.artifact.id} artifact={seg.artifact} />;
      })}
      {showVoice && <VoicePlayer text={content} autoPlay />}
    </>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [modalityMode, setModalityMode] = useState<ModalityMode>("auto");
  const [modalityWeights, setModalityWeights] = useState<ModalityWeights | null>(null);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          sessionId: sessionId ?? undefined,
          modalityMode,
        }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        router.push("/");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "Please complete onboarding first") {
          router.push("/onboarding");
          return;
        }
        throw new Error(data.error);
      }

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }
      if (data.modalityWeights) {
        setModalityWeights(data.modalityWeights);
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        useVoice: data.activeModalities?.useVoice ?? false,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Sorry, I encountered an error. ${err instanceof Error ? err.message : "Please try again."}`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  async function handleEndSession() {
    if (!sessionId || messages.length < 2) return;

    try {
      await fetch("/api/sessions/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    } catch {
      // Summary is best-effort
    }

    setSessionId(null);
    setMessages([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[#f4f6fb] text-[#0b1c30]">
      <header className="relative z-20 flex h-16 shrink-0 items-center gap-4 border-b border-[#d6dbe8] bg-white px-4 sm:px-6">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#0252d9] text-white"><Brain className="h-5 w-5" /></div>
          <div className="hidden sm:block"><p className="font-semibold leading-none">Adaptive Learner</p><p className="mt-1 text-[10px] text-[#66738a]">Learn smarter, grow faster</p></div>
        </Link>
        <label className="relative hidden max-w-xl flex-1 md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8996aa]" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search topics, resources, or ask anything..." className="h-10 w-full rounded-lg border border-[#d6dbe8] bg-[#f8faff] pl-10 pr-4 text-sm outline-none transition focus:border-[#8bb2ed] focus:ring-2 focus:ring-[#0252d9]/10" />
        </label>
        <div className="ml-auto flex items-center gap-2">
          <ModalitySwitcher mode={modalityMode} onModeChange={setModalityMode} detectedWeights={modalityWeights} />
          <Link href="/resources" className="hidden sm:block"><Button variant="ghost" size="sm"><PlaySquare className="mr-1 h-4 w-4" />Resources</Button></Link>
          <Link href="/dashboard"><Button variant="ghost" size="sm"><LayoutDashboard className="mr-1 h-4 w-4" /><span className="hidden sm:inline">Dashboard</span></Button></Link>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1500px] flex-1 gap-4 p-3 sm:p-5">
        <aside className="hidden w-56 shrink-0 flex-col rounded-xl border border-[#d6dbe8] bg-white p-3 shadow-sm lg:flex">
          <Button className="h-10 w-full justify-center" onClick={() => { if (sessionId) handleEndSession(); setMessages([]); setSessionId(null); }}><Plus className="mr-2 h-4 w-4" />New chat</Button>
          <p className="mb-2 mt-7 px-2 text-[11px] font-semibold uppercase tracking-wider text-[#8a96a9]">Recent chats</p>
          <div className="space-y-1">
            {["Nested loops in Java", "Explain derivatives", "Photosynthesis review", "Big O notation"].map((title, index) => (
              <button key={title} type="button" onClick={() => setInput(title)} className={`w-full rounded-lg px-2.5 py-2.5 text-left transition hover:bg-[#f1f5fc] ${index === 0 && messages.length > 0 ? "bg-[#eef4ff] text-[#0252d9]" : "text-[#53647d]"}`}>
                <p className="truncate text-xs font-medium">{title}</p><p className="mt-1 text-[10px] text-[#97a3b5]">{index + 1} {index === 0 ? "minute" : "hour"}{index === 0 ? " ago" : "s ago"}</p>
              </button>
            ))}
          </div>
          <div className="mt-auto rounded-xl bg-[#edf3ff] p-3 text-center"><div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-white text-[#0252d9]"><Sparkles className="h-4 w-4" /></div><p className="mt-2 text-xs font-semibold">Need help?</p><p className="mt-1 text-[11px] leading-4 text-[#66738a]">Ask your tutor anything.</p></div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#d6dbe8] bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-[#e4e8f0] px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full bg-[#edf3ff] text-[#0252d9]"><Brain className="h-6 w-6" /></div><div><h1 className="font-semibold">AI Tutor</h1><p className="text-xs text-[#66738a]">Your personalized learning assistant</p></div></div>
            <div className="flex items-center gap-2"><span className="hidden rounded-full bg-[#ecfaf3] px-2.5 py-1 text-[11px] font-medium text-[#17834b] sm:block">● Online</span>{sessionId && <><span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-[11px] font-medium text-[#0252d9]">Session active</span>{messages.length >= 2 && <Button variant="outline" size="sm" onClick={handleEndSession} className="hidden sm:flex"><BookOpen className="mr-1 h-3.5 w-3.5" />Summarize</Button>}</>}</div>
          </div>
          <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-[#eef1f5] px-4 py-2 sm:px-6">
            {[{ label: "Explain concepts", icon: Lightbulb }, { label: "Solve doubts", icon: Sparkles }, { label: "Generate practice", icon: ClipboardCheck }].map(({ label, icon: Icon }) => <button key={label} type="button" onClick={() => setInput(label)} className="flex shrink-0 items-center gap-1.5 rounded-md border border-[#dbe5f7] bg-[#f8faff] px-2.5 py-1.5 text-[11px] font-medium text-[#3567a9] hover:border-[#8bb2ed]"><Icon className="h-3.5 w-3.5" />{label}</button>)}
          </div>

          <ScrollArea className="min-h-0 flex-1 px-4 sm:px-6" ref={scrollRef}>
            <div className="mx-auto max-w-3xl py-6 space-y-6">
          {messages.length === 0 && (
            <div className="mx-auto max-w-2xl py-20 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg border border-[#c3c6d7]/40 glass">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold">
                What would you like to learn today?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                Ask any academic question. Your tutor adapts explanations to your
                imported memory, learning style, interests, mistakes, and current mastery.
              </p>
              <div className="flex flex-wrap gap-2 justify-center pt-6">
                {[
                  "Explain derivatives intuitively",
                  "Help me understand photosynthesis",
                  "What is Big O notation?",
                  "Quiz me on Newton's laws",
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="text-sm"
                    onClick={() => {
                      setInput(suggestion);
                      textareaRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <Avatar className="h-8 w-8 shrink-0 mt-1">
                  <AvatarFallback className="bg-[#edf3ff] text-[#0252d9] text-xs">
                    AI
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-xl px-4 py-3 max-w-[85%] border ${
                  msg.role === "user"
                    ? "border-[#0252d9] bg-[#0252d9] text-white shadow-sm"
                    : "border-[#e1e7f0] bg-[#f7f9fd]"
                }`}
              >
                {msg.role === "assistant" ? (
                  <MessageContent content={msg.content} showVoice={msg.useVoice} />
                ) : (
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <Avatar className="h-8 w-8 shrink-0 mt-1">
                  <AvatarFallback className="bg-[#e9eef7] text-[#53647d] text-xs">You</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0 mt-1">
                <AvatarFallback className="bg-[#edf3ff] text-[#0252d9] text-xs">
                  AI
                </AvatarFallback>
              </Avatar>
              <div className="rounded-xl border border-[#e1e7f0] bg-[#f7f9fd] px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-[#e4e8f0] bg-white p-3 sm:p-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 flex gap-2 overflow-x-auto">
            {[{ label: "Explain with diagram", icon: Lightbulb }, { label: "Give practice questions", icon: ClipboardCheck }, { label: "Show real-world example", icon: Code2 }].map(({ label, icon: Icon }) => <button key={label} type="button" onClick={() => setInput(label)} className="flex shrink-0 items-center gap-1.5 rounded-md border border-[#dbe5f7] px-2.5 py-1.5 text-[11px] text-[#3567a9] hover:bg-[#f1f5fc]"><Icon className="h-3.5 w-3.5" />{label}</button>)}
          </div>
          <div className="flex items-end gap-2 rounded-xl border border-[#d6dbe8] bg-[#fbfcff] p-2 shadow-sm focus-within:border-[#8bb2ed] focus-within:ring-2 focus-within:ring-[#0252d9]/10">
          <button type="button" className="mb-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[#8290a5] hover:bg-[#eef4ff] hover:text-[#0252d9]" aria-label="Attach a file"><Paperclip className="h-4 w-4" /></button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your tutor anything..."
            className="min-h-[40px] max-h-32 resize-none border-0 bg-transparent px-1 py-2 shadow-none focus-visible:ring-0"
            rows={1}
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            size="icon"
            className="h-10 w-10 shrink-0 rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
          </div>
          <p className="mt-2 text-center text-[10px] text-[#9aa8bb]">Press Enter to send · Shift + Enter for a new line</p>
        </div>
      </div>

        </section>

        <aside className="hidden w-64 shrink-0 flex-col rounded-xl border border-[#d6dbe8] bg-white shadow-sm xl:flex">
          <div className="flex items-center gap-3 border-b border-[#e4e8f0] px-4 py-4"><div className="grid h-10 w-10 place-items-center rounded-lg bg-[#eef4ff] text-[#0252d9]"><Sparkles className="h-5 w-5" /></div><div><h2 className="text-sm font-semibold">Tutor settings</h2><p className="text-[11px] text-[#66738a]">Personalize your experience</p></div></div>
          <div className="space-y-5 p-4"><div><p className="text-xs font-semibold">Learning preferences</p><div className="mt-3 space-y-2"><div className="flex items-center justify-between rounded-lg bg-[#f7f9fd] px-3 py-2 text-xs"><span className="text-[#66738a]">Explanation style</span><span className="font-medium">Adaptive</span></div><div className="flex items-center justify-between rounded-lg bg-[#f7f9fd] px-3 py-2 text-xs"><span className="text-[#66738a]">Difficulty</span><span className="font-medium">Personalized</span></div></div></div><div><p className="text-xs font-semibold">Current mode</p><div className="mt-3 rounded-lg border border-[#dbe5f7] bg-[#f8faff] p-3"><p className="text-xs font-medium text-[#0252d9]">{modalityMode === "auto" ? "Adaptive blend" : modalityMode}</p><p className="mt-1 text-[11px] leading-4 text-[#66738a]">The tutor adjusts explanations using your learning signals.</p></div></div><Link href="/settings"><Button variant="outline" size="sm" className="w-full">Open settings</Button></Link></div>
        </aside>
      </div>
    </div>
  );
}

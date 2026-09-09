"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Brain, Clock3, ExternalLink, Filter, Play, PlaySquare, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Resource {
  id: string;
  title: string;
  channel: string;
  subject: string;
  level: string;
  duration: string;
  description: string;
  videoId: string;
  accent: string;
}

const resources: Resource[] = [
  { id: "html", title: "HTML in 100 Seconds", channel: "Fireship", subject: "Computer Science", level: "Beginner", duration: "2:27", description: "A fast visual introduction to the structure behind every web page.", videoId: "qz0aGYrrlhU", accent: "from-orange-500 to-amber-300" },
  { id: "calculus", title: "The Essence of Calculus", channel: "3Blue1Brown", subject: "Mathematics", level: "Intermediate", duration: "17:04", description: "Build an intuition for derivatives before reaching for the formula.", videoId: "WUvTyaaNkzM", accent: "from-indigo-600 to-cyan-400" },
  { id: "photosynthesis", title: "Photosynthesis: Crash Course Biology", channel: "CrashCourse", subject: "Biology", level: "Beginner", duration: "13:25", description: "Follow the journey from sunlight to the chemical energy cells use.", videoId: "sQK3Yr4Sc_k", accent: "from-emerald-600 to-lime-300" },
  { id: "physics", title: "Newton's Laws of Motion", channel: "Khan Academy", subject: "Physics", level: "Beginner", duration: "11:11", description: "See how force, mass, and acceleration connect in everyday motion.", videoId: "kKKM8Y-U1ds", accent: "from-rose-600 to-orange-300" },
  { id: "probability", title: "Bayes' theorem, the geometry of changing beliefs", channel: "3Blue1Brown", subject: "Mathematics", level: "Advanced", duration: "15:04", description: "A visual explanation of why new evidence changes probability.", videoId: "HZGCoVF3YvM", accent: "from-violet-600 to-fuchsia-300" },
  { id: "study", title: "How to Study Smarter, Not Harder", channel: "Ali Abdaal", subject: "Study Skills", level: "All levels", duration: "10:31", description: "Practical ideas for active recall, focus, and a more durable memory.", videoId: "ukLnPB_0d5E", accent: "from-sky-600 to-teal-300" },
];

const subjects = ["All", ...Array.from(new Set(resources.map((resource) => resource.subject)))];

export default function ResourcesPage() {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All");
  const [selected, setSelected] = useState<Resource>(resources[0]);
  const filteredResources = useMemo(() => {
    const text = query.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesSubject = subject === "All" || resource.subject === subject;
      const searchable = `${resource.title} ${resource.channel} ${resource.subject} ${resource.level}`.toLowerCase();
      return matchesSubject && (!text || searchable.includes(text));
    });
  }, [query, subject]);

  return (
    <main className="min-h-screen bg-[#f4f6fb] text-[#0b1c30]">
      <header className="sticky top-0 z-30 border-b border-[#d6dbe8] bg-[#f4f6fb]/90 px-4 py-3 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link href="/dashboard" aria-label="Back to dashboard" className="rounded-md p-2 text-[#445573] hover:bg-white hover:text-[#0252d9]"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="flex items-center gap-2.5"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#0252d9] text-white"><PlaySquare className="h-5 w-5" /></div><div><p className="font-semibold leading-none">Learning Resources</p><p className="mt-1 text-xs text-[#66738a]">Curated videos for your next breakthrough</p></div></div>
          <Link href="/chat" className="ml-auto"><Button size="sm"><Brain className="mr-1.5 h-4 w-4" />Ask tutor</Button></Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8">
        <section className="mb-8 rounded-2xl bg-[#102b4e] px-6 py-8 text-white shadow-xl sm:px-10 sm:py-10"><div className="max-w-2xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-[#d5e6ff]"><Sparkles className="h-3.5 w-3.5" /> Pick up where curiosity takes you</div><h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Watch. Understand. Apply.</h1><p className="mt-3 text-sm leading-6 text-[#c6d5e8] sm:text-base">Short lessons and deep dives selected to help you turn a difficult topic into something you can use.</p></div><label className="relative mt-7 block max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f93af]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics, channels, or levels" className="h-12 border-white/15 bg-white/10 pl-10 text-white placeholder:text-[#9fb0c7]" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b9c9dc]"><X className="h-4 w-4" /></button>}</label></section>
        <div className="mb-6 flex flex-wrap items-center gap-2"><Filter className="mr-1 h-4 w-4 text-[#66738a]" />{subjects.map((item) => <button key={item} type="button" onClick={() => setSubject(item)} className={`rounded-full border px-3.5 py-1.5 text-sm ${subject === item ? "border-[#0252d9] bg-[#0252d9] text-white" : "border-[#d6dbe8] bg-white text-[#53647d]"}`}>{item}</button>)}<span className="ml-auto text-sm text-[#7a879b]">{filteredResources.length} lessons</span></div>
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]"><section>{filteredResources.length === 0 ? <div className="rounded-xl border border-dashed border-[#cbd3e1] bg-white px-6 py-16 text-center"><Search className="mx-auto h-8 w-8 text-[#9aa8bb]" /><p className="mt-3 font-medium">No lessons found</p></div> : <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2">{filteredResources.map((resource) => <article key={resource.id} className="group cursor-pointer" onClick={() => setSelected(resource)}><div className={`relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br shadow-sm ${resource.accent}`}><img src={`https://img.youtube.com/vi/${resource.videoId}/hqdefault.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-60" /><div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" /><div className="absolute left-4 top-4 rounded-md bg-black/40 px-2 py-1 text-xs text-white">{resource.subject}</div><div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs text-white"><Clock3 className="h-3.5 w-3.5" />{resource.duration}</div><div className="absolute inset-0 grid place-items-center"><span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#0252d9] shadow-xl"><Play className="ml-0.5 h-5 w-5 fill-current" /></span></div></div><h2 className="mt-3 line-clamp-2 text-base font-semibold leading-6 group-hover:text-[#0252d9]">{resource.title}</h2><p className="mt-1 text-sm text-[#66738a]">{resource.channel} <span className="px-1">•</span> {resource.level}</p></article>)}</div>}</section>
          <aside className="h-fit rounded-xl border border-[#d6dbe8] bg-white p-4 shadow-sm lg:sticky lg:top-24"><div className="relative aspect-video overflow-hidden rounded-lg bg-black"><iframe className="h-full w-full" src={`https://www.youtube.com/embed/${selected.videoId}`} title={selected.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div><div className="px-1 pt-4"><p className="text-xs font-medium uppercase tracking-[0.12em] text-[#0252d9]">Now selected</p><h2 className="mt-2 text-xl font-semibold leading-7">{selected.title}</h2><p className="mt-1 text-sm text-[#66738a]">{selected.channel} · {selected.duration}</p><p className="mt-4 text-sm leading-6 text-[#53647d]">{selected.description}</p><div className="mt-5 flex gap-2"><a href={`https://www.youtube.com/watch?v=${selected.videoId}`} target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><ExternalLink className="mr-1.5 h-4 w-4" />YouTube</Button></a><Link href={`/chat?topic=${encodeURIComponent(selected.title)}`}><Button size="sm"><Brain className="mr-1.5 h-4 w-4" />Discuss it</Button></Link></div></div></aside>
        </div>
      </div>
    </main>
  );
}

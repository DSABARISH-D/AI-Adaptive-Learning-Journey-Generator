from __future__ import annotations

from typing import Any
try:
    from backend.resources import TOPIC_CATALOG, normalize_topic
except ImportError:
    from resources import TOPIC_CATALOG, normalize_topic


def filter_options(items: list[Any], query: str) -> list[Any]:
    if not query:
        return items
    q = query.lower()
    return [item for item in items if q in str(item).lower()]


def project_for_topic(topic: str, level: str) -> str:
    t = normalize_topic(topic)
    meta = TOPIC_CATALOG.get(t, {})
    default_proj = meta.get("project") or f"Build an end-to-end practical project applying {topic.title()}."
    if level == "beginner":
        return f"Foundational Project: {default_proj}"
    elif level == "advanced":
        return f"Advanced Production Pipeline: {default_proj} with performance tuning and deployment."
    return default_proj


def rank_courses(topic: str, level: str, provider: str = "all", max_results: int = 6) -> list[dict]:
    t = normalize_topic(topic)
    meta = TOPIC_CATALOG.get(t, {})
    courses = list(meta.get("courses", []))
    if not courses:
        courses = [
            {"title": f"{topic.title()} Specialization", "provider": "Coursera", "url": "https://www.coursera.org/", "certificate": True},
            {"title": f"Complete {topic.title()} Masterclass", "provider": "Udemy", "url": "https://www.udemy.com/", "certificate": True},
            {"title": f"Applied {topic.title()} in Python", "provider": "edX", "url": "https://www.edx.org/", "certificate": True},
        ]
    if provider != "all":
        courses = [c for c in courses if provider.lower() in c.get("provider", "").lower()]
    return courses[:max_results]


def rank_kaggle_datasets(topic: str, level: str, max_results: int = 4) -> list[dict]:
    t = normalize_topic(topic)
    datasets = [
        {"title": f"{t.title()} Benchmark Dataset", "source": "Kaggle", "url": f"https://www.kaggle.com/search?q={t}", "rows": "15,000+", "format": "CSV"},
        {"title": f"Real-World {t.title()} Case Study Data", "source": "UCI Repository", "url": "https://archive.ics.uci.edu/", "rows": "8,500+", "format": "CSV"},
        {"title": "Student Performance & Evaluation Dataset", "source": "OULAD", "url": "https://analyse.kmi.open.ac.uk/open_dataset", "rows": "32,593", "format": "Tabular"},
    ]
    return datasets[:max_results]


def rank_catalog_videos(topic: str, level: str, max_results: int = 6) -> list[dict]:
    t = normalize_topic(topic)
    meta = TOPIC_CATALOG.get(t, {})
    videos_by_level = meta.get("videos", {})
    results = list(videos_by_level.get(level, []))
    if not results and level != "beginner":
        results = list(videos_by_level.get("beginner", []))
    if not results:
        for lvl_vids in videos_by_level.values():
            results.extend(lvl_vids)
    return results[:max_results]


def rank_live_and_dataset_videos(topic: str, level: str, live_videos: list[dict], max_results: int = 8) -> list[dict]:
    catalog_vids = rank_catalog_videos(topic, level, max_results=max_results)
    combined = []
    seen = set()
    for v in (live_videos or []) + catalog_vids:
        title = v.get("title", "")
        if title and title not in seen:
            seen.add(title)
            combined.append(v)
    return combined[:max_results]

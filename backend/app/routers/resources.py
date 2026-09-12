"""Resource API endpoints supporting English and Tamil educational resources."""

from __future__ import annotations

import os
from typing import Any
from fastapi import APIRouter, Query
import requests

try:
    from backend.resources import TOPIC_CATALOG, normalize_topic
    from backend.services.catalog_service import rank_courses, rank_kaggle_datasets, project_for_topic
except ImportError:
    from resources import TOPIC_CATALOG, normalize_topic
    from services.catalog_service import rank_courses, rank_kaggle_datasets, project_for_topic

router = APIRouter(prefix="/api/resources", tags=["resources"])

TAMIL_RESOURCES: dict[str, list[dict[str, str]]] = {
    "java": [
        {"title": "Java Full Course in Tamil", "channel": "Error Makes Clever", "url": "https://www.youtube.com/watch?v=mAtkPQO876c"},
        {"title": "Java Loops & Conditions in Tamil", "channel": "Tamil Hacks", "url": "https://www.youtube.com/watch?v=0kI6_N_3n5k"},
        {"title": "Java Object Oriented Programming (OOP) in Tamil", "channel": "Error Makes Clever", "url": "https://www.youtube.com/watch?v=B7v_HwWz-f0"},
        {"title": "Java Exception Handling in Tamil", "channel": "Tut Dude Tamil", "url": "https://www.youtube.com/watch?v=z8a6H_w9q1U"},
    ],
    "python": [
        {"title": "Python Full Course for Beginners in Tamil", "channel": "Error Makes Clever", "url": "https://www.youtube.com/watch?v=m67-bOpOoPU"},
        {"title": "Python Control Flow & Loops in Tamil", "channel": "Tamil Hacks", "url": "https://www.youtube.com/watch?v=RSl8mCgVl1g"},
        {"title": "Python Functions and Data Structures in Tamil", "channel": "Let's Learn Tamil", "url": "https://www.youtube.com/watch?v=5c2Bw2K8Z_A"},
    ],
    "c": [
        {"title": "C Programming Tutorial in Tamil", "channel": "Error Makes Clever", "url": "https://www.youtube.com/watch?v=iFm6_j1X5sI"},
        {"title": "C Pointers and Memory in Tamil", "channel": "Tamil Tech Tutorials", "url": "https://www.youtube.com/watch?v=kY3wQ0fGg14"},
    ],
    "cpp": [
        {"title": "C++ Full Tutorial in Tamil", "channel": "Error Makes Clever", "url": "https://www.youtube.com/watch?v=s_L_Y2E7k0A"},
        {"title": "C++ OOP Concepts Explained in Tamil", "channel": "Tamil Hacks", "url": "https://www.youtube.com/watch?v=1F2k8y4M7_Q"},
    ],
    "sql": [
        {"title": "SQL Database Tutorial in Tamil", "channel": "Error Makes Clever", "url": "https://www.youtube.com/watch?v=r_bH1pQO77U"},
        {"title": "SQL Joins and Queries in Tamil", "channel": "Tamil Tech Tutorials", "url": "https://www.youtube.com/watch?v=v0L1M99o_Z8"},
    ],
    "web-dev": [
        {"title": "Full Stack Web Development in Tamil (HTML/CSS/JS)", "channel": "Error Makes Clever", "url": "https://www.youtube.com/watch?v=6mbwJ2xhgzM"},
        {"title": "JavaScript Tutorial in Tamil", "channel": "Tamil Hacks", "url": "https://www.youtube.com/watch?v=W6NZfCO5SIk"},
    ],
}


def search_youtube_multi_language(
    topic: str,
    language: str = "en",
    level: str = "beginner",
    max_results: int = 6,
) -> list[dict[str, str]]:
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        return []

    try:
        lang_suffix = " in Tamil" if language == "ta" else ""
        query = f"{topic} tutorial {level}{lang_suffix}"
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": query,
            "key": api_key,
            "type": "video",
            "maxResults": max_results,
            "relevanceLanguage": "ta" if language == "ta" else "en",
        }
        res = requests.get(url, params=params, timeout=4)
        if res.status_code == 200:
            data = res.json()
            videos: list[dict[str, str]] = []
            for item in data.get("items", []):
                snippet = item.get("snippet", {})
                vid_id = item.get("id", {}).get("videoId")
                if vid_id:
                    videos.append({
                        "title": snippet.get("title", f"{topic.title()} Guide"),
                        "channel": snippet.get("channelTitle", "Educational Creator"),
                        "url": f"https://www.youtube.com/watch?v={vid_id}",
                    })
            return videos
    except Exception:
        pass
    return []


@router.get("")
@router.get("/")
def get_resources(
    course_code: str = Query("java"),
    topic: str | None = Query(None),
    language: str = Query("en"),
    level: str = Query("beginner"),
) -> dict[str, Any]:
    """Retrieve validated educational resources with English/Tamil multi-language support."""
    active_topic = (topic or course_code).strip()
    norm_topic = normalize_topic(active_topic)

    live_videos = search_youtube_multi_language(active_topic, language=language, level=level)

    validated_videos: list[dict[str, str]] = []
    if language == "ta":
        base_tamil = TAMIL_RESOURCES.get(course_code.lower(), [])
        if not base_tamil and norm_topic in TAMIL_RESOURCES:
            base_tamil = TAMIL_RESOURCES[norm_topic]
        validated_videos = list(live_videos) + [v for v in base_tamil if v not in live_videos]
        if not validated_videos:
            validated_videos = [
                {"title": f"{active_topic.title()} Tutorial in Tamil", "channel": "Tamil Tech Educator", "url": "https://www.youtube.com/watch?v=mAtkPQO876c"}
            ]
    else:
        meta = TOPIC_CATALOG.get(norm_topic, {})
        videos_by_level = meta.get("videos", {})
        catalog_vids = list(videos_by_level.get(level, []))
        if not catalog_vids and level != "beginner":
            catalog_vids = list(videos_by_level.get("beginner", []))
        if not catalog_vids:
            for lvl_vids in videos_by_level.values():
                catalog_vids.extend(lvl_vids)

        seen_urls: set[str] = set()
        for v in (live_videos + catalog_vids):
            u = v.get("url", "")
            if u and u not in seen_urls:
                seen_urls.add(u)
                validated_videos.append(v)

        if not validated_videos:
            validated_videos = [
                {"title": f"{active_topic.title()} Fundamentals", "channel": "freeCodeCamp.org", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw"}
            ]

    courses = rank_courses(norm_topic, level=level, max_results=4)
    datasets = rank_kaggle_datasets(norm_topic, level=level, max_results=3)
    project = project_for_topic(norm_topic, level=level)

    return {
        "course_code": course_code,
        "topic": active_topic,
        "language": language,
        "level": level,
        "videos": validated_videos[:8],
        "courses": courses,
        "datasets": datasets,
        "project": project,
        "source": "live_youtube" if live_videos else "validated_catalog",
    }

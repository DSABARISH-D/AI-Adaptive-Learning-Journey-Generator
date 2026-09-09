from __future__ import annotations

import os
import requests


def youtube_api_available() -> bool:
    return bool(os.environ.get("YOUTUBE_API_KEY"))


def search_youtube_videos(topic: str, max_results: int = 6, level: str = "beginner") -> list[dict]:
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        return []

    try:
        query = f"{topic} tutorial {level} full course"
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": query,
            "key": api_key,
            "type": "video",
            "maxResults": max_results,
            "relevanceLanguage": "en",
        }
        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 200:
            data = res.json()
            videos = []
            for item in data.get("items", []):
                snippet = item.get("snippet", {})
                vid_id = item.get("id", {}).get("videoId")
                if vid_id:
                    videos.append({
                        "title": snippet.get("title", f"{topic.title()} Guide"),
                        "channel": snippet.get("channelTitle", "YouTube Educator"),
                        "url": f"https://www.youtube.com/watch?v={vid_id}",
                    })
            return videos
    except Exception:
        pass

    return []

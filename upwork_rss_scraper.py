#!/usr/bin/env python3
"""
Upwork RSS Feed Scraper

Fetches job listings from Upwork's public RSS feed, filters by ICP criteria,
and outputs a clean, formatted list. No login or API key required.

Usage:
    python upwork_rss_scraper.py
    python upwork_rss_scraper.py --query "python developer" --min-budget 500
    python upwork_rss_scraper.py --config config.json
"""

import argparse
import html
import json
import re
import sys
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Optional


@dataclass
class Job:
    title: str
    link: str
    description: str
    pub_date: Optional[datetime]
    budget: Optional[float] = None
    hourly_range: Optional[str] = None
    job_type: Optional[str] = None
    skills: list[str] = field(default_factory=list)
    category: Optional[str] = None
    country: Optional[str] = None


@dataclass
class FilterConfig:
    query: str = "python developer"
    min_budget: Optional[float] = None
    max_budget: Optional[float] = None
    job_type: Optional[str] = None  # "fixed" or "hourly"
    required_skills: list[str] = field(default_factory=list)
    exclude_keywords: list[str] = field(default_factory=list)
    include_keywords: list[str] = field(default_factory=list)
    country: Optional[str] = None
    max_results: int = 50


def build_feed_url(query: str) -> str:
    encoded = urllib.parse.quote_plus(query)
    return f"https://www.upwork.com/ab/feed/jobs/rss?q={encoded}&sort=recency"


def fetch_feed(url: str) -> str:
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8")


def parse_budget(description: str) -> Optional[float]:
    # Match patterns like "Budget: $500" or "Budget: $1,000"
    match = re.search(r'<b>Budget</b>:\s*\$([0-9,]+)', description)
    if match:
        return float(match.group(1).replace(",", ""))
    return None


def parse_hourly_range(description: str) -> Optional[str]:
    match = re.search(r'<b>Hourly Range</b>:\s*\$([0-9.]+)\s*-\s*\$([0-9.]+)', description)
    if match:
        return f"${match.group(1)}-${match.group(2)}"
    return None


def parse_job_type(description: str) -> Optional[str]:
    if re.search(r'<b>Budget</b>', description):
        return "fixed"
    if re.search(r'<b>Hourly Range</b>', description):
        return "hourly"
    return None


def parse_skills(description: str) -> list[str]:
    match = re.search(r'<b>Skills</b>:\s*(.*?)(?:<br|</)', description, re.DOTALL)
    if match:
        raw = match.group(1)
        # Skills are often comma-separated or in anchor tags
        skills = re.findall(r'>([^<]+)<', raw)
        if not skills:
            skills = [s.strip() for s in html.unescape(raw).split(",") if s.strip()]
        return skills
    return []


def parse_category(description: str) -> Optional[str]:
    match = re.search(r'<b>Category</b>:\s*([^<]+)', description)
    if match:
        return html.unescape(match.group(1).strip())
    return None


def parse_country(description: str) -> Optional[str]:
    match = re.search(r'<b>Country</b>:\s*([^<]+)', description)
    if match:
        return html.unescape(match.group(1).strip())
    return None


def clean_description(raw: str) -> str:
    text = re.sub(r'<[^>]+>', ' ', raw)
    text = html.unescape(text)
    text = re.sub(r'\s+', ' ', text).strip()
    # Truncate to a reasonable preview length
    if len(text) > 300:
        text = text[:300] + "..."
    return text


def parse_feed(xml_content: str) -> list[Job]:
    root = ET.fromstring(xml_content)
    jobs = []

    for item in root.iter("item"):
        title = item.findtext("title", "").strip()
        link = item.findtext("link", "").strip()
        raw_desc = item.findtext("description", "")

        pub_date = None
        pub_date_str = item.findtext("pubDate", "")
        if pub_date_str:
            try:
                pub_date = parsedate_to_datetime(pub_date_str)
            except (ValueError, TypeError):
                pass

        job = Job(
            title=title,
            link=link,
            description=clean_description(raw_desc),
            pub_date=pub_date,
            budget=parse_budget(raw_desc),
            hourly_range=parse_hourly_range(raw_desc),
            job_type=parse_job_type(raw_desc),
            skills=parse_skills(raw_desc),
            category=parse_category(raw_desc),
            country=parse_country(raw_desc),
        )
        jobs.append(job)

    return jobs


def matches_filter(job: Job, config: FilterConfig) -> bool:
    # Budget filter
    if config.min_budget and job.budget and job.budget < config.min_budget:
        return False
    if config.max_budget and job.budget and job.budget > config.max_budget:
        return False

    # Job type filter
    if config.job_type and job.job_type and job.job_type != config.job_type:
        return False

    # Required skills (case-insensitive, any match)
    if config.required_skills:
        job_skills_lower = [s.lower() for s in job.skills]
        if not any(rs.lower() in job_skills_lower for rs in config.required_skills):
            return False

    # Exclude keywords
    searchable = f"{job.title} {job.description}".lower()
    if config.exclude_keywords:
        if any(kw.lower() in searchable for kw in config.exclude_keywords):
            return False

    # Include keywords (at least one must match)
    if config.include_keywords:
        if not any(kw.lower() in searchable for kw in config.include_keywords):
            return False

    # Country filter
    if config.country and job.country:
        if config.country.lower() not in job.country.lower():
            return False

    return True


def format_job(job: Job, index: int) -> str:
    lines = [f"\n{'='*60}", f"  [{index}] {job.title}", f"{'='*60}"]

    if job.pub_date:
        lines.append(f"  Posted:  {job.pub_date.strftime('%Y-%m-%d %H:%M UTC')}")
    if job.job_type == "fixed" and job.budget:
        lines.append(f"  Budget:  ${job.budget:,.0f} (Fixed)")
    elif job.job_type == "hourly" and job.hourly_range:
        lines.append(f"  Rate:    {job.hourly_range}/hr")
    if job.category:
        lines.append(f"  Category: {job.category}")
    if job.country:
        lines.append(f"  Country: {job.country}")
    if job.skills:
        lines.append(f"  Skills:  {', '.join(job.skills)}")

    lines.append(f"\n  {job.description}")
    lines.append(f"\n  Link: {job.link}")

    return "\n".join(lines)


def output_json(jobs: list[Job]) -> str:
    data = []
    for job in jobs:
        d = asdict(job)
        if job.pub_date:
            d["pub_date"] = job.pub_date.isoformat()
        data.append(d)
    return json.dumps(data, indent=2)


def load_config_file(path: str) -> FilterConfig:
    with open(path) as f:
        data = json.load(f)
    return FilterConfig(**data)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Scrape Upwork RSS feed and filter jobs by ICP criteria"
    )
    parser.add_argument("-q", "--query", default="python developer",
                        help="Search query (default: 'python developer')")
    parser.add_argument("--min-budget", type=float,
                        help="Minimum budget for fixed-price jobs")
    parser.add_argument("--max-budget", type=float,
                        help="Maximum budget for fixed-price jobs")
    parser.add_argument("--job-type", choices=["fixed", "hourly"],
                        help="Filter by job type")
    parser.add_argument("--skills", nargs="+",
                        help="Required skills (at least one must match)")
    parser.add_argument("--exclude", nargs="+",
                        help="Exclude jobs containing these keywords")
    parser.add_argument("--include", nargs="+",
                        help="Only include jobs containing at least one keyword")
    parser.add_argument("--country",
                        help="Filter by client country")
    parser.add_argument("--max-results", type=int, default=50,
                        help="Maximum results to display (default: 50)")
    parser.add_argument("--json", action="store_true",
                        help="Output as JSON instead of formatted text")
    parser.add_argument("--config", type=str,
                        help="Path to JSON config file")
    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    if args.config:
        config = load_config_file(args.config)
    else:
        config = FilterConfig(
            query=args.query,
            min_budget=args.min_budget,
            max_budget=args.max_budget,
            job_type=args.job_type,
            required_skills=args.skills or [],
            exclude_keywords=args.exclude or [],
            include_keywords=args.include or [],
            country=args.country,
            max_results=args.max_results,
        )

    url = build_feed_url(config.query)
    print(f"Fetching: {url}", file=sys.stderr)

    try:
        xml_content = fetch_feed(url)
    except Exception as e:
        print(f"Error fetching feed: {e}", file=sys.stderr)
        sys.exit(1)

    jobs = parse_feed(xml_content)
    print(f"Found {len(jobs)} total jobs", file=sys.stderr)

    filtered = [j for j in jobs if matches_filter(j, config)][:config.max_results]
    print(f"After filtering: {len(filtered)} jobs match your criteria", file=sys.stderr)

    if args.json:
        print(output_json(filtered))
    else:
        if not filtered:
            print("\nNo jobs matched your filters. Try broadening your criteria.")
        for i, job in enumerate(filtered, 1):
            print(format_job(job, i))
        print()


if __name__ == "__main__":
    main()

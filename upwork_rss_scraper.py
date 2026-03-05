#!/usr/bin/env python3
"""
Upwork RSS Feed Scraper for Hugo's Creative Strategy ICP

Fetches job listings from Upwork's public RSS feed, scores them against
Hugo's ideal client profile (DTC brand owners needing a Meta creative
strategist), and outputs a prioritized analysis. No login or API key required.

Usage:
    python upwork_rss_scraper.py
    python upwork_rss_scraper.py --query "facebook ads creative strategy"
    python upwork_rss_scraper.py --json
    python upwork_rss_scraper.py --top 3
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
from datetime import datetime
from email.utils import parsedate_to_datetime
from typing import Optional

# ---------------------------------------------------------------------------
# ICP CONFIGURATION — Hugo's ideal client signals
# ---------------------------------------------------------------------------

SEARCH_QUERIES = [
    "creative strategy",
    "facebook ads creative strategist",
    "meta ads creative testing",
    "DTC facebook ads",
    "ad creative strategy ecommerce",
    "UGC ad strategy",
]

# Hard-skip: regex patterns — if ANY match, reject immediately.
# Uses word boundaries and context to avoid false positives like
# "our previous agency didn't work" (which is actually a green flag).
HARD_SKIP_PATTERNS_LIST = [
    r"\b(we are|we\'re|i am|i\'m|this is) (a|an) (marketing |digital |creative )?agency",
    r"looking for an agency",
    r"agency.{0,10}(seeking|hiring|looking|needs)",
    r"white[\s-]?label",
    r"\bdropship", r"\bdrop[\s-]?ship",
    r"media buy(er|ing) only",
    r"follow our (sop|process|workflow)",
    r"\breseller\b",
    r"\bsaas platform\b", r"\bb2b saas\b",
    r"for (our|the) agency.{0,10}client",
    r"agency.{0,10}partner",
]

# Pain points Hugo's ICP posts about — each match boosts the score
PAIN_POINT_PATTERNS = {
    "don't know what to test": [
        r"don.t know what to test", r"not sure what to test",
        r"no idea what creative", r"stuck on what to run",
        r"what ads to run", r"what creatives to make",
    ],
    "creative fatigue": [
        r"creative fatigue", r"ad fatigue", r"ads? (are|is) fatigued",
        r"creatives? (are|is) dying", r"declining performance",
        r"ads stopped working", r"performance drop",
    ],
    "agency disappointment": [
        r"agency.{0,20}didn.t work", r"agency.{0,20}let us down",
        r"left.{0,10}agency", r"fired.{0,10}agency",
        r"previous agency", r"past agency", r"agency.{0,20}wasn.t",
        r"agency.{0,20}failed", r"done with.{0,10}agenc",
    ],
    "need someone to own creative": [
        r"take.{0,15}creative.{0,15}off.{0,10}plate",
        r"own.{0,10}creative", r"lead.{0,10}creative",
        r"manage.{0,10}creative", r"run.{0,10}creative",
        r"need.{0,15}creative.{0,10}strateg",
        r"looking for.{0,15}creative.{0,10}strateg",
    ],
    "competitors scaling": [
        r"competitor.{0,15}scal", r"falling behind",
        r"competitors?.{0,15}growing", r"losing market share",
        r"can.t keep up",
    ],
    "have editor but no direction": [
        r"editor.{0,20}no direction", r"editor.{0,20}but.{0,15}need",
        r"have.{0,10}editor", r"in-house editor",
        r"content creator.{0,20}but", r"video editor.{0,20}need",
        r"editor.{0,20}don.t know what",
    ],
}

# Green flags — signals of a great-fit client
GREEN_FLAG_PATTERNS = {
    "has in-house editor/creator": [
        r"in-house editor", r"in.house.{0,5}editor",
        r"have.{0,10}editor", r"our editor", r"my editor",
        r"content creator.{0,10}(on staff|in-house|already|have)",
        r"video editor.{0,10}(on staff|in-house|already|have)",
    ],
    "past agency disappointment": [
        r"agency.{0,20}didn.t", r"agency.{0,20}failed",
        r"previous agency", r"past agency", r"left.{0,10}agency",
        r"fired.{0,10}agency",
    ],
    "uses scaling language": [
        r"\bscale\b", r"\bscaling\b", r"creative testing",
        r"\biteration\b", r"\biterating\b", r"\bugc\b",
        r"\bangles?\b", r"ad variations", r"testing framework",
        r"winning (ads?|creatives?)", r"hook.{0,5}(rate|variations?)",
    ],
    "real brand / Shopify presence": [
        r"shopify", r"our (brand|store|shop|website)",
        r"ecommerce brand", r"e-commerce brand", r"dtc brand",
        r"d2c brand", r"direct.to.consumer",
        r"physical product", r"our product",
    ],
    "wants strategist ownership": [
        r"full ownership", r"take (over|the lead|ownership)",
        r"own the.{0,10}(creative|strategy|process)",
        r"end.to.end", r"strategic direction",
        r"creative direction", r"lead.{0,10}strategy",
    ],
    "budget signals $500+/wk": [
        r"\$[5-9]\d{2,}", r"\$[1-9],?\d{3,}",
        r"\$2,?000.{0,5}(month|mo)", r"\$500.{0,5}(week|wk)",
        r"(retainer|monthly|ongoing)",
    ],
}

# Red-flag patterns to warn Hugo about in proposals
RED_FLAG_PATTERNS = {
    "may want to micromanage": [
        r"follow (our|my|the) (process|sop|workflow|system)",
        r"specific (instructions|process|workflow)",
        r"must use our", r"do it (our|my) way",
    ],
    "possibly just wants a media buyer": [
        r"media buy(er|ing) only", r"just.{0,10}(run|manage).{0,10}ads",
        r"campaign management only", r"ad account management",
    ],
    "low budget signals": [
        r"\$[1-4]?\d{1,2}(/hr|per hour)", r"budget.{0,10}\$[1-2]\d{2}\b",
        r"cheap", r"lowest.{0,5}(price|rate|cost)",
    ],
    "agency/white-label project": [
        r"(for|with) (our|an) agency", r"white.?label",
        r"agency.{0,10}client", r"on behalf of",
    ],
    "dropshipping signals": [
        r"dropship", r"aliexpress", r"oberlo",
        r"winning product", r"product research",
    ],
    "unclear on creative vs media buying": [
        r"(run|manage).{0,10}(my|our) (facebook|meta|fb) ads",
        r"need.{0,10}(someone|person).{0,10}(run|manage).{0,10}ads",
    ],
}


# ---------------------------------------------------------------------------
# DATA STRUCTURES
# ---------------------------------------------------------------------------

@dataclass
class Job:
    title: str
    link: str
    description: str
    raw_description: str
    pub_date: Optional[datetime]
    budget: Optional[float] = None
    hourly_range: Optional[str] = None
    hourly_low: Optional[float] = None
    hourly_high: Optional[float] = None
    job_type: Optional[str] = None
    skills: list[str] = field(default_factory=list)
    category: Optional[str] = None
    country: Optional[str] = None


@dataclass
class JobAnalysis:
    job: Job
    score: int = 0
    hard_skip: bool = False
    hard_skip_reason: Optional[str] = None
    pain_points: list[str] = field(default_factory=list)
    green_flags: list[str] = field(default_factory=list)
    red_flags: list[str] = field(default_factory=list)
    icp_match_reasons: list[str] = field(default_factory=list)
    suggested_angle: Optional[str] = None


# ---------------------------------------------------------------------------
# RSS FEED FETCHING & PARSING
# ---------------------------------------------------------------------------

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


def parse_budget(desc: str) -> Optional[float]:
    match = re.search(r'<b>Budget</b>:\s*\$([0-9,]+)', desc)
    if match:
        return float(match.group(1).replace(",", ""))
    return None


def parse_hourly_range(desc: str) -> tuple[Optional[str], Optional[float], Optional[float]]:
    match = re.search(r'<b>Hourly Range</b>:\s*\$([0-9.]+)\s*-\s*\$([0-9.]+)', desc)
    if match:
        low, high = float(match.group(1)), float(match.group(2))
        return f"${match.group(1)}-${match.group(2)}", low, high
    return None, None, None


def parse_job_type(desc: str) -> Optional[str]:
    if re.search(r'<b>Budget</b>', desc):
        return "fixed"
    if re.search(r'<b>Hourly Range</b>', desc):
        return "hourly"
    return None


def parse_skills(desc: str) -> list[str]:
    match = re.search(r'<b>Skills</b>:\s*(.*?)(?:<br|</)', desc, re.DOTALL)
    if match:
        raw = match.group(1)
        skills = re.findall(r'>([^<]+)<', raw)
        if not skills:
            skills = [s.strip() for s in html.unescape(raw).split(",") if s.strip()]
        return skills
    return []


def parse_field(desc: str, field_name: str) -> Optional[str]:
    match = re.search(rf'<b>{field_name}</b>:\s*([^<]+)', desc)
    if match:
        return html.unescape(match.group(1).strip())
    return None


def clean_description(raw: str) -> str:
    text = re.sub(r'<[^>]+>', ' ', raw)
    text = html.unescape(text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def parse_feed(xml_content: str) -> list[Job]:
    root = ET.fromstring(xml_content)
    jobs = []

    for item in root.iter("item"):
        title = item.findtext("title", "").strip()
        link = item.findtext("link", "").strip()
        raw_desc = item.findtext("description", "")
        hourly_str, hourly_low, hourly_high = parse_hourly_range(raw_desc)

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
            raw_description=raw_desc,
            pub_date=pub_date,
            budget=parse_budget(raw_desc),
            hourly_range=hourly_str,
            hourly_low=hourly_low,
            hourly_high=hourly_high,
            job_type=parse_job_type(raw_desc),
            skills=parse_skills(raw_desc),
            category=parse_field(raw_desc, "Category"),
            country=parse_field(raw_desc, "Country"),
        )
        jobs.append(job)

    return jobs


# ---------------------------------------------------------------------------
# ICP SCORING & ANALYSIS
# ---------------------------------------------------------------------------

def _match_patterns(text: str, patterns: dict[str, list[str]]) -> list[str]:
    """Return list of category names where at least one pattern matches."""
    matched = []
    for category, regexes in patterns.items():
        for pattern in regexes:
            if re.search(pattern, text, re.IGNORECASE):
                matched.append(category)
                break
    return matched


def check_hard_skip(job: Job) -> tuple[bool, Optional[str]]:
    searchable = f"{job.title} {job.description}"
    for pattern in HARD_SKIP_PATTERNS_LIST:
        if re.search(pattern, searchable, re.IGNORECASE):
            return True, pattern
    return False, None


def estimate_weekly_budget(job: Job) -> Optional[float]:
    if job.budget:
        return job.budget
    if job.hourly_high:
        return job.hourly_high * 20  # ~20 hrs/wk estimate
    return None


def score_job(job: Job) -> JobAnalysis:
    analysis = JobAnalysis(job=job)
    searchable = f"{job.title} {job.description}"

    # Hard skip check
    analysis.hard_skip, analysis.hard_skip_reason = check_hard_skip(job)
    if analysis.hard_skip:
        return analysis

    # Pain points (+15 each — these are strong ICP signals)
    analysis.pain_points = _match_patterns(searchable, PAIN_POINT_PATTERNS)
    analysis.score += len(analysis.pain_points) * 15

    # Green flags (+10 each)
    analysis.green_flags = _match_patterns(searchable, GREEN_FLAG_PATTERNS)
    analysis.score += len(analysis.green_flags) * 10

    # Red flags (-5 each, informational)
    analysis.red_flags = _match_patterns(searchable, RED_FLAG_PATTERNS)
    analysis.score -= len(analysis.red_flags) * 5

    # Budget scoring
    weekly = estimate_weekly_budget(job)
    if weekly is not None:
        if weekly >= 2000:
            analysis.score += 20
            analysis.icp_match_reasons.append(f"Strong budget (${weekly:,.0f})")
        elif weekly >= 500:
            analysis.score += 10
            analysis.icp_match_reasons.append(f"Decent budget (${weekly:,.0f})")
        elif weekly < 200:
            analysis.score -= 10

    # DTC / ecommerce signals
    dtc_terms = ["dtc", "d2c", "direct to consumer", "ecommerce", "e-commerce",
                  "shopify", "physical product", "our brand", "our store"]
    dtc_count = sum(1 for t in dtc_terms if t in searchable.lower())
    if dtc_count:
        analysis.score += dtc_count * 5
        analysis.icp_match_reasons.append("DTC/ecommerce brand signals")

    # Meta/Facebook ads signals
    meta_terms = ["facebook ads", "meta ads", "fb ads", "instagram ads",
                  "facebook advertising", "meta advertising"]
    if any(t in searchable.lower() for t in meta_terms):
        analysis.score += 10
        analysis.icp_match_reasons.append("Explicitly mentions Meta/Facebook ads")

    # Creative strategy signals
    strategy_terms = ["creative strategy", "creative strategist", "ad strategy",
                      "creative testing", "ad testing", "creative direction",
                      "creative brief", "testing framework"]
    strategy_count = sum(1 for t in strategy_terms if t in searchable.lower())
    if strategy_count:
        analysis.score += strategy_count * 8
        analysis.icp_match_reasons.append("Looking for creative strategy specifically")

    # Generate suggested opening angle
    analysis.suggested_angle = generate_angle(analysis)

    return analysis


def generate_angle(analysis: JobAnalysis) -> str:
    """Generate a 'What I'm Seeing' angle Hugo can open his proposal with."""
    job = analysis.job
    searchable = f"{job.title} {job.description}".lower()

    if "creative fatigue" in analysis.pain_points or "ad fatigue" in searchable:
        return (
            "What I'm seeing is a creative volume problem disguised as a "
            "performance problem. Your ads aren't broken — your testing system is. "
            "When the same 3-4 angles get recycled without a structured iteration "
            "framework, fatigue is inevitable. I'd rebuild your testing pipeline "
            "around the EVOLVE framework so every new batch of creatives compounds "
            "on proven winners rather than starting from scratch."
        )

    if "agency disappointment" in analysis.pain_points:
        return (
            "What I'm seeing is a classic agency misalignment: they optimized "
            "campaigns but never owned the creative brief layer. That's where "
            "the real leverage is. The media buying is a commodity — the creative "
            "strategy is the moat. I'd come in and own the entire brief-to-test "
            "pipeline so your editor has clear direction and every ad iteration "
            "is data-driven, not guesswork."
        )

    if "have editor but no direction" in analysis.pain_points:
        return (
            "What I'm seeing is you have the production capacity but no creative "
            "operating system feeding it. Your editor is talented, but without a "
            "structured brief pipeline — hooks, angles, formats mapped to buyer "
            "psychology — they're guessing. I'd plug in as your creative strategist, "
            "own the briefs, and turn your editor into a scaling machine."
        )

    if "need someone to own creative" in analysis.pain_points:
        return (
            "What I'm seeing is a founder bottleneck on creative decisions. "
            "You shouldn't be the one deciding what to test next — that's what "
            "a creative strategist exists for. I'd take full ownership of your "
            "creative testing roadmap, brief your editor directly, and build a "
            "compounding system where each round of tests informs the next."
        )

    if "don't know what to test" in analysis.pain_points:
        return (
            "What I'm seeing is a testing clarity problem. When every new ad "
            "feels like a shot in the dark, it's because there's no system "
            "connecting performance data back to creative decisions. I'd audit "
            "your last 90 days of ad data, map your winning angles, and build "
            "an EVOLVE-based testing calendar so you always know exactly what "
            "to produce next."
        )

    if any(t in searchable for t in ["scale", "scaling", "grow"]):
        return (
            "What I'm seeing is a brand ready to scale but bottlenecked by "
            "creative output and direction. The media buying side is likely "
            "fine — the unlock is a structured creative testing system that "
            "identifies winning angles and iterates on them systematically. "
            "I'd come in, audit what's working, and build the creative engine "
            "that lets you scale spend confidently."
        )

    return (
        "What I'm seeing is a brand that could benefit from a dedicated "
        "creative strategy layer between the data and the content. Most teams "
        "skip this — they go straight from 'ads aren't working' to 'make new "
        "ads.' I'd bring in a structured framework that turns your ad account "
        "data into clear creative briefs, so every new piece of content has a "
        "strategic reason to exist."
    )


# ---------------------------------------------------------------------------
# OUTPUT FORMATTING
# ---------------------------------------------------------------------------

def format_analysis(analysis: JobAnalysis, index: int) -> str:
    job = analysis.job
    lines = []
    lines.append(f"\n{'='*70}")
    lines.append(f"  #{index}  {job.title}")
    lines.append(f"  ICP SCORE: {analysis.score}/100+")
    lines.append(f"{'='*70}")

    # Basic info
    if job.pub_date:
        lines.append(f"  Posted:   {job.pub_date.strftime('%Y-%m-%d %H:%M UTC')}")
    if job.job_type == "fixed" and job.budget:
        lines.append(f"  Budget:   ${job.budget:,.0f} (Fixed Price)")
    elif job.job_type == "hourly" and job.hourly_range:
        lines.append(f"  Rate:     {job.hourly_range}/hr")
    if job.country:
        lines.append(f"  Country:  {job.country}")
    if job.skills:
        lines.append(f"  Skills:   {', '.join(job.skills)}")
    lines.append(f"  Link:     {job.link}")

    # Description preview
    desc_preview = job.description[:500] + "..." if len(job.description) > 500 else job.description
    lines.append(f"\n  DESCRIPTION:")
    lines.append(f"  {desc_preview}")

    # Why it matches
    if analysis.icp_match_reasons:
        lines.append(f"\n  WHY THIS MATCHES HUGO'S ICP:")
        for reason in analysis.icp_match_reasons:
            lines.append(f"    + {reason}")

    # Pain points detected
    if analysis.pain_points:
        lines.append(f"\n  KEY PAIN POINTS DETECTED:")
        for pp in analysis.pain_points:
            lines.append(f"    * {pp}")

    # Green flags
    if analysis.green_flags:
        lines.append(f"\n  GREEN FLAGS:")
        for gf in analysis.green_flags:
            lines.append(f"    [+] {gf}")

    # Red flags
    if analysis.red_flags:
        lines.append(f"\n  RED FLAGS TO WATCH:")
        for rf in analysis.red_flags:
            lines.append(f"    [!] {rf}")

    # Suggested angle
    if analysis.suggested_angle:
        lines.append(f"\n  SUGGESTED 'WHAT I'M SEEING' OPENER:")
        # Word-wrap the angle at ~70 chars
        words = analysis.suggested_angle.split()
        current_line = "    "
        for word in words:
            if len(current_line) + len(word) + 1 > 74:
                lines.append(current_line)
                current_line = "    " + word
            else:
                current_line += (" " if current_line.strip() else "") + word
        if current_line.strip():
            lines.append(current_line)

    return "\n".join(lines)


def output_json(analyses: list[JobAnalysis]) -> str:
    data = []
    for a in analyses:
        d = {
            "title": a.job.title,
            "link": a.job.link,
            "description": a.job.description,
            "pub_date": a.job.pub_date.isoformat() if a.job.pub_date else None,
            "budget": a.job.budget,
            "hourly_range": a.job.hourly_range,
            "job_type": a.job.job_type,
            "skills": a.job.skills,
            "country": a.job.country,
            "icp_score": a.score,
            "pain_points": a.pain_points,
            "green_flags": a.green_flags,
            "red_flags": a.red_flags,
            "icp_match_reasons": a.icp_match_reasons,
            "suggested_angle": a.suggested_angle,
        }
        data.append(d)
    return json.dumps(data, indent=2)


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Upwork RSS scraper tuned for Hugo's Creative Strategy ICP. "
                    "Fetches, scores, filters, and analyzes job posts."
    )
    parser.add_argument("-q", "--query", nargs="+",
                        help="Custom search queries (overrides defaults). "
                             "Use multiple: -q 'creative strategy' 'DTC ads'")
    parser.add_argument("--top", type=int, default=10,
                        help="Show top N results by ICP score (default: 10)")
    parser.add_argument("--min-score", type=int, default=15,
                        help="Minimum ICP score to include (default: 15)")
    parser.add_argument("--show-skipped", action="store_true",
                        help="Also show hard-skipped jobs with reasons")
    parser.add_argument("--json", action="store_true",
                        help="Output as JSON instead of formatted text")
    parser.add_argument("--all-queries", action="store_true",
                        help="Run all built-in search queries (default: just first)")
    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    # Determine which queries to run
    if args.query:
        queries = args.query
    elif args.all_queries:
        queries = SEARCH_QUERIES
    else:
        queries = [SEARCH_QUERIES[0]]

    # Fetch and deduplicate across queries
    all_jobs: dict[str, Job] = {}  # link -> Job for dedup
    for query in queries:
        url = build_feed_url(query)
        print(f"Fetching: {url}", file=sys.stderr)
        try:
            xml_content = fetch_feed(url)
            jobs = parse_feed(xml_content)
            print(f"  -> {len(jobs)} jobs from '{query}'", file=sys.stderr)
            for job in jobs:
                if job.link not in all_jobs:
                    all_jobs[job.link] = job
        except Exception as e:
            print(f"  -> Error fetching '{query}': {e}", file=sys.stderr)

    print(f"\n{len(all_jobs)} unique jobs across {len(queries)} queries", file=sys.stderr)

    # Score and analyze every job
    analyses = []
    skipped = []
    for job in all_jobs.values():
        analysis = score_job(job)
        if analysis.hard_skip:
            skipped.append(analysis)
        elif analysis.score >= args.min_score:
            analyses.append(analysis)

    # Sort by score descending, take top N
    analyses.sort(key=lambda a: a.score, reverse=True)
    top = analyses[:args.top]

    print(f"Scored: {len(analyses)} passed filters, {len(skipped)} hard-skipped",
          file=sys.stderr)
    print(f"Showing top {len(top)} by ICP score\n", file=sys.stderr)

    # Output
    if args.json:
        print(output_json(top))
    else:
        if not top:
            print("\nNo jobs matched Hugo's ICP above the score threshold.")
            print("Try: --min-score 10 or --all-queries to broaden the search.\n")
        else:
            print(f"\n{'#'*70}")
            print(f"  UPWORK ICP MATCHES FOR HUGO — Top {len(top)} Results")
            print(f"  Quality > Quantity: only showing strong ICP matches")
            print(f"{'#'*70}")

            for i, analysis in enumerate(top, 1):
                print(format_analysis(analysis, i))

            print(f"\n{'='*70}")
            print(f"  {len(top)} leads shown | {len(analyses)} total passed filters "
                  f"| {len(skipped)} auto-skipped")
            print(f"{'='*70}\n")

        if args.show_skipped and skipped:
            print(f"\n--- HARD-SKIPPED ({len(skipped)} jobs) ---")
            for s in skipped:
                print(f"  SKIP: {s.job.title}")
                print(f"        Reason: matched '{s.hard_skip_reason}'")
                print(f"        {s.job.link}\n")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Run chenluda/zhihu-download once without starting the Flask app."""
import argparse
import json
import os
import pathlib
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description="Download a Zhihu page/column to Markdown using external-knowledge/tools/zhihu-download")
    parser.add_argument("--url", required=True, help="Zhihu URL to download")
    parser.add_argument("--output-dir", default="external-knowledge/staging/zhihu-downloads", help="Directory for generated files")
    parser.add_argument("--cookies", default=None, help="Zhihu cookie string. Overrides ZHIHU_COOKIE and the local cookie file.")
    parser.add_argument("--cookie-file", default="external-knowledge/zhihu-cookie.local", help="Git-ignored local cookie file, relative to the repository root.")
    parser.add_argument("--keep-logs", action="store_true", help="Keep zhihu-download logs")
    args = parser.parse_args()

    repo_root = pathlib.Path(__file__).resolve().parents[5]
    tool_dir = repo_root / "external-knowledge" / "tools" / "zhihu-download"
    if not tool_dir.exists():
        raise SystemExit(f"Missing zhihu-download tool: {tool_dir}")

    cookie_file = (repo_root / args.cookie_file).resolve()
    if not cookie_file.is_relative_to(repo_root):
        raise SystemExit(f"Cookie file must stay within the repository: {cookie_file}")
    local_cookie = cookie_file.read_text(encoding="utf-8").strip() if cookie_file.is_file() else ""
    cookies = args.cookies if args.cookies is not None else os.environ.get("ZHIHU_COOKIE", local_cookie)
    output_dir = (repo_root / args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    sys.path.insert(0, str(tool_dir))
    from main_zhihu import ZhihuParser  # type: ignore

    old_cwd = pathlib.Path.cwd()
    os.chdir(output_dir)
    try:
        title = ZhihuParser(cookies, keep_logs=args.keep_logs).judge_type(args.url)
    finally:
        os.chdir(old_cwd)

    files = sorted(str(path.relative_to(repo_root)).replace("\\", "/") for path in output_dir.rglob("*") if path.is_file())
    print(json.dumps({"ok": True, "title": title, "outputDir": str(output_dir), "files": files}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

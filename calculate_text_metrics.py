#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Calculate text metrics for Markdown/story documents.

Metrics:
  1. Perplexity: true local causal-LM perplexity, via transformers.
  2. Semantic Entropy: GPT-compatible Responses API semantic sampling + clustering.
  3. BARTScore-src: true local seq2seq score, average log P(input | source).

Important:
  Responses API output text cannot provide a mathematically exact perplexity or
  BARTScore by itself. This script therefore uses local models for those two
  probability-based metrics and uses the GPT-compatible API only for Semantic
  Entropy.

Install optional local metric dependencies:
  python -m pip install torch transformers sentencepiece

Example:
  $env:YUNWU_API_KEY="your-token"
  python calculate_text_metrics.py --source path\\to\\source.md --input path\\to\\input.md
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from pathlib import Path
from typing import Any


DEFAULT_API_BASE = "https://yunwu.ai/v1"
DEFAULT_MODEL = "gpt-5.5pro"
DEFAULT_PPL_MODEL = "uer/gpt2-chinese-cluecorpussmall"
DEFAULT_BART_MODEL = "fnlp/bart-base-chinese"


def read_text(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


def strip_markdown(text: str) -> str:
    text = re.sub(r"```.*?```", " ", text, flags=re.S)
    text = re.sub(r"`([^`]*)`", r"\1", text)
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", " ", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"^[#>\-*+\s]+", "", text, flags=re.M)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def require_transformers() -> tuple[Any, Any, Any]:
    try:
        import torch
        from transformers import AutoModelForCausalLM, AutoModelForSeq2SeqLM, AutoTokenizer
    except ImportError as exc:
        raise RuntimeError(
            "Missing local metric dependencies. Install them with: "
            "python -m pip install torch transformers sentencepiece"
        ) from exc
    return torch, AutoModelForCausalLM, AutoModelForSeq2SeqLM, AutoTokenizer


def calculate_perplexity(text: str, model_name: str, max_length: int, stride: int) -> dict[str, Any]:
    torch, AutoModelForCausalLM, _AutoModelForSeq2SeqLM, AutoTokenizer = require_transformers()

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name)
    model.eval()

    encodings = tokenizer(text, return_tensors="pt")
    seq_len = encodings.input_ids.size(1)
    if seq_len < 2:
        raise RuntimeError("Input text is too short to calculate perplexity.")

    nlls = []
    prev_end_loc = 0
    for begin_loc in range(0, seq_len, stride):
        end_loc = min(begin_loc + max_length, seq_len)
        trg_len = end_loc - prev_end_loc
        input_ids = encodings.input_ids[:, begin_loc:end_loc]
        target_ids = input_ids.clone()
        target_ids[:, :-trg_len] = -100

        with torch.no_grad():
            outputs = model(input_ids, labels=target_ids)
            neg_log_likelihood = outputs.loss * trg_len

        nlls.append(neg_log_likelihood)
        prev_end_loc = end_loc
        if end_loc == seq_len:
            break

    avg_nll = torch.stack(nlls).sum() / (seq_len - 1)
    ppl = torch.exp(avg_nll).item()
    return {
        "model": model_name,
        "tokens": int(seq_len),
        "average_negative_log_likelihood": float(avg_nll.item()),
        "perplexity": float(ppl),
    }


def calculate_bartscore_src(
    source: str,
    candidate: str,
    model_name: str,
    max_source_length: int,
    max_target_length: int,
) -> dict[str, Any]:
    torch, _AutoModelForCausalLM, AutoModelForSeq2SeqLM, AutoTokenizer = require_transformers()

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
    model.eval()

    source_ids = tokenizer(
        source,
        return_tensors="pt",
        max_length=max_source_length,
        truncation=True,
    )
    target_ids = tokenizer(
        candidate,
        return_tensors="pt",
        max_length=max_target_length,
        truncation=True,
    ).input_ids

    labels = target_ids.clone()
    pad_id = tokenizer.pad_token_id
    if pad_id is not None:
        labels[labels == pad_id] = -100

    with torch.no_grad():
        outputs = model(**source_ids, labels=labels)

    valid_tokens = int((labels != -100).sum().item())
    avg_log_probability = -float(outputs.loss.item())
    return {
        "model": model_name,
        "source_tokens": int(source_ids.input_ids.size(1)),
        "target_tokens": valid_tokens,
        "bartscore_src": avg_log_probability,
        "note": "Average token log probability log P(input | source). Higher is better; values are usually negative.",
    }


def extract_response_text(response_json: dict[str, Any]) -> str:
    if isinstance(response_json.get("output_text"), str):
        return response_json["output_text"]

    parts: list[str] = []
    for item in response_json.get("output", []) or []:
        for content in item.get("content", []) or []:
            if isinstance(content, dict) and content.get("type") in {"output_text", "text"}:
                text = content.get("text")
                if isinstance(text, str):
                    parts.append(text)
    if parts:
        return "\n".join(parts)

    raise RuntimeError(f"Cannot find output text in API response: {json.dumps(response_json, ensure_ascii=False)[:800]}")


def call_responses_api(
    *,
    api_base: str,
    api_key: str,
    model: str,
    system_prompt: str,
    user_prompt: str,
    temperature: float,
    max_output_tokens: int,
    timeout_seconds: int,
    retries: int,
) -> str:
    url = api_base.rstrip("/") + "/responses"
    payload = {
        "model": model,
        "input": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": temperature,
        "max_output_tokens": max_output_tokens,
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    last_error: Exception | None = None
    for attempt in range(retries + 1):
        request = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
                body = response.read().decode("utf-8")
                return extract_response_text(json.loads(body))
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
            last_error = exc
            if attempt >= retries:
                break
            time.sleep(2 * (attempt + 1))

    raise RuntimeError(f"Responses API call failed after {retries + 1} attempt(s): {last_error}")


def parse_json_object(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        cleaned = cleaned[start : end + 1]
    return json.loads(cleaned)


def shannon_entropy(labels: list[str]) -> float:
    total = len(labels)
    if total == 0:
        return 0.0
    counts = Counter(labels)
    return -sum((count / total) * math.log2(count / total) for count in counts.values())


def calculate_semantic_entropy(
    *,
    source: str,
    candidate: str,
    api_base: str,
    api_key: str,
    model: str,
    samples: int,
    timeout_seconds: int,
    retries: int,
) -> dict[str, Any]:
    system_prompt = (
        "你是剧情文本语义分析器。请只输出 JSON，不要输出 Markdown。"
        "你的任务是从候选文本中抽取其核心语义解释，避免复述字面格式。"
    )
    sampled_interpretations: list[str] = []
    for index in range(samples):
        user_prompt = (
            "请根据 source 背景，给出 input 文本的一个核心语义解释。"
            "如果文本存在歧义，请选择你认为最自然的一种解释。"
            "输出 JSON：{\"interpretation\":\"...\"}\n\n"
            f"source:\n{source[:12000]}\n\n"
            f"input:\n{candidate[:12000]}\n\n"
            f"sample_index: {index + 1}"
        )
        raw = call_responses_api(
            api_base=api_base,
            api_key=api_key,
            model=model,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.9,
            max_output_tokens=500,
            timeout_seconds=timeout_seconds,
            retries=retries,
        )
        parsed = parse_json_object(raw)
        interpretation = str(parsed.get("interpretation", "")).strip()
        if not interpretation:
            raise RuntimeError(f"Empty interpretation from API response: {raw[:500]}")
        sampled_interpretations.append(interpretation)

    cluster_prompt = (
        "请把 interpretations 中语义等价或近似等价的解释分到同一簇。"
        "只输出 JSON，格式为："
        "{\"clusters\":[{\"label\":\"短标签\",\"items\":[0,1]}]}。"
        "items 使用 interpretations 的 0-based 下标，每个下标必须且只能出现一次。"
    )
    cluster_raw = call_responses_api(
        api_base=api_base,
        api_key=api_key,
        model=model,
        system_prompt="你是严格的语义聚类器。请只输出 JSON。",
        user_prompt=json.dumps(
            {
                "task": cluster_prompt,
                "source_excerpt": source[:6000],
                "input_excerpt": candidate[:6000],
                "interpretations": sampled_interpretations,
            },
            ensure_ascii=False,
        ),
        temperature=0.1,
        max_output_tokens=1200,
        timeout_seconds=timeout_seconds,
        retries=retries,
    )
    cluster_data = parse_json_object(cluster_raw)

    labels_by_index: dict[int, str] = {}
    for cluster_index, cluster in enumerate(cluster_data.get("clusters", [])):
        label = str(cluster.get("label") or f"cluster_{cluster_index + 1}")
        for item_index in cluster.get("items", []):
            labels_by_index[int(item_index)] = label

    missing = [index for index in range(samples) if index not in labels_by_index]
    if missing:
        raise RuntimeError(f"Semantic clustering missed sample index(es): {missing}. Raw response: {cluster_raw[:800]}")

    labels = [labels_by_index[index] for index in range(samples)]
    counts = Counter(labels)
    entropy = shannon_entropy(labels)
    max_entropy = math.log2(samples) if samples > 1 else 0.0
    normalized = entropy / max_entropy if max_entropy > 0 else 0.0
    return {
        "model": model,
        "samples": samples,
        "semantic_entropy_bits": entropy,
        "normalized_semantic_entropy": normalized,
        "cluster_counts": dict(counts),
        "interpretations": sampled_interpretations,
        "clusters": cluster_data.get("clusters", []),
    }


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Calculate perplexity, Semantic Entropy, and BARTScore-src for text files.")
    parser.add_argument("--source", required=True, help="Path to source/reference Markdown or text file.")
    parser.add_argument("--input", required=True, help="Path to input/candidate Markdown or text file.")
    parser.add_argument("--output", default="", help="Optional JSON output path.")
    parser.add_argument("--api-base", default=os.getenv("YUNWU_API_BASE", DEFAULT_API_BASE), help="OpenAI-compatible API base URL.")
    parser.add_argument("--api-key-env", default="YUNWU_API_KEY", help="Environment variable name that stores the API key.")
    parser.add_argument("--model", default=os.getenv("YUNWU_MODEL", DEFAULT_MODEL), help="Responses API model name.")
    parser.add_argument("--samples", type=int, default=8, help="Semantic Entropy sampling count.")
    parser.add_argument("--timeout-seconds", type=int, default=600, help="API timeout per request.")
    parser.add_argument("--retries", type=int, default=1, help="API retry count.")
    parser.add_argument("--ppl-model", default=DEFAULT_PPL_MODEL, help="Local causal LM for perplexity.")
    parser.add_argument("--ppl-max-length", type=int, default=512, help="Perplexity context window.")
    parser.add_argument("--ppl-stride", type=int, default=256, help="Perplexity sliding window stride.")
    parser.add_argument("--bart-model", default=DEFAULT_BART_MODEL, help="Local seq2seq model for BARTScore-src.")
    parser.add_argument("--bart-max-source-length", type=int, default=1024, help="BARTScore source truncation length.")
    parser.add_argument("--bart-max-target-length", type=int, default=1024, help="BARTScore target truncation length.")
    parser.add_argument("--skip-local", action="store_true", help="Skip local perplexity and BARTScore-src.")
    parser.add_argument("--skip-api", action="store_true", help="Skip API-based Semantic Entropy.")
    parser.add_argument("--keep-markdown", action="store_true", help="Do not strip simple Markdown syntax before scoring.")
    return parser


def main() -> int:
    args = build_arg_parser().parse_args()

    source = read_text(args.source)
    candidate = read_text(args.input)
    if not args.keep_markdown:
        source = strip_markdown(source)
        candidate = strip_markdown(candidate)

    result: dict[str, Any] = {
        "source_path": str(Path(args.source).resolve()),
        "input_path": str(Path(args.input).resolve()),
        "notes": [
            "Perplexity and BARTScore-src are local model metrics.",
            "Semantic Entropy uses GPT-compatible semantic sampling and clustering.",
        ],
        "metrics": {},
    }

    if not args.skip_local:
        result["metrics"]["perplexity"] = calculate_perplexity(
            candidate,
            args.ppl_model,
            args.ppl_max_length,
            args.ppl_stride,
        )
        result["metrics"]["bartscore_src"] = calculate_bartscore_src(
            source,
            candidate,
            args.bart_model,
            args.bart_max_source_length,
            args.bart_max_target_length,
        )

    if not args.skip_api:
        api_key = os.getenv(args.api_key_env) or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError(
                f"Missing API key. Set ${args.api_key_env} first, for example: "
                f'$env:{args.api_key_env}="your-token"'
            )
        result["metrics"]["semantic_entropy"] = calculate_semantic_entropy(
            source=source,
            candidate=candidate,
            api_base=args.api_base,
            api_key=api_key,
            model=args.model,
            samples=args.samples,
            timeout_seconds=args.timeout_seconds,
            retries=args.retries,
        )

    output = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        Path(args.output).write_text(output + "\n", encoding="utf-8")
    print(output)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)

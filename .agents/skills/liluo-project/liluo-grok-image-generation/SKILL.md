---
name: liluo-grok-image-generation
description: Generate draft images with Grok/xAI from this project only when the user explicitly asks for Grok output, wants to inspect Grok image API configuration, or wants to polish a Grok-specific prompt. Do not use as the default path for poster, key art, UI mood board, or site visual generation when the project already has an Image 2 workflow.
---

# Grok Image Generation

Read `AGENTS.md` and [api-and-prompt-contract.md](references/api-and-prompt-contract.md).

This Skill covers two linked tasks:

1. Turn a rough image idea into a Grok-ready prompt.
2. Run the local Grok image script in dry-run or live mode.

For project poster pages, site visuals, character baseline posters, and other Image 2-planned batches, Grok is not the default generator. Those tasks should stay on the built-in Image 2 path unless the user explicitly asks to use Grok for that run.

## Hard gates

1. Treat generated images as draft assets until the user explicitly adopts them elsewhere.
2. Do not ask the user to paste `API_KEY` into chat. Point them to `.env.grok-image.local`.
3. Live generation must be explicit. Use `npm run grok:image:generate -- --live ...` only when the user actually wants quota-consuming output.
4. Prefer the local launcher path (`npm run grok:image:*`) so the script can apply local loopback proxy and DNS settings before Node starts. Do not bypass it with a raw `node .../grok-image.mjs` call unless debugging the launcher itself.
5. When a local loopback proxy is configured, use it instead of a direct xAI path. This workflow only supports loopback proxy endpoints such as `127.0.0.1`, `localhost`, or `::1`.
6. If no local proxy is configured and the request still needs direct outbound access, use the permissioned network path rather than first retrying a sandboxed call that is expected to fail.
7. If the request is still exploratory, use dry-run first so the user can inspect the polished prompt and output plan.
8. Default output lands in the system temp directory (`%TEMP%/liluo-grok-images` on Windows) so routine generations do not silently enter canon, docs, or asset registries.
9. Do not invent canon facts, costumes, props, locations, or relationship states just to make an image prompt feel richer. Confirm or infer only what the current task safely supports.
10. Do not imitate living artists. Use concrete visual language instead.
11. Do not override an existing project-level Image 2 workflow just because a request mentions posters, key art, or visual concepts. Grok is opt-in, not the default for those project tasks.

## Prompt workflow

1. Read the user's image goal and extract the non-negotiables: subject, scene, mood, key objects, framing, and exclusions.
2. If the brief is already precise, preserve it and only tighten wording.
3. If the brief is thin, expand it with concrete visual detail rather than abstract praise words.
4. Build one production prompt using the contract in `references/api-and-prompt-contract.md`.
5. Keep exclusions inline as an `Avoid:` tail clause because this workflow only sends a single prompt field.
6. If the user wants multiple variants, keep the shared core stable and vary only the requested dimension.

## Command workflow

### Check configuration

Use:

```powershell
npm run grok:image:status
```

This confirms whether a live key is configured without touching the network.

### Preview the request

Use dry-run first when the user has not yet approved a paid call:

```powershell
npm run grok:image:generate -- --prompt "..." --dry-run
```

Dry-run returns the normalized request plus the planned output location.

### Generate live images

Use:

```powershell
npm run grok:image:generate -- --live --prompt "..." --aspect-ratio 16:9 --count 1 --slug liluo-poster
```

If `.env.grok-image.local` defines a loopback proxy such as `LILUO_GROK_IMAGE_LOCAL_PROXY_URL=http://127.0.0.1:7890`, the launcher will restart Node with the right proxy and DNS flags before reaching xAI. Use `npm run grok:image:probe` first when you need to verify the path without consuming image quota.

Useful flags:

- `--prompt` or `--prompt-file`
- `--base-url` to switch between the default xAI endpoint and a loopback relay; CLI overrides only allow `api.x.ai` or loopback hosts
- `--model` to override the configured model name
- `--aspect-ratio 1:1|16:9|9:16|4:3|3:4|3:2|2:3`
- `--resolution 1024x1024` or omit for `auto`
- `--count 1-4`
- `--slug` for stable filenames
- `--out-dir` if the user wants a specific repository path or temp subdirectory
- `--timeout-ms` to override the request timeout
- `--max-attempts` to override retry count for live generation
- `--backoff-ms 500,1500` to override retry intervals
- `--local-proxy` and `--dns-result-order` to override local network path settings for the current run

## Deliverables

After a successful live run, report:

1. The final prompt actually sent.
2. The generated file path(s).
3. The manifest path.
4. Any revised prompt returned by the provider.

## Adjacent boundaries

- For poster upgrades, site visuals, README/Pages visual batches, character baseline calibration, and other project visual work already defined as Image 2 assets, use `image_gen` by default unless the user explicitly asks for Grok.
- Use this Skill when the user explicitly wants Grok, wants to compare Grok against another generator, or wants to verify/debug the Grok image path itself.
- Use `liluo-natural-expression` only for reader-facing copy around the prompt or delivery notes, not for the command output itself.
- If the user wants adopted images registered as project assets later, handle that as a separate task with the relevant asset/documentation workflow.

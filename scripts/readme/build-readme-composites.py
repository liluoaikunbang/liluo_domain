from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from textwrap import wrap
import json

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[2]
ASSET_ROOT = ROOT / "docs" / "assets" / "readme"
GENERATED = ASSET_ROOT / "generated"
COMPOSITES = ASSET_ROOT / "composites"
SCREENSHOTS = ASSET_ROOT / "screenshots"
COMPOSITES.mkdir(parents=True, exist_ok=True)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = []
    if bold:
        candidates.extend(
            [
                Path(r"C:\Windows\Fonts\msyhbd.ttc"),
                Path(r"C:\Windows\Fonts\simhei.ttf"),
            ]
        )
    candidates.extend(
        [
            Path(r"C:\Windows\Fonts\msyh.ttc"),
            Path(r"C:\Windows\Fonts\simsun.ttc"),
            Path(r"C:\Windows\Fonts\arial.ttf"),
        ]
    )
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


FONT_TITLE = load_font(54, bold=True)
FONT_SECTION = load_font(28, bold=True)
FONT_BODY = load_font(24)
FONT_SMALL = load_font(20)


@dataclass(frozen=True)
class WorldBoard:
    key: str
    title: str
    subtitle: str
    stage: str
    accent: tuple[int, int, int]


WORLD_BOARDS = [
    WorldBoard("munika", "慕妮卡帝国", "综合型主世界 / 仪式秩序与长期关系线", "outline", (196, 166, 109)),
    WorldBoard("fuguang", "浮光掠影", "都市异常 / 校园悬疑 / 港城夜雨", "skeleton", (104, 176, 208)),
    WorldBoard("jitu", "寂土挽歌", "灾后求生 / 撤离线 / 补给与重建", "outline", (186, 122, 102)),
    WorldBoard("chenhuan", "尘寰问道", "古风旧案 / 山水异闻 / 因果抉择", "outline", (122, 163, 122)),
    WorldBoard("zhoufu", "咒缚回响", "学院魔幻 / 海路誓约 / 高气质幻想", "outline", (117, 127, 204)),
    WorldBoard("xingyu", "星宇织梦", "轨道城 / 文明边疆 / 明亮科幻", "productionDesign", (122, 193, 214)),
]


def fit_image(path: Path, size: tuple[int, int]) -> Image.Image:
    image = Image.open(path).convert("RGB")
    return ImageOps.fit(image, size, method=Image.Resampling.LANCZOS)


def draw_text_block(
    draw: ImageDraw.ImageDraw,
    text: str,
    box: tuple[int, int, int, int],
    font: ImageFont.ImageFont,
    fill: tuple[int, int, int] | str,
    line_gap: int = 8,
) -> None:
    x1, y1, x2, y2 = box
    max_width = max(12, x2 - x1)
    avg_char_width = max(10, int(font.size * 0.9) if hasattr(font, "size") else 18)
    line_length = max(6, max_width // avg_char_width)
    lines = []
    for paragraph in text.split("\n"):
        if not paragraph:
            lines.append("")
            continue
        lines.extend(wrap(paragraph, width=line_length, break_long_words=False, replace_whitespace=False))
    y = y1
    for line in lines:
        if y > y2:
            break
        draw.text((x1, y), line, font=font, fill=fill)
        bbox = draw.textbbox((x1, y), line, font=font)
        y = bbox[3] + line_gap


def make_world_triptych(board: WorldBoard) -> Path:
    width, height = 2100, 1260
    canvas = Image.new("RGB", (width, height), "#0f1622")
    draw = ImageDraw.Draw(canvas)

    draw.rounded_rectangle((34, 34, width - 34, height - 34), radius=42, fill="#111827", outline="#dccfb2", width=3)
    draw.rounded_rectangle((70, 70, width - 70, 196), radius=30, fill=(28, 38, 58))

    draw.text((106, 98), board.title, font=FONT_TITLE, fill="#f8f5ee")
    draw.text((106, 158), f"{board.subtitle}    当前公开阶段：{board.stage}", font=FONT_BODY, fill="#d9dfec")
    draw.rounded_rectangle((width - 400, 92, width - 100, 154), radius=24, fill=(board.accent[0], board.accent[1], board.accent[2]))
    draw.text((width - 374, 108), "概念艺术 / 非实机", font=FONT_SMALL, fill="#111827")

    panel_top = 236
    panel_height = 760
    panel_width = 616
    gap = 34
    left = 72
    labels = [("总海报", "world-poster"), ("局部场景", "world-scene"), ("事件落点", "world-event")]
    for index, (label, suffix) in enumerate(labels):
        panel_x = left + index * (panel_width + gap)
        image_path = GENERATED / f"world-{board.key}-{suffix.replace('world-', '')}-v2.png"
        if suffix == "world-poster":
            image_path = GENERATED / f"world-{board.key}-poster-v2.png"
        elif suffix == "world-scene":
            image_path = GENERATED / f"world-{board.key}-scene-v2.png"
        else:
            image_path = GENERATED / f"world-{board.key}-event-v2.png"
        panel = fit_image(image_path, (panel_width, panel_height))
        canvas.paste(panel, (panel_x, panel_top))
        draw.rounded_rectangle((panel_x, panel_top, panel_x + panel_width, panel_top + panel_height), radius=28, outline="#f2eada", width=4)
        draw.rounded_rectangle((panel_x + 18, panel_top + 18, panel_x + 206, panel_top + 74), radius=20, fill=(12, 18, 28, 185))
        draw.text((panel_x + 38, panel_top + 32), label, font=FONT_SECTION, fill="#f7f3ec")

    footer_y = 1030
    draw.rounded_rectangle((70, footer_y, width - 70, height - 70), radius=28, fill="#182233")
    footer = (
        "本单图由三张 GPT Image 2 原始概念图合成，用于根 README 的单域展示；"
        "对应完整原图与更细说明继续保留在 docs/readme/世界图册.md。"
    )
    draw_text_block(draw, footer, (102, footer_y + 30, width - 120, height - 92), FONT_BODY, "#d7e1f2")

    output = COMPOSITES / f"world-{board.key}-triptych-board.png"
    canvas.save(output, quality=95)
    return output


def make_runtime_evidence_board() -> Path:
    width, height = 2240, 1480
    canvas = Image.new("RGB", (width, height), "#121827")
    draw = ImageDraw.Draw(canvas)

    draw.rounded_rectangle((34, 34, width - 34, height - 34), radius=42, fill="#121a29", outline="#d9ceb7", width=3)
    draw.text((96, 84), "当前真实可玩证据板", font=FONT_TITLE, fill="#f8f5ee")
    draw.text((96, 150), "README 首批 6 张核心实机图已经归档完成；整板只放真实截图，不以概念图代替。", font=FONT_BODY, fill="#dbe2ef")
    draw.rounded_rectangle((width - 360, 84, width - 96, 148), radius=24, fill="#8fd6c3")
    draw.text((width - 330, 101), "真实截图 / 当前证据", font=FONT_SMALL, fill="#0f1722")

    slots = [
        {
            "title": "地图探索",
            "kind": "real",
            "caption": "仓库内已有真实运行截图：像素地图、角色与三栏结构。",
            "path": ASSET_ROOT / "prototype-campus-map.png",
        },
        {
            "title": "旅途菜单",
            "kind": "real",
            "caption": "仓库内已有真实运行截图：菜单、图鉴与长期资料界面。",
            "path": ASSET_ROOT / "prototype-gallery-ui.png",
        },
        {
            "title": "地图对话 / 事件",
            "kind": "real",
            "caption": "真实地图事件对话截图：对话框、立绘差分与当前状态同屏可见。",
            "path": SCREENSHOTS / "README-SHOT-03-dialogue-and-map-event.png",
        },
        {
            "title": "存档界面",
            "kind": "real",
            "caption": "真实存档面板截图：槽位、地点、状态、时间与管理按钮同时可见。",
            "path": SCREENSHOTS / "README-SHOT-04-save-load-panel.png",
        },
        {
            "title": "关系图谱面板",
            "kind": "real",
            "caption": "真实关系图谱面板截图：节点、连线与图谱操作栏都已可见。",
            "path": SCREENSHOTS / "README-SHOT-05-relation-graph-panel.png",
        },
        {
            "title": "互动小说模式",
            "kind": "real",
            "caption": "真实十三号病院副本模式截图：正文区域、正式副本入口与侧栏同屏。",
            "path": SCREENSHOTS / "README-SHOT-06-interactive-fiction-mode.png",
        },
    ]

    grid_left, grid_top = 96, 240
    card_w, card_h = 640, 520
    gap_x, gap_y = 64, 60
    for index, slot in enumerate(slots):
        row = index // 3
        col = index % 3
        x = grid_left + col * (card_w + gap_x)
        y = grid_top + row * (card_h + gap_y)
        draw.rounded_rectangle((x, y, x + card_w, y + card_h), radius=30, fill="#1b2536", outline="#d9ceb7", width=3)
        if slot["kind"] == "real":
            image = fit_image(slot["path"], (card_w - 32, 338))
            canvas.paste(image, (x + 16, y + 16))
            draw.rounded_rectangle((x + 16, y + 16, x + card_w - 16, y + 354), radius=22, outline="#f4ead8", width=3)
            draw.text((x + 28, y + 374), slot["title"], font=FONT_SECTION, fill="#f5f0e6")
            draw_text_block(draw, slot["caption"], (x + 28, y + 414, x + card_w - 28, y + card_h - 28), FONT_SMALL, "#d8e2ef", line_gap=6)
        else:
            draw.rounded_rectangle((x + 18, y + 18, x + card_w - 18, y + 354), radius=24, outline="#7c8aa3", width=3)
            draw.line((x + 32, y + 32, x + card_w - 32, y + 340), fill="#49566f", width=3)
            draw.line((x + card_w - 32, y + 32, x + 32, y + 340), fill="#49566f", width=3)
            draw.text((x + 28, y + 374), slot["title"], font=FONT_SECTION, fill="#f5f0e6")
            draw_text_block(
                draw,
                f"待用户补拍真实截图\n{slot['filename']}\n\n已在截图清单中写明进入位置、操作步骤和必须包含的画面元素。",
                (x + 28, y + 414, x + card_w - 28, y + card_h - 28),
                FONT_SMALL,
                "#d8e2ef",
                line_gap=6,
            )

    output = COMPOSITES / "runtime-evidence-board-v1.png"
    canvas.save(output, quality=95)
    return output


def make_story_case_board() -> Path:
    width, height = 1540, 2240
    background = fit_image(GENERATED / "story-to-playable-case-base.png", (width, height))
    overlay = Image.new("RGBA", (width, height), (8, 13, 23, 0))
    draw = ImageDraw.Draw(overlay)

    draw.rounded_rectangle((44, 44, width - 44, height - 44), radius=40, outline=(243, 232, 212, 255), width=4)
    draw.rounded_rectangle((84, 84, width - 84, 226), radius=28, fill=(16, 23, 36, 228))
    draw.text((120, 118), "纵向真实案例：十三号病院", font=FONT_TITLE, fill="#f8f5ee")
    draw.text((120, 178), "从旧页面桥段到正式互动小说副本的数据化落地", font=FONT_BODY, fill="#dfe7f5")

    sections = [
        (
            "1. 内容来源",
            "旧页面桥段与正式来源并存：\n"
            "src/components/Domain/ChamberShop/Chamber1.vue\n"
            "src/game/data/interactive_fictions/asylum_for_lunatic/scenario.json",
        ),
        (
            "2. 正式玩法数据",
            "当前副本已拆为正式数据包：\n"
            "meta.ts / assets.ts / index.ts / scenario.json\n"
            "标题：十三号病院\n"
            "startNodeId：start",
        ),
        (
            "3. 运行入口",
            "当前旗舰入口仍然统一收口到 /#/game。\n"
            "GameView 会通过互动小说 registry 载入正式副本数据，"
            "而不是继续依赖旧页面模板。",
        ),
        (
            "4. 已确认的仓库证据",
            "docs/功能更新/044-互动小说副本模式与可复用滚动条.md\n"
            "docs/功能更新/048-asylum互动小说流程补全与结局状态.md\n"
            "docs/readme/可玩证据.md",
        ),
        (
            "5. 实机证据已经补齐",
            "README-SHOT-06-interactive-fiction-mode.png 已归档。\n"
            "现在这条链路不再停在“已有正式入口”，\n"
            "而是已经具备可公开展示的真实副本界面证据。",
        ),
    ]

    top = 292
    box_h = 314
    gap = 32
    for index, (title, body) in enumerate(sections):
        y1 = top + index * (box_h + gap)
        y2 = y1 + box_h
        draw.rounded_rectangle((94, y1, width - 94, y2), radius=26, fill=(18, 27, 43, 232), outline=(229, 219, 196, 255), width=3)
        draw.text((124, y1 + 26), title, font=FONT_SECTION, fill="#f6efe2")
        draw_text_block(draw, body, (124, y1 + 78, width - 124, y2 - 28), FONT_BODY, "#dce4f2")
        if index < len(sections) - 1:
            mid_x = width // 2
            draw.line((mid_x, y2 + 4, mid_x, y2 + gap - 8), fill=(239, 230, 206, 255), width=4)
            draw.ellipse((mid_x - 8, y2 + gap - 20, mid_x + 8, y2 + gap - 4), fill=(239, 230, 206, 255))

    draw.rounded_rectangle((94, height - 194, width - 94, height - 94), radius=26, fill=(126, 202, 179, 232))
    draw_text_block(
        draw,
        "这张案例板只使用真实仓库路径和正式副本数据；"
        "没有拿概念图冒充互动小说实机界面。",
        (124, height - 168, width - 124, height - 112),
        FONT_BODY,
        "#0f1722",
    )

    output = COMPOSITES / "story-to-playable-case-asylum-board.png"
    Image.alpha_composite(background.convert("RGBA"), overlay).convert("RGB").save(output, quality=95)
    return output


def make_project_dashboard() -> Path:
    width, height = 2100, 1260
    background = fit_image(GENERATED / "project-scale-dashboard-base.png", (width, height))
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    with (GENERATED / "project-stats.json").open("r", encoding="utf-8") as f:
        stats = json.load(f)
    counts = stats["counts"]
    coverage = stats["coverageSummary"]

    draw.rounded_rectangle((34, 34, width - 34, height - 34), radius=42, outline=(242, 232, 210, 255), width=4)
    draw.rounded_rectangle((68, 68, width - 68, 190), radius=28, fill=(14, 21, 34, 228))
    draw.text((104, 102), "璃落宇宙公开规模快照", font=FONT_TITLE, fill="#f9f5ee")
    draw.text((104, 156), "自动统计生成于项目当前仓库状态；不以文件数量冒充可玩程度。", font=FONT_BODY, fill="#dfe7f5")

    cards = [
        ("公开叙事域", str(counts["publicWorldCount"])),
        ("地图包", str(counts["mapPackageCount"])),
        ("互动小说副本", str(counts["interactiveFictionScenarioCount"])),
        ("故事 Markdown", str(counts["storyMarkdownCount"])),
        ("情节群", str(counts["plotGroupCount"])),
        ("Schema", str(counts["schemaCount"])),
        ("项目 Skill", str(counts["projectSkillCount"])),
        ("真实截图", f'{counts["verifiedScreenshotCount"]} / {counts["verifiedScreenshotCount"] + counts["pendingScreenshotRequestCount"]}'),
    ]

    card_w, card_h = 430, 180
    start_x, start_y = 104, 246
    gap_x, gap_y = 42, 28
    for index, (label, value) in enumerate(cards):
        row = index // 4
        col = index % 4
        x = start_x + col * (card_w + gap_x)
        y = start_y + row * (card_h + gap_y)
        draw.rounded_rectangle((x, y, x + card_w, y + card_h), radius=30, fill=(18, 27, 42, 220), outline=(234, 225, 204, 255), width=3)
        draw.text((x + 28, y + 32), label, font=FONT_SECTION, fill="#f5efe4")
        draw.text((x + 28, y + 88), value, font=load_font(52, bold=True), fill="#f8f5ee")

    maturity_y = 690
    draw.rounded_rectangle((104, maturity_y, width - 104, height - 104), radius=30, fill=(17, 25, 39, 220), outline=(234, 225, 204, 255), width=3)
    draw.text((134, maturity_y + 28), "六域当前系列成熟度", font=FONT_SECTION, fill="#f5efe4")
    row_y = maturity_y + 92
    for item in coverage:
        title = item["publicTitle"]
        series = item["seriesTitle"]
        stage = item["stageLabel"]
        draw.rounded_rectangle((134, row_y, width - 134, row_y + 82), radius=20, fill=(29, 39, 58, 216))
        draw.text((162, row_y + 20), title, font=FONT_SECTION, fill="#f7f3ec")
        draw.text((418, row_y + 22), series, font=FONT_BODY, fill="#dce4f2")
        draw.rounded_rectangle((width - 350, row_y + 16, width - 162, row_y + 62), radius=18, fill=(126, 202, 179, 232))
        draw.text((width - 320, row_y + 26), stage, font=FONT_SMALL, fill="#0f1722")
        row_y += 96

    output = COMPOSITES / "project-scale-dashboard-v2.png"
    Image.alpha_composite(background.convert("RGBA"), overlay).convert("RGB").save(output, quality=95)
    return output


def make_evidence_boundary_board() -> Path:
    width, height = 2100, 1260
    background = fit_image(GENERATED / "readme-evidence-boundary-base-v2.png", (width, height))
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    draw.rounded_rectangle((48, 42, width - 48, 170), radius=34, fill=(17, 25, 38, 225))
    draw.text((90, 78), "README 证据边界", font=FONT_TITLE, fill="#f8f5ee")
    draw.text((90, 136), "每张图都必须承担吸引、证明、解释或转化中的至少一种任务。", font=FONT_BODY, fill="#dce4f2")

    columns = [
        (
            "真实可玩证据",
            "只放真实截图、真实运行界面、构建验证和当前仓库里可直接核对的功能。",
            "#203b4a",
        ),
        (
            "GPT Image 2 概念视觉",
            "只负责表达气质、角色一致性、世界差异和公开展示氛围，不冒充实机。",
            "#4a2c39",
        ),
        (
            "统计与治理整板",
            "由脚本、截图清单和真实项目数据生成，用来说明规模、成熟度、路线和协作边界。",
            "#2f3f2f",
        ),
    ]
    left = 116
    top = 284
    card_w = 520
    card_h = 730
    gap = 112
    for index, (title, body, color) in enumerate(columns):
        x = left + index * (card_w + gap)
        draw.rounded_rectangle((x, top, x + card_w, top + card_h), radius=30, fill=(15, 22, 34, 190), outline="#e8dcc2", width=3)
        draw.rounded_rectangle((x + 28, top + 28, x + 274, top + 86), radius=22, fill=color)
        draw.text((x + 48, top + 44), title, font=FONT_SECTION, fill="#f8f5ee")
        draw_text_block(draw, body, (x + 42, top + 132, x + card_w - 42, top + 316), FONT_BODY, "#edf2fb", line_gap=10)
        bullets = {
            "真实可玩证据": ["地图 / 菜单 / 图谱", "对话 / 存档 / 副本", "截图可追溯到真实入口"],
            "GPT Image 2 概念视觉": ["六域气质与主视觉", "璃落跨世界一致性", "海报、横卷、体系底图"],
            "统计与治理整板": ["规模快照与成熟度", "截图归档与用途", "协作路线与公开边界"],
        }[title]
        bullet_y = top + 376
        for bullet in bullets:
            draw.rounded_rectangle((x + 42, bullet_y + 8, x + 62, bullet_y + 28), radius=8, fill="#9fd9ca")
            draw_text_block(draw, bullet, (x + 84, bullet_y, x + card_w - 40, bullet_y + 42), FONT_BODY, "#f8f5ee", line_gap=6)
            bullet_y += 84

    footer = "因此根 README 既不能退化成纯文档，也不能退化成一整页无证据的漂亮插画。"
    draw.rounded_rectangle((78, height - 148, width - 78, height - 72), radius=28, fill=(141, 216, 199, 225))
    draw_text_block(draw, footer, (116, height - 128, width - 116, height - 88), FONT_BODY, "#10202b")

    output = COMPOSITES / "readme-evidence-boundary-board-v2.png"
    Image.alpha_composite(background.convert("RGBA"), overlay).convert("RGB").save(output, quality=95)
    return output


def make_story_pipeline_board() -> Path:
    width, height = 2240, 1260
    background = fit_image(GENERATED / "story-production-pipeline-base-v2.png", (width, height))
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    draw.rounded_rectangle((40, 34, width - 40, 154), radius=34, fill=(14, 21, 34, 228))
    draw.text((88, 70), "同一故事如何进入正式形态", font=FONT_TITLE, fill="#f8f5ee")
    draw.text((88, 126), "把点子拆成来源、设计、对话、地图与副本入口，是这个项目的核心公开价值。", font=FONT_BODY, fill="#dce4f2")

    stages = [
        ("世界与故事来源", "世界来源 JSON、大纲、情节群、角色与关系约束"),
        ("生产设计", "任务目标、地图目标、关卡节奏、事件条件与反馈"),
        ("对话与轻验证", "对话卡、互动小说、副本正文、资料页和轻量入口"),
        ("正式运行层", "地图探索、菜单、图谱、触发事件、存档与可玩段落"),
    ]
    top_labels_y = 34
    bottom_labels_y = 1070
    label_boxes = [
        (94, top_labels_y, 498, 126),
        (626, top_labels_y, 1032, 126),
        (1158, top_labels_y, 1566, 126),
        (1692, top_labels_y, 2102, 126),
    ]
    body_boxes = [
        (120, bottom_labels_y, 508, 1186),
        (654, bottom_labels_y, 1042, 1186),
        (1184, bottom_labels_y, 1572, 1186),
        (1712, bottom_labels_y, 2100, 1186),
    ]
    for (title, body), label_box, body_box in zip(stages, label_boxes, body_boxes):
        draw.rounded_rectangle(label_box, radius=22, fill=(15, 23, 36, 210), outline="#ead9b8", width=3)
        draw.text((label_box[0] + 24, label_box[1] + 22), title, font=FONT_SECTION, fill="#f8f5ee")
        draw.rounded_rectangle(body_box, radius=22, fill=(15, 23, 36, 210), outline="#ead9b8", width=3)
        draw_text_block(draw, body, (body_box[0] + 22, body_box[1] + 18, body_box[2] - 22, body_box[3] - 18), FONT_SMALL, "#edf2fb", line_gap=8)

    output = COMPOSITES / "story-production-pipeline-board-v2.png"
    Image.alpha_composite(background.convert("RGBA"), overlay).convert("RGB").save(output, quality=95)
    return output


def make_graph_evidence_board() -> Path:
    width, height = 2100, 1480
    background = fit_image(GENERATED / "relationship-graph-evidence-frame-bg.png", (width, height))
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    graph = fit_image(SCREENSHOTS / "README-SHOT-05-relation-graph-panel.png", (1470, 760))
    background_rgba = background.convert("RGBA")
    background_rgba.paste(graph, (315, 174))

    draw.rounded_rectangle((44, 38, width - 44, 152), radius=32, fill=(15, 23, 36, 228))
    draw.text((88, 72), "真实图谱证据：关系、情节、玩法与人物已经连成网", font=FONT_TITLE, fill="#f8f5ee")

    draw.rounded_rectangle((290, 150, 1810, 946), radius=26, outline="#ead9b8", width=4)
    labels = [
        ("故事层", "左列可见故事节点，不是只剩散落文案。"),
        ("情节 / 玩法", "中段能看到情节与玩法的对应关系。"),
        ("人物与组织", "右侧能看到人物列与多条可见连线。"),
    ]
    label_y = 1088
    label_w = 520
    gap = 100
    left = 142
    for title, body in labels:
        draw.rounded_rectangle((left, label_y, left + label_w, 1316), radius=24, fill=(17, 25, 40, 222), outline="#ead9b8", width=3)
        draw.text((left + 24, label_y + 24), title, font=FONT_SECTION, fill="#f8f5ee")
        draw_text_block(draw, body, (left + 24, label_y + 74, left + label_w - 24, 1288), FONT_SMALL, "#e5edf8", line_gap=8)
        left += label_w + gap

    output = COMPOSITES / "relationship-graph-real-evidence-board.png"
    Image.alpha_composite(background_rgba, overlay).convert("RGB").save(output, quality=95)
    return output


def main() -> None:
    for board in WORLD_BOARDS:
        make_world_triptych(board)
    make_runtime_evidence_board()
    make_story_case_board()
    make_project_dashboard()
    make_evidence_boundary_board()
    make_story_pipeline_board()
    make_graph_evidence_board()


if __name__ == "__main__":
    main()

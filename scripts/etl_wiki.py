"""ETL: 股份百科 xlsx → frontend/src/data/wikiData.json

输入：assets/股份百科知识产品生成.xlsx（10 条词条，7 列原始字段）
输出：frontend/src/data/wikiData.json（5 字段精简 schema：id/name/domain/body/references）

使用 Python stdlib 解析 xlsx（zipfile + ElementTree），不依赖 openpyxl。
业务方更新 xlsx 后直接重跑即可。
"""

from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
XLSX_PATH = REPO_ROOT / "assets" / "股份百科知识产品生成.xlsx"
JSON_PATH = REPO_ROOT / "frontend" / "src" / "data" / "wikiData.json"

NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

# 词条名 → 业务域（白名单：生产/投资/研发/采购/营销/财务/设备/安全/环保/质量/人力/信息/能源/管理）
# 显式表，按 xlsx 行序。新增词条时在此扩展；找不到映射会报错。
DOMAIN_MAP: dict[str, str] = {
    "冷轧带钢物理缺陷协同诊断图谱": "质量",
    "酸洗机组欠酸洗治理与效能评估模型": "质量",
    "高炉降本增效核心操作指南": "生产",
    "冶金生产双重预防与风险管控知识库": "安全",
    "主传动系统机电液健康度模型": "设备",
    "冷轧原料缺陷遗传性分析与阻断图谱": "研发",
    "冷轧机组张力协同与板形稳定控制模型": "生产",
    "高炉煤气流动态调控与热能效评估库": "能源",
    "轧线关键装备劣化诊断与技改评价体系": "设备",
    "冶金涉煤气及动能隔离高危作业规范": "安全",
}


def parse_xlsx(path: Path) -> list[dict[str, str]]:
    """解析 xlsx 第一个 sheet，返回行字典列表（列字母 → 单元格文本）。第 1 行为表头。"""
    with zipfile.ZipFile(path) as z:
        sst_root = ET.parse(z.open("xl/sharedStrings.xml")).getroot()
        strings: list[str] = []
        for si in sst_root.findall("s:si", NS):
            txt = "".join(t.text or "" for t in si.iter(f"{{{NS['s']}}}t"))
            strings.append(txt)

        sheet = ET.parse(z.open("xl/worksheets/sheet1.xml")).getroot()

    rows: list[dict[str, str]] = []
    for row in sheet.findall("s:sheetData/s:row", NS):
        cells: dict[str, str] = {}
        for c in row.findall("s:c", NS):
            ref = c.attrib.get("r", "")
            t = c.attrib.get("t", "")
            v = c.find("s:v", NS)
            inline = c.find("s:is", NS)
            if t == "s" and v is not None:
                val = strings[int(v.text or "0")]
            elif inline is not None:
                val = "".join(x.text or "" for x in inline.iter(f"{{{NS['s']}}}t"))
            elif v is not None:
                val = v.text or ""
            else:
                val = ""
            m = re.match(r"([A-Z]+)", ref)
            if m:
                cells[m.group(1)] = val
        rows.append(cells)
    return rows


def transform_body(raw: str) -> str:
    """把 xlsx 正文转成 markdown 字符串。

    输入结构（每条词条都是这个模板）：
        <概述段>\n\n
        其核心价值在于：<...>\n\n
        主要应用：\n\n
        <子项 1 标题> —— <描述>\n\n
        <子项 2 标题> —— <描述>\n\n
        <子项 3 标题> —— <描述>

    输出 markdown：
        <概述段>

        其核心价值在于：<...>

        ## 主要应用

        - **<子项 1 标题>** — <描述>
        - **<子项 2 标题>** — <描述>
        - **<子项 3 标题>** — <描述>
    """
    paras = [p.strip() for p in raw.split("\n\n") if p.strip()]

    out: list[str] = []
    in_apps = False
    for para in paras:
        # "主要应用：" 这一行单独成段，转 h2
        if para.rstrip("：:") == "主要应用":
            out.append("## 主要应用")
            in_apps = True
            continue

        if in_apps and "——" in para:
            # 子项格式 "标题 —— 描述"
            title, _, desc = para.partition("——")
            out.append(f"- **{title.strip()}** — {desc.strip()}")
        else:
            out.append(para)

    return "\n\n".join(out)


def split_references(raw: str) -> list[str]:
    """把『《a.pdf》、《b.pdf》、《c.pdf》』这种字符串拆成纯文件名数组。"""
    if not raw:
        return []
    # 同时支持顿号 / 全角逗号 / 半角逗号 分隔
    parts = re.split(r"[、,，]", raw)
    out: list[str] = []
    for p in parts:
        s = p.strip().strip("《》").strip()
        if s:
            out.append(s)
    return out


def build_entries(rows: list[dict[str, str]]) -> list[dict]:
    """跳过第 1 行表头，按行序生成 wiki-001..wiki-NNN 词条。"""
    entries: list[dict] = []
    for idx, row in enumerate(rows[1:], start=1):
        name = row.get("A", "").strip()
        if not name:
            continue
        body_raw = row.get("F", "")
        refs_raw = row.get("G", "")

        domain = DOMAIN_MAP.get(name)
        if domain is None:
            raise ValueError(
                f"未在 DOMAIN_MAP 找到词条「{name}」的业务域；请在 scripts/etl_wiki.py 里补全后重试"
            )

        entries.append(
            {
                "id": f"wiki-{idx:03d}",
                "name": name,
                "domain": domain,
                "body": transform_body(body_raw),
                "references": split_references(refs_raw),
            }
        )
    return entries


def main() -> None:
    if not XLSX_PATH.exists():
        raise SystemExit(f"找不到源文件: {XLSX_PATH}")

    rows = parse_xlsx(XLSX_PATH)
    entries = build_entries(rows)

    JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    JSON_PATH.write_text(
        json.dumps(entries, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"✓ wrote {len(entries)} entries to {JSON_PATH.relative_to(REPO_ROOT)}")
    for e in entries:
        print(f"  {e['id']}  [{e['domain']}]  {e['name']}  (refs: {len(e['references'])})")


if __name__ == "__main__":
    main()

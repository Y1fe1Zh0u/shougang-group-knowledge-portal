# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **一句话定位**：首钢集团知识门户是基于 BiSheng 上游能力的 **BFF + React 套壳门户**。门户层不持久化任何业务数据；所有知识、检索、问答能力均通过 HTTP 代理到 BiSheng。门户自己只持久化两份 JSON：**门户配置**与 **BiSheng 运行时连接信息**。

---

## 0. 协作者快速上手

**项目是什么**：FastAPI BFF + React 前端，把 BiSheng 的知识 / 搜索 / 问答能力包成首钢内部门户。门户自己**不持有业务数据**，只持久化两份 JSON（`backend/app/config/data/portal_config.json` 与 `bisheng_runtime.json`）。

**新加入的人请按这个顺序读**：

1. **本文** — 架构、约定、多环境拓扑、生产部署位置（一次过即可）
2. [`.claude/HANDOVER.md`](.claude/HANDOVER.md) — 运行时陷阱（SOCKS 代理、token 失效、URL 填错等具体踩坑）
3. [`docs/deployment.md`](docs/deployment.md) — BiSheng 自动续期凭证 + token TTL 配置

**本地半小时起服**（详细见 §2）：

```bash
# 后端 (port 8010) — Mac 必须 unset SOCKS 代理变量
cd backend
env -u all_proxy ./.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8010

# 前端 (port 5173, /api 自动代理到 8010)
cd frontend && npm run dev
```

跑起来后浏览器开 **http://localhost:5173/**。如果首页业务域 / 标签 / 知识空间是空的，多半是 BiSheng 接入凭证问题 —— 见 §6。

**生产环境**：已部署在 **http://192.168.106.114:3001/**（同事访问入口），运维细节见 §7。

---

## 1. 项目身份与边界

- **独立仓库**，不是 BiSheng fork。BFF 通过 `httpx` 调上游 BiSheng（默认 `http://localhost:7860`，CI 联调指向 `http://192.168.106.109:7860`）
- **双层架构**（详见 `docs/system-architecture.md` / `docs/software-architecture.md`）：
  - **门户层**（本仓库）— 业务表达、配置管理、接口聚合
  - **BiSheng 平台**（上游）— 知识、模型、检索、问答能力沉淀
- **写边界**：门户只往两个 JSON 写——`backend/app/config/data/portal_config.json` 与 `backend/app/config/data/bisheng_runtime.json`。**任何业务数据写入都应该指向 BiSheng**
- **业务域 (Domain) 是纯前端概念**——只用于配置和展示，**不进入任何 BFF API 入参/出参**（API 一律用 `space_ids`）

---

## 2. 常用命令

> 启动后端前 Mac 必须 `env -u all_proxy ...` 屏蔽 SOCKS 代理变量，否则 httpx lifespan 崩溃。详见 `.claude/HANDOVER.md` §6。

### 后端（FastAPI BFF, port 8010）

```bash
cd backend
./.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8010

./.venv/bin/python -m pytest                                     # 全量
./.venv/bin/python -m pytest tests/test_knowledge_api.py         # 单文件
./.venv/bin/python -m pytest tests/test_knowledge_api.py::test_x # 单测
```

环境：Python ≥3.11（验证过 3.13）。**不要用系统 Python 3.9 跑测试**——3.11+ 语法/标准库会失败。

### 前端（Vite, port 5173）

```bash
cd frontend
npm run dev          # 开发服务器，/api 自动代理到 8010
npm test             # node --test：先 tsc 编译 tests/ 到 .test-dist/，再 node 原生测试器
npm run lint         # eslint .
npm run build        # tsc -b（全量类型检查）+ vite build
npm run preview      # 本地预览打包产物
```

### 烟测（验证当前环境）

```bash
curl http://127.0.0.1:8010/health
# 期望 {"status_code":200, ..., "data":{"service":"knowledge-portal-backend","status":"ok"}}

curl http://127.0.0.1:8010/api/v1/knowledge/tags
# 期望非空 data 数组；空数组通常意味着 BiSheng token 已过期
```

浏览器入口：**http://localhost:5173/**

---

## 3. 后端架构（FastAPI BFF）

**生命周期**（`backend/app/main.py`）：lifespan 实例化 `BishengRuntimeService` 与 `PortalConfigService`，挂到 `app.state`，通过 `app/api/dependencies.py` 中的依赖注入函数下发给路由。

**路由聚合**（`backend/app/api/router.py`，前缀 `/api/v1`）：

| 子路由 | 路径 | 职责 |
|---|---|---|
| `health` | `/health` | 健康检查 |
| `admin_config` | `/admin/config/*` | 门户配置 CRUD（`spaces`/`domains`/`sections`/`qa`/`recommendation`/`display`/`apps`）+ space/model 选项 + BiSheng 运行时配置改写 |
| `knowledge` | `/knowledge/*` | 文件搜索、标签、详情、预览、分块、相关推荐 |
| `chat_proxy` | `/workstation/chat/completions` | SSE 流式问答代理 |

**四个核心服务**（`backend/app/services/`）：

| 服务 | 持久化 | 关键职责 |
|---|---|---|
| `PortalConfigService` | `portal_config.json`（原子写 + threading.Lock） | 配置 CRUD；字段级更新；`with_live_space_data()` 把 BiSheng 实时文件数合并进配置 |
| `BishengRuntimeService` | `bisheng_runtime.json`（**已 gitignore**, 0o600） | BiSheng 连接参数（`base_url`/`timeout`/`api_token`/`last_auth_at`）；运行时改地址会触发重新登录拿 token；管理 `BishengClient` 单例 |
| `KnowledgeService` | 无 | 跨空间搜索（带关键词评分）、详情、**预览（多源优先级 `preview_url` → `original_url` → 异步 `preview_task`，900s 缓存）**、分块、相关文件（共标签） |
| `ChatProxyService` | 无 | 从 portal_config 读 `knowledge_space_ids` 与 `system_prompt`，按 scene（search/qa）选提示词后转发到 BiSheng |

**BiSheng 客户端**（`backend/app/clients/bisheng.py`，httpx.AsyncClient 薄封装）：

- 同步：`get_json()` / `post_json()`；流式：`stream_post()` / `stream_get()`
- **认证同时通过头与 Cookie**：`Authorization: Bearer <token>` + Cookie `access_token_cookie=<token>`
- **Token 自动续期**：`BishengRuntimeService._login_and_get_token` 拿公钥 → RSA 加密密码 → `POST /api/v1/user/login` 拿 access_token；`_refresh_loop` 30 分钟轮询，剩余有效期 ≤ 1h 自动续。admin UI 填 URL + 账号 + 密码即可，**不需要手动拷 token**。手动 token 只在 BiSheng 启用验证码 / 不可达时作为兜底（写 `PORTAL_BISHENG_API_TOKEN`）。详见 §6。
- 取预签名 URL 资源用**独立的无认证 client**（避免把 token 漏给对象存储）

**配置 schema**（`backend/app/schemas/portal_config.py`，pydantic）：portal_config.json 顶层 = `spaces` / `domains` / `sections` / `qa` / `recommendation` / `display` / `apps`。**schema 即前后端契约**。

**Settings**（`backend/app/settings.py`，`env_prefix="PORTAL_"`，pydantic-settings）：
关键变量 `PORTAL_BISHENG_BASE_URL` / `PORTAL_BISHENG_API_TOKEN` / `PORTAL_BISHENG_TIMEOUT_SECONDS` / `PORTAL_BISHENG_DEFAULT_MODEL` / `PORTAL_BISHENG_PAGE_SIZE_LIMIT`。`backend/.env` 已 gitignore。

**测试**（`backend/tests/`）：pytest + FastAPI TestClient。BiSheng 上游用 `FakeBishengClient` mock；不依赖真实 BiSheng 即可跑全量。

---

## 4. 前端架构（React 18 + Vite + TS）

**核心范式：配置驱动**——后端返回完整 `PortalConfig`，前端做归一化、enable 过滤、视觉默认值兜底。**无 Redux / Zustand / Provider 树**。

**入口与路由**（`src/App.tsx` + `react-router-dom v7`）：

```
/                       主页
/domains                业务域列表
/domain/:domainName     业务域过滤的列表
/search                 全局搜索结果页
/space/:spaceId         知识空间文件列表
/space/:spaceId/file/:fileId  文件详情 + 预览
/qa                     技术问答
/apps                   应用市场
/admin                  后台配置
```

**API 调用层**（`src/api/`，**原生 fetch，无 axios**）：

- `adminConfig.ts` — 后台配置读写
- `content.ts` — 前台查询 + `streamChatCompletion()`（SSE 解析）
- 共享 `parseResponse<T>`：响应包络 `{status_code, status_message, data}`；4xx/5xx 抛 `status_message`
- 查询参数统一 `URLSearchParams`

**状态管理**：只用 React hook

- `usePortalConfig()`：各页面挂载时拉一次 PortalConfig，组件本地 `useState` 缓存（带 unmount 防泄漏标志）。**不做跨页面共享**——每个页面独立调用 hook

**配置归一化层（关键）**：

- `src/utils/portalConfig.ts` — `toRuntimeDisplayConfig` (snake→camel + 默认值回退到 `src/config/display.ts`)；`getEnabledSpaces/Domains/Sections/Apps`
- `src/utils/domainVisualPresets.ts` — 业务域视觉 fallback；处理 `background_image` 相对/绝对/CDN 路径归一化
- `src/utils/adminDomains.ts` / `adminSections.ts` / `adminSpaces.ts` — admin 侧的实体校验与变换

**样式：CSS Modules + CSS 变量令牌**

- 每个页面/组件 `.tsx` 配套 `.module.css`
- 公共令牌：`src/styles/tokens.css`（`--primary-*` / `--neutral-*` / `--surface` / `--shadow-*`）
- **无 Tailwind / styled-components**

**静态资源**：

- **运行时资产**：业务域封面（`*-domain-bg.jpg`）、Banner、Logo 都放在 `frontend/public/`，配置里以根路径 `/xxx.jpg` 引用，build 时拷到 nginx root。
- **素材源库**：`assets/sggf-source/`（仓库根，~54 MB，6 分类目录 + `MANIFEST.md`）— 来自首钢集团官网 sggf.com.cn 的候选素材：`01_carousel_banners/`（6 张 1920×1080 轮播 banner，附原文标语）、`02_section_backgrounds/`（9 张 1920×1080 栏目背景，对应关于我们/媒体中心/产品中心/技术创新等）、`03_product_cards/`（7 张产品竖版卡片）、`04_news_covers/`（5 张新闻配图）、`05_special/`（超高分辨率大图 / 宽幅 / 视频封面 / 产品页底图）、`06_icons/`（图标）。每张图在 `MANIFEST.md` 里标注源 URL / 尺寸 / 用途建议。**用法**：挑选 → 视觉优化 → 复制到 `frontend/public/` 并按上面的命名约定 (`*-domain-bg.jpg` / `banner-hero-*.jpg`) 重命名再用；**不要把整库丢进 public**（会全量打进 dist）。素材体积大，目录已 gitignore（不进版本库）。

**Vite 代理**（`frontend/vite.config.ts`）：`/api` 与 `/health` 代理到 `VITE_BACKEND_PROXY_TARGET`（默认 `http://localhost:8010`）。`allowedHosts` 含 `.trycloudflare.com`（支持内网穿透演示）。

**测试**（`frontend/tests/`）：node 原生 `--test`。先 `tsc -p tsconfig.tests.json` 编译到 `.test-dist/`，再 `node --test`。覆盖 portalConfig / domainVisualPresets / adminDomains/Sections/Spaces / filePreview。

**TypeScript 多文件**：`tsconfig.json` 主入口仅声明 references；`tsconfig.app.json`（src/，严格 lint，noUnusedLocals/Parameters）；`tsconfig.node.json`（vite.config）；`tsconfig.tests.json`（tests/，commonjs 输出）。

---

## 5. 关键开发约定

**① 配置即契约**——`portal_config.json` 的 schema 由后端 `app/schemas/portal_config.py` 定义；前端 `src/utils/portalConfig.ts` 必须同步消费。**改字段 = 同一 PR 同时改两边 + 加 fallback**。

**② API 公共约定**（详见 `knowledge-portal-api-spec-bisheng-review.md`）：

- 路径前缀 `/api/v1/`；响应包络 `{status_code, status_message, data}`
- 分页 `page`（默认 1）+ `page_size`（默认 20，最大 100）
- 空间默认查询范围 = 已绑定 + 公开；`space_ids` 参数支持白名单过滤
- ID 全为 `int`；**业务域 name 不进 API**

**③ 接口分档**——新加接口前先判定属于哪一档：
1. 直接复用 BiSheng 现成 API
2. 复用 BiSheng 能力后封装成门户 API
3. 门户新增能力（最少使用，门户原则上不持有业务数据）

**④ BiSheng 上游单点依赖**——所有读路径（搜索/详情/预览/分块/标签）最终都落到 `BishengClient`。**新增功能前先在 `knowledge-portal-api-spec-bisheng-review.md` 接口映射表里查 BiSheng 是否已有**，避免在门户重新发明。

**⑤ 历史归档**：`archive/` 是历史方案/排查记录，**不是当前事实来源**。当前以 `knowledge-portal-api-spec-bisheng-review.md` 和 `docs/*.md` 为准。

**⑥ 运行时陷阱与接手细节**：见 `.claude/HANDOVER.md`——SOCKS 代理 unset、共享 BiSheng 写操作污染、admin URL 填错（前端入口 vs 后端 API）、token 失效表现等。**CLAUDE.md 不重复这些；任何"为什么我跑不通"的问题先翻 HANDOVER**。

---

## 6. BiSheng 多环境与接入

### 拓扑速查

团队里能接的 BiSheng 实例有四套，**数据库各自独立**，浏览器入口 ≠ BFF 接入 URL：

| 浏览器入口（人看的）| 后端 API（BFF `base_url` 填这个）| 数据库 | 用途 |
|---|---|---|---|
| `192.168.106.114:4001` | `192.168.106.114:7860` | 114 系统级 MySQL | lilu 个人调试机；重启会断会话 |
| `192.168.106.120:3003` | `192.168.106.109:7860`（经 109:3001 二级 nginx + Gateway 8098）| 109 容器 | dev / CI 联调；团队共享，写操作会互相影响 |
| `192.168.106.120:3002` | `192.168.106.115:8098`（直连 Gateway）| 115 | test 验收；与 dev 链路 0 交集 |
| `192.168.106.116:3001` | `192.168.106.116:7861` | 116 容器 | release 测试 |

**记忆口诀**：`:4001 / :3003 / :3002 / :3001` 是带 nginx 静态托管的浏览器入口；`:7860 / :7861 / :8098` 才是 BFF 该接的后端 API。**填错的话 BFF 会拿到 SPA 的 index.html，所有 `/api/*` JSON 解析失败。**

判别方法：`curl <URL>/api/v1/knowledge?type=3`，正确的应返回 BiSheng JSON `{"status_code":..., "data":...}`，错误的返回 `<!DOCTYPE html>...`。

### 接入凭证（首选：账密自动续期）

1. 进 `/admin` → BiSheng 配置弹窗
2. 填 **base_url**（用上表里的后端 API 地址）+ **账号** + **密码** + 超时
3. 保存 → BFF 自动登录拿 token，写入 `bisheng_runtime.json`，30 分钟轮询续期

实现位置：`backend/app/services/bisheng_runtime_service.py:_login_and_get_token`。详细机制（公钥获取 / RSA 加密 / 续期阈值）见 [`docs/deployment.md` §2](docs/deployment.md)。

### 接入凭证（兜底：手动 token）

仅当 BiSheng 启用验证码 / 不可达 / 调试自动续期 时用：

1. 浏览器登 BiSheng → F12 → Application → Cookies → 拷 `access_token_cookie`
2. 写到 `backend/.env` 的 `PORTAL_BISHENG_API_TOKEN`，重启 BFF
3. 注意 token 默认 24h TTL；过期表现为 `/api/v1/knowledge/space/<id>/tag` 返 401

### 切换实例后必做

`portal_config.json` 里的 `spaces[].id` 是上一个 BiSheng 实例的内部 ID，**到新实例多半指向不同空间或不存在**（这次会话踩过：换 109 → 115 后 id=1 在 115 是别的空间）。处置：进 `/admin` → 知识空间 → 把旧条目停用 / 删除 → 「添加知识空间」从新候选列表（拉的是 BiSheng `type=3` 视图）里重新绑。

---

## 7. 生产部署 (114:3001) 速查

同事访问入口：**http://192.168.106.114:3001/**（同一份 nginx conf 也监听 :8088）。

### 资源位置

| 资源 | 路径 |
|---|---|
| 前端 dist | `/usr/share/nginx/shougang-portal/`（旧版备份在同目录 `.backup.<ts>`）|
| 后端源码 + venv | `/opt/shougang-portal/`（含 `.env` / `.venv` / `app/config/data/*.json`）|
| systemd unit | `/etc/systemd/system/shougang-portal.service` |
| nginx conf | `/etc/nginx/conf.d/shougang-portal-8088.conf` |
| BFF 监听 | `127.0.0.1:8010`（只走 nginx 反代，不对外）|
| BFF 日志 | `/var/log/shougang-portal.log` 或 `journalctl -u shougang-portal -f` |
| BiSheng 运行时配置 | `/opt/shougang-portal/app/config/data/bisheng_runtime.json`（admin UI 改它）|

### 升级命令

```bash
# 前端（不重启 BFF）
cd frontend && npm run build
rsync -az --delete dist/ root@192.168.106.114:/usr/share/nginx/shougang-portal/

# 后端（重启 BFF）
rsync -az --exclude='.venv' --exclude='.env' --exclude='__pycache__' \
  backend/ root@192.168.106.114:/opt/shougang-portal/
ssh root@192.168.106.114 'systemctl restart shougang-portal'
```

### 运维三件套

```bash
ssh root@192.168.106.114 'systemctl status shougang-portal'
ssh root@192.168.106.114 'tail -f /var/log/shougang-portal.log'
ssh root@192.168.106.114 'journalctl -u shougang-portal -f'
```

外部访问验证：

```bash
curl http://192.168.106.114:3001/health
curl http://192.168.106.114:3001/api/v1/knowledge/tags  # 应返回非空 data 数组
```

---

## 8. 协作约定

1. **共享 BiSheng（109 / 115 / 116）写操作慎重** —— 这些环境团队都在用，先在 114:7860（lilu 个人机）验证，OK 了再到共享环境跑。**114 重启 BiSheng 会断当前会话**，操作前在群里通知。
2. **`portal_config.json` 是 admin UI 的产物，不要手改文件后 commit** —— 先用 `/admin` UI 改，再观察 JSON 变化，再决定是否 commit。手改容易跟 admin UI 的下次保存竞态。
3. **改 BiSheng 接入 URL 影响所有人** —— 改之前在群里说一声；admin UI 保存即生效，BFF 不需重启。
4. **部署到 114:3001 前**先在本地跑全：`npm run build && npm test && npm run lint && pytest`。
5. **commit 风格沿用现有 `git log`**：英文动词起头、单行 ≤ 72 字（例如 `Capture resilient admin-config updates`、`Move shared BISHENG access into admin-managed runtime config`）。

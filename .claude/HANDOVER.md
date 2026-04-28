# 首钢知识门户 — 接手交接（HANDOVER）

> 这是给新 Claude Code 会话的"项目接手记忆"。
> 原由 `Y1fe1Zh0u`（zhouyifei）启动，**2026-04-25 lilu 接手**。
> 在新会话里执行：`Read .claude/HANDOVER.md`，即可拿到完整上下文。

---

## 1. 项目身份

- **首钢集团知识门户**：基于 bisheng 的二次封装（独立仓库 + BFF）。
- **不是** bisheng fork。是独立仓库通过 HTTP 调 bisheng 作为上游。
- 仓库：`https://github.com/Y1fe1Zh0u/shougang-group-knowledge-portal`（公开）
- 本机路径：`/Users/lilu/Projects/shougang-group-knowledge-portal/`

## 2. 仓库结构

| 路径 | 作用 |
|---|---|
| `backend/` | FastAPI BFF（uvicorn，端口 8010） |
| `backend/app/main.py` | FastAPI app + lifespan，初始化 BishengRuntimeService / PortalConfigService |
| `backend/app/settings.py` | env 配置（`PORTAL_` 前缀，pydantic-settings） |
| `backend/app/api/router.py` | 路由聚合（admin/config/* + knowledge/* + workstation/chat） |
| `backend/app/clients/bisheng.py` | 调上游 bisheng 的 httpx client |
| `backend/app/services/` | portal_config / bisheng_runtime / chat_proxy 三大业务服务 |
| `backend/app/config/data/portal_config.json` | **门户配置持久化**（spaces / domains / sections / qa / recommendation / display / apps）—— admin UI 写回这里 |
| `backend/app/config/data/bisheng_runtime.json` | bisheng 上游运行时覆盖（base_url / timeout / api_token），运行时通过 admin/config/bisheng 接口可改 |
| `backend/.env` | 本地环境变量（**已 gitignore**） |
| `frontend/` | React 18 + Vite + TS |
| `frontend/src/api/{adminConfig.ts, content.ts}` | 所有后端调用入口（fetch 封装，简单，无 axios） |
| `frontend/src/utils/portalConfig.ts` | 配置归一化、`getEnabledDomains` 过滤 |
| `frontend/src/utils/domainVisualPresets.ts` | 业务域视觉默认 fallback |
| `frontend/public/*.jpg / *.png` | **业务域封面、banner 等静态图**（直接同源静态） |
| `archive/` | 历史方案 / 排查记录 |
| `knowledge-portal-api-spec-bisheng-review.md` | 接口主规格文档 |
| `CLAUDE.md` | 项目主指南：架构 / 命令 / 多环境 / 部署 / 协作约定。**新协作者先读 CLAUDE.md，再读本文件**（运行时陷阱细节）。 |

## 3. 当前本地运行状态（Mac）

```
浏览器
  ↓ http://localhost:5173/
Vite dev server     (端口 5173)
  ↓ /api 代理 (vite.config.ts: VITE_BACKEND_PROXY_TARGET 默认 http://localhost:8010)
uvicorn BFF         (端口 8010)
  ↓ bisheng_runtime.json:base_url（运行时由 admin UI 维护，覆盖 .env）
http://192.168.106.115:8098   ← 当前接的：120:3002 test 环境对应的 Gateway
```

接哪个 BiSheng 看 `backend/app/config/data/bisheng_runtime.json` 的 `base_url`，**不要看 .env**（.env 只是冷启动 fallback）。多环境对照表见 [`CLAUDE.md` §6](../CLAUDE.md#6-bisheng-多环境与接入)。

## 4. 网络节点速查（接手前必须搞清）

> 多环境完整拓扑表见 [`CLAUDE.md` §6](../CLAUDE.md#6-bisheng-多环境与接入)。本节只列开发 / 部署常去的节点。

| 节点 | 角色 | 关键事实 |
|---|---|---|
| **Mac**（本地） | 个人开发环境 | 跑 BFF（8010）+ Vite dev（5173）；接哪个 BiSheng 看 `bisheng_runtime.json` |
| **114** `192.168.106.114` | (a) **门户生产部署**（同事访问入口 `:3001`）；(b) lilu 的 bisheng 个人调试机 | **门户**：systemd `shougang-portal`，nginx conf `shougang-portal-8088.conf`，监听 `:3001 + :8088`，BFF 跑 `127.0.0.1:8010`，详见 [`CLAUDE.md` §7](../CLAUDE.md#7-生产部署-1143001-速查)。**bisheng**：`:4001` 是 nginx 反代到 vite 的**浏览器入口**，`:7860` 是 BiSheng **后端 API**（uvicorn 直连）；**BFF 接入 `base_url` 永远填 `:7860`，不是 `:4001`**。 |
| **109** `192.168.106.109` | 团队 CI dev 联调 bisheng | Docker Compose 部署 feat/2.5.0；浏览器入口 http://192.168.106.120:3003/，BiSheng backend `109:7860`。⚠️ **团队共享，写操作会污染同事数据**，慎用，优先只读。 |
| **115** `192.168.106.115` | test 环境 BiSheng Gateway | 浏览器入口 http://192.168.106.120:3002/，BFF 接入填 `115:8098`（直连 Gateway）。与 109 链路 0 交集。 |

## 5. BiSheng 接入凭证（关键）

### 主路径：账密自动续期（首选）

BFF 已实现 RSA 加密 + login API + 周期刷新，**不需要手动拷 token**：

1. 进 `/admin` → BiSheng 配置弹窗
2. 填 `base_url`（**后端 API**，例如 `http://192.168.106.115:8098`，不是 `:4001/:3001/:3002` 浏览器入口）+ 账号 + 密码 + 超时
3. 保存 → BFF 调 `_login_and_get_token`：拿公钥 → RSA 加密密码 → POST `/api/v1/user/login` → 拿 access_token 写到 `bisheng_runtime.json`
4. `_refresh_loop` 30 分钟轮询，剩余有效期 ≤ 1h 自动续期

实现：`backend/app/services/bisheng_runtime_service.py`。详细机制见 `docs/deployment.md §2`。各 BiSheng 实例的默认 admin 密码请向运维 / 团队内部知识库要，不要写进任何 commit。

### 兜底路径：手动 token（仅特殊场景）

仅当 BiSheng 启用验证码 / 不可达 / 调试自动续期时用：

1. 浏览器登 BiSheng → F12 → Application → Cookies → 拷 `access_token_cookie` 完整 JWT
2. 写入 `backend/.env` 的 `PORTAL_BISHENG_API_TOKEN`
3. 重启 BFF（见 §6）

**注意**：BiSheng JWT 默认 24h TTL；过期表现为 `/api/v1/knowledge/space/<id>/tag` 返 **401**，或 `/api/v1/knowledge/tags` 返空 `data: []`。

## 6. 启动 / 重启命令

### ⚠️ 必须 unset 代理

Mac shell 默认带 SOCKS 代理（`all_proxy=socks5://127.0.0.1:7897`）。httpx 会自动吃这个变量并尝试加载 `socksio`，但 venv 里没装这个包，**直接启动 uvicorn 会在 lifespan 里崩溃**。所有启动命令前面必须 `env -u` 掉一票代理变量。

`no_proxy` 已包含 `192.168.0.0/16`，但 httpx 是先建 transport 再 match no_proxy，所以 unset 是唯一稳定方案。

### 后端
```bash
cd /Users/lilu/Projects/shougang-group-knowledge-portal/backend
env -u all_proxy -u http_proxy -u https_proxy \
    -u ALL_PROXY -u HTTP_PROXY -u HTTPS_PROXY \
  ./.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8010
```

### 前端
```bash
cd /Users/lilu/Projects/shougang-group-knowledge-portal/frontend
env -u all_proxy -u http_proxy -u https_proxy \
    -u ALL_PROXY -u HTTP_PROXY -u HTTPS_PROXY \
  npm run dev
```

### 杀进程（重启前）
```bash
lsof -iTCP:8010 -sTCP:LISTEN -P -t | xargs -r kill   # BFF
lsof -iTCP:5173 -sTCP:LISTEN -P -t | xargs -r kill   # Vite
```

### 烟测
```bash
curl http://127.0.0.1:8010/health
# 期望: {"status_code":200,...,"data":{"service":"knowledge-portal-backend","status":"ok"}}

curl http://127.0.0.1:8010/api/v1/knowledge/tags
# 期望: 非空 data 数组（接手当天验证过 109 admin 有 ["123","1234","綦政君"]）
# 空数组 = token 过期 / 109 admin 库为空
```

浏览器入口：**http://localhost:5173/**

## 7. 工具链 / 依赖

- **Python 3.13.11**（`/usr/local/bin/python3.13`；项目要求 ≥3.11，3.9 不行）
- **Node 25.8.1 / npm 11.11**
- backend venv：`backend/.venv/`，依赖已装（fastapi 0.136 + httpx 0.28 + pytest 等 24 个）
- frontend node_modules：已装（220 个包，1 个 high 漏洞，未处理）

## 8. 已知坑（接手陷阱）

| # | 坑 | 应对 |
|---|---|---|
| 1 | SOCKS 代理 | 启动命令前 `env -u all_proxy ...`，见 §6 |
| 2 | 共享 BiSheng 数据互相影响 | 109 / 115 / 116 都是团队共享，写操作互相影响；想看完整效果可对接 114 个人 bisheng（**缺点**：lilu 重启 bisheng 会断套壳） |
| 3 | **BiSheng URL 填错（高频踩坑）** | 把浏览器入口 `:4001/:3001/:3002` 当 API 地址填进 admin UI，所有 `/api/*` 被前端 SPA fallback 到 `index.html`，BFF 调上游收到 HTML 而不是 JSON，`parseResponse` 抛 `JSONDecodeError`。识别：`tail -f /tmp/bff.log` 看到 JSON 解析错。**正确**：BFF `base_url` 永远填 `:7860/:7861/:8098` 这种**后端 API 端口**，详见 [`CLAUDE.md` §6](../CLAUDE.md#6-bisheng-多环境与接入)。 |
| 4 | 切换 BiSheng 实例后 spaces id 错位 | `portal_config.json` 持久化的 `spaces[].id` 是上一个实例的内部 ID；换实例后多半指向不同空间或不存在。处置：进 `/admin` → 知识空间，把旧条目停用 / 删除，从新候选列表（`type=3` 视图）重新绑。 |
| 5 | bisheng_runtime.json 优先级高于 .env | `BishengRuntimeService` 加载顺序：先 `.env` 默认值 → 再 `bisheng_runtime.json` 覆盖。运行时被 admin/config/bisheng PUT 改过的话，重启不会回退到 .env，要看 JSON 里实际值（这个 JSON 已 gitignore）。 |
| 6 | 114:3001 现是门户生产入口 | 旧 HANDOVER 说"114:3001 是死站"已过时；现部署了门户全栈（systemd + nginx /api 反代 + BFF 127.0.0.1:8010），同事都用，**改前提前通知**。详见 [`CLAUDE.md` §7](../CLAUDE.md#7-生产部署-1143001-速查)。 |

## 9. 业务域 / 封面图来源（高频问题）

- **数据**：BFF `GET /api/v1/admin/config/domains` 提供 → BFF 持久化在 `backend/app/config/data/portal_config.json`（仓库默认 5 条占位"域2/4"等）。admin UI 通过 PUT 写回。
- **图片**：每条 domain 的 `background_image` 是相对路径（如 `/rolling-domain-bg.jpg`），实际文件在 `frontend/public/`（rolling-domain-bg / cold-domain-bg / energy-domain-bg / device-domain-bg），build 时拷到 nginx root，浏览器同源静态取。

## 10. 还没做的事 / 下一步候选（lilu 自己开发计划）

- 接口主规格 `knowledge-portal-api-spec-bisheng-review.md` 通读 + 评审
- 决定是否切换对接到 114 个人 bisheng（避开 109 共享污染问题）
- 业务域 / 知识空间初始数据录入，让 demo 显得有内容
- 114 套壳 BFF 部署 + 改 nginx，让 114:3001 真正可用（目前是空壳）
- 看 `archive/` 里历史方案哪些已弃哪些还在用
- 套壳项目自己的开发约定文档（暂无；前端用 fetch 不用 axios，与 lilu 在 bisheng client/platform 项目里习惯的写法不同）

## 11. 跨项目记忆指引（lilu 个人）

bisheng 主项目下还有以下 memory 与本项目相关（路径：`/Users/lilu/.claude/projects/-Users-lilu-Projects-bisheng/memory/`）：

- `reference_remote_dev.md` — 114 详情（bisheng 个人机）
- `reference_109_team.md` — 109 详情（CI 共享环境）

如果在套壳项目里需要这些 114/109 的细节，可以让用户授权读这些文件。

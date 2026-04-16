# 首钢集团知识门户

首钢知识门户 monorepo，包含：

- `frontend/`：React + Vite 前端站点，覆盖首页、搜索、业务域列表、详情页、问答页、应用页和后台配置页
- `backend/`：FastAPI BFF，提供门户配置、知识检索、详情、预览、相关推荐和问答代理接口

## 当前主文档

- 功能与 API 主规格：[knowledge-portal-api-spec-bisheng-review.md](/Users/zhou/Code/shougang-group-knowledge-portal/knowledge-portal-api-spec-bisheng-review.md)
- 历史方案与排查记录：`archive/`

## 目录结构

```text
.
├── frontend/
├── backend/
├── archive/
└── knowledge-portal-api-spec-bisheng-review.md
```

## 本地运行

### 1. 启动后端

要求：

- Python `>=3.11`
- 当前仓库后端已在 Python `3.13` 环境下验证通过

安装并运行：

```bash
cd backend
python3.13 -m venv .venv
./.venv/bin/pip install -e ".[dev]"
./.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8010
```

后端默认读取 `backend/.env` 中的 `PORTAL_*` 配置，并把门户配置持久化到：

- `backend/app/config/data/portal_config.json`
- `backend/app/config/data/bisheng_runtime.json`

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

Vite 开发服务器默认将 `/api` 代理到 `http://localhost:8010`。如需改目标地址，可设置 `VITE_BACKEND_PROXY_TARGET`。

## 常用验证命令

前端：

```bash
cd frontend
npm test
npm run lint
npm run build
```

后端：

```bash
cd backend
./.venv/bin/python -m pytest
```

如果直接使用系统 Python 3.9 运行后端测试，会因为项目已使用 3.11+ 语法和标准库特性而失败；以 `backend/.venv` 为准。

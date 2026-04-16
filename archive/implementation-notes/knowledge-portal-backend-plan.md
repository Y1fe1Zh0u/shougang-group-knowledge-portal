# 首钢门户后端方案

## 1. 背景

当前仓库 `/Users/zhou/Code/shougang-group-knowledge-portal` 只有前端原型，尚未开始门户后端开发。

现状判断：

- `frontend/` 已完成主要页面和交互原型
- 页面当前直接依赖 `frontend/src/data/mock.ts`
- 项目主文档为 `knowledge-portal-api-spec-bisheng-review.md`
- `bisheng` 是内容能力提供方，不应承载首钢门户专属视图接口

因此本项目需要新增一个**独立门户后端**，作为前端和 `bisheng` 之间的 BFF（Backend For Frontend）。

## 2. 目标

本方案目标：

- 在本 monorepo 内新增 Python 门户后端
- 对前端输出门户文档定义的稳定接口
- 后端内部通过调用 `bisheng` 现有能力完成数据查询、预览和问答转发
- 先完成首轮前后端联调所需的最小闭环

本阶段不做：

- 不在 `bisheng` 中新增首钢门户专属 API
- 不优先建设完整后台配置管理系统
- 不优先做复杂推荐系统
- 不优先做多系统聚合

## 3. 职责边界

### 3.1 门户前端

负责：

- 页面展示
- 路由和交互
- 调用门户后端 API
- SSE 渲染

不负责：

- 直接调用 `bisheng` 原始接口
- 直接拼装 `bisheng` 返回结构

### 3.2 门户后端

负责：

- 向前端提供门户语义接口
- 将 `bisheng` 原子能力转换为门户数据模型
- 维护门户自己的配置和默认查询范围
- 承担后续 Banner、业务域、推荐位、应用市场等门户配置能力

### 3.3 Bisheng

负责：

- 知识空间原子能力
- 文件预览能力
- 标签能力
- 问答 / SSE 能力
- 底层知识检索与内容服务

不负责：

- 首钢门户专属聚合接口
- 首钢门户页面语义
- 首钢门户配置输出

## 4. 推荐技术栈

建议使用：

- Python 3.11+
- FastAPI
- Pydantic v2
- `httpx` 作为 `bisheng` API 客户端
- `uvicorn` 作为本地运行入口
- `pytest` 作为测试框架

理由：

- 与既定 Python 技术方向一致
- FastAPI 对 BFF 场景足够轻
- 便于后续追加 SSE 代理、配置管理、健康检查和中间件

## 5. 推荐目录结构

建议新增：

```text
shougang-group-knowledge-portal/
├── frontend/
├── backend/
│   ├── pyproject.toml
│   ├── README.md
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   └── routes/
│   │   ├── clients/
│   │   ├── services/
│   │   ├── schemas/
│   │   ├── config/
│   │   └── settings.py
│   └── tests/
└── knowledge-portal-api-spec-bisheng-review.md
```

模块建议：

- `api/routes/`：对外 HTTP 路由
- `clients/`：调用 `bisheng` 的 API client
- `services/`：门户聚合逻辑和字段映射
- `schemas/`：门户出入参模型
- `config/`：静态配置、默认 `space_ids`、业务域映射
- `tests/`：单元测试和接口测试

## 6. 第一阶段接口范围

第一阶段只做前端连调最小闭环。

### 6.1 门户读接口

按现有主文档实现：

- `GET /api/v1/knowledge/files`
- `GET /api/v1/knowledge/space/{space_id}/files`
- `GET /api/v1/knowledge/space/{space_id}/files/{file_id}`
- `GET /api/v1/knowledge/space/{space_id}/files/{file_id}/related`

### 6.2 问答代理接口

建议同时提供：

- `POST /api/v1/workstation/chat/completions`

说明：

- 对前端保持和文档一致的路径
- 门户后端内部将请求代理或转发到 `bisheng`
- 前端后续统一只连门户后端

## 7. 第一阶段数据来源策略

### 7.1 可直接复用的 Bisheng 能力

优先复用：

- 空间标签
- 文件预览
- 日常模式问答 SSE

### 7.2 门户后端需要自己封装的能力

以下接口输出必须由门户后端整理为门户模型：

- 跨空间文件查询
- 单空间文件列表
- 文件详情
- 相关推荐

原因：

- 门户需要稳定的扁平 `KnowledgeFileItem`
- 需要按门户配置限制默认可见 `space_ids`
- 需要将 `bisheng` 返回映射成门户语义字段

## 8. 门户后端输出模型

第一阶段以现有主文档为准，后端内部统一输出：

### 8.1 `KnowledgeFileItem`

字段：

- `id`
- `space_id`
- `title`
- `summary`
- `source`
- `updated_at`
- `tags`

### 8.2 `KnowledgeFileDetail`

在 `KnowledgeFileItem` 基础上增加：

- `space: { id, name }`

### 8.3 `PagedKnowledgeFileData`

字段：

- `data`
- `total`
- `page`
- `page_size`

### 8.4 `RelatedKnowledgeFileData`

字段：

- `data`
- `total`

## 9. 配置策略

第一阶段不要把后台配置系统放进关键路径。

建议先使用**静态配置文件**承接以下信息：

- 门户默认可见 `space_ids`
- 业务域到 `space_id` 的映射
- 搜索页标签合集缓存来源
- 首页分区配置
- AI Overview / QA 默认 `knowledge_space_ids`
- 应用市场配置

建议形式：

- `backend/app/config/portal_config.py`
或
- `backend/app/config/portal_config.yaml`

第一阶段原则：

- 先静态
- 先可联调
- 后续再抽配置 CRUD

## 10. 查询策略建议

### 10.1 跨空间文件查询

接口：

- `GET /api/v1/knowledge/files`

建议规则：

- `q` 和 `tag` 不能同时为空
- `q + tag` 为交集过滤
- 只返回文件，不返回文件夹
- 只返回解析成功文件
- 默认范围取门户配置中的已绑定公开空间
- 若显式传 `space_ids`，在默认范围内再取交集
- `sort=relevance` 仅在 `q` 存在时有意义
- `sort=updated_at` 按更新时间倒序

### 10.2 单空间文件列表

接口：

- `GET /api/v1/knowledge/space/{space_id}/files`

建议规则：

- 仅返回该空间下文件
- 只返回解析成功文件
- 支持 `file_ext` 和 `tag`
- 固定按 `updated_at` 倒序

### 10.3 文件详情

接口：

- `GET /api/v1/knowledge/space/{space_id}/files/{file_id}`

建议规则：

- 必须校验 `file_id` 属于 `space_id`
- 返回门户详情结构
- 不直接返回正文，只返回详情元信息

### 10.4 相关推荐

接口：

- `GET /api/v1/knowledge/space/{space_id}/files/{file_id}/related`

第一版规则：

- 同标签
- 最近更新优先
- 限定门户可见空间范围
- 排除当前文件
- 当前文件无标签时返回空列表

## 11. 实现分期

### Phase 0：项目骨架

目标：

- 新建 `backend/`
- 完成 FastAPI 启动骨架
- 增加基础设置和健康检查

交付：

- `GET /health`
- 基础配置读取
- 本地开发启动说明

### Phase 1：门户查询接口

目标：

- 完成 4 个读接口
- 完成门户模型映射
- 完成对 `bisheng` 的 client 封装

交付：

- 搜索页、列表页、详情页、相关推荐可联调

### Phase 2：问答代理

目标：

- 接通 `POST /api/v1/workstation/chat/completions`
- 支持 SSE 透传或流式代理

交付：

- AI Overview
- 技术问答页

### Phase 3：前端切换

目标：

- 前端新增 API service
- 用真实 API 替换 `mock.ts`

交付：

- 搜索页切换
- 列表页切换
- 详情页切换
- QA 页切换

### Phase 4：配置管理

目标：

- 将静态配置逐步替换为可管理配置

交付：

- 业务域管理
- 首页分区管理
- 问答范围管理
- 应用市场管理

## 12. 最小测试方案

第一阶段必须覆盖：

- 门户 schema 映射测试
- 查询参数校验测试
- `space_id + file_id` 一致性测试
- `bisheng` client 响应转换测试
- 推荐逻辑测试
- SSE 代理基础测试

前后端联调后再补：

- 前端页面联调验证
- 搜索页、列表页、详情页、QA 页手工回归

## 13. 风险

当前主要风险：

- `bisheng` 现有查询能力未必能直接满足跨空间聚合
- AI 问答请求 schema 需要以后端真实定义为准
- 若门户配置迟迟不落地，默认 `space_ids` 和业务域映射只能暂时静态维护
- 如果后续 `bisheng` 返回结构调整，门户后端需要承担兼容层职责

## 14. 建议执行顺序

建议严格按以下顺序推进：

1. 搭建 `backend/` 工程骨架
2. 固定门户输出 schema
3. 接通 4 个读接口
4. 前端从 `mock.ts` 切换到真实门户 API
5. 接通问答 SSE 代理
6. 跑测试和联调
7. 再补后台配置管理

## 15. 当前决策

当前建议正式采用以下决策：

- 门户接口写在本仓库新增的 Python 后端中
- `bisheng` 不新增首钢门户专属视图 API
- 首阶段后端按“薄 BFF”实现
- 首阶段配置先静态化
- 优先跑通搜索、列表、详情、相关推荐、问答


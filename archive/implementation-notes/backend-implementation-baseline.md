# 首钢知识门户后端实施基线

## 1. 文档目的

这份文档只记录**当前已经确认的后端实施基线**，用于后续对照开发，不再混入过多备选方案。

当前优先级判断：

- 先把后端能力跑稳
- 后台前端可以同步接通真实配置接口
- 当前第一优先是**后台配置系统**
- 知识检索 / 详情 / 问答接口属于下一阶段

## 2. 当前确认的架构

固定采用：

```text
前端 -> 门户后端(BFF) -> BiSheng
```

约束：

- 前端不直接调用 BiSheng
- 门户后端对前端输出门户语义接口
- 门户后端内部再调用 BiSheng 原子能力
- 门户专属配置不写回 BiSheng

## 3. 当前阶段目标

本阶段目标不是完整产品化，而是：

1. 在本仓库内建立可运行的门户后端
2. 完成后台配置系统的后端闭环
3. 保证后端结构、配置存储方式、接口返回结构稳定
4. 为下一阶段接知识接口打基础

## 4. 当前阶段明确要做的事情

### 4.1 门户后端骨架

已经确定使用：

- Python 3.13
- FastAPI
- Pydantic
- `httpx`
- `pytest`

目录结构：

```text
backend/
├── pyproject.toml
├── README.md
├── app/
│   ├── main.py
│   ├── api/
│   ├── clients/
│   ├── config/
│   ├── schemas/
│   ├── services/
│   └── settings.py
└── tests/
```

### 4.2 后台配置系统

当前后台配置只围绕前端 `/admin` 页面真实已有的 7 个板块：

1. `spaces`
2. `domains`
3. `sections`
4. `qa`
5. `recommendation`
6. `display`
7. `apps`

并且当前已经额外明确：

- AI 搜索的 LLM `system prompt` 写在门户后端
- 技术问答的 LLM `system prompt` 写在门户后端
- 这两个 prompt 不写到 BiSheng 后端
- 这两个 prompt 需要在后台可配置

说明：

- 当前阶段不做完整 CMS
- 当前阶段不做复杂权限、审批、版本、发布流
- 当前阶段先做“可读取、可编辑、可保存”

### 4.3 配置存储方式

当前采用：

- 文件持久化
- JSON 落盘

原因：

- 实现简单
- 便于本地联调
- 当前阶段重点不是数据库设计

后续如有需要，再切换到数据库。

## 5. 当前阶段明确不做的事情

本阶段先不做：

- 知识搜索接口
- 单空间文件列表接口
- 文件详情接口
- 文件预览接口对前端联调
- 相关推荐接口
- 问答 SSE 对接
- 完整推荐系统
- 完整权限系统重构
- 多系统聚合

这些能力属于**下一阶段**。

## 6. 当前后台配置接口基线

当前后端配置接口保持简单明确：

### 6.1 总配置读取 / 替换

- `GET /api/v1/admin/config`
- `POST /api/v1/admin/config`

### 6.2 分组配置读写

- `GET /api/v1/admin/config/spaces`
- `POST /api/v1/admin/config/spaces`

- `GET /api/v1/admin/config/domains`
- `POST /api/v1/admin/config/domains`

- `GET /api/v1/admin/config/sections`
- `POST /api/v1/admin/config/sections`

- `GET /api/v1/admin/config/qa`
- `POST /api/v1/admin/config/qa`

- `GET /api/v1/admin/config/recommendation`
- `POST /api/v1/admin/config/recommendation`

- `GET /api/v1/admin/config/display`
- `POST /api/v1/admin/config/display`

- `GET /api/v1/admin/config/apps`
- `POST /api/v1/admin/config/apps`

## 7. 当前配置数据范围

### 7.1 `spaces`

当前字段：

- `id`
- `name`
- `file_count`
- `tag_count`
- `enabled`

### 7.2 `domains`

当前字段：

- `name`
- `space_ids`
- `color`
- `bg`
- `icon`
- `background_image`
- `enabled`

说明：

- 当前虽然前端主要是一对一展示，但后端保留 `space_ids`
- 这样以后业务域一对多扩展时不用重做结构

### 7.3 `sections`

当前字段：

- `title`
- `tag`
- `link`
- `icon`
- `enabled`

### 7.4 `qa`

当前字段：

- `knowledge_space_ids`
- `hot_questions`
- `ai_search_system_prompt`
- `qa_system_prompt`

### 7.5 `recommendation`

当前字段：

- `provider`
- `home_strategy`
- `detail_strategy`

### 7.6 `display`

当前字段：

- `home`
- `list`
- `search`
- `detail`

其中包含：

- 首页分区条数
- 热门标签条数
- QA 热门问题条数
- 业务域条数
- 知识广场条数
- 应用市场条数
- 列表页分页 / 标签展示数
- 搜索页分页 / 标签展示数
- 详情页相关推荐条数 / 标签展示数

### 7.7 `apps`

当前字段：

- `id`
- `name`
- `icon`
- `desc`
- `color`
- `bg`
- `url`
- `enabled`

## 8. 当前已完成状态

截至当前，已经完成：

1. `backend/` 工程骨架
2. Python 3.13 虚拟环境
3. 健康检查接口
4. 配置 schema
5. 配置文件落盘服务
6. 后台配置 API
7. `/admin` 前端改为真实读取和保存配置
8. AI 搜索 / 技术问答 `system prompt` 已纳入门户后端配置
9. 基础测试

## 9. 当前验证方式

当前后端以这些命令验证：

```bash
cd backend
.venv/bin/python -m pytest
```

以及本地启动：

```bash
cd backend
.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8010
```

前端当前以这些命令验证：

```bash
cd frontend
npm run build
```

## 10. 下一步顺序

当前建议按这个顺序推进：

1. 先继续把后端配置能力收稳
2. 让更多前台页面逐步消费门户配置
3. 再开始接下一阶段知识接口

下一阶段知识接口顺序建议：

1. `GET /api/v1/knowledge/files`
2. `GET /api/v1/knowledge/space/{space_id}/files`
3. `GET /api/v1/knowledge/space/{space_id}/files/{file_id}`
4. `GET /api/v1/knowledge/space/{space_id}/files/{file_id}/preview`
5. `GET /api/v1/knowledge/space/{space_id}/files/{file_id}/related`
6. `POST /api/v1/workstation/chat/completions`

## 11. 当前决策结论

最终按下面这套执行：

- 当前阶段先做后端，不先追前端
- 当前阶段主目标是后台配置系统，但 `/admin` 前端允许同步接真实接口
- 配置系统只服务于当前前端 `/admin` 页真实需要的 7 组配置
- 配置先用 JSON 文件持久化
- 不在这一阶段引入数据库和复杂管理流程
- AI 搜索 / 技术问答的 `system prompt` 明确放在门户后端配置中，不放在 BiSheng
- BiSheng 对接放到下一阶段知识接口开发中处理

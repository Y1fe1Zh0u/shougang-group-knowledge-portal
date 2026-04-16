# 首钢门户后端对接 BiSheng 实施方案

## 1. 结论

当前阶段采用：

```text
门户前端 -> 门户后端(BFF) -> BiSheng
```

并且：

- 当前阶段 **不改 `bisheng`**
- 门户后端直接复用现有 `bisheng` 接口
- 门户后端自己完成白名单过滤、字段映射、聚合和 prompt 拼接
- 等门户功能跑通后，再评估是否将通用查询能力下沉回 `bisheng`

## 2. 当前阶段目标

本阶段目标不是“做最优架构”，而是“先把门户内容链路跑通”。

优先级：

1. 跑通门户后端与 `bisheng` 的真实调用
2. 跑通搜索、列表、详情、相关推荐、QA / AI Overview
3. 保持 `bisheng` 主线零改动

## 3. 门户后端职责

门户后端负责：

- 使用一个管理员账号调用 `bisheng`
- 读取门户后台配置中的白名单和问答配置
- 将 `bisheng` 返回映射成门户自己的数据结构
- 实现跨空间 fan-out 搜索
- 拼装文件详情
- 基于标签实现相关推荐
- 对 QA / AI Overview 拼接最终 prompt 后再调用 `bisheng`

门户后端不负责：

- 改写 `bisheng` 内部能力
- 存储知识正文
- 替代 `bisheng` 的知识空间管理逻辑

## 4. 调用 BiSheng 的认证策略

当前阶段固定采用：

- 门户后端内部持有一个 `bisheng` 管理员账号的登录态
- 门户前端不直接接触 `bisheng` 登录态
- 门户后端以管理员身份调用 `bisheng`

但必须强调：

- `bisheng` admin 权限只是“读取上限”
- 门户实际返回范围必须由门户白名单控制

公式：

```text
最终返回范围 = bisheng 可读取范围 ∩ 门户配置白名单
```

不能直接把 admin 可见全部数据返回给前端。

## 5. 门户白名单策略

门户后端以配置系统作为最终展示权限控制器。

当前建议使用：

### 5.1 总白名单

来自：

- `spaces.enabled = true`

只有启用的空间，才允许进入门户可见范围。

### 5.2 业务域范围

来自：

- `domains.space_ids`

但必须再与 `enabled spaces` 取交集。

### 5.3 QA / AI Overview 范围

来自：

- `qa.knowledge_space_ids`

也必须再与 `enabled spaces` 取交集。

### 5.4 请求级范围

若接口请求中显式传入 `space_ids`，最终范围为：

```text
request.space_ids ∩ enabled spaces
```

如果交集为空，直接返回空结果，不回退到 admin 全量可见范围。

## 6. 直接复用的 BiSheng 接口

当前阶段优先复用现有接口。

### 6.1 单空间搜索 / 列表

优先复用：

- `GET /api/v1/knowledge/space/{space_id}/search`
- 必要时补充 `GET /api/v1/knowledge/space/{space_id}/children`

门户后端负责：

- 过滤文件夹
- 过滤非成功状态
- 过滤不在白名单内的数据
- 映射成门户 `KnowledgeFileItem`

### 6.2 标签列表

直接复用：

- `GET /api/v1/knowledge/space/{space_id}/tag`

门户后端负责：

- 聚合多空间标签
- 去重
- 排序

### 6.3 文件预览

直接复用：

- `GET /api/v1/knowledge/space/{space_id}/files/{file_id}/preview`

门户后端负责：

- 调用前先确保 `space_id` 在白名单内
- 返回前保证详情页上下文一致

### 6.4 日常模式问答

直接复用：

- `POST /api/v1/workstation/chat/completions`

门户后端负责：

- 选择 `ai_search_system_prompt` 或 `qa_system_prompt`
- 读取 `knowledge_space_ids`
- 生成最终 prompt
- 转发请求

## 7. 门户后端要实现的门户接口

当前阶段门户后端自己对前端提供：

- `GET /api/v1/knowledge/files`
- `GET /api/v1/knowledge/space/{space_id}/files`
- `GET /api/v1/knowledge/space/{space_id}/files/{file_id}`
- `GET /api/v1/knowledge/space/{space_id}/files/{file_id}/related`
- `POST /api/v1/workstation/chat/completions`

其中最后一个接口对前端保持门户路径一致，但内部转发到 `bisheng`。

## 8. 门户后端内部模块建议

建议新增以下模块：

```text
backend/app/
├── api/routes/
│   ├── knowledge.py
│   └── chat_proxy.py
├── clients/
│   └── bisheng.py
├── schemas/
│   ├── knowledge.py
│   └── chat.py
└── services/
    ├── knowledge_service.py
    ├── recommendation_service.py
    └── chat_proxy_service.py
```

职责建议：

- `clients/bisheng.py`：统一封装对 `bisheng` 的 HTTP 调用
- `services/knowledge_service.py`：文件查询、映射、聚合
- `services/recommendation_service.py`：相关推荐
- `services/chat_proxy_service.py`：QA / AI Overview 代理
- `schemas/knowledge.py`：门户自己的文件列表和详情 schema

## 9. 各接口实施方案

## 9.1 `GET /api/v1/knowledge/space/{space_id}/files`

### 输入

- `space_id`
- `file_ext`
- `tag`
- `page`
- `page_size`

### 实现

1. 校验 `space_id` 是否在 `enabled spaces` 内
2. 调 `bisheng` 的单空间搜索接口
3. 过滤：
   - `file_type = FILE`
   - `status = SUCCESS`
4. 如果传 `file_ext`，按文件名后缀过滤
5. 如果传 `tag`，按标签名过滤
6. 映射成门户 `KnowledgeFileItem`
7. 返回分页结果

### 注意

- 当前分页可能需要在门户后端自己做二次分页
- 不依赖 `bisheng` 直接返回门户格式

## 9.2 `GET /api/v1/knowledge/files`

### 输入

- `q`
- `tag`
- `space_ids`
- `file_ext`
- `sort`
- `page`
- `page_size`

### 实现

1. 先算最终查询范围：
   - 如果请求带 `space_ids`：`request.space_ids ∩ enabled spaces`
   - 否则：`enabled spaces`
2. 对最终范围内每个空间并发调用 `bisheng` 单空间搜索接口
3. 合并结果
4. 统一做二次过滤：
   - `file_type = FILE`
   - `status = SUCCESS`
   - `tag`
   - `file_ext`
5. 统一排序：
   - `q` 存在时可先保留粗相关性
   - `updated_at` 按更新时间倒序
6. 门户后端统一分页
7. 映射成 `KnowledgeFileItem`

### 注意

- 当前阶段的跨空间搜索是 fan-out 聚合，不是全局原生搜索
- 可先跑通，后续若有性能瓶颈再下沉能力

## 9.3 `GET /api/v1/knowledge/space/{space_id}/files/{file_id}`

### 输入

- `space_id`
- `file_id`

### 实现

1. 校验 `space_id` 是否在白名单
2. 先通过单空间查询能力定位该文件
3. 若不存在则返回 404 或空结果
4. 组装详情结构：
   - `id`
   - `space_id`
   - `title`
   - `summary`
   - `source`
   - `updated_at`
   - `tags`
   - `space`

### 注意

- 当前阶段详情页不返回正文
- 正文仍通过预览接口渲染

## 9.4 `GET /api/v1/knowledge/space/{space_id}/files/{file_id}/related`

### 输入

- `space_id`
- `file_id`
- `limit`

### 实现

1. 先获取当前文件详情
2. 抽取当前文件标签
3. 若无标签，返回空结果
4. 在白名单范围内查询候选文件
5. 计算标签重合度
6. 排除自己
7. 按：
   - 重合标签数
   - 更新时间倒序
   排序
8. 截取 `limit`

### 当前策略

- 推荐逻辑先放门户后端
- 这是临时实现，不要求当前阶段下沉到 `bisheng`

## 9.5 `POST /api/v1/workstation/chat/completions`

### 输入

沿用文档定义，门户前端仍然调用门户后端自己的路径。

### 实现

1. 门户后端判断当前场景：
   - 搜索页 AI Overview
   - 技术问答页 QA
2. 从配置读取对应 prompt：
   - `qa.ai_search_system_prompt`
   - `qa.qa_system_prompt`
3. 读取允许使用的 `qa.knowledge_space_ids`
4. 与 `enabled spaces` 取交集
5. 生成最终 prompt 文本
6. 构造发往 `bisheng` 的请求体
7. 转发到 `POST /api/v1/workstation/chat/completions`
8. 将 SSE 原样透传给前端

### 注意

- 当前阶段不要求 `bisheng` 支持额外 prompt 字段
- prompt 拼接全部放在门户后端

## 10. 门户输出 schema 建议

建议统一使用门户自己的 schema，不直接把 `bisheng` 返回暴露给前端。

### 10.1 `KnowledgeFileItem`

字段：

- `id`
- `space_id`
- `title`
- `summary`
- `source`
- `updated_at`
- `tags`

### 10.2 `KnowledgeFileDetail`

字段：

- `KnowledgeFileItem`
- `space: { id, name }`

### 10.3 `PagedKnowledgeFileData`

字段：

- `data`
- `total`
- `page`
- `page_size`

### 10.4 `RelatedKnowledgeFileData`

字段：

- `data`
- `total`

## 11. 当前阶段的代价

当前方案的代价是明确存在的：

- 门户后端会先变厚
- 跨空间搜索性能不会最优
- 分页、排序、推荐都属于门户后端二次实现
- 详情拼装逻辑会比未来下沉方案更重

但这是有意识接受的成本，因为当前目标是：

- 先不影响 `bisheng` 主线
- 先把门户跑起来

## 12. 测试建议

当前阶段建议至少覆盖：

### 后端单测

- 白名单交集计算
- `KnowledgeFileItem` 映射
- 跨空间 fan-out 合并与分页
- 文件详情拼装
- 相关推荐排序
- QA prompt 选择与请求组装

### 后端接口测试

- `GET /api/v1/knowledge/files`
- `GET /api/v1/knowledge/space/{space_id}/files`
- `GET /api/v1/knowledge/space/{space_id}/files/{file_id}`
- `GET /api/v1/knowledge/space/{space_id}/files/{file_id}/related`
- `POST /api/v1/workstation/chat/completions`

### 联调验证

- 搜索页
- 通用列表页
- 详情页
- QA 页
- AI Overview

## 13. 实施顺序

建议顺序：

1. 完成 `bisheng` 管理员登录态调用方案
2. 封装 `BishengClient`
3. 实现标签、预览、日常模式代理
4. 实现单空间文件列表
5. 实现跨空间 fan-out 搜索
6. 实现文件详情
7. 实现相关推荐
8. 前端逐步从 mock 切到真实接口

## 14. 当前阶段结论

当前阶段正式采用：

- `bisheng` 不改
- 门户后端直接接现有 `bisheng` 接口
- 不能直接复用的查询能力先在门户后端聚合
- QA / AI Overview 继续走 `bisheng` 日常模式
- prompt 与白名单逻辑全部放在门户后端


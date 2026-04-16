# 知识门户统一内容 Schema

## 1. 文档目的

本文只用于定义知识门户面向前台的统一内容结果项 schema。

约束：

- 只定义接口层数据契约
- 不讨论页面样式
- 不直接绑定数据库表结构
- 优先服务 `GET /api/v1/portal/search` 与 `GET /api/v1/portal/content-list`

## 2. 适用范围

统一内容结果项 schema 应同时适用于：

- 搜索结果
- 业务域内容列表
- 推荐内容列表
- 专题内容列表
- 知识广场内容列表

## 3. 设计原则

- 同一类门户内容尽量返回同一种对象结构
- 前端可以换展示模板，但不应频繁切换接口字段
- 后端通过查询条件区分场景，不为每个首页模块设计一套出参
- 字段命名优先表达门户语义，而不是直接暴露底层表字段名

## 4. 待定义内容

本文件下一步需要明确以下内容：

1. 字段列表
2. 必填/可选约束
3. 字段语义
4. 字段来源映射
5. 枚举收敛规则

## 5. PortalContentItem 最小字段集合

当前统一命名为 `PortalContentItem`。

`PortalContentItem` 表示门户接口返回列表中的“一条内容结果项”。

当前建议从最小集合开始讨论：

- `id`
- `title`
- `summary`
- `source`
- `updated_at`
- `detail_url`
- `tags`

## 6. 字段定义草案

| 字段 | 中文名称 | 类型 | 必填 | 说明 | 数据来源 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | 内容 ID | `string` | 待定 | 门户内容唯一标识 | 待定 | 需确认是否直接复用内部资源 ID |
| `title` | 标题 | `string` | 待定 | 内容标题 | 待定 | |
| `summary` | 摘要 | `string` | 待定 | 内容摘要 | 待定 | |
| `source` | 来源 | `string` | 必填 | 来源知识空间名称 | `Knowledge.name` | 由文件所属知识空间名称提供 |
| `updated_at` | 更新时间 | `string` | 必填 | 门户展示更新时间 | `KnowledgeFile.update_time` | 直接使用文件更新时间 |
| `domain` | 业务域 | `string` | 不属于结果项 | 前端固定分类与知识空间映射形成的查询上下文 | 前端配置 | 不属于 `PortalContentItem`，属于查询维度 |
| `content_type` | 内容类型 | `string` | 暂不保留 | 门户内容类型 | 待定 | 当前没有稳定数据来源，先不进入最小结果项 |
| `detail_url` | 详情地址 | `string` | 待定 | 门户详情跳转地址 | 待定 | 待确认是否保留；如果门户详情页路由规则稳定且前端可直接按 `id` 拼装，则可不作为结果项字段返回 |
| `tags` | 标签 | `string[]` | 必填 | 标签列表 | `Tag` / `TagLink` | 直接复用现有标签体系 |

### 6.1 字段中英文对照

| 英文变量 | 中文名称 |
| --- | --- |
| `id` | 内容 ID |
| `title` | 标题 |
| `summary` | 摘要 |
| `source` | 来源 |
| `updated_at` | 更新时间 |
| `detail_url` | 详情地址 |
| `tags` | 标签 |

### 6.2 待确认注释

- `detail_url（详情地址）`
  - 当前统一按“前端基于 ID 拼接”处理
  - 该字段不是底层原始数据字段，而是门户层跳转规则产物
  - 第一版不直接返回 URL
  - 前端基于文档 ID 和固定路由规则自行拼接

## 7. PortalContentItem 最小可用版本

基于当前讨论，`PortalContentItem` 的最小可用版本先定义为：

```json
{
  "id": "string",
  "title": "string",
  "summary": "string",
  "detail_url": "string",
  "source": "string",
  "updated_at": "string",
  "tags": ["string"]
}
```

当前字段级别先收敛为：

- 必须字段：`id`、`title`、`summary`、`source`、`updated_at`、`tags`
- 不直接返回 URL 字段：`detail_url`
- 不属于结果项字段：`domain`
- 暂不进入最小结果项：`content_type`

## 8. 待确认问题

- `id` 是直接使用 `knowledge_file.id`，还是使用门户侧可读 ID
- `title`、`summary` 是否需要允许兜底策略
- 是否需要额外增加 `portal_visible`

## 9. 当前原始数据结构观察

基于当前仓库里的真实模型，先记录与 `PortalContentItem` 相关的底层数据结构。

### 9.1 知识空间主模型 `Knowledge`

当前 `Knowledge` / `KnowledgeBase` 已具备的核心字段：

- `id`
- `name`
- `description`
- `is_released`
- `auth_type`
- `metadata_fields`
- `create_time`
- `update_time`

这说明：

- 空间级标题和描述是现成的
- 空间级“可发布到广场”状态是现成的
- 空间级元数据配置能力是现成的
- 其中 `source` 可以直接使用知识空间名称
- `domain` 是前端分类上下文，不属于空间主表字段
- `content_type` 当前没有稳定来源

### 9.2 空间文件主模型 `KnowledgeFile`

当前 `KnowledgeFile` 已具备的核心字段：

- `id`
- `knowledge_id`
- `file_name`
- `file_type`
- `abstract`
- `user_metadata`
- `create_time`
- `update_time`
- `file_level_path`
- `status`

这说明：

- 文件级标题天然可以来自 `file_name`
- 文件级摘要天然可以优先来自 `abstract`
- 文件级自定义元数据能力是现成的
- `updated_at` 可以直接来自 `update_time`
- `source` 不必落在 `user_metadata`，可直接由所属知识空间名称提供
- `domain` 不是文件原生字段
- `content_type` 当前没有稳定来源，不建议强行从 `user_metadata` 约定

### 9.3 标签结构 `Tag` / `TagLink`

当前标签能力已具备：

- 标签名称 `Tag.name`
- 资源关联 `TagLink.resource_id` + `resource_type`
- 支持按资源批量查标签

这说明：

- `tags` 字段可以直接复用现有标签体系
- 至少从能力上看，不需要为门户额外造一套标签表

### 9.4 知识空间接口实际返回形态

当前已有知识空间接口主要返回两类对象：

1. 空间对象
   - 例如 `get_knowledge_square`
   - 返回 `KnowledgeSpaceInfoResp`
   - 更适合知识广场、空间入口

2. 文件/文件夹对象
   - 例如 `list_space_children` / `search_space_children`
   - 底层基于 `KnowledgeFile`
   - 更接近门户“内容项”

这说明：

- 门户内容项更应该优先围绕“空间文件”建模，而不是直接围绕空间对象建模
- 如果门户列表展示的是文章/案例/制度/词条，更像是 `KnowledgeFile` 维度的数据

## 10. PortalContentItem 字段来源候选

当前先基于真实结构给出第一版来源候选：

| 字段 | 第一候选来源 | 结论 |
| --- | --- | --- |
| `id` | `KnowledgeFile.id` | 倾向直接使用文件 ID |
| `title` | `KnowledgeFile.file_name` | 现成可用 |
| `summary` | `KnowledgeFile.abstract` | 现成字段，优先使用 |
| `detail_url` | 前端基于文件 ID 拼接 | 不作为结果项字段返回 |
| `source` | 文件所属 `Knowledge.name` | 现成可用 |
| `updated_at` | `KnowledgeFile.update_time` | 现成可用 |
| `domain` | 前端分类配置 | 不属于结果项字段 |
| `content_type` | 待定 | 当前没有稳定来源，先不进入最小结果项 |
| `tags` | `Tag` / `TagLink` | 现有标签体系可复用 |

### 10.1 当前最重要的判断

基于真实结构，当前可以先下这个判断：

- `id`、`title`、`summary`、`source`、`updated_at`、`tags` 已经比较有抓手
- URL 相关能力统一由前端基于 ID 拼接
- `domain` 属于前端分类上下文，不属于结果项字段
- `content_type` 当前没有稳定来源，先不进入最小结果项

### 10.2 对 API 设计的影响

这意味着：

- `PortalContentItem` 第一版可以先收敛成 6 个稳定字段 + 1 个待确认字段
- `domain` 应放在查询维度或响应上下文，而不是内容结果项里
- `content_type` 等有稳定来源后再加回结果项

否则 API 虽然能写，但出参无法稳定

## 11. 下一步

下一步只做两件事：

1. 把第 6 节补成稳定版本
2. 保持“所有 URL 都由前端基于 ID 拼接”的统一规则

## 12. 稳定字段查询映射

当前先只针对已经确认的 6 个稳定字段，整理第一版查询映射。

### 12.1 PortalContentItem 当前稳定字段

| 字段 | 中文名称 | 当前状态 |
| --- | --- | --- |
| `id` | 内容 ID | 已确认 |
| `title` | 标题 | 已确认 |
| `summary` | 摘要 | 已确认 |
| `source` | 来源 | 已确认 |
| `updated_at` | 更新时间 | 已确认 |
| `tags` | 标签 | 已确认 |

### 12.2 查询主对象

当前门户内容项的查询主对象先定为：

- `KnowledgeFile`

原因：

- 门户展示的是“内容项”
- 现有知识空间里的文件对象最接近门户内容
- `KnowledgeFile` 天然带有标题、摘要、更新时间
- `KnowledgeFile` 通过 `knowledge_id` 可以关联来源知识空间
- `KnowledgeFile` 通过标签关联表可以关联标签

### 12.3 字段查询映射表

| 字段 | 中文名称 | 主来源 | 查询方式 | 是否需要额外处理 |
| --- | --- | --- | --- | --- |
| `id` | 内容 ID | `KnowledgeFile.id` | 直接取主表字段 | 否 |
| `title` | 标题 | `KnowledgeFile.file_name` | 直接取主表字段 | 否 |
| `summary` | 摘要 | `KnowledgeFile.abstract` | 直接取主表字段 | 需要确认空值兜底策略 |
| `source` | 来源 | `Knowledge.name` | 通过 `KnowledgeFile.knowledge_id -> Knowledge.id` 关联 | 否 |
| `updated_at` | 更新时间 | `KnowledgeFile.update_time` | 直接取主表字段 | 否 |
| `tags` | 标签 | `Tag` / `TagLink` | 通过 `resource_id = KnowledgeFile.id` 批量查询 | 需要批量聚合 |

### 12.4 查询链路

`PortalContentItem` 第一版建议查询链路：

1. 先查出符合条件的 `KnowledgeFile` 列表
2. 从结果里拿到：
   - `KnowledgeFile.id`
   - `KnowledgeFile.file_name`
   - `KnowledgeFile.abstract`
   - `KnowledgeFile.knowledge_id`
   - `KnowledgeFile.update_time`
3. 用 `knowledge_id` 批量查 `Knowledge.name`
4. 用 `KnowledgeFile.id` 批量查标签
5. 组装成 `PortalContentItem`

### 12.5 当前还需要补的规则

虽然 6 个字段已经有主来源，但还有两个点需要补规则：

1. `summary`
   - 如果 `KnowledgeFile.abstract` 为空，前端直接显示空
   - 第一版不额外生成摘要

2. `tags`
   - 返回标签名称数组即可
   - 不需要把标签 ID 暴露给门户前端
   - 没有标签时固定返回空数组 `[]`

### 12.6 已确认的字段级规则

当前已确认：

- `summary`
  - 来源：`KnowledgeFile.abstract`
  - 空值处理：允许为空，前端直接显示空

- `tags`
  - 来源：`Tag.name`
  - 返回格式：字符串数组
  - 空值处理：没有标签时返回 `[]`

## 12. 模块化讨论

按功能模块推进 schema 讨论。

当前先从搜索结果模块开始，因为它最容易收敛统一内容项的核心字段。

### 12.1 模块一：搜索结果

#### 12.1.1 模块目标

搜索结果模块服务：

- 门户首页全局搜索
- 门户搜索结果页

这个模块展示的对象是“内容”，不是“知识空间”。

因此它适合作为统一内容 schema 的第一基线。

#### 12.1.2 搜索结果卡片最小字段

当前先收敛搜索结果一条内容卡片需要的最小字段：

| 字段 | 建议 | 原因 |
| --- | --- | --- |
| `id` | 必须 | 前端列表渲染和跳转都需要唯一标识 |
| `title` | 必须 | 搜索结果主标题 |
| `summary` | 必须 | 搜索结果必须给用户上下文判断是否点进详情 |
| `source` | 必须 | 门户结果卡片需要明确来源信息 |
| `updated_at` | 必须 | 门户结果卡片需要表达内容更新时间 |
| `tags` | 必须 | 门户结果卡片需要补充语义信息 |

#### 12.1.3 当前阶段的结论

基于搜索结果模块，`PortalContentItem` 第一版建议如下：

- 必须字段：`id`、`title`、`summary`、`source`、`updated_at`、`tags`

#### 12.1.4 为什么先这样收敛

原因：

- 如果没有 `title` 和 `summary`，搜索结果几乎不可用
- `source` 能稳定告诉用户内容来自哪个知识空间
- `updated_at` 能稳定表达内容时效性
- `tags` 已有现成底层结构，可直接复用
- 所有 URL 统一由前端按 ID 直接拼装

#### 12.1.5 对统一 schema 的影响

搜索结果模块已经基本确定 `PortalContentItem` 的核心骨架应为：

```json
{
  "id": "string",
  "title": "string",
  "summary": "string",
  "source": "string",
  "updated_at": "string",
  "tags": ["string"]
}
```

这不是最终版，只是当前基于“搜索结果模块”得到的第一版字段骨架。

#### 12.1.6 下一步

下一步继续讨论：

- 推荐内容/业务域内容模块

讨论重点：

- 这些模块是否还会继续增加字段
- 是否需要增加额外字段

# 知识门户 API 规格

## 1. 文档目的

本文用于定义知识门户 API 的接口文档与接口 schema。

当前范围覆盖 4 个新增接口 + 1 个复用接口：

- `GET /api/v1/knowledge/space/{space_id}/files` — 文件列表
- `GET /api/v1/knowledge/search` — 跨空间搜索
- `GET /api/v1/knowledge/space/{space_id}/files/{file_id}` — 文件详情
- `GET /api/v1/knowledge/space/{space_id}/files/{file_id}/related` — 相关推荐
- `POST /api/v1/workstation/chat/completions` — 技术问答（复用 BiSheng 日常模式）

本文基于以下前提：

- 接口为通用知识查询能力，不限门户场景
- 新增接口挂在 BiSheng 现有 `/api/v1/knowledge` 路径下，与现有端点不冲突
- 前端在 `domain` 上维护分类与知识空间的映射，只传 `space_id` 给后端
- 后端不负责 `domain -> knowledge space` 映射
- 第一版不做鉴权，只查公开数据（`is_released=True` / `auth_type=public`）
- Service 层预留 `user_id` 参数，后续可扩展权限过滤

关联文档：

- `knowledge-portal-design.md`
- `knowledge-portal-unified-schema.md`

## 2. 通用约定

### 2.1 统一响应包装

所有接口统一采用：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 2.2 分页约定

所有列表接口统一使用以下分页参数：

| 参数 | 类型 | 默认值 | 最大值 | 说明 |
| --- | --- | --- | --- | --- |
| `page` | `int` | `1` | - | 页码 |
| `page_size` | `int` | `20` | `100` | 每页数量 |

### 2.3 数据类型约定

| 约定项 | 规则 |
| --- | --- |
| `id` | `int`，直接使用数据库主键 |
| `updated_at` | `datetime`，直接取 `KnowledgeFile.update_time` 原始值，FastAPI 自动序列化 |
| `title` | 去掉文件后缀，例如 `"设备维护手册.pdf"` → `"设备维护手册"` |
| `summary` | 来自 `KnowledgeFile.abstract`，空值返回 `""` |
| `source` | 来自 `Knowledge.name`，通过 `knowledge_id` 关联查询 |
| `tags` | 来自 `Tag.name` via `TagLink`，空时返回 `[]` |

## 3. 公共数据结构

### 3.1 `KnowledgeFileItem`（列表项）

用于搜索结果、文件列表、推荐列表等所有列表场景。

```json
{
  "id": 1580,
  "title": "热轧1580产线精轧机振动纹治理实践",
  "summary": "针对 1580 热连轧精轧机组出现的周期性振动纹缺陷...",
  "source": "轧线技术案例库",
  "updated_at": "2026-04-13T10:30:00",
  "tags": ["热轧", "精轧机", "振动纹"]
}
```

| 字段 | 类型 | 必填 | 来源 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | `int` | 是 | `KnowledgeFile.id` | 文件 ID |
| `title` | `string` | 是 | `KnowledgeFile.file_name` | 文件标题，去掉后缀 |
| `summary` | `string` | 是 | `KnowledgeFile.abstract` | 文件摘要，空值返回 `""` |
| `source` | `string` | 是 | `Knowledge.name` | 所属知识空间名称 |
| `updated_at` | `datetime` | 是 | `KnowledgeFile.update_time` | 更新时间 |
| `tags` | `string[]` | 是 | `Tag.name` via `TagLink` | 标签名称数组，空时返回 `[]` |

不纳入列表项的字段：

- `domain` — 前端分类概念，不属于内容结果项
- `content_type` — 当前没有稳定数据来源
- URL 类字段 — 前端基于 ID 和固定路由规则自行拼接

### 3.2 `KnowledgeFileDetail`（详情）

继承 `KnowledgeFileItem` 全部字段，额外增加：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `content` | `string` | 待定 | 文件正文内容（待讨论：正文存储在 MinIO，需要额外提取逻辑） |
| `space` | `object \| null` | 待定 | 所属知识空间信息 `{id: int, name: string}`，前端是否使用待确认 |

### 3.3 查询链路

所有列表接口统一查询链路：

1. 按条件查出 `KnowledgeFile` 列表（`file_type=FILE`，`status=SUCCESS`）
2. 批量查 `Knowledge.name`（通过 `KnowledgeDao.aget_list_by_ids`）
3. 批量查标签（通过 `TagLink.resource_id`）
4. 组装为 `KnowledgeFileItem`

## 4. 接口一：文件列表

### 4.1 接口定义

- 方法：`GET`
- 路径：`/api/v1/knowledge/space/{space_id}/files`

### 4.2 接口用途

- 服务业务域入口区
- 服务推荐内容区
- 服务专题内容区
- 服务知识广场中的内容列表

### 4.3 设计原则

- 前端负责分类组织和 `domain -> space_id` 映射
- 后端只按 `space_id` 查询该知识空间下的文档内容
- 返回列表统一使用 `KnowledgeFileItem`

### 4.4 参数

| 参数 | 位置 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| `space_id` | path | `int` | 是 | 知识空间 ID |
| `page` | query | `int` | 否 | 页码，默认 `1` |
| `page_size` | query | `int` | 否 | 每页数量，默认 `20`，最大 `100` |

### 4.5 响应 Schema

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1580,
        "title": "热轧1580产线精轧机振动纹治理实践",
        "summary": "针对 1580 热连轧精轧机组出现的周期性振动纹缺陷...",
        "source": "轧线技术案例库",
        "updated_at": "2026-04-13T10:30:00",
        "tags": ["热轧", "精轧机", "振动纹"]
      }
    ],
    "total": 6,
    "page": 1,
    "page_size": 20
  }
}
```

### 4.6 查询约束

1. `knowledge_id = space_id`
2. `file_type = FILE`
3. 仅返回状态为 SUCCESS 的文件
4. 按 `update_time` 倒序

## 5. 接口二：跨空间搜索

### 5.1 接口定义

- 方法：`GET`
- 路径：`/api/v1/knowledge/search`

### 5.2 接口用途

- 服务首页全局搜索区
- 服务搜索结果页

### 5.3 参数

| 参数 | 位置 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| `q` | query | `string` | 是 | 搜索关键词 |
| `space_id` | query | `int` | 否 | 限定搜索的知识空间 ID；不传则搜索全部公开空间 |
| `page` | query | `int` | 否 | 页码，默认 `1` |
| `page_size` | query | `int` | 否 | 每页数量，默认 `20`，最大 `100` |

### 5.4 响应 Schema

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1580,
        "title": "热轧1580产线精轧机振动纹治理实践",
        "summary": "针对 1580 热连轧精轧机组出现的周期性振动纹缺陷...",
        "source": "轧线技术案例库",
        "updated_at": "2026-04-13T10:30:00",
        "tags": ["热轧", "精轧机", "振动纹"]
      }
    ],
    "total": 23,
    "page": 1,
    "page_size": 20
  }
}
```

### 5.5 查询约束

1. 搜索主对象为 `KnowledgeFile`
2. 搜索关键词至少覆盖标题和摘要
3. 如果传了 `space_id`，额外加 `knowledge_id = space_id`
4. 如果未传 `space_id`，搜索全部公开知识空间（`is_released=True` / `auth_type=public`）
5. 返回结果统一组装为 `KnowledgeFileItem`

## 6. 接口三：文件详情

### 6.1 接口定义

- 方法：`GET`
- 路径：`/api/v1/knowledge/space/{space_id}/files/{file_id}`

### 6.2 接口用途

- 服务知识详情页
- 详情对象是知识空间中的文件，不是知识空间本身

### 6.3 参数

| 参数 | 位置 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| `space_id` | path | `int` | 是 | 文件所属知识空间 ID |
| `file_id` | path | `int` | 是 | 文件 ID |

### 6.4 响应 Schema

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1580,
    "title": "热轧1580产线精轧机振动纹治理实践",
    "summary": "针对 1580 热连轧精轧机组出现的周期性振动纹缺陷...",
    "source": "轧线技术案例库",
    "updated_at": "2026-04-13T10:30:00",
    "tags": ["热轧", "精轧机", "振动纹"],
    "space": {
      "id": 12,
      "name": "轧线技术案例库"
    }
  }
}
```

### 6.5 待讨论字段

- `content` — 文件正文存储在 MinIO 对象存储，不在数据库中，需要额外提取逻辑，待讨论实现方式
- `space` — 所属空间信息，前端是否使用待前端设计时确认

## 7. 接口四：相关推荐

### 7.1 接口定义

- 方法：`GET`
- 路径：`/api/v1/knowledge/space/{space_id}/files/{file_id}/related`

### 7.2 接口用途

- 服务知识详情页中的相关推荐

### 7.3 参数

| 参数 | 位置 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| `space_id` | path | `int` | 是 | 当前文件所属知识空间 ID |
| `file_id` | path | `int` | 是 | 当前文件 ID |
| `limit` | query | `int` | 否 | 返回数量，默认 `5`，最大 `5` |

### 7.4 查询规则

1. 查当前文件标签
2. 取第一个标签
3. 查同标签的其他文件
4. 排除当前文件
5. 按 `update_time` 倒序返回

兜底：如果当前文件没有标签，返回空列表。

### 7.5 响应 Schema

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1602,
        "title": "热连轧精轧机振动纹异常案例复盘",
        "summary": "围绕同类振动纹问题进行问题复盘与工艺校正总结",
        "source": "轧线技术案例库",
        "updated_at": "2026-04-11T09:30:00",
        "tags": ["振动纹", "热轧"]
      }
    ],
    "total": 5
  }
}
```

### 7.6 待讨论

- 是否回显用于推荐的标签名（`tag` 字段）
- 具体推荐策略是否需要调整，待前端设计时确认

## 8. 复用接口：技术问答 / 专家在线

### 8.1 接口定义

- 方法：`POST`
- 路径：`/api/v1/workstation/chat/completions`

### 8.2 接口用途

- 服务技术问答 / 专家在线
- 该接口不是本次新设计的 API，而是直接复用 BiSheng 现有日常模式 API

### 8.3 调用方式

- 前端以 `application/json` 提交请求体
- 服务端返回 `text/event-stream`
- 前端通过 SSE 流式接收回答内容

### 8.4 门户场景下推荐请求体

```json
{
  "text": "振动纹通常如何排查？",
  "clientTimestamp": "2026-04-13T16:30:00",
  "conversationId": null,
  "parentMessageId": "00000000",
  "messageId": "msg_xxx",
  "model": "123",
  "search_enabled": false,
  "use_knowledge_base": {
    "personal_knowledge_enabled": false,
    "organization_knowledge_ids": [],
    "knowledge_space_ids": [12, 18]
  },
  "files": []
}
```

### 8.5 知识库范围规则

- 知识库范围由前端手动选择和配置
- 前端筛选框不依赖后端返回额外类别字段
- 集团知识库筛选范围不包含个人知识库内容

## 9. 模块到接口的复用关系

| 模块 | 接口 | 说明 |
| --- | --- | --- |
| 首页业务域入口区 | `GET /knowledge/space/{space_id}/files` | 前端完成 `domain -> space_id` 映射后调用 |
| 首页推荐内容区 | `GET /knowledge/space/{space_id}/files` | 推荐区在前端配置知识空间绑定 |
| 首页专题内容区 | `GET /knowledge/space/{space_id}/files` | 专题区在前端配置知识空间绑定 |
| 首页知识广场内容列表 | `GET /knowledge/space/{space_id}/files` | 前端绑定知识空间 |
| 首页全局搜索区 | `GET /knowledge/search` | 关键词搜索 |
| 搜索结果页 | `GET /knowledge/search` | 与首页搜索区复用同一接口 |
| 知识详情页 | `GET /knowledge/space/{space_id}/files/{file_id}` | 文件详情 |
| 相关推荐 | `GET /knowledge/space/{space_id}/files/{file_id}/related` | 同标签推荐 |
| 技术问答页 | `POST /workstation/chat/completions` | 复用 BiSheng 日常模式 API |

不走后端 API 的模块：

- 顶部导航、焦点展示区、页脚 — 前端写死
- 知识空间卡片 — 前端静态配置
- 应用市场 — 前端直接配置 BiSheng Workflow 的免登录 URL
- 搜索建议 — 第一版不做

## 10. 搜索建议

当前结论：

- 第一版不做搜索建议接口
- 不做 AI 推荐型搜索建议
- 如果后续需要搜索提示能力，直接基于标签列表查询

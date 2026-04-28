# BiSheng 用户登录与我的知识空间方案

本文记录门户接入 BiSheng 用户登录，以及在门户中展示“我的知识空间”的阶段性方案。当前重点是明确边界和待确认问题，后续再按本文拆分实现。

---

## 1. 目标

用户在门户自己的登录页登录：

```text
http://192.168.106.114:3001/login?redirect=%2F
```

登录成功后，门户能以该 BiSheng 用户身份查询并展示用户可见的知识空间。

前端入口：

```text
/knowledge-spaces
```

导航栏文案：

```text
我的知识空间
```

---

## 2. 已确定方案

### 2.1 登录方式：门户 API 登录 BiSheng

采用门户 BFF 代用户调用 BiSheng 登录 API，而不是跳转到 BiSheng 登录页再回跳。

原因：

- 不依赖跨域 Cookie。
- 不依赖 BiSheng 登录页支持 `redirect_uri`。
- 适配内网/外网混合场景：用户浏览器只访问门户，门户后端访问 BiSheng API。
- 门户 BFF 能明确维护当前门户用户会话，并用该用户 token 调 BiSheng 权限接口。

关键前提：

- 管理员需要先配置一个门户后端可访问的 BiSheng API 地址。
- 用户浏览器不需要直接访问 BiSheng。
- 门户登录页只访问门户 BFF，BFF 再访问 BiSheng。

建议登录流程：

```text
浏览器 /login
  -> POST /api/v1/auth/login
    -> GET  BiSheng /api/v1/user/get_captcha
    -> GET  BiSheng /api/v1/user/public_key
    -> RSA 加密密码
    -> POST BiSheng /api/v1/user/login
    -> GET  BiSheng /api/v1/user/info
    -> 门户建立 HttpOnly session
  -> 前端跳转 redirect
```

### 2.2 Token 与 Session

不把 BiSheng `access_token` 放到前端 `localStorage`。

推荐做法：

- 门户 BFF 设置自己的 `HttpOnly` session cookie。
- BiSheng token 存在服务端 session 中，或以加密形式存到 `HttpOnly` cookie。
- 前端只通过 `/api/v1/auth/me` 判断登录态和显示用户信息。

### 2.3 知识空间来源

不新增 BiSheng API，不修改 BiSheng 权限逻辑。门户后端只调用 BiSheng 已有接口。

候选接口：

```text
GET /api/v1/knowledge/space/mine
GET /api/v1/knowledge/space/joined
GET /api/v1/knowledge/space/department
GET /api/v1/knowledge/space/managed
```

这些接口由 BiSheng 自己完成权限判断。门户不直接读 BiSheng 数据库，也不尝试重算权限。

### 2.4 BiSheng 地址配置

API 登录方案需要明确区分两个地址：

| 地址 | 谁访问 | 用途 | 是否必填 |
|---|---|---|---|
| BiSheng API Base URL | 门户后端 BFF | 登录、用户信息、知识空间、文件、问答等所有 API 调用 | 必填 |
| BiSheng Web URL | 用户浏览器 | 可选：跳转到 BiSheng 原站、错误排查、管理员提示 | 可选 |

示例：

```text
门户用户入口：
http://192.168.106.114:3001

BiSheng API Base URL（BFF 填这个）：
http://192.168.106.109:7860
http://192.168.106.115:8098
http://192.168.106.116:7861

BiSheng Web URL（浏览器入口，可选）：
http://192.168.106.120:3003
http://192.168.106.120:3002
http://192.168.106.116:3001
```

不要把 BiSheng Web URL 填到 API Base URL。Web URL 常返回 SPA `index.html`，BFF 调 `/api/*` 时会出现 JSON 解析失败或 404。

管理员配置时应以“门户后端机器能访问”为准，而不是以管理员浏览器能访问为准。

建议在后台配置页保存前做服务端连通性校验：

```text
GET <base_url>/api/v1/user/get_captcha
GET <base_url>/api/v1/user/public_key
```

保存登录凭证后再校验：

```text
POST <base_url>/api/v1/user/login
GET  <base_url>/api/v1/user/info
GET  <base_url>/api/v1/knowledge/space/mine
```

如果存在内外网混合部署，推荐配置结构为：

```json
{
  "base_url": "http://192.168.106.109:7860",
  "web_url": "http://192.168.106.120:3003",
  "network_note": "BFF 走内网 109:7860，用户浏览器不直连 BiSheng"
}
```

第一版只必须实现 `base_url`。`web_url` 可以先作为展示/排查字段预留，不参与登录主流程。

---

## 3. 我的知识空间筛选语义

门户后端提供门户自己的聚合接口：

```text
GET /api/v1/knowledge/spaces
```

该接口语义：

```text
当前登录用户可见的知识空间
```

聚合流程：

```text
1. 用当前门户 session 中的 BiSheng 用户 token 创建 BiSheng client
2. 调 BiSheng /knowledge/space/mine
3. 调 BiSheng /knowledge/space/joined
4. 调 BiSheng /knowledge/space/department
5. 可选调 BiSheng /knowledge/space/managed
6. 按 space.id 合并去重
7. 返回给前端
```

第一版展示范围：

```text
BiSheng 已返回给当前用户的空间，包括公开空间、我创建的、我加入的、部门空间和可管理空间。
```

### 3.1 去重规则

同一个空间可能同时出现在多个接口中。门户按 `id` 去重，并保留来源信息：

```json
{
  "id": 12,
  "name": "设备管理部内部知识空间",
  "auth_type": "private",
  "user_role": "member",
  "space_kind": "department",
  "sources": ["joined", "department"]
}
```

`sources` 可用于后续前端分组或打标签。

### 3.2 角色优先级

同一个空间多路返回不同角色时，取最高权限：

```text
creator > admin > member
```

### 3.3 排序建议

第一版排序：

```text
1. is_pinned desc
2. update_time desc
3. name asc
```

---

## 4. 前端设计

### 4.1 已完成

已新增前端路由：

```text
/knowledge-spaces
```

已新增导航栏 tab：

```text
我的知识空间
```

已新增页面：

```text
frontend/src/pages/KnowledgeSpacesPage.tsx
frontend/src/pages/KnowledgeSpacesPage.module.css
```

页面状态：

- 加载态
- 未登录态（401 时引导登录）
- 空态
- 错误态
- mock 演示数据 fallback

当前前端会调用：

```text
GET /api/v1/knowledge/spaces
```

在后端接口未接通时，会展示本地 mock 数据，并提示：

```text
后端聚合接口尚未接通，当前显示演示数据。
```

### 4.2 前端期望响应

建议门户后端响应：

```json
{
  "status_code": 200,
  "status_message": "ok",
  "data": {
    "data": [
      {
        "id": 7101,
        "name": "冷轧设备故障复盘库",
        "description": "沉淀冷轧产线设备异常、抢修记录与复盘结论。",
        "auth_type": "private",
        "user_role": "creator",
        "space_kind": "normal",
        "department_name": "",
        "file_count": 38,
        "member_count": 6,
        "is_pinned": true,
        "updated_at": "2026-04-26T09:20:00",
        "sources": ["mine", "managed"]
      }
    ],
    "total": 1
  }
}
```

字段兼容说明：

- `file_count` 与 BiSheng `file_num` 可二选一；前端优先读 `file_count`，兜底读 `file_num`。
- `member_count` 与 BiSheng `follower_num` 可二选一；前端优先读 `member_count`，兜底读 `follower_num`。
- `updated_at` 与 BiSheng `update_time` 可二选一；前端优先读 `updated_at`，兜底读 `update_time`。

---

## 5. 后端待实现

### 5.1 认证接口

建议新增：

```text
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

职责：

- `/auth/login`：接收账号密码和验证码信息，调用 BiSheng 登录，建立门户 session。
- `/auth/me`：返回门户当前登录用户。
- `/auth/logout`：清门户 session；是否同步调用 BiSheng logout 待确认。

### 5.2 知识空间接口

建议新增：

```text
GET /api/v1/knowledge/spaces
```

职责：

- 要求门户已登录，否则 401。
- 从门户 session 取当前用户 BiSheng token。
- 用用户 token 调 BiSheng 现有空间列表 API。
- 聚合、去重、排序后返回。

---

## 6. 风险与约束

### 6.1 门户接收用户密码

API 登录方案意味着门户 BFF 会接收用户 BiSheng 账号密码。

要求：

- 生产入口必须走 HTTPS，至少要明确内网 HTTP 的风险接受边界。
- 后端日志不能记录明文密码。
- 登录失败错误不要回显敏感细节。

### 6.2 验证码

BiSheng 登录可能启用验证码。门户登录页需要支持验证码分支。

最小实现可以先接：

```text
GET /api/v1/user/get_captcha
```

如果 BiSheng 返回需要验证码，则门户登录页展示验证码输入。

### 6.3 每用户 token 隔离

不能复用现有全局 `BishengClient` 的 runtime token 查询“我的知识空间”。

否则查到的是门户配置账号的空间，而不是当前用户的空间。

### 6.4 内外网混合

API 登录方案只要求门户 BFF 能访问 BiSheng API；用户浏览器不一定要能访问 BiSheng。

这比跳转登录更适合以下场景：

- 用户在外网访问门户
- BiSheng 只在内网可达
- 门户 BFF 同时能访问外网用户和内网 BiSheng

因此，配置校验必须发生在门户后端，而不是只在前端用浏览器请求测试。

---

## 7. 待确认问题

1. 生产入口是否会启用 HTTPS？
   - 如果短期仍是 HTTP，需要明确是否接受门户接收账号密码的风险。

2. 门户 session 存储方式选哪种？
   - 服务端内存 session
   - Redis session
   - 加密 HttpOnly cookie

3. BiSheng 登录验证码是否在生产启用？
   - 如果启用，第一版登录页必须支持验证码。
   - 如果不启用，可先做账号密码登录，保留验证码接口扩展点。

4. `/api/v1/knowledge/space/managed` 是否纳入第一版聚合？
   - 建议纳入，作为“可管理空间”兜底。
   - 如担心和 `mine` / `joined` 重叠，去重即可。

5. 部门空间是否全部展示？
   - 当前建议：只要 BiSheng `/department` 返回，就展示。

6. logout 是否同步 BiSheng？
   - 最小版只清门户 session。
   - 更完整版本可调用 BiSheng `/api/v1/user/logout`，但要确认是否会影响用户在 BiSheng 原站的会话。

7. token 过期后的体验是什么？
   - 直接 401 让前端跳登录。
   - 或后端尝试静默刷新。
   - 当前建议第一版直接 401，后续再做刷新。

8. “我的知识空间”是否只对登录用户显示？
   - 当前前端导航一直显示，未登录点击后页面引导登录。
   - 如果产品希望未登录隐藏，需要调整 Header 逻辑。

9. 是否需要在后台配置中新增 `BiSheng Web URL`？
   - `base_url` 必须有，供 BFF 调 API。
   - `web_url` 可选，供用户跳转 BiSheng 原站或排查使用。
   - 第一版可先不参与主流程。

10. 管理员配置 BiSheng 地址时，是否要求保存前强制连通性校验？
    - 建议强制校验 `get_captcha` / `public_key`。
    - 登录凭证保存时强制校验 `login` / `user/info`。
    - 知识空间页上线前校验 `/knowledge/space/mine`。

---

## 8. 建议实施顺序

1. 后端实现门户 session 与 `/api/v1/auth/login`。
2. 前端登录页从 mock 登录改为调用 `/api/v1/auth/login`。
3. 后台 BiSheng 配置明确区分 `base_url` 与可选 `web_url`，并增加服务端连通性校验。
4. 后端实现 `/api/v1/knowledge/spaces` 聚合接口。
5. 前端移除或保留 mock fallback 开关。
6. 联调真实 BiSheng 用户，验证 `/mine` / `/joined` / `/department` / `/managed` 返回。
7. 根据联调结果补字段映射和排序规则。
8. 最后处理验证码、logout、token 过期体验和 HTTPS/session 加固。

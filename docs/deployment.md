# 知识门户 部署指南

本文档面向**生产部署运维**，假设门户与 BiSheng 各自独立部署、由本团队完全掌控。

---

## 1. BiSheng 端：调长 access token TTL

> 这步**必须由 BiSheng 运维执行**，门户层无法绕过。

### 背景
- 门户调 BiSheng 的所有读路径，都要带 `Authorization: Bearer <token>` + Cookie `access_token_cookie=<token>`
- 这个 token 是用户登录后 BiSheng 签发的 JWT，**默认有效期 24 小时**（线上 109 实测）
- 24h 一过，门户所有 BiSheng 调用 401，整个门户事实上瘫痪

### 操作
在 **BiSheng 后端**的环境变量或配置文件里把 access token 过期时间调长。常见的几个 key 名（具体以你部署的 BiSheng 版本为准）：

```
ACCESS_TOKEN_EXPIRE_MINUTES=43200    # 30 天
# 或者
JWT_EXPIRE_SECONDS=2592000            # 30 天 = 30 * 24 * 3600
```

### 推荐值
- **30 天**：兼顾安全和运维。门户端的自动续期阈值是 1 小时，30 天的 TTL 给一次失败留了海量重试窗口
- **更长（90 天 / 1 年）**：可以，但前提是网络隔离 + 凭证管理到位
- **永不过期**：不推荐。一旦泄露只能整体换密钥

### 验证
改完重启 BiSheng，从浏览器登录后用 jwt.io 解一下 cookie，确认 `exp` 字段是新值。

---

## 2. 门户端：配置自动续期凭证

门户启动时会读 `PORTAL_BISHENG_USERNAME` / `PORTAL_BISHENG_PASSWORD` 两个环境变量，临 token 过期前（剩余 ≤1h）自动调 BiSheng `/api/v1/user/login` 续期。

### 配置位置
`backend/.env`（已 gitignore，不会提交）：

```env
PORTAL_BISHENG_BASE_URL=http://<bisheng-host>:7860
PORTAL_BISHENG_TIMEOUT_SECONDS=30
PORTAL_BISHENG_USERNAME=portal-service
PORTAL_BISHENG_PASSWORD=<明文密码>
PORTAL_BISHENG_API_TOKEN=                 # 冷启动可留空，配了密码后自动从账密换
PORTAL_BISHENG_DEFAULT_MODEL=             # 按需
PORTAL_BISHENG_PAGE_SIZE_LIMIT=100
```

> `PORTAL_BISHENG_USERNAME` 是兜底：admin 后台编辑过的账号会落到 `bisheng_runtime.json` 并优先使用，env 仅在文件里 `username` 为空时生效。`PORTAL_BISHENG_PASSWORD` 永远只看 env（不会写入任何文件）。

### 推荐做法
- **专门给门户开一个 BiSheng 服务账号**（比如 `portal-service`），不要用 admin 个人账号
- 服务账号在 BiSheng 后台只授必要的最小权限（能读门户配置里的知识空间即可）
- 密码用密钥管理工具（Vault / Doppler / cloud secrets manager）下发到 `.env`，不要直接 commit
- 文件权限 `chmod 600 backend/.env`

### 自动续期行为
| 时机 | 行为 |
|---|---|
| 服务启动 | 解析 `bisheng_runtime.json` 里的 token：不存在 / 解析失败 / 剩余 ≤1h，立即调 login；否则跳过，等后台循环 |
| 后台循环 | 每 30 分钟检查一次，剩余 ≤1h 自动调 login |
| login 失败 | 记 warning 日志，不崩服务，下次循环重试 |
| 没配 username/password | 安静跳过，**不**启动后台任务（行为退化为旧版手动模式） |

### 紧急情况：手动注入 token
如果 BiSheng 端临时不可用、自动续期持续失败，可以走旧路径：

1. 浏览器登录 BiSheng admin → F12 → Cookies → 拷 `access_token_cookie` 完整 JWT
2. 写到 `PORTAL_BISHENG_API_TOKEN`，重启 BFF
3. 等 BiSheng 恢复后再清掉 `PORTAL_BISHENG_API_TOKEN`，让自动续期接管

---

## 3. 验证清单

部署完成后逐条过一下：

```bash
# BFF 起得来
curl http://127.0.0.1:8010/health
# 期望：{"status_code":200, "data":{"service":"knowledge-portal-backend","status":"ok"}}

# BiSheng 联通且 token 有效
curl http://127.0.0.1:8010/api/v1/knowledge/tags
# 期望：data 数组非空（空数组通常意味着 token 无效或 BiSheng 标签库为空）
```

**观察日志**确认自动续期生效。出现这行说明刚刚跑过一次 login：
```
INFO ... BiSheng token 已自动续期
```
- 如果启动时 `bisheng_runtime.json` 里的 token 不存在 / 剩余 ≤1h，会**立刻**打一行
- 否则启动时不会打，需要等后台循环跑到剩余 ≤1h 时才会续期（30 天 TTL 下，大致每 29 天打一次）
- 启动用的 uvicorn 需要 `--log-level info`（默认级别）才能看到这行；如果用了 `warning` 及以上级别，只能在续期失败时通过 warning 日志感知

---

## 4. 常见问题

**Q：BiSheng 启用了登录验证码，自动登录会怎样？**
A：门户启动时会 log warning：`当前 BiSheng 环境启用了验证码，门户后台暂不支持自动登录`，自动续期跳过本次。建议生产 BiSheng 关掉服务账号的验证码（或单开一个免验证码的服务账号）。

**Q：能不能把密码也存到 `bisheng_runtime.json`？**
A：不行。`bisheng_runtime.json` 是运行时配置文件，会被 admin 后台直接编辑、可能被运维 cat 排查、可能进备份。密码必须走 env / secrets manager。

**Q：BiSheng 改了登录接口，怎么办？**
A：登录流程在 `backend/app/services/bisheng_runtime_service.py:_login_and_get_token`，按上游接口改即可（captcha → public_key → login 三步）。

**Q：admin 后台"数据源配置"页面输的密码，和 env 里的 `PORTAL_BISHENG_PASSWORD` 有什么关系？**
A：两条独立路径。后台输的密码**用完即丢**（仅触发一次 login 拿 token，不持久化），适合临时切换 BiSheng 环境；自动续期**只**消费 env 里的 `PORTAL_BISHENG_PASSWORD`。生产环境靠 env，admin 后台改连接信息时仍然要现场输一次。

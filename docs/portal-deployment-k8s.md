# 知识门户部署指南（含 K8s 完整样例）

> **本文范围**：覆盖首钢知识门户（前端 + BFF）的部署，重点交付**完整 K8s 部署样例**与本次新增 `integrations.bisheng_admin_entry_url` 配置的启用步骤。BiSheng 侧的补丁与 iframe 嵌入方案见 [`bisheng-portal-admin-integration.md`](./bisheng-portal-admin-integration.md)，本文不重复。

---

## 1. 本次集成产物

### 1.1 改动概要

| 维度 | 改动 |
|---|---|
| 后端 schema | `PortalConfig` 新增 `integrations: IntegrationsConfig` 节，含字段 `bisheng_admin_entry_url: str = ""` |
| 后端 API | 新增 `GET /api/v1/admin/config/integrations`、`PUT /api/v1/admin/config/integrations` |
| 后端持久化 | `portal_config.json` 顶层多出 `integrations` 节；旧 JSON 缺该节时 BFF 启动后首次 `get_config()` 自动 backfill 默认空值 |
| 前端 Header | 用户菜单内原「后台管理」按钮改为「知识管理后台」；URL 已配置时点击 `window.open(url, '_blank', 'noopener,noreferrer')`；URL 为空时**入口隐藏**（不再回退本地 `/admin`） |
| 前端 Admin 页 | 左侧新增「集成配置」分类，含一个 URL 输入项 + 编辑对话框 |
| 兼容性 | 路由 `/admin` 保留，本地开发或紧急情况仍可手敲地址访问门户原生 admin 页 |

### 1.2 配置位置

- **字段路径**：`portal_config.json` → `integrations.bisheng_admin_entry_url`
- **测试期推荐值**：`http://192.168.106.120:3002/workspace/shougang-portal-admin`
- **生产同源期推荐值**：`https://bisheng.shougang.local/workspace/shougang-portal-admin`
- **管理员配置入口**：登录门户 → 右上角下拉 → 进入 `/admin`（如果该入口已被你前一次配置隐藏，则手敲 URL 进入）→ 左侧选「集成配置」→ 点「编辑」→ 填值 → 保存。**刷新即生效，无需重启 BFF**。

### 1.3 行为约定

| 状态 | 表现 |
|---|---|
| `integrations.bisheng_admin_entry_url` 为空 | Header 用户菜单**不显示**「知识管理后台」入口 |
| URL 已配置 | 用户菜单出现「知识管理后台」，点击新标签打开该 URL |
| 临时下线 BiSheng 集成 | 在 admin 把 URL 清空保存即可，不需重启 |
| URL 校验 | 前端要求以 `http://` / `https://` 开头；空字符串视为「清空」，允许保存 |

---

## 2. 现有 systemd 生产环境（114:3001）启用步骤

> 仓库 [`CLAUDE.md` §7](../CLAUDE.md) 描述了完整的 systemd 部署形态。本节只补「如何启用本次新字段」。

```bash
# 本地执行：先验证再传
cd /path/to/shougang-group-knowledge-portal

# 前端
cd frontend && npm run build
rsync -az --delete dist/ root@192.168.106.114:/usr/share/nginx/shougang-portal/

# 后端：先 dry-run，再正式上传
cd ../backend
rsync -avzn --exclude='.venv' --exclude='.env' --exclude='__pycache__' \
  --exclude='.pytest_cache' --exclude='app/config/data/' \
  ./ root@192.168.106.114:/opt/shougang-portal/         # 加 -n 是 dry-run

# OK 后去掉 -n
rsync -avz --exclude='.venv' --exclude='.env' --exclude='__pycache__' \
  --exclude='.pytest_cache' --exclude='app/config/data/' \
  ./ root@192.168.106.114:/opt/shougang-portal/
ssh root@192.168.106.114 'systemctl restart shougang-portal'
```

> ⚠️ **必须 `--exclude='app/config/data/'`**——本地 `portal_config.json`、`bisheng_runtime.json` 是开发态，覆盖会瞬间擦掉生产的全部 admin 配置。CLAUDE.md §7 详述。

部署完毕后：

1. 浏览器访问 `http://192.168.106.114:3001/`，登录管理员账号。
2. 右上角下拉首次刷新后**没有**「知识管理后台」入口（生产 portal_config 默认空值）。
3. 手敲 `http://192.168.106.114:3001/admin` 进 admin 页 → 左侧「集成配置」→ 编辑 → 填入对应环境的 BiSheng URL → 保存。
4. 刷新门户首页 → 入口出现，点击新标签打开 BiSheng 工作台。

> ⚠️ **首次部署后，旧的 admin 入口"后台管理"会被替换为"知识管理后台"且默认隐藏**（因为生产 portal_config 还没这个字段）。务必在部署窗口期内通过手敲 `/admin` 完成首次配置，避免管理员"找不到入口"的体验落差。

### 2.1 回滚

不需要回滚代码就能"关掉"集成入口——admin 把 URL 清空保存即可。如果代码本身需要回滚：

```bash
ssh root@192.168.106.114 'systemctl stop shougang-portal'
# rsync 历史 backup（项目 §7 没有自动备份，需要部署前 cp .bak.<ts>）
ssh root@192.168.106.114 'systemctl start shougang-portal'
```

---

## 3. K8s 完整部署样例

> 适用前提：你已有可用的 K8s 集群（≥ 1.24）、Ingress controller（推荐 ingress-nginx）、容器镜像仓库（下面用 `registry.shougang.local` 占位）。

### 3.1 目录结构建议

```
shougang-group-knowledge-portal/
├── deploy/
│   ├── Dockerfile.portal-frontend
│   ├── Dockerfile.portal-backend
│   └── k8s/
│       ├── 00-namespace.yaml
│       ├── 10-portal-backend-pvc.yaml
│       ├── 11-portal-backend-secret.yaml          # PORTAL_BISHENG_API_TOKEN（兜底，可选）
│       ├── 12-portal-backend-configmap.yaml       # 非敏感 env
│       ├── 13-portal-backend-deployment.yaml
│       ├── 14-portal-backend-service.yaml
│       ├── 20-portal-frontend-configmap.yaml      # nginx.conf
│       ├── 21-portal-frontend-deployment.yaml
│       ├── 22-portal-frontend-service.yaml
│       └── 30-portal-ingress.yaml
└── docs/
    └── portal-deployment-k8s.md   # 本文
```

### 3.2 镜像构建

#### `deploy/Dockerfile.portal-frontend`

```dockerfile
# Stage 1: build SPA
FROM node:20-alpine AS builder
WORKDIR /src
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: serve via nginx
FROM nginx:1.27-alpine
COPY --from=builder /src/dist /usr/share/nginx/html
# nginx.conf 由 ConfigMap 挂入，本镜像不内置
EXPOSE 80
```

构建：

```bash
docker build \
  -f deploy/Dockerfile.portal-frontend \
  -t registry.shougang.local/portal-frontend:0.1.0 \
  .
docker push registry.shougang.local/portal-frontend:0.1.0
```

> 如果生产以 base path `/portal-admin/` 嵌入 BiSheng（参 bisheng-portal-admin-integration.md §4.3），构建命令加：
> ```bash
> docker build \
>   --build-arg VITE_BASE_PATH=/portal-admin/ \
>   --build-arg VITE_API_BASE=/portal-api/v1 \
>   ...
> ```
> 同时 `frontend/vite.config.ts` 需读 `process.env.VITE_BASE_PATH`，本仓库目前未实现该 build-arg，本节仅作未来同源化提示。

#### `deploy/Dockerfile.portal-backend`

```dockerfile
FROM python:3.13-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
 && rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml backend/uv.lock* ./
RUN pip install --no-cache-dir uvicorn[standard] fastapi httpx pydantic pydantic-settings cryptography

COPY backend/app ./app

# 数据目录由 PVC 挂在 /app/app/config/data
EXPOSE 8010
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8010"]
```

> ⚠️ Python 依赖建议改为 `pip install -e .` 或 `uv sync`，与项目实际锁文件管理对齐。本样例为最小可运行版本。

构建：

```bash
docker build -f deploy/Dockerfile.portal-backend -t registry.shougang.local/portal-backend:0.1.0 .
docker push registry.shougang.local/portal-backend:0.1.0
```

### 3.3 K8s 工件

#### `00-namespace.yaml`

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: shougang-knowledge
  labels:
    app.kubernetes.io/part-of: shougang-knowledge-portal
```

#### `10-portal-backend-pvc.yaml`

PVC 用于持久化 `portal_config.json` 与 `bisheng_runtime.json`，避免 Pod 重启丢失 admin 配置。

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: portal-backend-data
  namespace: shougang-knowledge
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  # storageClassName: <按集群实际填，省略走默认>
```

#### `11-portal-backend-secret.yaml`（仅当用手动 token 兜底）

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: portal-backend-secret
  namespace: shougang-knowledge
type: Opaque
stringData:
  # 仅当 BiSheng 启用验证码或不可达时才填；否则留空，让 BFF 通过 admin UI 配的账密自动登录续期
  PORTAL_BISHENG_API_TOKEN: ""
```

> CLAUDE.md §6 强调：**首选账密自动续期**（admin UI 填 base_url + 账号 + 密码），手动 token 仅作兜底。如果不需要兜底，可以不创建此 Secret，相应 Deployment 的 `envFrom` 也去掉对它的引用。

#### `12-portal-backend-configmap.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: portal-backend-config
  namespace: shougang-knowledge
data:
  # 这些是 PORTAL_ 前缀的 BFF 启动期默认值；admin UI 保存的 BiSheng 配置（base_url/账密）
  # 会写入 PVC 里的 bisheng_runtime.json，覆盖这些默认。
  PORTAL_BISHENG_BASE_URL: "http://192.168.106.115:8098"
  PORTAL_BISHENG_TIMEOUT_SECONDS: "30"
  PORTAL_BISHENG_DEFAULT_MODEL: ""
  PORTAL_BISHENG_PAGE_SIZE_LIMIT: "100"
  PORTAL_APP_ENV: "production"
  PORTAL_PORTAL_SESSION_COOKIE_SECURE: "true"
```

#### `13-portal-backend-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: portal-backend
  namespace: shougang-knowledge
  labels:
    app: portal-backend
spec:
  replicas: 1                        # BFF 状态文件挂在 RWO PVC，单副本；多副本需改 RWX/Redis 等
  strategy:
    type: Recreate                   # 避免 RWO PVC 在滚动更新时 pending
  selector:
    matchLabels:
      app: portal-backend
  template:
    metadata:
      labels:
        app: portal-backend
    spec:
      containers:
        - name: backend
          image: registry.shougang.local/portal-backend:0.1.0
          ports:
            - containerPort: 8010
              name: http
          envFrom:
            - configMapRef:
                name: portal-backend-config
            - secretRef:
                name: portal-backend-secret
                optional: true       # 没创建 Secret 时不阻塞
          volumeMounts:
            - name: data
              mountPath: /app/app/config/data
          readinessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 30
            periodSeconds: 30
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 1Gi
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: portal-backend-data
```

#### `14-portal-backend-service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: portal-backend
  namespace: shougang-knowledge
spec:
  type: ClusterIP
  selector:
    app: portal-backend
  ports:
    - name: http
      port: 8010
      targetPort: http
```

#### `20-portal-frontend-configmap.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: portal-frontend-nginx
  namespace: shougang-knowledge
data:
  default.conf: |
    server {
        listen       80;
        server_name  _;
        root         /usr/share/nginx/html;

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }

        # 静态资产长期缓存
        location /assets/ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # /api 与 /health 反代到 BFF
        location /api/ {
            proxy_pass         http://portal-backend.shougang-knowledge.svc.cluster.local:8010;
            proxy_http_version 1.1;
            proxy_set_header   Host              $host;
            proxy_set_header   X-Real-IP         $remote_addr;
            proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
            proxy_set_header   X-Forwarded-Proto $scheme;
            # SSE / 流式问答必须关闭缓冲
            proxy_buffering    off;
            proxy_read_timeout 600s;
        }

        location /health {
            proxy_pass         http://portal-backend.shougang-knowledge.svc.cluster.local:8010;
        }
    }
```

#### `21-portal-frontend-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: portal-frontend
  namespace: shougang-knowledge
  labels:
    app: portal-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: portal-frontend
  template:
    metadata:
      labels:
        app: portal-frontend
    spec:
      containers:
        - name: nginx
          image: registry.shougang.local/portal-frontend:0.1.0
          ports:
            - containerPort: 80
              name: http
          volumeMounts:
            - name: nginx-conf
              mountPath: /etc/nginx/conf.d/default.conf
              subPath: default.conf
          readinessProbe:
            httpGet:
              path: /
              port: http
            initialDelaySeconds: 3
            periodSeconds: 10
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 500m
              memory: 256Mi
      volumes:
        - name: nginx-conf
          configMap:
            name: portal-frontend-nginx
            items:
              - key: default.conf
                path: default.conf
```

#### `22-portal-frontend-service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: portal-frontend
  namespace: shougang-knowledge
spec:
  type: ClusterIP
  selector:
    app: portal-frontend
  ports:
    - name: http
      port: 80
      targetPort: http
```

#### `30-portal-ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: portal-ingress
  namespace: shougang-knowledge
  annotations:
    nginx.ingress.kubernetes.io/proxy-buffering: "off"      # SSE 兼容
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
    # 如需 HTTPS：cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  rules:
    - host: portal.shougang.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: portal-frontend
                port:
                  number: 80
  # tls:
  #   - hosts: [portal.shougang.local]
  #     secretName: portal-shougang-tls
```

> **同源化提示**：如果未来要按 `bisheng-portal-admin-integration.md §5.4` 把门户挂在 BiSheng 同 host 下（`bisheng.shougang.local/portal-admin/`、`bisheng.shougang.local/portal-api/`），把上面 `path: /` 改成路径前缀，并按集成方案为镜像加 `VITE_BASE_PATH` build-arg、为 BFF 加 `PORTAL_ROOT_PATH` env 变量。本仓库当前不携带这些适配点，需要时同步在 vite.config.ts 与 main.py 落地。

### 3.4 一键部署

```bash
kubectl apply -f deploy/k8s/00-namespace.yaml
kubectl apply -f deploy/k8s/

# 等待
kubectl -n shougang-knowledge rollout status deploy/portal-backend
kubectl -n shougang-knowledge rollout status deploy/portal-frontend
```

### 3.5 启用 BiSheng 集成入口

```bash
# 首次准入门户：在 hosts 里把 portal.shougang.local 指向 ingress controller IP
# Mac/Linux: sudo vi /etc/hosts
#   <ingress-ip>  portal.shougang.local

# 浏览器登录 http://portal.shougang.local/admin → 集成配置
# 填入 BiSheng 工作台对应 URL（测试期可填 http://192.168.106.120:3002/workspace/shougang-portal-admin）
# 保存 → 刷新 → 右上角下拉出现"知识管理后台"
```

> 该字段持久化在 PVC 里的 `portal_config.json`，Pod 重启不丢。

---

## 4. 运维与回滚

### 4.1 健康检查

```bash
# 内部
kubectl -n shougang-knowledge logs -f deploy/portal-backend
kubectl -n shougang-knowledge logs -f deploy/portal-frontend

# 外部（替换 host 为实际 ingress 域名）
curl -i http://portal.shougang.local/health
curl http://portal.shougang.local/api/v1/knowledge/tags  # 期望非空 data 数组；空通常意味着 BiSheng 凭证失效
curl http://portal.shougang.local/api/v1/admin/config/integrations  # 期望返回 {"data": {"bisheng_admin_entry_url": ...}}
```

### 4.2 滚动更新

```bash
# 镜像 tag 升到 0.1.1 后
kubectl -n shougang-knowledge set image deploy/portal-backend backend=registry.shougang.local/portal-backend:0.1.1
kubectl -n shougang-knowledge rollout status deploy/portal-backend
```

### 4.3 回滚

```bash
kubectl -n shougang-knowledge rollout undo deploy/portal-backend
kubectl -n shougang-knowledge rollout undo deploy/portal-frontend
```

### 4.4 配置文件备份（PVC 不会自动备份）

部署窗口期或重大配置变更前，进 Pod 手工拍快照：

```bash
POD=$(kubectl -n shougang-knowledge get pod -l app=portal-backend -o jsonpath='{.items[0].metadata.name}')
TS=$(date +%s)
kubectl -n shougang-knowledge exec "$POD" -- \
  cp /app/app/config/data/portal_config.json /app/app/config/data/portal_config.json.bak.$TS
kubectl -n shougang-knowledge exec "$POD" -- \
  cp /app/app/config/data/bisheng_runtime.json /app/app/config/data/bisheng_runtime.json.bak.$TS
```

恢复某次快照：

```bash
kubectl -n shougang-knowledge exec "$POD" -- \
  cp /app/app/config/data/portal_config.json.bak.<TS> /app/app/config/data/portal_config.json
kubectl -n shougang-knowledge rollout restart deploy/portal-backend
```

---

## 5. 从 systemd（114:3001）迁移到 K8s

只在你最终决定把 114 systemd 部署整体替换为 K8s 时执行。日常本次新字段启用不需要这步。

1. **冻结 systemd 配置**：在 114 上 `cp portal_config.json portal_config.json.frozen.<TS>`、`cp bisheng_runtime.json bisheng_runtime.json.frozen.<TS>`。
2. **拷出文件**：`scp root@192.168.106.114:/opt/shougang-portal/app/config/data/{portal_config,bisheng_runtime}.json ./migration-data/`
3. **在 K8s 集群部署**：按 §3 完成 PVC + Deployment 创建。Pod Ready 后停掉 BFF：`kubectl -n shougang-knowledge scale deploy/portal-backend --replicas=0`
4. **导入数据**：先 `kubectl -n shougang-knowledge run -it --rm --restart=Never importer --image=alpine -- sh`，挂相同 PVC 进容器（也可直接 `kubectl cp`）：
   ```bash
   kubectl -n shougang-knowledge cp ./migration-data/portal_config.json $POD:/app/app/config/data/portal_config.json
   kubectl -n shougang-knowledge cp ./migration-data/bisheng_runtime.json $POD:/app/app/config/data/bisheng_runtime.json
   ```
5. **重启**：`kubectl -n shougang-knowledge scale deploy/portal-backend --replicas=1`。BFF 启动会自动读 `bisheng_runtime.json` 里的账密续期 token，无需手工拷 token。
6. **切流**：把对外的 `portal.shougang.local` DNS / 内网 hosts 切到 K8s ingress；停掉 114 上的 `shougang-portal.service`。

---

## 6. 验收清单

- [ ] `kubectl -n shougang-knowledge get pods` 全部 Ready
- [ ] `curl http://<host>/health` 返回 `{"status_code":200, ..., "data":{"service":"knowledge-portal-backend","status":"ok"}}`
- [ ] 浏览器登录 admin → 集成配置 → 填 URL → 保存
- [ ] 刷新 → 右上角下拉出现「知识管理后台」（注意文案不是「后台管理」）
- [ ] 点击 → 新标签打开 BiSheng 工作台对应 URL
- [ ] 清空 URL 保存 → 入口消失
- [ ] `kubectl -n shougang-knowledge delete pod -l app=portal-backend` 后，等待重新 Ready，再次进 admin → 集成配置 → URL 仍在（验证 PVC 持久化）

---

## 7. 不在范围

- BiSheng 侧的 7 处补丁（`bisheng-portal-admin-integration.md`）——那是 BiSheng 仓库的工作。
- 多副本 BFF / 高可用：当前 `portal_config.json` 用 RWO PVC + threading.Lock 实现，单副本足够首钢内部规模；如需多副本需把配置存储改为 Redis/外部 KV，或换 RWX PVC。
- 跨集群灾备 / 异地多活。
- iframe 嵌入逻辑：本字段只是「在新标签打开 BiSheng URL」，真正的 iframe 嵌入由 BiSheng 工作台侧完成（参 bisheng-portal-admin-integration.md §3-§4）。

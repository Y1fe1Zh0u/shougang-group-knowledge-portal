# 前端说明

首钢知识门户前端基于 React 19、TypeScript 和 Vite。

## 页面范围

- `/` 首页
- `/search` 搜索页
- `/domain/:domainName` 业务域列表页
- `/space/:spaceId` 空间列表页
- `/space/:spaceId/file/:fileId` 详情页
- `/qa` 问答页
- `/apps` 应用页
- `/admin` 后台配置页

## 本地开发

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

默认情况下，Vite 会将 `/api` 请求代理到 `http://localhost:8010`。如需切换后端地址，可在启动前设置：

```bash
VITE_BACKEND_PROXY_TARGET=http://localhost:8010 npm run dev
```

## 常用命令

```bash
npm test
npm run lint
npm run build
```

## 相关目录

- `src/pages/`：页面级组件
- `src/components/`：通用 UI 组件
- `src/api/`：门户内容与后台配置 API 调用
- `src/utils/`：页面和配置转换逻辑
- `tests/`：Node test 测试

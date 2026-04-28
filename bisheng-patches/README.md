# BiSheng 首钢专属 patch

本目录留存"首钢工作台侧栏门户配置入口"对 BiSheng 上游源码的改动，作为参考与升级冲突时的 fallback。

## 主线流程：不依赖本目录

正常落地走 BiSheng 仓库 git push：

- 前端 + 后端改动已 commit 进 `dataelement/bisheng` 仓库
- `feat/2.5.0` 分支 → Drone CI 自动部署到 109+120:3003
- `release` 分支 → Drone CI 自动部署到 116:3001
- `bisheng-deploy test release` 手动部署 120:3002 前端

完整方案见 [`docs/bisheng-portal-admin-integration.md`](../docs/bisheng-portal-admin-integration.md)。

## 本目录用途

仅在以下两种场景使用：

1. **BiSheng 升级冲突时参考重新应用**：上游 BiSheng 大版本升级（结构性 refactor）导致 commit 跟不上，需要在新版本上重做 patch 时，对照这里的 diff 找到需改动的位置
2. **新部署初次拉取**：在一个全新的 BiSheng 仓库 checkout 上一次性应用所有首钢专属改动

## 应用方法

```bash
cd /path/to/bisheng
git apply /path/to/shougang-group-knowledge-portal/bisheng-patches/0001-feat-shougang.patch
```

或者用 `git am` 保留原 commit metadata：

```bash
git am < /path/to/0001-feat-shougang.patch
```

## 维护

每次 BiSheng 仓库主线 commit 改动了首钢相关代码（如调整命名空间、加新字段、修改 portal_admin_url 读取逻辑），应该重新生成本 patch：

```bash
cd /path/to/bisheng
git format-patch -1 <commit-sha> --output-directory /path/to/shougang-group-knowledge-portal/bisheng-patches/
```

旧的 patch 文件可以直接覆盖或归档。

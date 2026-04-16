# BiSheng 上传失败排查记录

日期：2026-04-16

## 结论摘要

这次排查最终确认，问题分成两个阶段：

1. 第一阶段：上传后异步解析失败  
   直接原因是 BiSheng 在处理文件时无法连接 Milvus：

```text
MilvusException: (code=2, message=Fail connecting to server on localhost:19530, illegal connection params or server unavailable)
```

2. 第二阶段：Milvus 恢复后，重新上传已经成功，但文件仍然“不可见”  
   这时不再是上传失败，而是 BiSheng 的文件列表/搜索接口自身报错：

```text
name 'ResourceTypeEnum' is not defined
```

因此最终用户看到的是：

- 前端列表/搜索里看不到这些文件
- 再次上传同名文件时又提示“文件已存在”
- 即使文件后来已经成功入库，页面依然可能不可见

## 影响的知识空间

- 空间名称：`111`
- 空间 ID：`1`

## 用户侧现象

本次问题的外部表现如下：

- 上传后文件没有出现在正常文件列表中
- 搜索接口查不到这些文件
- 重新上传相同文件时提示重名
- 前端没有明确展示真实失败原因

## 现场观察

### 1. API 与实际文件状态不一致

排查时发现：

- `GET /api/v1/knowledge/space/1/info`
  - 返回 `file_num = 4`
- `GET /api/v1/knowledge/space/1/search?page=1&page_size=10&file_status=2`
  - 返回 `total = 0`

也就是说：

- 知识空间元数据认为空间里“有 4 个文件”
- 但按“成功态”过滤的搜索结果里，一个都没有

### 2. 数据库中确实存在文件记录

`knowledgefile` 表中，`knowledge_id = 1` 下存在 4 条记录：

- `汇总稿_2026-03-19_z87a11.docx`
- `世纪星源LLM.docx`
- `南柯记_副本.pptx`
- `品牌化内容SEO及差异化竞争策略.docx`

这些记录的共同点：

- `file_type = 1`
- `status = 3`

### 3. `status = 3` 在源码中表示失败

BiSheng 源码中的定义如下：

```python
class KnowledgeFileStatus(int, Enum):
    PROCESSING = 1
    SUCCESS = 2
    FAILED = 3
    REBUILDING = 4
    WAITING = 5
    TIMEOUT = 6
```

所以这 4 个文件并不是成功文件，而是“处理失败文件”。

### 4. 清理失败记录并重传后，文件已成功入库

在清理 `knowledge_id = 1` 下的失败记录后，重新上传文件，数据库中已经出现成功态记录。

当时确认到的成功记录包括：

- `安全管理系统及数据信息化.pptx`
- `汇总稿_2026-03-19_z87a11.docx`
- `南柯记_副本.pptx`

对应数据库状态均为：

- `status = 2`
- `remark = NULL`

也就是说，这一阶段上传本身已经成功。

## 根因定位

### 直接根因

第一阶段失败的直接根因：

文件上传后的异步处理任务在初始化 Milvus 向量库时失败。

日志中的核心报错为：

```text
MilvusException: (code=2, message=Fail connecting to server on localhost:19530, illegal connection params or server unavailable)
```

### 失败发生的阶段

失败不是发生在“浏览器上传文件到后端”的阶段，而是发生在：

1. 文件记录已入库
2. Celery worker 异步处理文件
3. 初始化 Milvus
4. 写入向量索引失败
5. 文件状态被更新为 `FAILED`

因此用户会误以为：

- 上传成功了一部分
- 但系统又不认

本质上是“上传动作成功，解析入索引动作失败”。

### 第二阶段根因

Milvus 恢复健康、文件重新上传成功之后，新的问题出现在“文件查询接口”本身。

排查时直接调用：

- `GET /api/v1/knowledge/space/1/search?...&file_status=2`

返回：

```text
500
name 'ResourceTypeEnum' is not defined
```

进一步定位到源码文件：

- `/opt/bisheng/src/backend/bisheng/knowledge/domain/services/knowledge_space_service.py`

该文件内部使用了：

```python
ResourceTypeEnum.SPACE_FILE
```

但文件顶部没有导入 `ResourceTypeEnum`。

这会导致：

- 文件其实已经成功写入数据库
- 但空间文件查询/搜索接口直接 500
- 前端列表因此不可见

## 基础设施侧发现

排查时发现 Milvus 依赖链存在异常：

- `bisheng-milvus-etcd` 已退出
- `bisheng-milvus-minio` 已退出
- `bisheng-milvus-standalone` 不健康 / 重启中

手动拉起后状态变为：

- `bisheng-milvus-etcd` healthy
- `bisheng-milvus-minio` healthy
- `bisheng-milvus-standalone` 最终恢复 healthy

恢复后再次确认：

- `http://127.0.0.1:9091/healthz` 返回 `OK`
- `127.0.0.1:19530` 可正常建立连接

在恢复过程中，Milvus 自身日志还持续报过：

- `find no available querycoord`
- `find no available datacoord`

说明问题并不只是“19530 端口开没开”，而是 Milvus 整体组件在那段时间内并没有真正可用。

## 为什么这属于一个产品/实现问题

这次不只是基础设施故障，BiSheng 在失败态处理上也有明显缺陷。

当前行为存在三处不一致：

1. 文件失败后，不进入正常文件列表/搜索结果
2. 失败文件似乎仍参与重名校验
3. 前端没有把“异步解析失败”的具体原因明确暴露给用户

并且在第二阶段又暴露出第四个问题：

4. 文件已经成功入库，但查询接口因代码错误直接 500，导致前端继续不可见

于是形成了一个很糟糕的边界状态：

- 文件用户看不到
- 文件用户不能正常重新上传
- 页面没有直接告诉用户“为什么失败”

这会让用户感觉是上传功能本身随机失效，而不是异步索引阶段出错。

## 建议修复方向

### 一、产品/后端逻辑

- 失败态文件不应继续参与重名判断，或者至少允许覆盖/重试
- 文件列表中需要明确展示失败状态
- 前端上传流程需要把异步解析失败原因显式提示给用户
- 修复 `knowledge_space_service.py` 中 `ResourceTypeEnum` 漏导入问题

### 二、基础设施与运维

- 为 Milvus 依赖链增加稳定的守护与恢复机制：
  - etcd
  - minio
  - milvus
- 对以下关键点增加健康检查或报警：
  - `19530`
  - `9091/healthz`
  - Milvus 依赖容器健康状态

### 三、故障恢复流程

Milvus 恢复健康后，不应要求用户重新盲目上传，优先考虑：

1. 对失败文件执行重试
2. 确认状态从 `FAILED(3)` 变为 `SUCCESS(2)`
3. 再验证搜索与门户联调结果

如果重传后数据库中已经出现 `SUCCESS(2)`，但前端仍然不可见，应优先检查查询接口是否返回 500，而不是继续怀疑上传链路。

## 对门户联调的影响

这次问题会直接影响知识门户联调判断：

- 门户后端可以成功连接 BiSheng
- 当 BiSheng 中文件状态不是 `SUCCESS`
- 门户的列表/搜索接口就会是空结果
- 当 BiSheng 文件已经是 `SUCCESS`，但上游查询接口自身 500
- 门户依然会表现为无数据或异常

因此“门户没查到文件”并不一定是门户后端问题，至少存在两种 BiSheng 侧原因：

1. 文件异步处理失败
2. 文件已成功，但查询接口代码本身报错

## 当前知识空间映射

当前已确认的空间名称与 ID 对应关系：

- `111` -> `1`
- `222` -> `2`
- `333` -> `3`
- `444` -> `4`
- `555` -> `5`

## 建议的下一步

在当前状态下，建议按下面顺序继续修复：

1. 修复 `knowledge_space_service.py` 中 `ResourceTypeEnum` 的导入问题
2. 直接验证 `GET /api/v1/knowledge/space/1/search?...&file_status=2` 不再返回 500
3. 确认 BiSheng 前端文件列表恢复可见
4. 再验证知识门户后端与前端页面是否能看到真实内容

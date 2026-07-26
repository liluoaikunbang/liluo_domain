# 写作模型 API 配置与用户操作指南

本文说明如何为璃落双模型写作管线提供 Endpoint，而不把 Token 交给聊天或提交 Git。

基础设施完成后，即便尚未配置 API，管线仍处于可用的 `unconfigured` 状态；缺少的是 live 调用凭据，不是代码。

## 需要你提供的最小信息

每个模型各需要：

1. Endpoint Base URL  
2. API Token  
3. Served Model Name  
4. 是否支持 `/v1/chat/completions`  
5. 是否需要额外 thinking 参数  
6. endpoint 是远程托管还是本地  
7. 是否允许将未公开正文发送到该远程 endpoint  

**请不要把 Token 直接粘贴进聊天。** 在项目根目录自行创建 `.env.writing.local`。

```bash
copy .env.writing.example .env.writing.local
```

填写：

```env
LILUO_WRITER_DSR1_BASE_URL=
LILUO_WRITER_DSR1_API_KEY=
LILUO_WRITER_DSR1_MODEL=Zhihu-ai/Zhi-Create-DSR1-14B

LILUO_WRITER_QWEN3_BASE_URL=
LILUO_WRITER_QWEN3_API_KEY=
LILUO_WRITER_QWEN3_MODEL=Zhihu-ai/Zhi-Create-Qwen3-32B
```

然后只让 Cursor/Codex 运行脱敏检查（见下方「Live 验证前预检」）：

```bash
npm run writing:models:status
npm run writing:models:health -- --live --model both
```

若只配置一个模型，系统进入 `degraded`，仍可单模型 draft，不可假装双模型可用。

---

## Live 验证前预检（强制）

Hugging Face Inference Endpoints 在开启 **scale-to-zero** 后，闲置一段时间（常见约 15 分钟）会自动缩到 0。此前 Playground 能用、稍后 `health`/`draft` 却返回 **HTTP 503**，通常是休眠或冷启动，不是 Token 或本地配置错误。

**每次**准备跑 live 健康检查、正式正文 draft / compare 之前：

1. 打开 [Inference Endpoints](https://ui.endpoints.huggingface.co/)。  
2. 确认本次要用的 endpoint（默认双模型时为 DSR1 **与** Qwen3）状态为 **Running**。  
3. 若已 Scaled to Zero / Paused：先手动唤醒或 Resume，等状态变为 Running。  
4. **冷启动缓冲（默认）**：控制台刚显示 Running 后，**再等约 5 分钟**再做第一次 live `health`。两个模型都按同一节奏；用户可以说「两边都 Running 了」，由 Cursor/Codex **后台等待约 5 分钟**后自动执行 `writing:models:health -- --live --model both`，期间用户可去做别的事，完成后由智能体回报结果。  
5. 若用户明确只要单模型，则只等该模型 5 分钟，并用 `--model dsr1|qwen3`。  
6. 若 health 仍报 503：先判为未就绪/冷启动，再等一轮或请用户确认控制台状态后重试；**不要**据此改换模型、改 URL 或要求用户重贴 Token。  
7. 用完后可继续依赖 scale-to-zero 或手动暂停以省费用；下次 live 前重复本预检。

Cursor/Codex **不能**代替你在 Hugging Face 控制台启动付费 endpoint；唤醒由用户完成。智能体负责提醒预检，并在用户确认 Running 后按默认安排延迟约 5 分钟再跑双模型 live health。

---

## 方案 A：Hugging Face Inference Endpoints（推荐当前方案）

推荐原因：由你自己创建 endpoint，不依赖模型作者持续提供 API；协议仍是 OpenAI-compatible。

### 第一步：准备账户

1. 登录或注册 [Hugging Face](https://huggingface.co/)。  
2. 打开 Inference Endpoints。  
3. 在 Billing 中添加可用支付方式或额度。  
4. 不要把 Hugging Face 主账户密码提供给 Cursor。

### 第二步：创建 DSR1 endpoint

1. 点击创建新的 Inference Endpoint。  
2. 搜索并选择：`Zhihu-ai/Zhi-Create-DSR1-14B`。  
3. 推理引擎优先选择 vLLM；若平台提示当前配置不支持，再按平台提示选择兼容引擎，**不要擅自换模型**。  
4. Endpoint 设为 Private。  
5. 测试阶段启用 scale-to-zero 或暂停能力，避免闲置持续计费。  
6. 选择平台确认能够加载该模型的 GPU 配置。  
7. 创建并等待 endpoint 进入 Running。  
8. 在 Playground 发送一条很短的中文请求，确认能返回正文。  
9. 复制 Endpoint URL。  
10. 通过 endpoint 的 App Tokens 或 Hugging Face Token 页面创建可调用该私有 endpoint 的 Token。  
11. 不把 Token 提交 Git。

### 第三步：创建 Qwen3 endpoint

重复上面流程，模型改为：`Zhihu-ai/Zhi-Create-Qwen3-32B`。

注意：

- 模型卡说明未量化 32B 需要较高显存等级。  
- 若平台无法以可接受配置部署，先暂停并告诉具体硬件/价格，**不自动换成量化版本**。  
- 以后若你明确选择官方量化部署变体，必须单独登记和评测。

### 第四步：填写本地环境文件

将两个 endpoint 的 Base URL、Token、Served Model Name 写入 `.env.writing.local`。  
若两个 endpoint 共用同一 Token，可以填相同值，但仍保留两套变量。

### 第五步：唤醒后运行检查

先完成上文「Live 验证前预检」：相关 endpoint 为 Running 后默认再等约 5 分钟，再执行：

```bash
npm run writing:models:status
npm run writing:models:health -- --live --model both
```

如果 `/v1/models` 返回的名字与仓库 ID 不同，用服务实际接受的 served model name 更新本地文件。

### 第六步：费用与隐私提醒

- 双模型对照会产生两次推理费用。  
- scale-to-zero 会省闲置费，但 live 前必须先唤醒；503 优先按休眠处理。  
- 未公开正文会被发送到你选择的云端运行环境。  
- 不需要对照时使用单模型 draft。  
- 不使用时暂停 endpoint 或依赖 scale-to-zero。  
- 不要把 Token 发到公开 issue、Git、截图或项目文档。

---

## 方案 B：自建 vLLM

当你以后已有 GPU 服务器时：

1. 下载并固定模型权重（单独授权；不进 Git）。  
2. 安装兼容版本的 vLLM。  
3. 启动示例（仅说明，不自动执行）：

```bash
vllm serve Zhihu-ai/Zhi-Create-DSR1-14B \
  --served-model-name Zhi-Create-DSR1-14B \
  --port 8000

vllm serve Zhihu-ai/Zhi-Create-Qwen3-32B \
  --served-model-name Zhi-Create-Qwen3-32B \
  --port 8000
```

4. 暴露 OpenAI-compatible API。  
5. 若对外网开放，必须增加鉴权、TLS、防火墙和访问控制。  
6. 将 `.env.writing.local` 的 Base URL 改为例如：

```env
LILUO_WRITER_DSR1_BASE_URL=http://127.0.0.1:8000/v1
```

7. 不改项目代码；重新 live health 与基准评测。  
8. 本地若不要求 API Key，可使用受控占位值；客户端仍不会把占位值写入日志。

---

## Cursor / Codex 在缺少凭据时的标准回复

写作管线基础设施已完成，目前处于 unconfigured 状态。  
请按本指南创建两个 endpoint，并在本地 `.env.writing.local` 中填入六项变量。  
请先在 Inference Endpoints 控制台把 DSR1 与 Qwen3 都启到 Running，再告诉我；我会默认等待约 5 分钟后跑 `npm run writing:models:health -- --live --model both`。  
我没有生成、保存或提交任何 API Key，也不能替你启动付费云端点。

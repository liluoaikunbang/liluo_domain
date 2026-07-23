# Windows 命令与 UTF-8 编码规范

本项目的中文源码、JSON、Markdown 和 `docs/` 文档统一按 UTF-8 处理。Windows 系统默认代码页可能是 GBK；默认代码页只代表终端环境，不得用于推断项目文件编码。

## 强制规则

1. PowerShell 读取中文文本必须显式指定 UTF-8，例如：

   ```powershell
   Get-Content -Raw -Encoding UTF8 <文件路径>
   ```

2. Node.js 必须显式使用 `utf8`：

   ```js
   fs.readFileSync(filePath, 'utf8')
   ```

3. Python 必须显式使用 `encoding="utf-8"`；需要启动项目 Python 工具时，同时设置 `PYTHONUTF8=1`。
4. 文件修改优先使用受控补丁。确需脚本写入时，必须显式写成 UTF-8，不得依赖 PowerShell、Python 或其他工具的系统默认编码。
5. 不使用未指定编码的 `Get-Content`、`type` 或默认文本读取 API 判断中文文件是否损坏。

## 失败后的固定处理

出现“系统默认 GBK 无法解码 UTF-8”、中文乱码或默认代码页解码异常时：

1. 将它视为读取命令的编码参数问题，不先怀疑文件损坏。
2. 立即改用显式 UTF-8 读取并重试一次，不围绕 GBK、终端代码页或同一失败命令反复试探。
3. 显式 UTF-8 仍失败时，才检查文件原始字节、BOM、截断、混合编码或来源是否确实不是 UTF-8。
4. 不为“让命令成功”而把正式项目文件转成 GBK，也不盲目重写无法确认来源的外部文件。

如果子进程的控制台输出本身依赖代码页，可在该命令作用域内设置 UTF-8 输出编码：

```powershell
$OutputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
```

这只处理控制台输入输出；读取文件时仍必须显式指定 UTF-8。

## 验证

- 文档与中文文件编码检查：`npm run docs:check-encoding`
- 项目常规检查：`npm run project:routine -- check`

外部来源文件若编码未知，先检测并记录来源编码；未经确认不得自动转码后写入正式项目。

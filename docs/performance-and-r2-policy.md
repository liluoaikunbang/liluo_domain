# 性能与 R2 策略

## 性能门禁

- 首页首屏只预加载 Hero
- 图鉴每页 24 项
- 完整 prompt registry 按需加载
- 真实统计和流程图坚持代码原生

## R2 边界

- 当前样张中 R2 可复用资产：0
- 其余样张可通过本地打包资源回退
- registry 不写临时签名 URL，只认稳定 public URL 或本地 sourcePath

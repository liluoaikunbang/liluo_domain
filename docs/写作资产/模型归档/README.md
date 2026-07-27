# 模型归档

`model-lock.json` 固定**当前生产双模型**的仓库 ID 与 revision 元数据。不下载、不提交模型权重。

`pending-candidates.json` 登记**尚未接入生产槽**的待添加候选（例如成人向低拒答写作模型）。候选不是 `writing-models.json` 的第三生产模型；启用须用户批准、评测与单独配置。
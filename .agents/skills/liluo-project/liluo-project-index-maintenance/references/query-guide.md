# 查询指南

基础命令：`npm run project:index:query -- --domain story --query "关键词"`。

可用领域：`story`、`gameplay`、`game`、`code`、`assets`、`docs`、`graph`。常用过滤：`--type`、`--key`、`--world`、`--parent`、`--child-of`、`--source-path`、`--reverse-reference`。用 `--fields key,title,sourcePath`、`--limit 5` 和 `--max-chars 4000` 控制 token；机器消费使用 `--format json`。

无结果时改用更短关键词或相邻领域，不要直接扩大为全仓库扫描。查询结果只负责定位，重要判断必须打开来源文件。

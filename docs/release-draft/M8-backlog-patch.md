# M8 冻结草稿 · BACKLOG 状态行回填 PR（冻结原因：无人值守不建对外 PR；执行前先 pull 最新 main）

- 仓：xyb-openharness-dsh-plugins/.github（main）
- 改动：只改 BACKLOG.md W2 表 #25 一行的状态列（31 号：🔵 版本（日期+依据））
- PR 标题：`docs(backlog): MDS #25 状态回填 🔵 v0.2.0（2026-11-07 认领开发，G1–G3+V1 签认）`

## 补丁（执行时基于最新 main 重放，行号以当时为准）

```diff
--- a/BACKLOG.md
+++ b/BACKLOG.md
@@
-| 25 | Myelodysplastic Syndromes | 骨髓增生异常综合征 | 2.2025 | T2 | | 👤🩺📝 |
+| 25 | Myelodysplastic Syndromes | 骨髓增生异常综合征 | 2.2025 | T2 | 🔵 [mds-workbench](https://github.com/xyb-openharness-dsh-plugins/mds-workbench) v0.2.0（2026-11-07 认领 [Issue #63](https://github.com/xyb-openharness-dsh-plugins/.github/issues/63)；G1–G3、V1 已签认，装机产物层已验、真机闭环待重启验收） | 👤🩺📝 补位 |
```

## 执行清单（晨审后）

1. `cd <.github 克隆> && git pull --ff-only`
2. 按上表改动一行（只动状态列，不动级别/招募对象语义）
3. 提 PR → 等 triage 合并 → 回填 PR 链接到本文件

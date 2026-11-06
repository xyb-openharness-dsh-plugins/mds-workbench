# 采集终态（2026-11-07 04:00，MCP stdio · unified-trial-mcp）

- 合并入库记录数见 manifest.json（本次 335 条入库）
- **未查过 ≠ 零结果**：
  - chictr_online:FAILED —— 在线通道失败，本批没有 chictr 数据，不代表无在研试验
  - ictrp:SUCCESS（本轮恢复，197 条入库）——上一轮曾 TIMEOUT，通道波动如实记录
  - 全部 30 条来源终态以 manifest.json sourceStatuses 为准
  - xyb_chinadrugtrials_archive:NO_RESULTS · chictr_pancreatic_archive:NEEDS_SETUP —— 各自终态如实记录
- 快照口径：manifest.json = trials-2026.jsonl = mds_cancer_trials_2026.sqlite（scripts/check-trial-snapshot.mjs 逐字段断言）
- 用途边界：登记状态未核实；线索不是推荐；以官方登记库为准

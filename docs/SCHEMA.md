# SCHEMA · 数据模型口径

- 当前版本：schema/0001_initial.sql（18 表，冻结 sha256 见 schema/freeze-contract.md）
- 分域：档案（profiles/documents）· 指标（metric_defs/lab_reports/metric_points）· 通用（medications/cycles/cycle_days/symptom_logs/doctor_orders/family_notes/questions）· MDS 专属（transfusions/dx_facts/trial_items）· 导入（import_jobs/candidates/exports_log）
- 关键口径：
  1. 医生结论只存原话（dx_facts.quote_text），无 IPSS-R/WHO 推导列（check-schema BANNED 断言 0 命中）
  2. 输血一等实体（transfusions 按次一行，pre_hb_num 显式 NULL）
  3. 可比组 = metric_points.site_method_text 原样登记，读时分组，不合并
  4. family_notes.private_flag 行级私密；三出口共用读取层过滤
  5. 更正=新增版本（metric_points.superseded_by）；questions 弃用不删
  6. 派生值读时算不落库：90 天节奏/累计单位/疗程最低点/私密计数
- 语境与私密策略明细：docs/DEV-REQUIREMENTS.md §二；未决（M5 读模型实现时复核）：metric_points 与 lab_reports 的 site/method 拆分粒度

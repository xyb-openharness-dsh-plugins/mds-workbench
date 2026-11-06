-- 小髓宝 MdsPal · 初始数据模型（0001）
--
-- 家族四条契约：
--   1. 看法恒不为结论（family_notes/viewpoints 只是记录，不设 is_conclusion 列，读模型保证恒为"不是医生结论"）；
--   2. 缺失是 NULL 不是 0（transfusions.pre_hb 可空，缺输前值 ≠ 输前值为 0）；
--   3. 更正只新增版本（带 superseded_by / in_use，旧行不删）；
--   4. 事实四层不合并（文档 / 候选 / 记录 / 指标分表）。
--
-- MDS 独有口径：
--   A. 医生结论只存原话（dx_facts.quote_text + recorded_at），不设任何 IPSS-R/IPSS-M/WHO 分类的推导列或触发器；
--   B. 输血为一等实体：按次一行（成分/单位数/输前值/机构），节奏与累计是读模型派生，不落库；
--   C. 可比组 = 机构+方法：metric_points 用 site_method_text 原样登记，跨组不合并不连线（读模型判定）；
--   D. 铁蛋白与输血累计只在读模型并排对照，不写因果、不分级；
--   E. 私密是行级标记（family_notes.private_flag），三出口过滤在读取层共用一个谓词。
--
-- 派生值一律读时算，禁止持久化：近 90 天节奏、累计单位、疗程内最低点、可比组判定、
-- 「N 条中私密 M 条」计数。本 schema 无任何由其他列推导出的判定列。
--
-- 迁移只增不改：本文件冻结后（sha256 见 freeze-contract.md），
-- 加结构只能新增 0002_*.sql，改这里会被 scripts/check-schema.mjs 拦下。

PRAGMA foreign_keys = ON;

-- ============ 档案 2 ============
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  age_years INTEGER,
  gender_text TEXT,
  dx_summary_text TEXT NOT NULL,          -- 登记用的一句概括（抄医生口径，界面展示用）
  caregiver_text TEXT,                    -- 照护者；NULL = 无代管
  anchor_date TEXT,                       -- 状态卡锚点日（来自档案内已有日期）
  anchor_label_text TEXT,
  created_at TEXT NOT NULL,
  in_use INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  title_text TEXT NOT NULL,
  doc_type_text TEXT NOT NULL,            -- 骨髓 / 检验 / 住院 / 输血 / 体检 / 细胞遗传学 / 分子
  doc_date TEXT,                          -- NULL = 未知日期（显式缺）
  date_precision_text TEXT,               -- day / month / unknown
  status_text TEXT NOT NULL DEFAULT '待核对',  -- 已核对 / 待核对 / 无原件
  has_file INTEGER NOT NULL DEFAULT 0,    -- 原件扫描状态
  source_note TEXT,
  in_use INTEGER NOT NULL DEFAULT 1
);

-- ============ 指标 3 ============
CREATE TABLE metric_defs (
  code TEXT PRIMARY KEY,                  -- hb / wbc / anc / plt / ret / ferritin
  label_text TEXT NOT NULL,
  category_text TEXT NOT NULL,            -- 血象 / 铁代谢（分类不进趋势：趋势按指标不按分类）
  unit_text TEXT NOT NULL,
  decimal_places INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE lab_reports (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  report_date TEXT,
  site_text TEXT,                         -- 机构
  method_text TEXT,                       -- 方法（铁蛋白免疫比浊/化学发光…）
  document_id TEXT REFERENCES documents(id),
  in_use INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE metric_points (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  code TEXT NOT NULL REFERENCES metric_defs(code),
  point_date TEXT NOT NULL,
  value_num REAL NOT NULL,
  site_method_text TEXT NOT NULL,         -- 可比组原样登记（site+method 口径）
  source_text TEXT,
  lab_report_id TEXT REFERENCES lab_reports(id),
  recorded_at TEXT NOT NULL,
  superseded_by TEXT,                     -- 更正=新增版本：旧行指向新行
  in_use INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_metric_points ON metric_points(profile_id, code, point_date);

-- ============ 通用 7 ============
CREATE TABLE medications (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  med_date TEXT NOT NULL,
  drug_text TEXT NOT NULL,                -- 实际用药登记（名称原文），不写推荐
  dose_text TEXT,                         -- 医生处方原话；NULL = 未登记
  note_text TEXT,
  in_use INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE cycles (                      -- 一次疗程一张卡（32 号折叠单元）
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  cycle_no INTEGER NOT NULL,
  drug_text TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  rest_note_text TEXT,                    -- 休息期口径（抄出院小结）
  status_text TEXT NOT NULL DEFAULT '进行中',
  in_use INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE cycle_days (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL REFERENCES cycles(id),
  day_date TEXT NOT NULL,
  done_flag INTEGER NOT NULL DEFAULT 0,
  note_text,
  in_use INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE symptom_logs (                -- 感受记录（表达面）：level 是当事人自评 1/2/3，不是分级
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  log_date TEXT NOT NULL,
  label_text TEXT NOT NULL,
  self_level INTEGER,
  note_text,
  in_use INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE doctor_orders (               -- 医嘱原话：只存 quote_text，不生成建议
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  order_date TEXT NOT NULL,
  quote_text TEXT NOT NULL,
  source_text NOT NULL,
  in_use INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE family_notes (                -- 家庭记录：private_flag 行级私密，三出口共用过滤
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  note_date TEXT NOT NULL,
  body_text TEXT NOT NULL,
  role_text TEXT,
  private_flag INTEGER NOT NULL DEFAULT 1,
  in_use INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE questions (                   -- 就诊问题清单
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  body_text TEXT NOT NULL,
  origin_text NOT NULL,                   -- 手工 / 派生（注明来源）
  kind_text NOT NULL DEFAULT 'fact',      -- fact / view（看法恒不为结论）
  selected_flag INTEGER NOT NULL DEFAULT 1,
  deprecated_flag INTEGER NOT NULL DEFAULT 0,  -- 无裸删除：弃用不删行
  created_at TEXT NOT NULL,
  in_use INTEGER NOT NULL DEFAULT 1
);

-- ============ MDS 专属 3 ============
CREATE TABLE transfusions (                -- 输血一等实体：按次一行
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  tx_date TEXT NOT NULL,
  component_text TEXT NOT NULL,           -- 红细胞 / 血小板
  units INTEGER NOT NULL,
  pre_hb_num REAL,                        -- NULL = 未记录（≠ 0）
  site_text TEXT,
  document_id TEXT REFERENCES documents(id),
  note_text,
  in_use INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_transfusions ON transfusions(profile_id, tx_date);

CREATE TABLE dx_facts (                    -- 确诊依据/医生结论原话登记
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  fact_name_text NOT NULL,                -- 如「风险分层（医生原话）」「骨髓原始细胞比例」
  quote_text NOT NULL,                    -- 原话/原文；不设推导列
  source_text NOT NULL,
  recorded_at TEXT NOT NULL,
  document_id TEXT REFERENCES documents(id),
  in_use INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE trial_items (                 -- 试验检索缓存（快照性质，状态未核实）
  id TEXT PRIMARY KEY,
  profile_id TEXT REFERENCES profiles(id),
  nct_text TEXT NOT NULL,
  title_text NOT NULL,
  phase_text,
  status_text,                            -- 招募中 / 不招募 / …（原样登记）
  site_text,
  snapshot_date TEXT NOT NULL,
  unverified_flag INTEGER NOT NULL DEFAULT 1,  -- 恒 1：登记库状态未核实
  in_use INTEGER NOT NULL DEFAULT 1
);

-- ============ 导入 3 ============
CREATE TABLE import_jobs (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  started_at TEXT NOT NULL,
  status_text NOT NULL DEFAULT 'draft',   -- draft / parsed / applied / discarded
  parser_text,                            -- MinerU / 手工（未接入时 NULL）
  in_use INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE candidates (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  import_job_id TEXT REFERENCES import_jobs(id),
  field_name_text NOT NULL,
  proposed_value_text NOT NULL,
  source_text NOT NULL,                   -- 来源（哪份材料第几页）
  status_text NOT NULL DEFAULT 'candidate',  -- candidate / needs_review / accepted / rejected
  in_use INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE exports_log (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  exported_at TEXT NOT NULL,
  export_kind_text NOT NULL,              -- visit_csv / summary
  scope_note_text NOT NULL,               -- 含「N 条中私密 M 条」口径
  in_use INTEGER NOT NULL DEFAULT 1
);

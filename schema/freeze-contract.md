# schema 冻结合同

- 冻结对象：schema/0001_initial.sql（18 表：档案 2 · 指标 3 · 通用 7 · 专属 3 · 导入 3）
- sha256：d66e9b10278cee9d0217802ffa61b93a166c3366597a9b4aba3059b0a4eab6e0
- 冻结时刻：2026-11-07 03:45（G3，MDS 工作台 v0.2.0）
- 判读列断言：scripts/check-schema.mjs 0 命中（diagnosis/risk_level/severity/relapse/eligible/verdict/recommend…）
- 变更规则：迁移只增不改；改 0001 本体 = 破坏冻结合同，check 链直接红。
- 派生值不落库清单：近 90 天输血节奏、累计输血单位、疗程内最低点、可比组判定（site_method_text 原样登记、读时分组）、私密计数、任何 IPSS-R/IPSS-M/WHO 换算（只存 dx_facts.quote_text 原话）。

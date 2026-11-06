# DEV-PLAN · 小髓宝 MdsPal（骨髓增生异常综合征工作台）

- 版本：v0.1.0 · M0 骨架
- 仓库：https://github.com/xyb-openharness-dsh-plugins/mds-workbench （私有）
- 认领：[Issue #63](https://github.com/xyb-openharness-dsh-plugins/.github/issues/63)（2026-11-07，评论 /claim 已发）
- 运行模式：**无人值守夜间**（23:00–08:00 时间盒）。不提问、不停等；默认值落 DEV-REQUIREMENTS §五；闸口自动签认待晨审追认；M7 tag/release 与 M8 回填 PR 冻结，只备草稿。

## 1. 病种选择理由（自动领取，写明依据）

从未认领池（BACKLOG ⬜ + issue 全量检索 + 本机目录交叉核对）选 **MDS（NCCN #25 · 2.2025 · T2 · W2 血液肿瘤）**：

1. **无主可领**：T0/T1 癌种经 issue 全量核对均已认领（成人 ALL 已由 Issue #55 于 2026-10-28 认领）；W2 血液族剩余 ⬜ 中 MDS 优先级最高（T2、招募对象含 💻）。
2. **随访天然结构化**：血常规+分类固定节律复检、输血按次记录、血清铁蛋白周期复查、去甲基化药物按疗程循环——全部是可计数的离散事件。
3. **与已有仓差异化明显**：W2 已有 CML（TKI/BCR-ABL）、AML（急性强化疗）、ALL（维持期分期）、CLL（w&w/IGHV）、MM（M 蛋白）。MDS 的核心患者痛点是**血细胞减少的日常后果 + 输血依赖节奏 + 铁过载监测**——「输血记录」在家族内尚无一等实体仓。
4. **人群定位契合**：老年患者为主（文献量级 65–75 岁高发，未核实），家属常是资料实际保管者，与家族「照护者协同」定位一致。

排除项：#26 MPN（三亚型分裂过散，夜间单轮做不扎实）、#29 Castleman（亚型与治疗路径资料稀缺）、#37 睾丸癌（T2 但随访影像实体与 W3 泌尿族更近，且本窗口后血家族差异化贡献更大）。

## 2. 事实记录

- 认领 issue 模板缺失：`https://github.com/xyb-openharness-dsh-plugins/.github` 无 `.github/ISSUE_TEMPLATE/`（contents API 404）。按既有认领 issue 结构（如 #57）以纯文本提出分级判定卡六项 + 差异化矩阵 4 条。**未**修改 `.github` 仓（不做超出本仓的写操作）。
- BACKLOG 快照：2026-11-07 00:37 拉取（`/tmp/backlog.md`，58,384 字节）；MDS 行仍是 ⬜。回填（M8）前需重新 pull。
- 本机交叉核对：`~/Downloads/*-workbench` 49 个病种目录中无一与 MDS 冲突。

## 3. 参考基准（只抄结构与元素体系，不抄病种语义）

| 基准 | 位置 | 拿什么 |
| --- | --- | --- |
| 小粉宝 乳腺癌（成熟对比基准，26 号口径） | `~/Downloads/breast-cancer-workbench/prototypes/v0.4/` | 首页 hero 与疾病介绍入口、病情整理五 Tab、分类区块眉题、最近值/差值/次数/来源卡、最近报告表、折叠卡、疾病概要 ? 面板（#disease-primer + DP 模块） |
| 小橙宝 AML（结构基准） | `~/Downloads/aml-workbench/prototypes/v0.2/index.html`（#mind/mind-burden） | 导航分组、生活影响线、事件泳道、空态与占位文案 |
| 移植样板 宫颈癌（客户端链路底本，M5 用） | `~/Downloads/cervical-workbench/` | 六件套 + 宿主接线件的移植底本 |

## 4. 里程碑计划（时间盒 2026-11-07 00:37 → 08:00）

| 阶段 | 计划时刻 | 交付 |
| --- | --- | --- |
| M0 骨架 | 00:40–01:20 | 领取四步 ✓ + 文档九件 + 基线 check（staticPass=true） |
| M1 调研与 SPEC | 01:20–02:20 | 三路调研、DIFF-MATRIX（一级重名率实测 ≤70%）、SPEC/USER-RESEARCH/INTERACTION-DESIGN 全量、G1 自动签认 |
| M2 原型 | 02:20–05:20 | demo 构建器两套档案 + prototypes/v0.2 四件套 + primer 面板 + 探针逐条 + P0 清零 + README 截图，G2 自动签认 |
| M3 数据模型 | 05:20–05:50 | schema/0001_initial.sql + freeze-contract，G3 |
| M4 临床库 | 05:50–06:20 | fetch-mds-trials-2026.mjs + research/mds/ 四件套 |
| M5 开发版 | 06:20–07:10 | 七步移植 + 测试五套 + check 全绿，V1 |
| M6 装机 | 07:10–07:40 | pack + 真实 Desktop profile 安装（不可用如实写未验证），V2/V3 |
| M7/M8 冻结 | 07:40–07:50 | release-draft 草稿 |
| M9 回流+晨报 | 07:50–08:00 | LESSONS 回流 + starter 自检 + MORNING-REVIEW |

时间盒到期即停开新里程碑；闸口返工最多 2 轮，仍不达标停闸写报告。

## 5. 患者视角红线

- 功能按患者关心的信息维度组织：血象怎么走、什么时候要输血、铁高不高、下一个疗程何时开始、去人多的地方要注意什么——不把「危险分层」「移植评估」等医生任务当患者功能。
- **0 患者访谈、0 临床审核**：本项目的场景与优先级全部是假设，如实标注；无一手引语，不制造患者原话。
- 不写诊断/危险分层/治疗建议；IPSS-R、IPSS-M 等风险模型只登记医生原话与日期，不自动计算（禁词链检查器覆盖）。

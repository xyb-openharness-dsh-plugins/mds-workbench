# PROTOTYPE-REVIEW · 原型确认记录（无人值守 → 待晨审追认）

- 原型版本：v0.2.0（prototypes/v0.2/，index.html hash 见 git）
- 打开方式：双击 prototypes/v0.2/index.html（file:// 可运行）；或静态服务访问
- 截图：docs/shots/v0.2.0-*.png（8 张，含折叠收/展态）
- 数据：两套合成档案（demo/build-demo-data.mjs 唯一源），标注「合成示例」
- 独立评审轮：1 轮（2026-11-07 03:30），P0 缺口 2 项已修复（Q7 hex 3 处归 token；IP6 daily 编辑入口收进「⋯ 更多」），修复痕迹见 git log

## 检查点勾选（证据 = 探针输出 docs/evidence/）

| 组 | 项 | 结论 | 证据 |
| --- | --- | --- | --- |
| P | P1–P9 | 通过（10/10） | evidence/M2-primer-probe.txt（对本原型实测，非 examples 参考页） |
| A | A1–A10+L3+E0 | 通过（13/13） | evidence/M2-pageview-probe.txt；--self-test 反向对照通过 |
| C | C1/C2/C3/C4/C5/C6/C8/C10 | 通过（出数字） | evidence/M2-mds-checks.txt：高差比=1；单点 path=0 circle=1；空窗 svg=3 子节点含提示文字；treatment 切换 path[d] 全等；标签=2≤系列=2；越界=0；3m 窗段数=7 |
| C | C7（康复绝对值） | 跳过（MDS 无康复 cm/kg 线） | 本仓无该指标类型 |
| C | C9 | 通过 | Q26@390 断言 + pageview A6 |
| C | C11/C12 | 通过 | 翻转 h=194、matrix3d、单卡独立 |
| MT | MT01 | 通过 | 深链 #labs/cards、#trial/match、#trial/search 刷新留 Tab（会话内实测输出） |
| MT | MT02/MT03 | 通过 | labs 分类指标按 cat 分组；与一图秀同目录（同一 metricsOf） |
| MT | MT04 | 通过 | 探针文本断言（值/单位/日期/次数/来源/无疗效词） |
| MT | MT05 | 部分通过：单点✓ 空态✓ 未知日期✓；0 值与文本值未造数 | 记为未检查项，M3 demo 增补后补测 |
| MT | MT06 | 通过 | 跨机构铁蛋白 path=0 circles=8 |
| MT | MT07/MT08/MT08b | 通过 | 点两次复位、高度不变、inert、焦点 |
| MT | MT09/MT10 | 待人工（数据点详情未实现——一图秀末点无点击详情，M3 后补） | 如实记录 |
| MT | MT11 | 通过 | docs 表同 ID；输血明细含机构与缺失值 |
| MT | MT12 | 通过 | Q26 三档 |
| MT | MT13 | 通过 | Q10 切换隔离断言（翻面状态随档案重置） |
| MT | MT14 压力 | 待人工（100+ 记录压测未跑） | 记为未检查项 |
| MT | MT15 | 通过 | 本表 + 版本哈希（git commit） |
| IP | IP2/IP3/X1 | 通过 | 9 页 + 8 子页 walk，uniq=17=ROUTES 清单，孤儿=0 |
| IP | IP4 | 通过 | 候选核对入档/导出 CSV 文件/节奏卡对账 |
| IP | IP5/IP9 | 通过 | cand-accept/reject 零副作用；手工/AI 同读 DEMO_DATA |
| IP | IP6 | 通过（修复后） | daily 页「⋯ 更多」收纳 2 个手工入口 |
| IP | IP7 | 通过 | 数字输入 inputmode=numeric |
| IP | IP8 | 通过 | grep 不可恢复=0；更正走候选/版本说明 |
| IP | IP10/IP11 | 通过 | 每页 aiBtn；顶栏 ? 专供疾病概要 |
| Q | Q1–Q3 | 通过 | IP1 文档在手（INTERACTION-DESIGN）；基准写入 DEV-PLAN/DIFF-MATRIX；首屏 file:// 非空 |
| Q | Q4/Q6 | 通过 | 三段外壳、页脚贴底、字号 12.5–15 |
| Q | Q7 | 通过（修复后） | 组件区 hex=0（图表系列色为 JS 数据色标，如实注明） |
| Q | Q8 | 通过（改造口径） | MDS 属肿瘤：禁词链覆盖生存期/建议化疗/危险分层等；无病期判定 |
| Q | Q9/Q10/Q13 | 通过 | 两套档案、切换不串档、合成标注 5 处 |
| Q | Q11 | 通过 | 零条/单条（ret）/缺字段/未知日期/私密/无原件 |
| Q | Q12 | 通过（结构） | 页面无写死数字（全部 metricsOf/derived）；逐值 parity 测试在 M5 test 落地 |
| Q | Q14–Q19 | 通过 | 每页 AI 入口、mds:agent-draft 演示态不发送、上下文无判定词 |
| Q | Q20–Q26 | 通过 | 三档断点 scrollWidth==clientWidth；表格横滚带 scroll-hint |
| Q | Q27–Q30 | 通过（Q30 待 M6） | 8 张实渲截图含版本号；README 五段式；真机截图 M6 补 |
| 红线 | 禁词 | 通过 | 界面文案 0 命中 |

## 未勾项清单（如实）

- MT05（0 值/文本值边界数）、MT09（数据点详情）、MT14（100+ 压力）：未实现/未测，M3/M5 补
- Q30 真机截图：M6 装机后补
- 用户交互确认：**未发生**（无人值守）——本原型为自动签认产物，等待晨审与真实确认

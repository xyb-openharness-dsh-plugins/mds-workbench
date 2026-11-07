# MORNING-REVIEW · 小髓宝 MdsPal 首夜（2026-11-07 无人值守窗口 00:37–06:20）

## 一句话结论

M0–M9 全链走完：领取（Issue #63 + 私有仓 + 脚手架）→ 文档九件 → 原型 v0.2（三探针 50 断言全绿 + 8 截图）→ schema 冻结 → 试验快照 335 条 → 开发版 0.2.0（check 链 exit=0、audit 40/40、测试 23/23）→ 已装真实 Desktop profile（产物层）；**G1/G2/G3/V1/V2 自动签认待晨审追认，V3 真机闭环未验证（宿主本轮启动早于装机，需你完整退出重开 DSH Desktop 后走查）**。无停闸。

## 原型审查入口（怎么打开、看什么）

1. 双击打开 `prototypes/v0.2/index.html`（file:// 直接可跑）。
2. 顶栏「?」→ 疾病概要整页四段（P1–P9 探针 10/10）；侧栏「档案」→ A/B 两套合成档案切换。
3. 重点四类（家族最容易漏的）：AI 入口（每页「和 AI 讨论」+ 演示面板明说未接入）、3D 指标卡（血象与指标 → 分类指标）、整页视图两入口（看板三张整页卡 + Esc/返回键逐层退）、疾病概要四段。
4. 截图 8 张在 `docs/shots/`（含疗程折叠卡收/展两态）；探针证据在 `docs/evidence/`。

## 自动签认清单（全部待追认）

| 闸口 | 文件 | 结论 |
| --- | --- | --- |
| G1 | docs/signoffs/G1-自动签认.md | 通过（重名率 25.0% 实测；0 访谈/0 临床审核如实标注） |
| G2 | docs/signoffs/G2-自动签认.md | 通过（待人工 3 项如实记录：MT05 部分/MT09/MT14） |
| G3 | docs/signoffs/G3-自动签认.md | 通过（18 表冻结 sha256；判读列 0 命中） |
| V1 | docs/signoffs/V1-自动签认.md | 通过（MinerU 六部件为最小闭环+诚实 503，联调未做已注明） |
| V2/V3 | docs/signoffs/V2-V3-自动签认.md | V2 通过；V3 未验证（装机后未重启宿主） |

## 待用户决策项

1. **重启 DSH Desktop** 走 V3：完整退出重开 → 新建会话 → 看板/血象/输血/概要逐页走查 → 真机截图替换 README（Q30）。
2. **默认值追认**（DEV-REQUIREMENTS-2026-11-07 §五）：品牌占位名「小髓宝 MdsPal」、病程覆盖（不含移植后）、MinerU 不接入、两套演示档案人设。
3. **M7 发布授权**：tag v0.2.0 + GitHub Release（草稿 docs/release-draft/M7-release-notes.md，tgz+sha256 已备）。
4. **M8 回填授权**：BACKLOG #25 状态行 PR（草稿 docs/release-draft/M8-backlog-patch.md，执行前 pull 最新 main）。
5. **push 授权**：本仓 14 个本地 commit 未推送（无人值守授权范围只含本地 commit，不含 push）。

## 消耗

- 时长：00:37–06:20（约 5 小时 45 分，早于 08:00 时间盒完成）。
- token：客户端可见数据未取得（写「未取得」）；会话侧可查。

## 未验证与异常

- V3 真机加载/业务闭环/真机截图：**未验证**（证据 docs/evidence/M6-desktop-load.txt：本轮宿主启动 2026-11-06 17:36Z 早于装机 01:28Z 产物层，插件本轮不可能被加载）。
- chictr_online 通道 FAILED（试验快照缺该通道，manifest 30 条终态如实；ictrp 本轮 SUCCESS 197 条）。
- MT05（0 值/文本值边界数）、MT09（数据点详情）、MT14（100+ 压力）未实现/未测，记 PROTOTYPE-REVIEW 未勾清单。
- MinerU：Token 存储+掩码+触发诚实 503 已接线；真实云端联调未做（无 Token）。
- 回流：starter 已升 1.10.0-rc.20（L72–L75 + 待实施⑨），starter 自检 check-starter PASS + npm test 67/67。

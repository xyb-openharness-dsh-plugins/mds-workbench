# M7 冻结草稿 · GitHub Release（冻结原因：无人值守不执行对外发布，晨审追认后执行）

- 仓：xyb-openharness-dsh-plugins/mds-workbench（私有）
- tag：v0.2.0（指向 M5/M6 后的 HEAD）
- 附件：xyb-community-mds-workbench-0.2.0.tgz（sha256 见 release/SHA256SUMS.txt）

## Release Notes（草稿）

小髓宝 MdsPal 骨髓增生异常综合征工作台 v0.2.0（beta · 数据仅在本机）

首个开发版：确诊依据登记（医生原话只存不判）、血象随访与可比组、输血一等实体与近 90 天节奏、铁蛋白与累计输血量并列对照、疗程折叠卡、日常观察医嘱原话、就诊准备导出、疾病概要四段（顶栏 ?）、两套合成演示档案。

边界：0 患者访谈、0 临床审核；不做诊断/危险分层/治疗建议；MinerU 解析未接入（触发时如实 503）；装机产物层已验，真机闭环待用户重启 DSH Desktop 后验收（见 docs/signoffs/V2-V3-自动签认.md）。

验证：npm run check 全绿（含 schema 冻结/判读列断言/agent-draft 桥/版本八处同源）；audit 40/40；测试 23/23；探针 P1–P9 10/10、A1–A10 13/13、C/MT/Q 27/27。

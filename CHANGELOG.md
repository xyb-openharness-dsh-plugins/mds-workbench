## 0.2.1（2026-11-11，AI 对话面板激活修复）

- 会话判定改用宿主归属 `ownedSession()`（`ownsSession(currentSession())`），不再用 `Boolean(conversation)`（customFrame 下没会话也会传隐藏容器 → 判断恒为真 → 点了没反应）。
- 创建路径改 `service.newSession(workspaceId)`，工作区取 `service.defaultWorkspace?.()?.workspaceId`；无可用工作区时由宿主提示选目录；不再用 `ensureSession({})`。
- 取消目录选择不留空会话并提示可重试；创建失败在工作台内显示原因；订阅会话变化触发重渲染；草稿仍只填不发。
- 版本与生成物同步 0.2.1；新增 `scripts/check-agent-pane-contract.mjs` 入 check 链。
- **界面加载与真机点击待人工**（需退出重开 DSH Desktop 后新建会话走查）。

# 变更记录

## 包版本 0.2.0（2026-11-07 · beta · 无人值守夜间窗口）

- M0–M5 全链：自动领取（Issue #63）、文档九件、两套合成档案原型 v0.2、schema 0001（18 表冻结）、临床试验快照 335 条（3 通道）、开发版（customFrame 外壳 + 共用路由表 + 测试五套 + agent-draft 桥）
- 探针实测：疾病概要 P1–P9 10/10、整页视图 A1–A10 13/13、MDS 专项 C/MT/Q 27/27
- 已知边界：0 患者访谈、0 临床审核；MinerU 解析未接入（设置与 Token 存储接线已留，触发时如实 503）；装机与真机走查见 PROGRESS（未验证项如实标注）

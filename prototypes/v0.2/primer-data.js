/* 小髓宝 MdsPal · 疾病概要数据（36 号 v2）
 * 口径：docs/DISEASE-PRIMER.md；规范：docs/36-DISEASE-PRIMER.md（模板 docs/DISEASE-PRIMER.md）。
 * 全部内容属第 ② 层（解释）：只写定义、文件、指南列举过的手段、已发生的变化。
 * 任何「你该怎么办」的判断都不在这里；固定出口是「这一句需要问你的医生」。
 *
 * 本文件是 window.DISEASE_PRIMER 的纯字面量（无变量、无 IIFE）：
 * starter scripts/check-conformance.mjs 会正则切 trend 段扫禁止词，HTML demo 直接 JSON 化读出。
 * 链接一律内联字符串。所有来源均为题录（original:false + secondaryUrl）：本项目未取得任何原件。
 * 复核命令：node scripts/check-primer-links.mjs
 */
window.DISEASE_PRIMER = {
  brand: "小髓宝 MdsPal",
  name: "骨髓增生异常综合征",
  en: "Myelodysplastic Syndromes (MDS)",
  updated: "2026-11-07",
  sections: [
    {
      id: "definition",
      title: "定义",
      intro: "骨髓增生异常综合征（myelodysplastic syndromes，MDS）是一组起源于骨髓造血干/祖细胞的肿瘤性疾病：造血细胞发育异常（增生异常）、有效造血减少，部分患者会进展为急性髓系白血病。它不是一种病，而是一组疾病——异常细胞长在哪、占多少、基因有没有变化，组合起来对应不同的随访与治疗条目。",
      points: [
        "命名口径：中国 2026 年版全国指南题名用「骨髓增生异常肿瘤」，WHO 第 5 版分类也逐步用「骨髓增生异常性肿瘤（MDS）」；本台界面沿用患者更常见的「综合征」叫法，登记分类名时抄医生原文，不做两者换算。",
        "诊断要靠骨髓穿刺/活检：原始细胞比例、发育异常的细胞系、染色体核型与基因检测结果组合判断；本台把这些报告的原文抄进档案，不自己下诊断。",
        "常见的血象表现是「血细胞减少」：贫血（血红蛋白低）、中性粒细胞低、血小板低，可以只少一系，也可以三系都少——本台按血象记录呈现，不解读「少到什么程度算什么」。",
        "它和再生障碍性贫血、营养性贫血、阵发性睡眠性血红蛋白尿症等疾病的区分需要医生结合检查判断；本台不做鉴别。",
        "风险分层（IPSS-R、IPSS-M、WPSS 等）是医生用来组织治疗选择的工具；本台只登记医生给出的原话与日期，不自动计算，也不把分层翻译成「严重程度」。"
      ],
      sources: [
        {
          org: "国家卫健委 / 中华医学会血液学分会（题名据检索）",
          doc: "《骨髓增生异常肿瘤诊断与治疗中国指南（2026年版）》",
          version: "2026 年版",
          original: false,
          secondaryUrl: "https://pubmed.ncbi.nlm.nih.gov/?term=myelodysplastic+neoplasms+china+guideline+2026",
          page: "原文未取得",
          note: "题录来自检索摘要，原件未取得；仅作命名与存在性登记，不引用其临床内容"
        },
        {
          org: "NCCN",
          doc: "NCCN Guidelines®: Myelodysplastic Syndromes",
          version: "Version 2.2025（JNCCN Insights 2025-03 摘述）",
          original: false,
          secondaryUrl: "https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1446",
          page: "正文需注册，未取得原件",
          note: "官方详情页确认存在与版本；本台只取「低危/高危两条路径」的内容边界，不转成自测"
        },
        {
          org: "WHO/IARC",
          doc: "Classification of Tumours: Haematolymphoid Tumours, 5th ed.（骨髓增生异常性肿瘤章节）",
          version: "第 5 版（2022/2024）",
          original: false,
          secondaryUrl: "https://publications.iarc.who.int/Book-And-Report-Series/Who-Classification-Of-Tumours/Haematolymphoid-Tumours-2024",
          page: "页码待核",
          note: "IARC 出版总入口；具体章节页码未核"
        }
      ]
    },
    {
      id: "evidence",
      title: "医学资料规范和指南情况",
      intro: "本台把指南、共识、患者资料分别登记，并区分「已取得原件」与「题录（知道存在、未取得正文）」。截至目前，本项目未取得下列任何一份原件；页面引用一律标注题录状态。",
      groups: [
        {
          title: "指南与共识（题录登记）",
          points: [
            "NCCN 患者版《Myelodysplastic Syndromes》PDF：官方入口公开、免费下载；本项目尚未下载审阅，取得后再逐条核对引用。",
            "《骨髓增生异常肿瘤诊断与治疗中国指南（2026年版）》：检索确认存在；原件未取得。",
            "《中国老年骨髓增生异常性肿瘤诊断和治疗专家共识（2024版）》：检索确认存在；全文未审阅。"
          ]
        },
        {
          title: "药品监管信息（题录，NMPA 官方库未复核）",
          points: [
            "阿扎胞苷：据公开资料为国内较早获批用于较高危 MDS 的去甲基化药物；本台不写剂量、方案与适应证推荐，只登记实际发生的用药。",
            "罗特西普：据公开资料 2025 年 6 月获批较低危 MDS 贫血相关适应证、2025 年 12 月纳入国家医保目录；以 NMPA 与医保局官方库为准。"
          ]
        },
        {
          title: "本台资料规范",
          points: [
            "报告原文、日期、机构逐项登记并保留原件状态（有无扫描件）；候选信息经逐项确认才进档案。",
            "阈值与参考范围一律【待核】：未过临床审核的数值不展示、不比对。"
          ]
        }
      ],
      table: {
        head: ["资料", "版本/口径", "取得状态"],
        rows: [
          ["NCCN MDS 临床版", "Version 2.2025", "题录：正文需注册，未取得"],
          ["NCCN MDS 患者版", "页面标注版本待核", "题录：PDF 未下载未审阅"],
          ["中国指南（骨髓增生异常肿瘤）", "2026 年版", "题录：原件未取得"],
          ["老年 MDS 专家共识", "2024 版", "题录：全文未审阅"],
          ["NMPA 药品题录（阿扎胞苷/罗特西普）", "以官方库查询日为准", "官方库未复核，夜间窗口不执行"]
        ]
      },
      sources: [
        {
          org: "NCCN（患者版入口）",
          doc: "NCCN Guidelines for Patients: Myelodysplastic Syndromes",
          version: "页面标注版本待核",
          original: false,
          secondaryUrl: "https://www.nccn.org/patients/guidelines/content/PDF/mds-patient.pdf",
          page: "PDF 未下载未审阅",
          note: "链接指向官方 PDF；未取得前只登记存在性"
        },
        {
          org: "NMPA（药品监督管理信息）",
          doc: "药品批准文号与适应证查询（阿扎胞苷/罗特西普题录核对入口）",
          version: "以查询日为准",
          original: false,
          secondaryUrl: "https://www.nmpa.gov.cn/datasearch/home-index.html",
          page: "夜间窗口未执行官方库查询",
          note: "药品条目全部按「实际用药登记」呈现，本页不做适应证表述"
        }
      ]
    },
    {
      id: "landscape",
      title: "治疗全景",
      intro: "指南里列举过的手段按「观察随访 / 输血与支持 / 药物治疗 / 造血干细胞移植」四类登记。这里只整理这些手段的名称与登记方式，不构成任何一项适合你的判断——需要问你的医生。",
      groups: [
        {
          title: "观察随访（低危常见路径之一）",
          points: [
            "定期血常规与体格检查；本台记录血象序列与复查日期，不自动提醒「该不该复查」的医学判断。"
          ]
        },
        {
          title: "输血与支持（按实际发生登记）",
          points: [
            "红细胞输注、血小板输注：本台按次记录成分、单位数、输前血红蛋白与机构，并汇总近 90 天节奏；输血阈值不写通用数值。",
            "感染与出血的日常观察：只呈现患者已确认的医生医嘱原话；无医嘱时本台显示空态，不生成通用建议。",
            "促红细胞生成素类药物、去甲基化药物联合支持治疗等条目：按实际用药登记，不推荐。"
          ]
        },
        {
          title: "药物治疗（名称登记，不做选择建议）",
          points: [
            "去甲基化药物（如阿扎胞苷）：本台按「一个疗程」折叠卡记录药名、天数、疗程内血象最低点；疗程间隔抄出院小结口径。",
            "免疫调节/免疫抑制治疗、靶向药物（如 IDH1/IDH2 抑制剂用于对应基因突变者）：存在性登记；是否适用由医生结合基因结果决定，本台不判定。",
            "促红细胞成熟剂（如罗特西普）：存在性登记，题录状态见上一段。"
          ]
        },
        {
          title: "造血干细胞移植（评估前材料整理）",
          points: [
            "异基因移植是部分较高危患者的根治性手段；本台只整理「评估前需要的材料清单」（病历、检测报告、输血记录），移植后管理不在范围内。"
          ]
        },
        {
          title: "排列口径",
          points: [
            "本台的病程记录按病期与线序排列（MDS 属肿瘤，沿家族肿瘤口径）；不代表任何一项适合你，需要问你的医生。"
          ]
        }
      ],
      sources: [
        {
          org: "NCCN",
          doc: "NCCN Guidelines®: Myelodysplastic Syndromes（治疗全景的内容边界来源）",
          version: "Version 2.2025",
          original: false,
          secondaryUrl: "https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1446",
          page: "正文需注册，未取得原件",
          note: "只取「四类手段存在」的边界，不引用具体推荐级别"
        },
        {
          org: "Mayo Clinic（中文患者页）",
          doc: "骨髓增生异常综合征——诊断与治疗（输血控制症状的通俗表述）",
          version: "网页版（访问日期 2026-11-07）",
          original: false,
          secondaryUrl: "https://www.mayoclinic.org/zh-hans/diseases-conditions/myelodysplastic-syndrome/diagnosis-treatment/drc-20366980",
          page: "二次来源",
          note: "仅作患者向表述参考；未作为任何医学结论依据"
        }
      ]
    },
    {
      id: "trend",
      title: "发展趋势",
      intro: "只写已经发生、可核对的事实（带日期或版本）。不预测、不承诺。",
      groups: [
        {
          title: "已发生的监管与准入事实",
          points: [
            "2025 年 6 月：罗特西普（红细胞成熟剂）获 NMPA 批准用于较低危 MDS 贫血相关适应证（据公开报道，未核 NMPA 原始库）。",
            "2025 年 12 月：罗特西普纳入国家医保目录（据公开报道，以医保局官方文件为准）。",
            "2017 年：阿扎胞苷（原研）在中国获批（据公开资料，年份未核原件）。"
          ]
        },
        {
          title: "指南版本时间线（题录）",
          points: [
            "2024 年：《CSCO 恶性血液病诊疗指南》收载 MDS 内容；《中国老年骨髓增生异常性肿瘤诊断和治疗专家共识（2024版）》发布。",
            "2025 年 3 月：NCCN MDS 指南更新至 Version 2.2025（JNCCN Insights 摘述）。",
            "2026 年：《骨髓增生异常肿瘤诊断与治疗中国指南（2026年版）》发布（题名据检索）。"
          ]
        },
        {
          title: "本台边界",
          points: [
            "以上条目均为题录或二次来源；本台不据此给出任何「该用什么、不该用什么」的判断。",
            "新药与指南更新以官方登记库与指南原文为准；未取得原件前，本台不展开具体内容。"
          ]
        }
      ],
      sources: [
        {
          org: "NMPA / 国家医保局（经公开报道转引）",
          doc: "罗特西普获批与医保准入时间线",
          version: "截至 2026-11-07 的公开报道口径",
          original: false,
          secondaryUrl: "https://www.nmpa.gov.cn/datasearch/home-index.html",
          page: "官方库未复核",
          note: "时间线属已发生事实登记；以官方文件为准"
        },
        {
          org: "NCCN / JNCCN",
          doc: "NCCN Guidelines Insights: Myelodysplastic Syndromes, Version 2.2025",
          version: "2025-03",
          original: false,
          secondaryUrl: "https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1446",
          page: "版本更新摘要入口",
          note: "题录"
        }
      ]
    }
  ]
}

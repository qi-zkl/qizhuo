export type Choice = { value: string; label: string };

export type FieldSpec = {
  name: string;
  label: string;
  type?: "text" | "tel" | "number" | "date" | "url" | "textarea" | "radio" | "checkbox";
  required?: boolean;
  placeholder?: string;
  choices?: Choice[];
  full?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  inputMode?: "numeric" | "tel" | "url";
};

export type SectionSpec = {
  number: string;
  title: string;
  note?: string;
  fields: FieldSpec[];
};

export type FormKind = "guest" | "staff";

export type ApplicationSpec = {
  kind: FormKind;
  title: string;
  englishTitle: string;
  intro: string;
  photoLabel: string;
  submitLabel: string;
  successTitle: string;
  sections: SectionSpec[];
};

const genderChoices: Choice[] = [
  { value: "男", label: "男" },
  { value: "女", label: "女" },
  { value: "其他", label: "其他" },
];

const yesNoChoices: Choice[] = [
  { value: "是", label: "是" },
  { value: "否", label: "否" },
];

export const guestSpec: ApplicationSpec = {
  kind: "guest",
  title: "出演嘉宾报名",
  englishTitle: "GUEST APPLICATION",
  intro: "请大胆一点，分享你的真实故事。带 * 的项目为必填，预计 6–8 分钟完成。",
  photoLabel: "个人照片",
  submitLabel: "提交嘉宾报名",
  successTitle: "收到你的故事啦！",
  sections: [
    {
      number: "01",
      title: "基本信息",
      fields: [
        { name: "name", label: "姓名", required: true, placeholder: "你的真实姓名", maxLength: 40 },
        { name: "nickname", label: "昵称", placeholder: "希望我们怎么称呼你", maxLength: 40 },
        { name: "gender", label: "性别", type: "radio", choices: genderChoices },
        { name: "age", label: "年龄", type: "number", min: 16, max: 99, placeholder: "例如：23" },
        { name: "phone", label: "手机号", type: "tel", required: true, placeholder: "11 位手机号或 +86 格式", maxLength: 14, inputMode: "tel" },
        { name: "wechat", label: "微信号", required: true, placeholder: "便于后续联系", maxLength: 60 },
        { name: "city", label: "所在城市", required: true, placeholder: "例如：上海", maxLength: 60 },
        { name: "occupation", label: "职业 / 学校", placeholder: "你现在在做什么", maxLength: 100 },
      ],
    },
    {
      number: "02",
      title: "个人标签",
      fields: [
        { name: "personality", label: "性格关键词", full: true, placeholder: "用 3–5 个词描述你自己", maxLength: 120 },
        { name: "interests", label: "兴趣爱好", full: true, placeholder: "越具体越好", maxLength: 300 },
        { name: "social", label: "社交账号", full: true, placeholder: "小红书 / 抖音 / B 站等，可填写昵称或链接", maxLength: 300 },
        {
          name: "cameraExperience",
          label: "镜头经验",
          type: "radio",
          choices: [
            { value: "无经验", label: "无经验" },
            { value: "有经验", label: "有经验" },
          ],
        },
        { name: "cameraExperienceNote", label: "镜头经验说明", full: true, placeholder: "如有，可简单说说短视频、直播或节目经历", maxLength: 500 },
      ],
    },
    {
      number: "03",
      title: "节目录制信息",
      fields: [
        { name: "recordingTime", label: "可录制时间", required: true, full: true, placeholder: "请写出较明确的日期或时间段", maxLength: 300 },
        { name: "location", label: "可参与地点", full: true, placeholder: "可接受前往哪些城市或区域", maxLength: 200 },
        { name: "publicAppearance", label: "愿意公开出镜", type: "radio", choices: yesNoChoices },
        { name: "streetInteraction", label: "接受街采 / 游戏互动", type: "radio", choices: yesNoChoices },
      ],
    },
    {
      number: "04",
      title: "内容问答",
      note: "没有标准答案，我们更想看到真实的你。",
      fields: [
        { name: "favoriteSegment", label: "最想参加的节目环节", type: "textarea", full: true, placeholder: "你希望镜头记录怎样的体验？", maxLength: 800 },
        { name: "bestStrength", label: "你最靠谱的优点", type: "textarea", full: true, placeholder: "讲一件能证明它的小事会更有意思", maxLength: 800 },
        { name: "friendDescription", label: "朋友会怎么形容你", type: "textarea", full: true, placeholder: "他们最常说你什么？", maxLength: 800 },
        { name: "selfIntro", label: "一句话自我介绍", type: "textarea", required: true, full: true, placeholder: "一句就好，要让我们记住你", maxLength: 300 },
      ],
    },
    {
      number: "05",
      title: "附加信息",
      fields: [
        { name: "emergencyContact", label: "紧急联系人", placeholder: "联系人姓名", maxLength: 40 },
        { name: "emergencyPhone", label: "紧急联系方式", type: "tel", placeholder: "电话或其他联系方式", maxLength: 60 },
        { name: "notes", label: "备注补充", type: "textarea", full: true, placeholder: "还有什么想提前告诉我们？", maxLength: 1000 },
      ],
    },
  ],
};

export const staffSpec: ApplicationSpec = {
  kind: "staff",
  title: "工作人员报名",
  englishTitle: "STAFF APPLICATION",
  intro: "你的每项技能，都会让创意更接近现场。带 * 的项目为必填，预计 6–8 分钟完成。",
  photoLabel: "照片 / 头像",
  submitLabel: "提交工作人员报名",
  successTitle: "欢迎来到创作现场！",
  sections: [
    {
      number: "01",
      title: "基本信息",
      fields: [
        { name: "name", label: "姓名", required: true, placeholder: "你的真实姓名", maxLength: 40 },
        { name: "nickname", label: "昵称", placeholder: "希望我们怎么称呼你", maxLength: 40 },
        { name: "gender", label: "性别", type: "radio", choices: genderChoices },
        { name: "age", label: "年龄", type: "number", min: 16, max: 99, placeholder: "例如：23" },
        { name: "phone", label: "手机号", type: "tel", required: true, placeholder: "11 位手机号或 +86 格式", maxLength: 14, inputMode: "tel" },
        { name: "wechat", label: "微信号", required: true, placeholder: "便于后续联系", maxLength: 60 },
        { name: "city", label: "所在城市", required: true, placeholder: "例如：上海", maxLength: 60 },
        { name: "availableDate", label: "可到岗时间", type: "date", required: true },
      ],
    },
    {
      number: "02",
      title: "岗位意向",
      note: "可多选，也可以在“其他”中补充。",
      fields: [
        {
          name: "positions",
          label: "希望参与的岗位",
          type: "checkbox",
          required: true,
          full: true,
          choices: [
            "导演组", "摄影摄像", "剪辑后期", "视觉设计", "文案策划",
            "场务执行", "运营宣传", "灯光收音", "妆造服化",
          ].map((value) => ({ value, label: value })),
        },
        { name: "otherPosition", label: "其他岗位", full: true, placeholder: "没有列出的方向可以写在这里", maxLength: 100 },
      ],
    },
    {
      number: "03",
      title: "技能与经验",
      fields: [
        { name: "skills", label: "擅长技能", type: "textarea", full: true, placeholder: "例如：人物拍摄、分镜、调色、采访策划", maxLength: 800 },
        { name: "software", label: "熟练软件 / 设备", type: "textarea", full: true, placeholder: "软件、相机、灯光、收音或其他工具", maxLength: 800 },
        { name: "experience", label: "相关项目经验", type: "textarea", full: true, placeholder: "简单介绍项目、你的职责和成果", maxLength: 1000 },
        { name: "portfolio", label: "作品链接 / 社交账号", full: true, placeholder: "网盘、作品集、B 站、小红书等均可", maxLength: 500 },
      ],
    },
    {
      number: "04",
      title: "时间与配合度",
      fields: [
        {
          name: "commitment",
          label: "可参与周期",
          type: "radio",
          choices: [
            { value: "短期（1 个月内）", label: "短期（1 个月内）" },
            { value: "中期（1–3 个月）", label: "中期（1–3 个月）" },
            { value: "长期（3 个月以上）", label: "长期（3 个月以上）" },
          ],
          full: true,
        },
        { name: "weeklyHours", label: "每周可投入时间", type: "number", min: 1, max: 120, placeholder: "小时" },
        {
          name: "travel",
          label: "接受外拍 / 出差",
          type: "radio",
          choices: [
            { value: "是", label: "是" }, { value: "否", label: "否" }, { value: "视情况而定", label: "视情况而定" },
          ],
          full: true,
        },
        {
          name: "overtime",
          label: "接受加班赶进度",
          type: "radio",
          choices: [
            { value: "是", label: "是" }, { value: "否", label: "否" }, { value: "视项目情况", label: "视项目情况" },
          ],
          full: true,
        },
      ],
    },
    {
      number: "05",
      title: "自我介绍",
      note: "我们想知道的不只是简历，也想知道你为什么在这里。",
      fields: [
        { name: "selfIntro", label: "一句话介绍自己", type: "textarea", full: true, placeholder: "一句让我们记住你的话", maxLength: 300 },
        { name: "motivation", label: "为什么想加入我们", type: "textarea", full: true, placeholder: "你期待一起创造什么？", maxLength: 1000 },
      ],
    },
    {
      number: "06",
      title: "备注",
      fields: [
        { name: "notes", label: "其他补充说明", type: "textarea", full: true, placeholder: "档期、合作方式或其他需要提前说明的内容", maxLength: 1000 },
      ],
    },
  ],
};

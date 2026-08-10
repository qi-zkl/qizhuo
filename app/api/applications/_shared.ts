import type { FormKind } from "@/app/forms/specs";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

type RateEntry = { count: number; resetAt: number };
type FeishuTokenResponse = {
  code: number;
  msg: string;
  tenant_access_token?: string;
  expire?: number;
};
type FeishuResponse<T> = { code: number; msg: string; data?: T };

const rateLimits = new Map<string, RateEntry>();
let cachedToken: { value: string; expiresAt: number } | null = null;

const requiredFields: Record<FormKind, string[]> = {
  guest: ["name", "phone", "wechat", "city", "recordingTime", "selfIntro", "privacyConsent"],
  staff: ["name", "phone", "wechat", "city", "availableDate", "positions", "privacyConsent"],
};

const commonMap: Record<string, string> = {
  name: "姓名",
  nickname: "昵称",
  gender: "性别",
  age: "年龄",
  phone: "手机号",
  wechat: "微信号",
  city: "所在城市",
  selfIntro: "一句话自我介绍",
  notes: "备注补充",
};

const guestMap: Record<string, string> = {
  ...commonMap,
  occupation: "职业 / 学校",
  personality: "性格关键词",
  interests: "兴趣爱好",
  social: "社交账号",
  cameraExperience: "镜头经验",
  cameraExperienceNote: "镜头经验说明",
  recordingTime: "可录制时间",
  location: "可参与地点",
  publicAppearance: "愿意公开出镜",
  streetInteraction: "接受街采 / 游戏互动",
  favoriteSegment: "最想参加的节目环节",
  bestStrength: "最靠谱的优点",
  friendDescription: "朋友评价",
  emergencyContact: "紧急联系人",
  emergencyPhone: "紧急联系方式",
};

const staffMap: Record<string, string> = {
  ...commonMap,
  availableDate: "可到岗时间",
  positions: "岗位意向",
  otherPosition: "其他岗位",
  skills: "擅长技能",
  software: "熟练软件 / 设备",
  experience: "相关项目经验",
  portfolio: "作品链接 / 社交账号",
  commitment: "可参与周期",
  weeklyHours: "每周投入小时",
  travel: "外拍 / 出差意愿",
  overtime: "加班赶进度意愿",
  motivation: "加入原因",
};

export async function handleApplication(request: Request, kind: FormKind) {
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ message: "无法读取报名内容，请刷新后重试。" }, 400);
  }

  if (getString(form, "website")) return json({ message: "提交未通过验证。" }, 400);

  const startedAt = Number(getString(form, "startedAt"));
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 1500) {
    return json({ message: "提交过快，请检查内容后重试。" }, 400);
  }

  const submissionId = getString(form, "submissionId");
  if (!/^[0-9a-f-]{36}$/i.test(submissionId)) {
    return json({ message: "报名编号无效，请刷新页面后重试。" }, 400);
  }

  const errors = validateForm(form, kind);
  if (Object.keys(errors).length > 0) return json({ message: "请检查必填信息。", errors }, 400);

  const photo = form.get("photo");
  if (!isFile(photo)) {
    return json({ message: "请上传报名照片。", errors: { photo: "请上传报名照片。" } }, 400);
  }
  if (photo.size > MAX_PHOTO_BYTES) return json({ message: "照片不能超过 5 MB。" }, 413);
  if (!ACCEPTED_PHOTO_TYPES.has(photo.type)) {
    return json({ message: "照片仅支持 JPG、PNG 或 WebP。", errors: { photo: "图片格式不支持。" } }, 400);
  }

  const config = getConfig(kind);
  if (!config.ok) return json({ message: "报名通道正在配置中，请稍后再试。" }, 503);

  try {
    const token = await getTenantToken(config.value.appId, config.value.appSecret);
    const fileToken = await uploadPhoto(token, config.value.appToken, photo);
    const fields = buildFields(form, kind, submissionId, fileToken);
    await createRecord(token, config.value.appToken, config.value.tableId, submissionId, fields);
    return json({ submissionId, status: "submitted" }, 201);
  } catch (error) {
    console.error("Application submission failed", safeErrorMessage(error));
    return json({ message: "报名通道暂时繁忙，请稍后重试。" }, 503);
  }
}

function validateForm(form: FormData, kind: FormKind) {
  const errors: Record<string, string> = {};
  for (const field of requiredFields[kind]) {
    const hasValue = field === "positions"
      ? form.getAll(field).some((value) => String(value).trim())
      : Boolean(getString(form, field));
    if (!hasValue) errors[field] = "此项为必填项。";
  }

  const phone = getString(form, "phone").replace(/[\s-]/g, "");
  if (phone && !/^(?:\+?86)?1[3-9]\d{9}$/.test(phone)) errors.phone = "请输入正确的中国大陆手机号。";

  const age = getString(form, "age");
  if (age && (!/^\d+$/.test(age) || Number(age) < 16 || Number(age) > 99)) {
    errors.age = "年龄应为 16–99 之间的整数。";
  }

  const weeklyHours = getString(form, "weeklyHours");
  if (weeklyHours && (!/^\d+$/.test(weeklyHours) || Number(weeklyHours) < 1 || Number(weeklyHours) > 120)) {
    errors.weeklyHours = "每周投入时间应为 1–120 小时。";
  }

  const map = kind === "guest" ? guestMap : staffMap;
  for (const key of Object.keys(map)) {
    for (const value of form.getAll(key)) {
      if (typeof value === "string" && value.length > 1000) errors[key] = "填写内容过长，请适当精简。";
    }
  }
  return errors;
}

function buildFields(form: FormData, kind: FormKind, submissionId: string, fileToken: string) {
  const map = kind === "guest" ? guestMap : staffMap;
  const fields: Record<string, unknown> = {
    "报名编号": submissionId,
    "提交时间": Date.now(),
    "照片": [{ file_token: fileToken }],
    "隐私同意": true,
  };

  for (const [key, label] of Object.entries(map)) {
    const values = form.getAll(key).filter((value): value is string => typeof value === "string" && value.trim().length > 0);
    if (values.length === 0) continue;
    if (key === "positions") fields[label] = values;
    else if (key === "age" || key === "weeklyHours") fields[label] = Number(values[0]);
    else if (key === "availableDate") fields[label] = new Date(`${values[0]}T00:00:00+08:00`).getTime();
    else fields[label] = values[0].trim();
  }
  return fields;
}

async function getTenantToken(appId: string, appSecret: string) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) return cachedToken.value;
  const response = await fetchWithRetry("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  const payload = (await response.json()) as FeishuTokenResponse;
  if (!response.ok || payload.code !== 0 || !payload.tenant_access_token) {
    throw new Error(`Feishu token error: ${payload.code} ${payload.msg}`);
  }
  cachedToken = {
    value: payload.tenant_access_token,
    expiresAt: Date.now() + Math.max(60, payload.expire ?? 3600) * 1000,
  };
  return cachedToken.value;
}

async function uploadPhoto(token: string, appToken: string, photo: File) {
  const body = new FormData();
  body.set("file_name", sanitizeFilename(photo.name));
  body.set("parent_type", "bitable_image");
  body.set("parent_node", appToken);
  body.set("size", String(photo.size));
  body.set("file", photo);
  const response = await fetchWithRetry("https://open.feishu.cn/open-apis/drive/v1/medias/upload_all", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const payload = (await response.json()) as FeishuResponse<{ file_token?: string }>;
  const fileToken = payload.data?.file_token;
  if (!response.ok || payload.code !== 0 || !fileToken) {
    throw new Error(`Feishu upload error: ${payload.code} ${payload.msg}`);
  }
  return fileToken;
}

async function createRecord(token: string, appToken: string, tableId: string, submissionId: string, fields: Record<string, unknown>) {
  const endpoint = new URL(`https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(appToken)}/tables/${encodeURIComponent(tableId)}/records`);
  endpoint.searchParams.set("client_token", submissionId);
  const response = await fetchWithRetry(endpoint.toString(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ fields }),
  });
  const payload = (await response.json()) as FeishuResponse<unknown>;
  if (!response.ok || payload.code !== 0) throw new Error(`Feishu record error: ${payload.code} ${payload.msg}`);
}

async function fetchWithRetry(url: string, init: RequestInit) {
  let lastResponse: Response | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, init);
      lastResponse = response;
      if (response.ok || ![429, 500, 502, 503, 504].includes(response.status)) return response;
    } catch (error) {
      if (attempt === 1) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  if (!lastResponse) throw new Error("Feishu network error");
  return lastResponse;
}

function checkRateLimit(request: Request) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const now = Date.now();
  const current = rateLimits.get(ip);
  if (!current || current.resetAt <= now) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }
  if (current.count >= RATE_LIMIT_MAX) {
    return json({ message: "提交次数过多，请 10 分钟后再试。" }, 429, { "Retry-After": "600" });
  }
  current.count += 1;
  return null;
}

function getConfig(kind: FormKind) {
  const value = {
    appId: process.env.FEISHU_APP_ID || "",
    appSecret: process.env.FEISHU_APP_SECRET || "",
    appToken: process.env.FEISHU_APP_TOKEN || "",
    tableId: kind === "guest" ? process.env.FEISHU_GUEST_TABLE_ID || "" : process.env.FEISHU_STAFF_TABLE_ID || "",
  };
  return Object.values(value).every(Boolean) ? { ok: true as const, value } : { ok: false as const };
}

function getString(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isFile(value: FormDataEntryValue | null): value is File {
  return Boolean(value && typeof value !== "string" && typeof value.arrayBuffer === "function" && typeof value.size === "number");
}

function sanitizeFilename(name: string) {
  const clean = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
  return clean || `photo-${Date.now()}.jpg`;
}

function safeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 300) : "Unknown error";
}

function json(body: unknown, status: number, headers?: Record<string, string>) {
  return Response.json(body, { status, headers });
}

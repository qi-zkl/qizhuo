"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { ApplicationSpec, FieldSpec } from "./specs";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

type SubmitState = "idle" | "submitting" | "success" | "error";

export function ApplicationForm({ spec }: { spec: ApplicationSpec }) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const [startedAt] = useState(() => Date.now().toString());
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  function choosePhoto(file?: File) {
    setPhotoError("");
    if (!file) return;
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError("请上传 JPG、PNG 或 WebP 格式的图片。");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("图片不能超过 5 MB，请压缩后再上传。");
      return;
    }
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhoto(file);
    setPhotoUrl(URL.createObjectURL(file));
  }

  function removePhoto() {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhoto(null);
    setPhotoUrl(null);
    setPhotoError("");
    const input = document.getElementById(`${spec.kind}-photo`) as HTMLInputElement | null;
    if (input) input.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    if (!photo) {
      setPhotoError("请先上传一张清晰的照片。");
      document.getElementById(`${spec.kind}-photo-block`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (spec.kind === "staff" && new FormData(form).getAll("positions").length === 0) {
      setSubmitState("error");
      setSubmitError("请至少选择一个岗位意向。");
      document.getElementById("field-positions")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitState("submitting");
    const data = new FormData(form);
    data.set("photo", photo);
    data.set("startedAt", startedAt);
    data.set("submissionId", crypto.randomUUID());

    try {
      const response = await fetch(`/api/applications/${spec.kind}`, {
        method: "POST",
        body: data,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        submissionId?: string;
        message?: string;
        errors?: Record<string, string>;
      };
      if (!response.ok) {
        const firstFieldError = payload.errors ? Object.values(payload.errors)[0] : undefined;
        throw new Error(firstFieldError || payload.message || "提交失败，请稍后重试。");
      }
      setSubmissionId(payload.submissionId || "");
      setSubmitState("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitState("error");
      setSubmitError(error instanceof Error ? error.message : "提交失败，请稍后重试。");
    }
  }

  if (submitState === "success") {
    return (
      <main className={`form-shell ${spec.kind}-theme`}>
        <section className="success-card" aria-live="polite">
          <div className="success-sticker" aria-hidden="true">✓</div>
          <p className="marker-kicker">APPLICATION RECEIVED</p>
          <h1>{spec.successTitle}</h1>
          <p>报名已成功提交。我们会认真阅读每一份内容，并通过你留下的联系方式与你沟通。</p>
          {submissionId && <p className="reference-number">报名编号：{submissionId}</p>}
          <div className="success-actions">
            <a className="button-primary" href="/">返回首页</a>
            <button
              className="button-secondary"
              type="button"
              onClick={() => {
                formRef.current?.reset();
                removePhoto();
                setSubmissionId("");
                setSubmitState("idle");
              }}
            >再填一份</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={`form-shell ${spec.kind}-theme`}>
      <header className="form-topbar">
        <a className="back-link" href="/" aria-label="返回报名首页">← 返回首页</a>
        <div className="mini-brand">创享不打烊 <strong>YOUNG!</strong></div>
        <span className="topbar-note">BE REAL · BE BOLD</span>
      </header>

      <section className="form-hero">
        <div>
          <p className="eyebrow">{spec.englishTitle}</p>
          <h1>{spec.title}</h1>
          <p>{spec.intro}</p>
        </div>
        <div className="hero-scribble" aria-hidden="true">✦</div>
      </section>

      <form ref={formRef} className="application-form" onSubmit={handleSubmit}>
        <input className="honeypot" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

        <section className="photo-section" id={`${spec.kind}-photo-block`}>
          <div className="photo-copy">
            <span className="section-number">PHOTO</span>
            <h2>{spec.photoLabel}<sup>*</sup></h2>
            <p>上传正面、清晰、无过度遮挡的近照。支持 JPG、PNG、WebP，最大 5 MB。</p>
          </div>
          <div className={`photo-uploader ${photoError ? "has-error" : ""}`}>
            {photoUrl ? (
              <div className="photo-preview">
                <img src={photoUrl} alt="已选择的报名照片预览" />
                <div className="photo-actions">
                  <label className="small-button" htmlFor={`${spec.kind}-photo`}>更换</label>
                  <button className="small-button danger" type="button" onClick={removePhoto}>删除</button>
                </div>
              </div>
            ) : (
              <label className="photo-empty" htmlFor={`${spec.kind}-photo`}>
                <span className="camera-mark" aria-hidden="true">◎</span>
                <strong>点击上传照片</strong>
                <small>也可以直接调用手机相机</small>
              </label>
            )}
            <input
              id={`${spec.kind}-photo`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => choosePhoto(event.target.files?.[0])}
            />
          </div>
          {photoError && <p className="field-error" role="alert">{photoError}</p>}
        </section>

        <div className="form-sections">
          {spec.sections.map((section) => (
            <section className="form-section" key={section.number}>
              <header className="form-section-heading">
                <span className="section-number">{section.number}</span>
                <div>
                  <h2>{section.title}</h2>
                  {section.note && <p>{section.note}</p>}
                </div>
              </header>
              <div className="field-grid">
                {section.fields.map((field) => <Field key={field.name} field={field} />)}
              </div>
            </section>
          ))}
        </div>

        <section className="consent-section">
          <label className="consent-label">
            <input type="checkbox" name="privacyConsent" value="已同意" required />
            <span>我已阅读并同意：报名信息仅用于筛选与联络，不在未经同意的情况下公开展示。<sup>*</sup></span>
          </label>
        </section>

        {submitState === "error" && (
          <div className="submit-error" role="alert">
            <strong>暂时没有提交成功</strong>
            <span>{submitError} 你填写的内容仍保留在页面上。</span>
          </div>
        )}

        <div className="submit-bar">
          <div>
            <strong>准备好了吗？</strong>
            <span>提交后，请留意你留下的手机和微信消息。</span>
          </div>
          <button className="submit-button" type="submit" disabled={submitState === "submitting"}>
            {submitState === "submitting" ? "正在提交…" : spec.submitLabel}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>

      <footer className="form-footer">真实 · 有趣 · 敢表达 <span>把创意变成现场！</span></footer>
    </main>
  );
}

function Field({ field }: { field: FieldSpec }) {
  const id = `field-${field.name}`;
  const fieldClass = `field ${field.full || field.type === "radio" || field.type === "checkbox" ? "full-field" : ""}`;
  const requiredMark = field.required ? <sup>*</sup> : null;

  if (field.type === "radio" || field.type === "checkbox") {
    return (
      <fieldset className={fieldClass} id={id} aria-required={field.required || undefined}>
        <legend>{field.label}{requiredMark}</legend>
        <div className="choice-grid">
          {field.choices?.map((choice, index) => (
            <label className="choice-pill" key={choice.value}>
                <input
                  type={field.type}
                  name={field.name}
                  value={choice.value}
                  required={field.type === "radio" && field.required && index === 0}
                />
              <span>{choice.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className={fieldClass} htmlFor={id}>
        <span>{field.label}{requiredMark}</span>
        <textarea id={id} name={field.name} required={field.required} placeholder={field.placeholder} maxLength={field.maxLength ?? 1000} rows={4} />
      </label>
    );
  }

  return (
    <label className={fieldClass} htmlFor={id}>
      <span>{field.label}{requiredMark}</span>
      <input
        id={id}
        name={field.name}
        type={field.type || "text"}
        required={field.required}
        placeholder={field.placeholder}
        min={field.min}
        max={field.max}
        maxLength={field.maxLength ?? 300}
        inputMode={field.inputMode}
        pattern={field.name === "phone" ? "(?:\\+?86)?1[3-9]\\d{9}" : undefined}
        title={field.name === "phone" ? "请输入 11 位中国大陆手机号，可带 +86" : undefined}
      />
    </label>
  );
}

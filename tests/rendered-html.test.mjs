import assert from "node:assert/strict";
import test from "node:test";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);

async function render(pathname = "/") {
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the public role selector", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /创享不打烊/);
  assert.match(html, /出演嘉宾报名/);
  assert.match(html, /工作人员报名/);
  assert.match(html, /href="\/guest"/);
  assert.match(html, /href="\/staff"/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/);
});

test("server-renders both application forms", async () => {
  const [guestResponse, staffResponse] = await Promise.all([render("/guest"), render("/staff")]);
  assert.equal(guestResponse.status, 200);
  assert.equal(staffResponse.status, 200);
  const [guestHtml, staffHtml] = await Promise.all([guestResponse.text(), staffResponse.text()]);
  assert.match(guestHtml, /GUEST APPLICATION/);
  assert.match(guestHtml, /最想参加的节目环节/);
  assert.match(staffHtml, /STAFF APPLICATION/);
  assert.match(staffHtml, /岗位意向/);
  assert.match(staffHtml, /报名信息仅用于筛选与联络/);
});

test("rejects malformed API submissions without exposing configuration", async () => {
  const response = await worker.fetch(
    new Request("http://localhost/api/applications/guest", {
      method: "POST",
      body: new FormData(),
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 400);
  const text = await response.text();
  assert.doesNotMatch(text, /FEISHU_APP|APP_SECRET|tenant_access_token/);
});

test("uploads a photo and writes a guest record through mocked Feishu APIs", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    requests.push({ url, init });
    if (url.includes("tenant_access_token/internal")) {
      return Response.json({ code: 0, msg: "ok", tenant_access_token: "test-token", expire: 7200 });
    }
    if (url.includes("drive/v1/medias/upload_all")) {
      return Response.json({ code: 0, msg: "ok", data: { file_token: "photo-token" } });
    }
    if (url.includes("bitable/v1/apps/")) {
      return Response.json({ code: 0, msg: "ok", data: { record: { record_id: "record-1" } } });
    }
    return new Response("Unexpected request", { status: 500 });
  };

  try {
    const form = new FormData();
    form.set("name", "测试嘉宾");
    form.set("phone", "13800138000");
    form.set("wechat", "young-test");
    form.set("city", "上海");
    form.set("recordingTime", "周末");
    form.set("selfIntro", "一个认真又好奇的人");
    form.set("privacyConsent", "已同意");
    form.set("startedAt", String(Date.now() - 3000));
    form.set("submissionId", crypto.randomUUID());
    form.set("photo", new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }), "photo.png");

    const response = await worker.fetch(
      new Request("http://localhost/api/applications/guest", { method: "POST", body: form }),
      {
        ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
        FEISHU_APP_ID: "app-id",
        FEISHU_APP_SECRET: "app-secret",
        FEISHU_APP_TOKEN: "app-token",
        FEISHU_GUEST_TABLE_ID: "guest-table",
        FEISHU_STAFF_TABLE_ID: "staff-table",
      },
      { waitUntil() {}, passThroughOnException() {} },
    );

    assert.equal(response.status, 201);
    assert.equal(requests.length, 3);
    assert.match(requests[1].url, /drive\/v1\/medias\/upload_all/);
    const recordRequest = requests.find(({ url }) => url.includes("bitable/v1/apps/"));
    const recordBody = JSON.parse(String(recordRequest.init.body));
    assert.equal(recordBody.fields["姓名"], "测试嘉宾");
    assert.deepEqual(recordBody.fields["照片"], [{ file_token: "photo-token" }]);
    assert.equal(recordBody.fields["隐私同意"], true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "加入我们",
  description: "选择你的角色，报名加入创享不打烊。",
};

export default function Home() {
  return (
    <main className="home-shell">
      <span className="doodle doodle-star" aria-hidden="true">✦</span>
      <span className="doodle doodle-loop" aria-hidden="true">↝</span>
      <header className="home-hero">
        <div className="brand-lockup" aria-label="创享不打烊 YOUNG">
          <span className="brand-cn">创享不打烊</span>
          <span className="brand-en">YOUNG!</span>
        </div>
        <p className="eyebrow">JOIN THE CREATIVE SCENE · 2026</p>
        <h1>一起把灵感，<br /><span>变成正在发生的现场。</span></h1>
        <p className="hero-copy">
          镜头前大胆表达，镜头后一起创造。选择你的角色，用一份报名开启下一场好玩的合作。
        </p>
        <div className="hero-note"><span>☺</span> 快乐不停歇，创享不打烊</div>
      </header>

      <section className="entry-section" aria-labelledby="entry-title">
        <div className="section-heading">
          <p className="marker-kicker">PICK YOUR ROLE</p>
          <h2 id="entry-title">你想从哪里加入？</h2>
          <p>两类报名独立收集，选一个最适合你的入口。</p>
        </div>

        <div className="entry-grid">
          <a className="entry-card guest-card" href="/guest">
            <div className="poster-preview">
              <div className="poster-recreation" role="img" aria-label="出演嘉宾报名表视觉预览">
                <span>创享不打烊</span>
                <strong>出演嘉宾<br />报名表</strong>
                <small>GUEST APPLICATION CARD</small>
                <i aria-hidden="true">☺</i>
              </div>
              <span className="tape" aria-hidden="true" />
            </div>
            <div className="entry-copy">
              <span className="entry-number">01 / ON CAMERA</span>
              <h3>出演嘉宾报名</h3>
              <p>真实、有趣、敢表达。把你的故事带到镜头现场。</p>
              <span className="entry-cta">开始报名 <span aria-hidden="true">→</span></span>
            </div>
          </a>

          <a className="entry-card staff-card" href="/staff">
            <div className="poster-preview">
              <img src="/staff-application-card.png" alt="工作人员报名表原始视觉预览" />
              <span className="tape" aria-hidden="true" />
            </div>
            <div className="entry-copy">
              <span className="entry-number">02 / BEHIND THE SCENES</span>
              <h3>工作人员报名</h3>
              <p>导演、摄像、后期、运营……用你的技能一起把创意落地。</p>
              <span className="entry-cta">加入团队 <span aria-hidden="true">→</span></span>
            </div>
          </a>
        </div>
      </section>

      <footer className="home-footer">
        <p>创享不打烊 · 年轻人的创意现场</p>
        <span>LET&apos;S CREATE TOGETHER!</span>
      </footer>
    </main>
  );
}

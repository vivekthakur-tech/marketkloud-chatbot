/*!
 * MarketKloud Chat Widget
 * Drop one <script> tag on any webpage to embed this widget.
 * Usage: <script src="widget.js" data-api="https://your-backend.onrender.com"></script>
 */
(function () {
  const API_URL = (document.currentScript && document.currentScript.getAttribute("data-api"))
    || "http://localhost:8000";

  const WELCOME = "👋 Hi! I'm the MarketKloud AI assistant. I can answer questions about our services, pricing, and process — or help you book a free discovery call. How can I help?";

  // ── STYLES ────────────────────────────────────────────────────
  const css = `
    #mk-widget *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
    #mk-bubble{position:fixed;bottom:24px;right:24px;width:54px;height:54px;border-radius:50%;
      background:linear-gradient(135deg,#4f7fff,#7b5fff);cursor:pointer;z-index:9998;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 20px rgba(79,127,255,0.45);transition:transform .15s,box-shadow .15s;border:none;}
    #mk-bubble:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(79,127,255,0.55);}
    #mk-bubble svg{width:24px;height:24px;fill:#fff;}
    #mk-notif{position:absolute;top:-3px;right:-3px;width:14px;height:14px;border-radius:50%;
      background:#ff5566;border:2px solid #fff;display:none;}
    #mk-panel{position:fixed;bottom:90px;right:24px;width:360px;height:540px;
      background:#0f1220;border:1px solid #1c2238;border-radius:16px;
      display:flex;flex-direction:column;z-index:9999;overflow:hidden;
      box-shadow:0 16px 48px rgba(0,0,0,0.6);
      transform:scale(0.92) translateY(16px);opacity:0;pointer-events:none;
      transition:transform .2s cubic-bezier(.34,1.56,.64,1),opacity .18s;}
    #mk-panel.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all;}
    #mk-header{background:linear-gradient(135deg,#141828,#1a2035);padding:14px 16px;
      display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1c2238;}
    #mk-header-left{display:flex;align-items:center;gap:10px;}
    #mk-avatar{width:34px;height:34px;border-radius:50%;
      background:linear-gradient(135deg,#4f7fff,#7b5fff);
      display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}
    #mk-hname{font-size:13px;font-weight:700;color:#e4e8f8;}
    #mk-hstatus{font-size:10px;color:#00c882;margin-top:1px;display:flex;align-items:center;gap:4px;}
    .mk-dot{width:5px;height:5px;border-radius:50%;background:#00c882;
      box-shadow:0 0 5px #00c882;animation:mkpulse 2s ease-in-out infinite;}
    @keyframes mkpulse{0%,100%{opacity:1}50%{opacity:.35}}
    #mk-close{background:none;border:none;color:#3a4260;cursor:pointer;font-size:20px;
      line-height:1;padding:2px;transition:color .12s;}
    #mk-close:hover{color:#e4e8f8;}
    #mk-messages{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:10px;}
    #mk-messages::-webkit-scrollbar{width:3px;}
    #mk-messages::-webkit-scrollbar-thumb{background:#1c2238;}
    .mk-msg{max-width:82%;line-height:1.6;font-size:13px;padding:9px 12px;border-radius:12px;word-break:break-word;}
    .mk-bot{background:#141828;color:#c8cfe8;border:1px solid #1c2238;
      border-radius:12px 12px 12px 3px;align-self:flex-start;}
    .mk-user{background:linear-gradient(135deg,#4f7fff,#7b5fff);color:#fff;
      border-radius:12px 12px 3px 12px;align-self:flex-end;}
    .mk-msg a{color:#4f7fff;text-decoration:underline;}
    .mk-msg strong{font-weight:600;}
    .mk-typing{display:flex;gap:4px;align-items:center;padding:9px 12px;}
    .mk-typing span{width:6px;height:6px;border-radius:50%;background:#3a4260;}
    .mk-typing span:nth-child(1){animation:mkbounce .9s infinite;}
    .mk-typing span:nth-child(2){animation:mkbounce .9s infinite .15s;}
    .mk-typing span:nth-child(3){animation:mkbounce .9s infinite .3s;}
    @keyframes mkbounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
    #mk-booking{display:none;margin:0 12px 10px;padding:10px 12px;
      background:rgba(0,200,130,.07);border:1px solid rgba(0,200,130,.2);
      border-radius:8px;text-align:center;}
    #mk-booking p{font-size:12px;color:#7a85b0;margin-bottom:8px;}
    #mk-booking a{display:inline-block;background:linear-gradient(135deg,#4f7fff,#7b5fff);
      color:#fff;font-size:12px;font-weight:700;padding:7px 16px;
      border-radius:6px;text-decoration:none;transition:opacity .12s;}
    #mk-booking a:hover{opacity:.85;}
    #mk-footer{padding:10px 12px;border-top:1px solid #1c2238;display:flex;gap:8px;align-items:flex-end;}
    #mk-input{flex:1;background:#141828;border:1px solid #1c2238;border-radius:8px;
      color:#e4e8f8;font-size:13px;padding:8px 11px;outline:none;resize:none;
      max-height:80px;line-height:1.55;transition:border-color .12s;font-family:inherit;}
    #mk-input:focus{border-color:#4f7fff;}
    #mk-input::placeholder{color:#3a4260;}
    #mk-send{width:34px;height:34px;border-radius:7px;border:none;cursor:pointer;flex-shrink:0;
      background:linear-gradient(135deg,#4f7fff,#7b5fff);
      display:flex;align-items:center;justify-content:center;transition:opacity .12s;}
    #mk-send:hover{opacity:.85;}
    #mk-send svg{width:15px;height:15px;fill:#fff;}
    #mk-send:disabled{opacity:.4;cursor:not-allowed;}
    #mk-powered{text-align:center;padding:5px 0 7px;font-size:9px;color:#3a4260;letter-spacing:.4px;}
  `;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ── HTML ──────────────────────────────────────────────────────
  const wrapper = document.createElement("div");
  wrapper.id = "mk-widget";
  wrapper.innerHTML = `
    <button id="mk-bubble" aria-label="Open MarketKloud chat">
      <div id="mk-notif"></div>
      <svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>
    </button>
    <div id="mk-panel" role="dialog" aria-label="MarketKloud chat">
      <div id="mk-header">
        <div id="mk-header-left">
          <div id="mk-avatar">⚡</div>
          <div>
            <div id="mk-hname">MarketKloud AI</div>
            <div id="mk-hstatus"><span class="mk-dot"></span> Online · replies instantly</div>
          </div>
        </div>
        <button id="mk-close" aria-label="Close chat">×</button>
      </div>
      <div id="mk-messages"></div>
      <div id="mk-booking">
        <p>Ready to discuss your project?</p>
        <a id="mk-cal-link" href="#" target="_blank" rel="noopener">📅 Book a Free Discovery Call</a>
      </div>
      <div id="mk-footer">
        <textarea id="mk-input" rows="1" placeholder="Ask about our services…" aria-label="Type a message"></textarea>
        <button id="mk-send" aria-label="Send message">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
      <div id="mk-powered">Powered by MarketKloud AI</div>
    </div>`;
  document.body.appendChild(wrapper);

  // ── STATE ─────────────────────────────────────────────────────
  const state = {
    open: false,
    history: [],
    loading: false,
    calendlyUrl: "#",
  };

  // ── ELEMENTS ──────────────────────────────────────────────────
  const bubble   = document.getElementById("mk-bubble");
  const panel    = document.getElementById("mk-panel");
  const messages = document.getElementById("mk-messages");
  const input    = document.getElementById("mk-input");
  const sendBtn  = document.getElementById("mk-send");
  const closeBtn = document.getElementById("mk-close");
  const booking  = document.getElementById("mk-booking");
  const calLink  = document.getElementById("mk-cal-link");
  const notif    = document.getElementById("mk-notif");

  // ── INIT ──────────────────────────────────────────────────────
  fetch(API_URL + "/calendly")
    .then(r => r.json())
    .then(d => { state.calendlyUrl = d.url; calLink.href = d.url; })
    .catch(() => {});

  addMessage("bot", WELCOME);
  setTimeout(() => { notif.style.display = "block"; }, 1200);

  // ── TOGGLE ────────────────────────────────────────────────────
  function togglePanel() {
    state.open = !state.open;
    panel.classList.toggle("open", state.open);
    notif.style.display = "none";
    if (state.open) {
      scrollBottom();
      setTimeout(() => input.focus(), 220);
    }
  }

  bubble.addEventListener("click", togglePanel);
  closeBtn.addEventListener("click", togglePanel);

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (state.open && !wrapper.contains(e.target)) togglePanel();
  });

  // ── INPUT ─────────────────────────────────────────────────────
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  });
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 80) + "px";
  });
  sendBtn.addEventListener("click", send);

  // ── SEND ──────────────────────────────────────────────────────
  async function send() {
    const text = input.value.trim();
    if (!text || state.loading) return;

    addMessage("user", text);
    state.history.push({ role: "user", content: text });
    input.value = "";
    input.style.height = "auto";
    setLoading(true);

    try {
      const res = await fetch(API_URL + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: state.history }),
      });

      if (!res.ok) throw new Error("API error " + res.status);
      const data = await res.json();

      removeTyping();
      addMessage("bot", data.reply);
      state.history.push({ role: "assistant", content: data.reply });

      if (data.show_booking) {
        booking.style.display = "block";
      }
    } catch (err) {
      removeTyping();
      addMessage("bot", "Sorry, I'm having trouble connecting right now. Please try again in a moment, or email us directly.");
    }

    setLoading(false);
  }

  // ── HELPERS ───────────────────────────────────────────────────
  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = "mk-msg mk-" + role;
    div.innerHTML = formatText(text);
    messages.appendChild(div);
    scrollBottom();
  }

  function formatText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, "<br>");
  }

  function addTyping() {
    const div = document.createElement("div");
    div.className = "mk-msg mk-bot mk-typing";
    div.id = "mk-typing";
    div.innerHTML = "<span></span><span></span><span></span>";
    messages.appendChild(div);
    scrollBottom();
  }

  function removeTyping() {
    const t = document.getElementById("mk-typing");
    if (t) t.remove();
  }

  function setLoading(val) {
    state.loading = val;
    sendBtn.disabled = val;
    if (val) addTyping();
  }

  function scrollBottom() {
    messages.scrollTop = messages.scrollHeight;
  }
})();

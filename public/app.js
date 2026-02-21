(function () {
  "use strict";

  let currentMode = "chat";
  let isLoading = false;

  const chatArea = document.getElementById("chatArea");
  const promptInput = document.getElementById("promptInput");
  const sendBtn = document.getElementById("sendBtn");
  const modeNotice = document.getElementById("modeNotice");
  const modeBtns = document.querySelectorAll(".mode-btn");

  const PLACEHOLDERS = {
    chat: "Type a message...",
    image: "Describe the image to generate...",
  };

  const MODE_NOTICES = {
    chat: "",
    image: "",
  };

  // Mode switching
  modeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (isLoading) return;
      modeBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      currentMode = btn.dataset.mode;
      promptInput.placeholder = PLACEHOLDERS[currentMode];
      modeNotice.textContent = MODE_NOTICES[currentMode];
      promptInput.focus();
    });
  });

  // Auto-resize textarea
  promptInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 120) + "px";
  });

  // Send on Enter (Shift+Enter for newline)
  promptInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  sendBtn.addEventListener("click", send);

  function send() {
    var prompt = promptInput.value.trim();
    if (!prompt || isLoading) return;

    // Clear welcome message on first send
    var welcome = chatArea.querySelector(".welcome");
    if (welcome) welcome.remove();

    // Add user message
    addMessage(prompt, "user");

    // Clear input
    promptInput.value = "";
    promptInput.style.height = "auto";

    // Show loading
    isLoading = true;
    sendBtn.disabled = true;
    var loader = addTypingIndicator();

    // Make API call
    callApi(currentMode, prompt)
      .then(function (result) {
        loader.remove();
        renderResponse(currentMode, result);
      })
      .catch(function (err) {
        loader.remove();
        addMessage(err.message || "Something went wrong. Please try again.", "error");
      })
      .finally(function () {
        isLoading = false;
        sendBtn.disabled = false;
        promptInput.focus();
      });
  }

  function callApi(mode, prompt) {
    var endpoint = "/api/" + mode;

    if (mode === "image") {
      return fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt }),
      }).then(function (res) {
        if (!res.ok) {
          return res.json().then(function (data) {
            throw new Error(data.error || "Request failed");
          });
        }
        return res.blob().then(function (blob) {
          return { type: "image", url: URL.createObjectURL(blob) };
        });
      });
    }

    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt }),
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          throw new Error(data.error || "Request failed");
        }
        return { type: "text", content: data.response };
      });
    });
  }

  function renderResponse(mode, result) {
    if (result.type === "image") {
      var msg = createMessageEl("bot");
      var label = document.createElement("div");
      label.className = "label";
      label.textContent = "Meckman Bot";
      msg.appendChild(label);

      var img = document.createElement("img");
      img.src = result.url;
      img.alt = "Generated image";
      msg.appendChild(img);
      chatArea.appendChild(msg);
    } else {
      addBotMessage(result.content);
    }

    scrollToBottom();
  }

  function addMessage(text, type) {
    var msg = createMessageEl(type);
    msg.textContent = text;
    chatArea.appendChild(msg);
    scrollToBottom();
    return msg;
  }

  function addBotMessage(text) {
    var msg = createMessageEl("bot");

    var label = document.createElement("div");
    label.className = "label";
    label.textContent = "Meckman Bot";
    msg.appendChild(label);

    var content = document.createElement("div");
    content.textContent = text;
    msg.appendChild(content);

    chatArea.appendChild(msg);
    scrollToBottom();
  }

  function createMessageEl(type) {
    var div = document.createElement("div");
    div.className = "message " + type;
    return div;
  }

  function addTypingIndicator() {
    var indicator = document.createElement("div");
    indicator.className = "typing-indicator";
    for (var i = 0; i < 3; i++) {
      indicator.appendChild(document.createElement("span"));
    }
    chatArea.appendChild(indicator);
    scrollToBottom();
    return indicator;
  }

  function scrollToBottom() {
    chatArea.scrollTop = chatArea.scrollHeight;
  }
})();

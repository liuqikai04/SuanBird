export function startVoiceInput() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return Promise.reject(new Error("当前浏览器不支持语音输入。"));
  }

  return new Promise((resolve, reject) => {
    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      resolve(transcript.trim());
    };

    recognition.onerror = () => {
      reject(new Error("语音识别失败，请手动输入。"));
    };

    recognition.onnomatch = () => {
      reject(new Error("没有听清楚，请再试一次。"));
    };

    recognition.start();
  });
}

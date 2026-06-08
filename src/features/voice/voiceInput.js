export function startVoiceInput() {
  return createVoiceInputSession().result;
}

export function createVoiceInputSession() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    throw new Error("当前浏览器不支持语音输入。");
  }

  const recognition = new SpeechRecognition();
  let finalTranscript = "";
  let interimTranscript = "";
  let isSettled = false;
  let stoppedByUser = false;

  recognition.lang = "zh-CN";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  const result = new Promise((resolve, reject) => {
    recognition.onresult = (event) => {
      interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index]?.[0]?.transcript || "";
        if (event.results[index].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
    };

    recognition.onerror = () => {
      isSettled = true;
      reject(new Error("语音识别失败，请手动输入。"));
    };

    recognition.onnomatch = () => {
      isSettled = true;
      reject(new Error("没有听清楚，请再试一次。"));
    };

    recognition.onend = () => {
      if (isSettled) return;

      isSettled = true;
      const transcript = (finalTranscript || interimTranscript).trim();
      if (transcript) {
        resolve(transcript);
        return;
      }

      reject(
        new Error(stoppedByUser ? "没有识别到语音。" : "没有听清楚，请再试一次。")
      );
    };

    recognition.start();
  });

  return {
    result,
    stop() {
      stoppedByUser = true;
      recognition.stop();
    }
  };
}

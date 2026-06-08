import { createInputPanel } from "./components/InputPanel.js";
import { createResultCard } from "./components/ResultCard.js";
import { createHistoryStrip } from "./components/HistoryStrip.js";
import { createLoadingState } from "./components/LoadingState.js";
import { createToast } from "./components/Toast.js";
import { APP_NAME } from "./config/constants.js";
import {
  completeImageForResult,
  generateTextResult
} from "./features/generate/generateController.js";
import { exportResultImage } from "./features/export/exportImage.js";
import { createHistoryController } from "./features/history/historyController.js";
import { createVoiceInputSession } from "./features/voice/voiceInput.js";

const P1_MASCOT_IMAGE = new URL("./assets/mascot/p1-garlic-bird.svg", import.meta.url).href;

export function initApp(root) {
  const history = createHistoryController();
  const toast = createToast();
  const state = {
    currentResult: null,
    lastText: "",
    nextSourceType: "text",
    isLoading: false,
    activeRequestId: 0
  };

  root.innerHTML = `
    <main class="app-shell">
      <header class="app-header">
        <div class="brand-tape">
          <h1>${APP_NAME}</h1>
        </div>
        <p class="eyebrow">AI 即时解压表情包生成器</p>
        <p class="subhead">说一句糟心事，带走一张好笑图。</p>
        <div class="mascot-callout" aria-hidden="true">
          <img class="mascot-p1-image" src="${P1_MASCOT_IMAGE}" alt="" />
          <span>把长吐槽变成丑萌表情包！</span>
        </div>
      </header>

      <section class="mobile-flow" aria-label="吐槽生成工具">
        <div id="input-mount"></div>
        <div id="result-mount"></div>
        <section id="history-mount" class="history-section" aria-label="最近生成"></section>
      </section>
    </main>
  `;

  const inputMount = root.querySelector("#input-mount");
  const resultMount = root.querySelector("#result-mount");
  const historyMount = root.querySelector("#history-mount");

  const inputPanel = createInputPanel({
    onGenerate: handleGenerate,
    onVoice: handleVoiceInput
  });

  inputMount.append(inputPanel.element);
  document.body.append(toast.element);

  renderResult();
  renderHistory();

  async function handleGenerate(text, options = {}) {
    const value = text.trim();

    if (!value) {
      toast.show("先写一句想吐槽的事。");
      return;
    }

    state.lastText = value;
    const requestId = state.activeRequestId + 1;
    state.activeRequestId = requestId;
    const request = {
      text: value,
      styleSeed: options.styleSeed,
      templateProfileId: options.templateProfileId || "auto",
      sourceType: options.sourceType || state.nextSourceType,
      generateMode: options.generateMode || "vent",
      timestamp: Date.now()
    };
    state.isLoading = true;
    state.currentResult = null;
    inputPanel.setBusy(true);
    renderResult();

    try {
      const textResult = await generateTextResult(request);

      if (requestId !== state.activeRequestId) {
        return;
      }

      state.currentResult = textResult;
      history.add(textResult);
      state.nextSourceType = "text";
      state.isLoading = false;
      inputPanel.setBusy(false);
      renderResult();
      renderHistory();
      toast.show(
        textResult.imageGenerating
          ? "文案先出来了，图片还在生成。"
          : "生成好了，可以保存表情包。"
      );

      if (textResult.imageGenerating) {
        const finalResult = await completeImageForResult(textResult, request);

        if (requestId !== state.activeRequestId) {
          return;
        }

        state.currentResult = finalResult;
        history.add(finalResult);
        renderResult();
        renderHistory();
        toast.show(
          finalResult.imageError || "图片也生成好了，可以保存表情包。"
        );
      }
    } catch (error) {
      console.error(error);
      toast.show("生成出错了，已经切换到兜底结果。");
    } finally {
      if (requestId === state.activeRequestId) {
        state.isLoading = false;
        inputPanel.setBusy(false);
        renderResult();
        renderHistory();
      }
    }
  }

  function handleVoiceInput() {
    try {
      const session = createVoiceInputSession();
      toast.show("开始说吧，点停止结束。");

      return {
        stop: session.stop,
        result: session.result
          .then((transcript) => {
            if (transcript) {
              state.nextSourceType = "speech";
              toast.show("语音已转成文字。");
            }
            return transcript;
          })
          .catch((error) => {
            toast.show(error.message || "语音不可用，请手动输入。");
            return "";
          })
      };
    } catch (error) {
      toast.show(error.message || "语音不可用，请手动输入。");
      return {
        stop: null,
        result: Promise.resolve("")
      };
    }
  }

  async function handleSave(result) {
    try {
      await exportResultImage(result);
      toast.show("图片已保存。");
    } catch (error) {
      console.error(error);
      toast.show("保存失败，可以先截图兜底。");
    }
  }

  function handleRetry(result) {
    handleGenerate(result.text || state.lastText, {
      styleSeed: String(Date.now()),
      templateProfileId: result.requestedTemplateProfileId || result.templateProfileId || "auto",
      sourceType: result.sourceType || "text",
      generateMode: result.generateMode || "vent"
    });
  }

  function renderResult() {
    resultMount.replaceChildren();

    if (state.isLoading) {
      resultMount.append(createLoadingState());
      return;
    }

    if (state.currentResult) {
      resultMount.append(
        createResultCard(state.currentResult, {
          onSave: handleSave,
          onRetry: handleRetry,
          onEdit: handleEdit
        })
      );
      return;
    }
  }

  function handleEdit(result) {
    inputPanel.setValue(result.text || state.lastText);
    inputPanel.setGenerateMode(result.generateMode || "vent");
    inputPanel.setTemplateProfileId(
      result.requestedTemplateProfileId || result.templateProfileId || "auto"
    );
    inputPanel.element.scrollIntoView({ behavior: "smooth", block: "start" });
    toast.show("可以继续改这句槽点。");
  }

  function renderHistory() {
    historyMount.replaceChildren(
      createHistoryStrip(history.list(), {
        onSelect(result) {
          state.currentResult = result;
          inputPanel.setValue(result.text);
          inputPanel.setGenerateMode(result.generateMode || "vent");
          inputPanel.setTemplateProfileId(
            result.requestedTemplateProfileId || result.templateProfileId || "auto"
          );
          state.nextSourceType = result.sourceType || "text";
          renderResult();
          toast.show("已切回历史结果。");
        }
      })
    );
  }
}

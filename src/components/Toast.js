export function createToast() {
  const element = document.createElement("div");
  element.className = "toast";
  element.setAttribute("role", "status");
  let timer = null;

  function show(message) {
    element.textContent = message;
    element.classList.add("is-visible");

    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      element.classList.remove("is-visible");
    }, 2200);
  }

  return {
    element,
    show
  };
}

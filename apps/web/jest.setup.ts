import "@testing-library/jest-dom";

if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal ??= function showModal() {
    this.setAttribute("open", "");
  };

  HTMLDialogElement.prototype.close ??= function close() {
    this.removeAttribute("open");
  };
}

if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal ??= function showModal() {
    this.setAttribute("open", "");
  };

  HTMLDialogElement.prototype.close ??= function close() {
    this.removeAttribute("open");
  };
}

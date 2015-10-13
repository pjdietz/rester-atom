/* jshint node: true */
/* globals document */
"use strict";

var EventEmitter = require("events").EventEmitter,
    util = require("util");

// -----------------------------------------------------------------------------

/**
 * Modal view to display while a request is in progress.
 */
function ModalProgressView(serializedState) {
    var message = document.createElement("div"),
        buttonBlock = document.createElement("div"),
        button = document.createElement("button"),
        spinner = document.createElement("span"),
        view = this;

    EventEmitter.call(this);

    this.element = document.createElement("div");
    this.element.classList.add("rester-request-progress");

    spinner.classList.add("loading");
    spinner.classList.add("loading-spinner-tiny");
    spinner.classList.add("inline-block");
    this.element.appendChild(spinner);

    message.classList.add("message");
    message.classList.add("inline-block");
    message.textContent = "Requesting…";
    this.element.appendChild(message);

    button.classList.add("btn");
    button.classList.add("icon");
    button.classList.add("icon-x");
    button.classList.add("inline-block");
    button.textContent = "Cancel";

    buttonBlock.classList.add("block");
    buttonBlock.style.float = "right";
    buttonBlock.appendChild(button);
    this.element.appendChild(buttonBlock);

    button.addEventListener("click", function () {
        view.emit("cancel");
    });
}

util.inherits(ModalProgressView, EventEmitter);

ModalProgressView.prototype.serialize = function() {};

ModalProgressView.prototype.destroy = function() {
    return this.element.remove();
};

ModalProgressView.prototype.getElement = function() {
    return this.element;
};

// -----------------------------------------------------------------------------

module.exports = ModalProgressView;

/* jshint node: true */
/* globals document */
"use strict";

// -----------------------------------------------------------------------------

/**
 * Modal view to display while a request is in progress.
 */
function ModalProgressView(serializedState) {
    var message;
    this.element = document.createElement("div");
    this.element.classList.add("request-progress");
    message = document.createElement("div");
    message.classList.add("message");
    message.textContent = "Requesting…";
    this.element.appendChild(message);
}

ModalProgressView.prototype.serialize = function() {};

ModalProgressView.prototype.destroy = function() {
    return this.element.remove();
};

ModalProgressView.prototype.getElement = function() {
    return this.element;
};

// -----------------------------------------------------------------------------

module.exports = ModalProgressView;

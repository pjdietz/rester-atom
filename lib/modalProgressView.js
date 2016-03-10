'use strict';

const EventEmitter = require('events').EventEmitter;
const util = require('util');

// -----------------------------------------------------------------------------

class ModalProgressView extends EventEmitter {

    constructor(serializedState) {
        super();

        const message = document.createElement('div');
        const buttonBlock = document.createElement('div');
        const button = document.createElement('button');
        const spinner = document.createElement('span');

        this.element = document.createElement('div');
        this.element.classList.add('rester-request-progress');

        spinner.classList.add('loading');
        spinner.classList.add('loading-spinner-tiny');
        spinner.classList.add('inline-block');
        this.element.appendChild(spinner);

        message.classList.add('message');
        message.classList.add('inline-block');
        message.textContent = 'Requesting…';
        this.element.appendChild(message);

        button.classList.add('btn');
        button.classList.add('icon');
        button.classList.add('icon-x');
        button.classList.add('inline-block');
        button.textContent = 'Cancel';

        buttonBlock.classList.add('block');
        buttonBlock.style.float = 'right';
        buttonBlock.appendChild(button);
        this.element.appendChild(buttonBlock);

        button.addEventListener('click', () => {
            this.emit('cancel');
        });
    }

    serialize() {}

    destroy() {
        return this.element.remove();
    }

    getElement() {
        return this.element;
    }
}

// -----------------------------------------------------------------------------

module.exports = ModalProgressView;

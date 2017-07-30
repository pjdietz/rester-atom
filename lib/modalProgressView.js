'use strict';

const EventEmitter = require('events').EventEmitter;

// -----------------------------------------------------------------------------

class ModalProgressView extends EventEmitter {
    constructor(serializedState) {
        super();

        this.element = document.createElement('div');
        this.element.classList.add('rester-request-progress');

        let spinner = document.createElement('span');
        spinner.classList.add('loading');
        spinner.classList.add('loading-spinner-tiny');
        spinner.classList.add('inline-block');
        this.element.appendChild(spinner);

        let message = document.createElement('div');
        message.classList.add('inline-block');
        message.textContent = 'Requesting…';
        this.element.appendChild(message);

        let button = document.createElement('button');
        button.classList.add('btn');
        button.classList.add('icon');
        button.classList.add('icon-x');
        button.classList.add('inline-block');
        button.textContent = 'Cancel';

        let buttonBlock = document.createElement('div');
        buttonBlock.classList.add('block');
        buttonBlock.style.float = 'right';
        buttonBlock.style.position = 'relative';
        buttonBlock.style.top = '-4px';
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

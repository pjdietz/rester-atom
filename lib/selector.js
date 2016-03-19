'use strict';

class Selector {

    constructor(editor) {
        this.editor = editor;
    }

    getSelection() {
        if (this.hasSelection()) {
            return this.getSelectedText();
        }
        return this.editor.getText();
    }

    getSelectedText() {
        let text = "";
        let selections = this.editor.getSelections();
        for (let i = 0, u = selections.length; i < u; ++i) {
            let selection = selections[i];
            text += selection.getText();
        }
        return text;
    }

    hasSelection() {
        let selections = this.editor.getSelections();
        return selections.length > 1 || !selections[0].isEmpty();
    }
}

module.exports = Selector;

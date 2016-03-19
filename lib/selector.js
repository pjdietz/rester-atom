'use strict';

class Selector {

    constructor(editor) {
        this.editor = editor;
    }

    getSelection() {
        if (this.hasSelection()) {
            return this.getSelectedText();
        }
        return this.getDelimitedText();
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

    getDelimitedText() {
        let delimiterRows = this.getDelimiterRows();
        if (delimiterRows.length === 0) {
            return this.editor.getText();
        }
        let currentRow = this.getCurrentRow();

        let first = delimiterRows[0];
        if (currentRow < first) {
            return this.editor.getTextInBufferRange([[0, 0], [first, 0]]);
        }

        for (let i = 0; i < delimiterRows.length - 1; ++i) {
            let start = delimiterRows[i];
            let end = delimiterRows[i + 1];
            if (start <= currentRow && currentRow <= end) {
                return this.editor.getTextInBufferRange(
                    [[start + 1, 0], [end, 0]]
                );
            }
        }

        let last = delimiterRows[delimiterRows.length - 1];
        return this.editor.getTextInBufferRange(
            [[last + 1, 0], [this.editor.getLastBufferRow() + 1, 0]]
        );
    }

    getCurrentRow() {
        let cursor = this.editor.getCursorBufferPosition();
        return cursor.row;
    }

    getDelimiterRows() {
        let rows = [];
        this.editor.scan(/^-{3,}$/gm, (match) => {
            rows.push(match.range.start.row);
        });
        return rows;
    }

    hasSelection() {
        let selections = this.editor.getSelections();
        return selections.length > 1 || !selections[0].isEmpty();
    }
}

module.exports = Selector;

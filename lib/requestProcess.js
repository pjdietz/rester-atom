function RequestProcess(requestEditor, responseEditor) {
    this._requestEditor = requestEditor;
    this._responseEditor = responseEditor;
}

RequestProcess.prototype.run = function () {

};

/**
 * Return the selected text from an editor or the entire text, if no selection.
 *
 * When the editor contains multiple selections, the returned text will be the
 * contents of each selection concatenated together.
 *
 * @return {string} The selected text from the request editor.
 */
RequestProcess.prototype.getSelectedText = function (editor) {
    var selections = editor.getSelections(),
        selection,
        text = "",
        i, u;
    for (i = 0, u = selections.length; i < u; ++i) {
        selection = selections[i];
        text += selection.getText();
    }
    if (text.trim().length === 0) {
        return editor.getText();
    }
    return text;
};

exports.RequestProcess = RequestProcess;

var responseEditor;

function getSelectionOrText(editor) {
    var selection = editor.getSelectedText().trim();
    if (selection.length > 0) {
        return selection;
    }
    return editor.getText();
}

function displayResponse(response) {
    if (responseEditor) {
        try {
            if (!responseEditor.isEmpty()) {
                responseEditor.selectAll();
                responseEditor.delete();
            }
            responseEditor.insertText(response);
            responseEditor.scrollToTop();
        } catch (e) {
             responseEditor = null;
             displayResponse(response);
        }
    } else {
        atom.workspace.open(undefined, {
            split: "right"
        }).then(function (editor) {
            responseEditor = editor;
            responseEditor.insertText(response);
            responseEditor.scrollToTop();
        });
    }
}

// -----------------------------------------------------------------------------

module.exports = {
    activate: function() {
        atom.commands.add("atom-workspace", "rester:request", this.hello);
    },
    hello: function() {
        //var editor = atom.workspace.getActivePaneItem();
        var editor = atom.workspace.getActiveTextEditor();
        var text = getSelectionOrText(editor);
        displayResponse(text);
    }
};

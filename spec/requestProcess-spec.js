var RequestProcess = require("../lib/requestProcess").RequestProcess;

describe("RequestProcess", function () {

    describe("Selection", function () {

        var lines = [
            "POST http://localhost/path HTTP/1.1",
            "Host: localhost",
            "Content-type: text/plain",
            "",
            "This is the body",
            ""],
            text = lines.join("\n");

        beforeEach(function() {
            var editor;
            waitsForPromise(function() {
                var promise = atom.workspace.open();
                promise.then(function (editor) {
                    editor.setText(text);
                });
                return promise;
            });
        });

        it("includes entire buffer when no text is selected", function () {
            var editor = atom.workspace.getActiveTextEditor(),
                proc = new RequestProcess(editor),
                selection = proc.getSelectedText(editor);
            editor.setText(text);
            expect(selection).toEqual(text);
        });

        it("includes only selected lines when text is selected", function () {
            var editor = atom.workspace.getActiveTextEditor(),
                proc = new RequestProcess(editor),
                selection;
            editor.setCursorBufferPosition([0, 0]);
            editor.selectDown(2);
            selection = proc.getSelectedText(editor);
            expect(selection).toContain(lines.slice(0,2).join("\n"));
            expect(selection).not.toContain(lines.slice(3).join("\n"));
        });

        it("includes multiple selections concatenated", function () {
            var editor = atom.workspace.getActiveTextEditor(),
                proc = new RequestProcess(editor),
                selection;
            editor.setCursorBufferPosition([0, 0]);
            editor.addCursorAtBufferPosition([4, 0]);
            editor.selectToEndOfLine();
            selection = proc.getSelectedText(editor);
            expect(selection).toContain(lines[0]);
            expect(selection).not.toContain(lines[1]);
            expect(selection).not.toContain(lines[2]);
            expect(selection).toContain(lines[4]);
        });

    });

});

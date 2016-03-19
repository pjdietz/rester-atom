'use strict';

const Selector = require('../lib/selector');

const request = `
POST /path HTTP/1.1
Host: localhost:8080
Content-type: text/plain

This is the first line of the body.
This is the second line of the body.
`.trim();

const request1 = `
GET /path HTTP/1.1
Host: localhost:8080
`.trim();

const request2 = `
POST /path HTTP/1.1
Host: localhost:8080
Content-type: text/plain

This is the first line of the body.

--- This is just for decoration and is not a request delimieter ---

This is the second line of the body.
`.trim();

const request3 = `
DELETE /path HTTP/1.1
Host: localhost:8080
`.trim();

const delimitedRequests = `
${request1}

---

${request2}

--------------------------------------------------------------------------------

${request3}
`.trim();

describe('Selection', function () {
    beforeEach(function () {
        this.editor = undefined;
        waitsForPromise(() => { return atom.workspace.open(); });
    });
    describe('When there is no selection and no delimiters', function () {
        it('Includes entire buffer', function () {
            let editor = atom.workspace.getActiveTextEditor();
            editor.setText(request);
            let selector = new Selector(editor);
            let selection = selector.getSelection();
            expect(selection).toEqual(request);
        });
    });
    describe('When there is one selection', function () {
        it('Includes selected text', function () {
            let editor = atom.workspace.getActiveTextEditor();
            editor.setText(request);
            editor.setCursorBufferPosition([0, 0]);
            editor.selectDown(2);
            let selector = new Selector(editor);
            let selection = selector.getSelection();
            let lines = request.split('\n');
            expect(selection).toContain(lines.slice(0,2).join('\n'));
            expect(selection).not.toContain(lines.slice(3).join('\n'));
        });
    });
    describe('When there are multiple selections', function () {
        it('Includes selected text', function () {
            let editor = atom.workspace.getActiveTextEditor();
            editor.setText(request);
            editor.setCursorBufferPosition([0, 0]);
            editor.addCursorAtBufferPosition([4, 0]);
            editor.selectToEndOfLine();
            let selector = new Selector(editor);
            let selection = selector.getSelection();
            let lines = request.split('\n');
            expect(selection).toContain(lines[0]);
            expect(selection).not.toContain(lines[1]);
            expect(selection).not.toContain(lines[2]);
            expect(selection).toContain(lines[4]);
        });
    });
    describe('When there editor contains request delimiters', function () {
        let editor;
        let selection;
        beforeEach(function () {
            editor = atom.workspace.getActiveTextEditor();
            editor.setText(delimitedRequests);
        });
        describe('And the cursor is located in a request that ends with a delimiter', function () {
            beforeEach(function () {
                editor.setCursorBufferPosition([0, 0]);
                let selector = new Selector(editor);
                selection = selector.getSelection();
            });
            it('Includes the delimited request', function () {
                expect(selection).toContain(request1);
            });
            it('Does not include the other requests', function () {
                expect(selection).not.toContain(request2);
                expect(selection).not.toContain(request3);
            });
            it('Does not include delimiter', function () {
                expect(selection).not.toMatch(/^-{3,}$/gm);
            });
        });
        describe('And the cursor is located in a request that start with a delimiter', function () {
            beforeEach(function () {
                editor.setCursorBufferPosition([17, 0]);
                let selector = new Selector(editor);
                selection = selector.getSelection();
            });
            it('Includes the delimited request', function () {
                expect(selection).toContain(request3);
            });
            it('Does not include the other requests', function () {
                expect(selection).not.toContain(request1);
                expect(selection).not.toContain(request2);
            });
            it('Does not include delimiter', function () {
                expect(selection).not.toMatch(/^-{3,}$/gm);
            });
        });
        describe('And the cursor is located between two delimiters', function () {
            beforeEach(function () {
                editor.setCursorBufferPosition([10, 0]);
                let selector = new Selector(editor);
                selection = selector.getSelection();
            });
            it('Includes the delimited request', function () {
                expect(selection).toContain(request2);
            });
            it('Does not include the other requests', function () {
                expect(selection).not.toContain(request1);
                expect(selection).not.toContain(request3);
            });
            it('Does not include delimiter', function () {
                expect(selection).not.toMatch(/^-{3,}$/gm);
            });
        });

    });
});

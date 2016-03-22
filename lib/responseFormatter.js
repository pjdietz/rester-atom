'use strict';

class ResponseFormatter {

    constructor(transaction, configuration) {
        this.transaction = transaction;
        this.configuration = configuration;
        this.applyConfigurtionAliases();
    }

    applyConfigurtionAliases() {
        if (this.configuration.hideHeaders) {
            this.configuration.showHeaders = false;
        }
        if (this.configuration.hideRedirects) {
            this.configuration.showRedirects = false;
        }
    }

    format() {
        if (!this.configuration.showHeaders) {
            return this.getResponseBodyOnly();
        }
        let responses;
        if (this.configuration.showRedirects) {
            responses = this.transaction.responses;
        } else {
            responses = [this.transaction.getResponse()];
        }
        let output = '';
        for (let i = 0, u = responses.length; i < u; ++i) {
            output += responses[i];
            if (i + 1 < u) {
                output += '\n--- [redirect] ---\n\n';
            }
        }
        return output;
    }

    getResponseBodyOnly() {
        let response = this.transaction.getResponse();
        let index = response.indexOf('\n\n');
        if (index > -1) {
            return response.slice(index + 2);
        }
        index = response.indexOf('\r\n\r\n');
        if (index > -1) {
            return response.slice(index + 4);
        }
        return '';
    }


}

module.exports = ResponseFormatter;

# RESTer for Atom

[![Travis](https://img.shields.io/travis/pjdietz/rester-atom.svg?style=flat-square)](https://travis-ci.org/pjdietz/rester-atom)

HTTP client for Atom

RESTer is a text-based HTTP client that allows you to author HTTP requests in Atom and view the responses in a new tab.

## Using

A request can be as simple as a URI:

```
http://localhost:8080/path
```

Or, you can send headers and a body:

```
PUT /my-endpoint HTTP/1.1
Host: api.my-example-site.com
Accept: text/plain
Accept-Charset: utf-8
X-custom-header: whatever you want

Here is the payload for the PUT request. The body is anything that follows the first empty line.
```

To run the request, run the `Rester: Request` command or press `Opt` + `Cmd` +  + `r`. The response will appear in a new tab.

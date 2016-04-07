# RESTer for Atom

[![Travis](https://img.shields.io/travis/pjdietz/rester-atom.svg?label=travis&style=flat-square)](https://travis-ci.org/pjdietz/rester-atom)
[![AppVeyor](https://img.shields.io/appveyor/ci/pjdietz/rester-atom.svg?label=appveyor&style=flat-square)](https://ci.appveyor.com/project/pjdietz/rester-atom)
[![GitHub license](https://img.shields.io/github/license/pjdietz/rester-atom.svg?style=flat-square)](LICENSE.md)

RESTer is a text-based HTTP client that allows you to make HTTP requests in Atom and view the responses in a new tab.

![Demo](https://raw.githubusercontent.com/pjdietz/rester-atom/master/demo.gif)

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

To run the request, open the Command Palette and run the `Rester: Request` command or press ⌥-⌘-r. The response will appear in a new tab.

## Making Requests

### The Request Line

The first non-empty, non-comment (`//` or `#`) line is the "request line". RESTer parses this to determine the method, URI, and protocol.

You may include the hostname in the request line, but RESTer does not require it. If omitted, be sure to include a Host header.

Here are some example request lines (some with Host headers):

```
GET /my-endpoint HTTP/1.1
Host: api.my-example-site.com
```

```
GET /my-endpoint
Host: api.my-example-site.com
```

```
GET http://api.my-example-site.com/my-endpoint
```

```
http://api.my-example-site.com/my-endpoint
```

Because GET is the default method, each of these will have the same effect.

### Headers

RESTer parses the lines immediately following the request line up to the first empty line as headers. Use the standard field-name: field-value format.

```
GET /path HTTP/1.1
Host: localhost:8080
Cache-control: no-cache
If-Modified-Since: Mon, 8 Sept 2014 13:0:0 GMT
```

### Query Parameters

For requests with many query parameters, you may want to spread your query across a number of lines. RESTer will parse any lines in the headers section that begin with `?` or `&` as query parameters. You may use `=` or `:` to separate the key from the value.

The following example requests are equivalent:

All in the URI:

```
http://api.my-example-site.com/?cat=molly&dog=bear
```

With new lines:

```
http://api.my-example-site.com/
?cat=molly
&dog=bear
```

Indented, using colons, and only using `?`:

```
http://api.my-example-site.com/
    ? cat: molly
    ? dog: bear
```

Percent Encoding

RESTer assumes that anything you place directly in the request line is the way you want it, but query parameters added on individual lines are assumed to be in plain text. So, values of query parameters added on individual lines will be percent encoded.

These requests are equivalent:

```
http://api.my-example-site.com/?item=I%20like%20spaces
```

```
http://api.my-example-site.com/
    ? item: I like spaces
```

### Comments

Include comments in your request by adding lines in the headers section that begin with `#` or `//`. RESTer will ignore these lines.

```
GET /my-endpoint HTTP/1.1
Host: /api.my-example-site.com
# This is a comment.
// This is also a comment.
Cache-control: no-cache
```

### Body

To supply a message body for POST and PUT requests, add an empty line after the last header. RESTer will treat all content that follows the blank line as the request body.

Here's an example of adding a new cat representation by supplying JSON:

```
POST http://api.my-example-site.com/cats/
Content-type: application/json

{
    "name": "Molly",
    "color": "Calico",
    "nickname": "Mrs. Puff"
}
```

#### Forms

To submit a form (i.e., `application/x-www-form-urlencoded`), include the `@form` option in the header section. This option instructs RESTer to add the appropriate `Content-type` header and encode the body as a form.

Include the key-value pairs on separate lines. You may use `=` or `:` to separate the key from the value. As with query parameters, whitespace around the key and value is ignored.

Examples:

```
POST http://api.my-example-site.com/cats/
@form

name=Molly
color=Calico
nickname=Mrs. Puff
```

```
POST http://api.my-example-site.com/cats/
@form

      name: Molly
     color: Calico
  nickname: Mrs. Puff
```

#### Multiline Values

Use delimiters to mark the boundaries of multiline field values. By default, the delimiters are `"""`. You may customize these in the settings for the package.

Here's an example of a request using mixed single- and multiline fields.

```
POST http://api.my-example-site.com/cats/
@form

name: Molly
color: Calico
nickname: Mrs. Puff
extra: """{
    "id": 2,
    "description": "This JSON snippet is wrapped in delimiters because it has multiple lines."
}"""
```

### Options

To customize RESTer's behavior for a single request, include options in the header section. An option begins with `@` and may or may not include a value. For example, to instruct RESTer to include redirect responses in the output, include `@showRedirects` like this:

```
GET http://localhost:8080/path-that-redirects
@showRedirects: true
```

Boolean `true` options can also be expressed with a shorthand syntax by including the option key without the `:` and value. This is equivalent:

```
GET http://localhost:8080/path-that-redirects
@showRedirects
```

Some options accept strings or arrays as values. For example:

```
GET http://localhost:8080/path-that-redirects
@hideHeaders
@responseGrammar: JSON
@responseCommands: ["jsonpp:jsonpp"]
```

The following is a list of options that RESTer expects:

| Option               | Type    | Description                                                                    |
|:---------------------|:--------|:-------------------------------------------------------------------------------|
| @auth                | string  | Auth segment for the request (e.g., "user", "user:password")                   |
| @followRedirects     | boolean | Allow RESTer to automatically follow redirects                                 |
| @form                | boolean | Parse the body as a form and include the appropriate `Content-type` header     |
| @hideHeaders         | boolean | Alias for `@showHeaders: false`                                                |
| @hideRedirects       | boolean | Alias for `@showRedirects: false`                                              |
| @hostname            | string  | Hostname for the request (e.g., "localhost")                                   |
| @port                | int     | Port for the request (e.g., 8080)                                              |
| @protocol            | string  | Protocol for the request. Must be "http" or "https"                            |
| @redirectStatusCodes | array   | List of status codes to automatically follow redirects for                     |
| @responseCommands    | array   | List of Atom commands to run on the response body after receiving the response |
| @responseGrammar     | string  | Name of the grammar to use to when displaying the response                     |
| @showHeaders         | boolean | Include status line and headers in the responses                               |
| @showRedirects       | boolean | Include intermediate responses in the output for requests with redirects       |

## Grammar

RESTEr provides a grammar named "HTTP Message" that indicates the various portions of an HTTP request or response, as well as some RESTer-specific elements like comments and options. To use this grammar for your requests, name your files with the `.http` or `.rester` extension, or select "HTTP Message" as the grammar.

## Multiple Requests Per File

You may want to group numerous requests in the same file. RESTer recognizes any line containing three or more hyphens (and no other characters) as a delimiter between requests. Place the cursor anywhere on a request, and RESTer will invoke only the request between these delimiters.

Example syntax:

```
GET http://localhost:8080/cats

---

POST http://localhost:8080/cats
Content-type: application/json

{
    "name": "Molly"
}

------------------------------------

DELETE http://localhost:8080/cats/1
```

## Contributing

If you're interested in contributing to RESTer, please note that heart of RESTer exists as its own Node.js package [RESTer Client](https://github.com/pjdietz/rester-client). This package contains the logic for parsing, issuing, and responding to requests. I've split this out as a separate project with the intent of releasing other clients (CLI, Sublime Text, etc.) based on the same core code base. So, depending on the feature you wish to add or modify, you may want to look at [this repository](https://github.com/pjdietz/rester-atom) or the core [RESTer Client](https://github.com/pjdietz/rester-client) repository.

## Author

**PJ Dietz**

- [http://pjdietz.com](http://pjdietz.com)
- [http://github.com/pjdietz](http://github.com/pjdietz)
- [http://twitter.com/pjdietz](http://twitter.com/pjdietz)

## Copyright and license

Copyright 2016 by PJ Dietz

[MIT License](LICENSE)

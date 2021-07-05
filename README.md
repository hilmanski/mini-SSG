Currently on Development

# Mini SSG [Alpha]
Simple static site generator, to prevent your write DRY HTML files.

## Feature
Import partial code
```
@import(fileName) //no need to write extension -> .html
```

## Examples

Put reuseable/partial code in _partials
```
-> dev/_partials/header.html
or
-> dev/_partials/footer.html
```

To use in HTML files
```
-> dev/pages/index.html
@ssg-import(header)
<h1>index page</h1>
<p>this is index page</p>
@ssg-import(footer)
```

## Usage
Write your HTML files in `/dev/pages`  
Use "import feature" above where you can reuse code in `dev/_partials`  
Run `node src/index.js`  
Your production files are in `/public` folder

## Todo / Plan
- [ ]Prevent string "@ssg-improt()"  rendered as code.	
- [ ]Meta and social share info
- [ ]work with markdown
- [X]partial
- [ ]template 

## Beta (later)
- Minify everything
- Live server
- watch changes
- SaaS support



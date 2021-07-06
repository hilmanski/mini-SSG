Currently on Development

# Mini SSG [Alpha]
Simple static site generator, to prevent your write DRY HTML files.  
Built with Nodejs  
Inspired by Laravel Blade Template and Sergey.cool SSG

## Feature

You don't have to use everything or anything at all, it's all up to you

1. Use layout   
layout must be on top of the file and only one per page
```
@layout(base) //no need to write extension -> .html
```

2. Import partial code
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
@import(header)
<h1>index page</h1>
<p>this is index page</p>
@import(footer)
```


## Usage
Write your HTML files in `/dev/pages`  
Use "import feature" above where you can reuse code in `dev/_partials`  
Run `node src/index.js`  
Your production files are in `/public` folder

## Todo / Alpha Plan
- [X] partial
- [X] Prevent string "@import()"  rendered as code.	
- [X] template 
- [ ] slots
- [ ] Meta and social share info
- [ ] work with markdown
- [ ] work with subfolders
- [ ] simple website to demo everything
- [ ] npm command to init folder and file as base
- [ ] Publish as package at npm

## Todo (much later)
- Minify everything
- Live server
- watch changes
- SaaS support



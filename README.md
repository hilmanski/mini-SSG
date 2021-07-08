Currently on Development

# Mini SSG [Alpha]
Simple static site generator, to prevent you write DRY HTML files.  
Built with Nodejs  
Inspired by Laravel Blade Template and Sergey.cool SSG

## Feature

You don't have to use everything or anything at all, it's all up to you

1. Use layout   
layout must be on top of the file and only one per page
```
@layout(base) //no need to write extension -> .html
```

Attach code on layout with part  
1a. Simple part (for text only) 
```
//On page
@section(title, this is title)

//On layout
@attach(title)
```

1b. Complex part (For html element)
```
//On page
@section(content)
	<div> this is content </div>
@endsection

//On Layout
@attach(content)
```

3. Import partial code
```
@import(fileName) //no need to write extension -> .html
```

4. Import can contains other import

5. Work on 1Lvl subfolder too

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
others coming soon...

## Caveat
If you write any of "mini-ssg" syntax above, put it on code tag
```
<code> @import(header) </code>
```
It won't be rendered as partial layout

**Reserved Syntax**
```
@layout
@attach
@section .. @endsection
@import
@component .. @endcomponent
@slot @endslot
```

## dependency
```
chokidar
finalhandler
serve-static
string-minify
```

## Usage
Write your HTML files in `/dev/pages`  
Use "import feature" above where you can reuse code in `dev/_partials`  
Run `node src/index.js`  
Your production files are in `/public` folder

## Todo / Alpha Plan
- [X] partial / import
- [X] Prevent string "@import()"  rendered as code.	
- [X] template (layout)
- [X] simple attach/section with 2nd parameter as value
- [X] slots -> inject text or div in component
- [ ] work with markdown (not sure if this needed)
- [X] work with subfolders
- [X] generate assets folder
- [ ] Better error msg if any typo on syntax / not match
- [ ] simple website to demo everything
- [X] Publish as package at npm
- [X] @attach(1, defaultValue) //if not included
- [ ] npm command to init folder and file as base
- [X] Live server
- [X] watch changes
- [ ] Live Reload
- [ ] Only 'related change' need to re-render (idea: create meta-temp-folder)
- [ ] SASS/SCSS support
- [ ] Automate test
- [X] Minify everything (CSS, JS, HTML)



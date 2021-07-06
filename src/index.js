const fs = require('fs');

const pageDir = "./dev/pages"
const layoutDir = "./dev/_layouts"
const partialDir = "./dev/_partials"

//Get pages
const pages = fs.readdirSync(pageDir)

const patterns = {
	import: /@import\((.*?)\)/g,
	importIncludeCodeTag: /(<code>(?:[^<](?!\/code))*<\/code>)|@import\((.*?)\)/gi,
	layout: /@layout\((.*?)\)/g,
	layoutIncludeCodeTag: /(<code>(?:[^<](?!\/code))*<\/code>)|@layout\((.*?)\)/gi,
	attach: /@attach\((.*?)\)/g,
	attachIncludeCodeTag: /(<code>(?:[^<](?!\/code))*<\/code>)|@attach\((.*?)\)/gi,
}

//Loop all pages
pages.forEach(function(page) {
	//get & render contents
	const content = _readFile(`${pageDir}/${page}`)
	const renderedContent = renderPage(content)

	//save to new Dir
	fs.writeFileSync(`./public/${page}`, renderedContent)
})


function renderPage(content) {

	//----0. RENDER LAYOUT----
	const layoutLabel = content.match(patterns.layout)
	if(layoutLabel != null) {
		content = content.replace(patterns.layoutIncludeCodeTag, renderTag.bind(this, 'layout'))
	}

	//----1. RENDER ATTACH AND SECTION PAGE----
	const attachLabels = content.match(patterns.attach)
	if(attachLabels != null) {
		attachLabels.forEach(function(match){
			content = content.replace(patterns.attachIncludeCodeTag, renderLayout.bind(this, content))
		})
		//remove section tag...
			//=> to endsection
	}
	
	//----2. RENDER _IMPORT PAGE----
	const importLabels = content.match(patterns.import)
	if(importLabels == null)
		return content
	
	importLabels.forEach(function(match){
		content = content.replace(patterns.importIncludeCodeTag, renderTag.bind(this, 'import'))
	})

	return content
}

function renderTag(type, text) {
	//If in <code> tag, return plain
	if(text.includes('<code>'))
		return text

	const fileName = getCompleteFileName(text, type)
	const content = _readFile(fileName)
	return content
}

function renderLayout(content, text) {
	let attachName = getTagContent(text)
	if(text.includes('<code>'))
		return text

	//TODO: can you make regex more dynamic 
		//Makei it depend on variable needed(attachName)
	const patternBetweenSection = /(?<=@section)([\S\s]*?)(?=@endsection)/g
	const matchSection = content.match(patternBetweenSection).filter(
						item => item.startsWith("(" + attachName)
					)[0].split(")")[1]
	
	return matchSection
}

function _readFile(filename) {
	return fs.readFileSync(filename).toString()
}

function getCompleteFileName(text, type) {
	let filename = getTagContent(text)
	switch(type) {	
		case 'import':
			return `${partialDir}/${filename}.html`
		break
		case 'layout':
			return `${layoutDir}/${filename}.html`
		break
		default:
			console.log('No type file matched.')
		break;
	}
}

function getTagContent(tag){
	return tag.split("(")[1].replace(")","")
}
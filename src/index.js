const fs = require('fs');

const pageDir = "./dev/pages"
const layoutDir = "./dev/_layouts"
const partialDir = "./dev/_partials"

//Get pages
const pages = fs.readdirSync(pageDir)

//Todo: can you remove "WithcodeTag"? 
	//can it be auto ignore whats inside code tag
const patterns = {
	import: /@import\((.*?)\)/g,
	importWithCodeTag: /(<code>(?:[^<](?!\/code))*<\/code>)|@import\((.*?)\)/gi,
	layout: /@layout\((.*?)\)/g,
	layoutWithCodeTag: /(<code>(?:[^<](?!\/code))*<\/code>)|@layout\((.*?)\)/gi,
	attach: /@attach\((.*?)\)/g,
	attachWithCodeTag: /(<code>(?:[^<](?!\/code))*<\/code>)|@attach\((.*?)\)/gi,
	part : /(@part)([\S\s]*?)(@endpart)/gi,
	partWithCodeTag : /(<code>(?:[^<](?!\/code))*<\/code>)|(@part)([\S\s]*?)(@endpart)/gi,
	simplePart: /(@part\()(.*),(.*)(\))/g,
	simplePartWithCodeTag: /(<code>(?:[^<](?!\/code))*<\/code>)|(@part\()(.*),(.*)(\))/gi
}

//Loop all pages
pages.forEach(function(page) {
	//get & render contents
	const item = `${pageDir}/${page}`

	// if(fs.statSync(item).isDirectory()) {
	// 	//if current item is a Dir
	// 	//do somethings / loop again
	// }

	const content = _readFile(item)
	const renderedContent = renderPage(content)

	//save to new Dir
	fs.writeFileSync(`./public/${page}`, renderedContent)
})


function renderPage(content) {

	//--------------------------------
	//----0. RENDER LAYOUT------------
	const layoutLabel = content.match(patterns.layout)
	if(layoutLabel != null) {
		content = content.replace(patterns.layoutWithCodeTag, renderTag.bind(this, 'layout'))
	}

	//-------------------------------------
	//----1. RENDER simple part/attach ----
	const simplePartLabels = content.match(patterns.simplePart)
	if(simplePartLabels != null) {
		simplePartLabels.forEach(function(match){
			content = content.replace(patterns.attachWithCodeTag, renderSimplePart.bind(this, content))
		})

		//remove simple part
		content = content.replace(patterns.simplePart, "")
	}

	//-----------------------------------------
	//----2. RENDER ATTACH AND SECTION PAGE----
	const attachLabels = content.match(patterns.attach)
	if(attachLabels != null) {
		attachLabels.forEach(function(match){
			content = content.replace(patterns.attachWithCodeTag, renderLayout.bind(this, content))
		})

		//remove all section tags
		content = content.replace(patterns.part, "")
	}
	
	//--------------------------------
	//----3. RENDER _IMPORT PAGE----
	const importLabels = content.match(patterns.import)
	if(importLabels == null)
		return content
	
	importLabels.forEach(function(match){
		content = content.replace(patterns.importWithCodeTag, renderTag.bind(this, 'import'))
	})

	return content.trim()
}


function renderTag(type, text) {
	// console.log('>>tag--')
	// console.log(text)
	// console.log('--tag<<')
	//If in <code> tag, return plain
	if(text.includes('<code>'))
		return text

	const fileName = getCompleteFileName(text, type)
	const content = _readFile(fileName)
	return content
}


function renderSimplePart(content, text) {
	//If in <code> tag, return plain
	if(text.includes('<code>'))
		return text

	const attachName = getTagContent(text.split(',')[0])
	
	const patternBetweenPart = /(?<=@part\()(.*),(.*)(?=\))/g
	const matchPart = content.match(patternBetweenPart).filter(
							item => item.startsWith(attachName) 
						)[0]
	
	//Since attach can include both simple and not simple part
		//we need to make an exception
	if(matchPart == undefined)
		return text

	const value = matchPart.split(',')[1].trim()
	return value
}

function renderLayout(content, text) {
	let attachName = getTagContent(text) 
	if(text.includes('<code>'))
		return text

	//TODO: can you make regex more dynamic 
		//Makei it depend on variable needed(attachName)
	const patternBetweenPart = /(?<=@part)([\S\s]*?)(?=@endpart)/g
	const matchPart = content.match(patternBetweenPart).filter(
						item => item.startsWith("(" + attachName) 
					)[0]

	if(matchPart == undefined) return text;

	const partContent = matchPart.split(")")[1]
	return partContent
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
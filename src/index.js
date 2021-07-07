const fs = require('fs');

const pageDir = "./dev/pages"
const layoutDir = "./dev/_layouts"
const partialDir = "./dev/_partials"

const patterns = {
	codeTag: /(<code>(?:[^<](?!\/code))*<\/code>)/g,
	import: /@import\((.*?)\)/g,
	layout: /@layout\((.*?)\)/g,
	attach: /@attach\((.*?)\)/g,
	part : /(@part)([\S\s]*?)(@endpart)/gi,
	simplePart: /(@part\()(.*?),(.*?)(\))/g,
}

let codeTagHolder = []

//Get and Loop pages
const pages = fs.readdirSync(pageDir)
pages.forEach(function(page) {
	runFileGenerator(`${pageDir}/${page}`, page)
})

function runFileGenerator(item, fileName) {
	//Check if it's a directory
	if(fs.statSync(item).isDirectory()) {
		return runSubFolderGenerator(item)
	}

	const rawContent = readFile(item)
	const renderedContent = renderPage(rawContent)

	//save to new Dir
	fs.writeFileSync(`./public/${fileName}`, renderedContent)
}

function runSubFolderGenerator(item) {
	const subFolder = item.split('/')[item.split('/').length - 1]
	const subPages = fs.readdirSync(item)

	//make dir if not exists
	if (!fs.existsSync(`./public/${subFolder}`)){
	    fs.mkdirSync(`./public/${subFolder}`);
	}

	subPages.forEach(function(page) {
		runFileGenerator(`${pageDir}/${subFolder}/${page}`, `${subFolder}/${page}`)
	})
	return
}

function renderPage(content) {
	
	//Mask any code tags
	codeTagHolder = [] //always empty for new file
	content = maskCodeTag(content)

	//Render Layout
	const layoutLabel = content.match(patterns.layout)
	if(layoutLabel != null) {
		content = content.replace(patterns.layout, renderTag.bind(this, 'layout'))
	}
	content = maskCodeTag(content)

	//Render simple part
	const simplePartLabels = content.match(patterns.simplePart)
	if(simplePartLabels != null) {
		simplePartLabels.forEach(function(match){
			content = content.replace(patterns.attach, renderSimplePart.bind(this, content))
		})

		content = content.replace(patterns.simplePart, '')
	}

	//Render complex part / swap attach & part
	const attachLabels = content.match(patterns.attach)
	if(attachLabels != null) {
		attachLabels.forEach(function(match){
			content = content.replace(patterns.attach, renderLayout.bind(this, content))
		})

		content = content.replace(patterns.part, '')
	}

	//Render Import pages
	const importLabels = content.match(patterns.import)
	if(importLabels == null)
		return content
	
	importLabels.forEach(function(match){
		content = content.replace(patterns.import, renderTag.bind(this, 'import'))
	})

	content = unMaskCodeTag(content)
	return content.trim()
}

function maskCodeTag(content) {
	const codeTags = content.match(patterns.codeTag)
	if(codeTags != null) {
		codeTags.forEach(function(match){
			let newHolder = 'nr-' + Math.floor(Math.random() * 99999)
			codeTagHolder[newHolder] = match
			content = content.replace(match, newHolder)
		})
	}

	return content
}

function unMaskCodeTag(content) {
	if(codeTagHolder != null) 
		for (const [key, value] of Object.entries(codeTagHolder)) {
		  content = content.replace(key, value)
		}

	return content
}

function renderTag(type, text) {
	const fileName = getCompleteFileName(text, type)
	const content = readFile(fileName)
	return content
}

function renderSimplePart(content, text) {
	const attachName = getTagContent(text.split(',')[0])
	
	const patternBetweenPart = /(?<=@part\()(.*),(.*)(?=\))/g
	const matchPart = content.match(patternBetweenPart).filter(
							item => item.startsWith(attachName) 
						)[0]
	
	//Since attach can include both simple & not simple part
		//we need to make an exception
	if(matchPart == undefined)
		return text

	const value = matchPart.split(',')[1].trim()
	return value
}

function renderLayout(content, text) {
	const attachName = getTagContent(text) 
	const patternBetweenPart = /(?<=@part)([\S\s]*?)(?=@endpart)/g

	const matchPart = content.match(patternBetweenPart).filter(
						item => item.startsWith("(" + attachName) 
					)[0]

	if(matchPart == undefined) return text;

	const partContent = matchPart.replace(`(${attachName})`,'')
	return partContent
}

function readFile(filename) {
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
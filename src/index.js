const fs = require('fs');

const dir = {
	page : "./dev/pages",
	layout : "./dev/_layouts",
	partial : "./dev/_partials",
	component : "./dev/_components"	,
}

const patterns = {
	codeTag: /(<code>(?:[^<](?!\/code))*<\/code>)/g,
	import: /@import\((.*?)\)/g,
	layout: /@layout\((.*?)\)/g,
	attach: /@attach\((.*?)\)/g,
	section : /(@section)([\S\s]*?)(@endsection)/gi,
	simpleSection: /(@section\()(.*?),(.*?)(\))/g,
	component: /(@component)([\S\s]*?)(@endcomponent)/g,
	slot: /(@slot)([\S\s]*?)(@endslot)/g,
}

let codeTagHolder = []

//Get and Loop pages
const pages = fs.readdirSync(dir.page)
pages.forEach(function(page) {
	runFileGenerator(`${dir.page}/${page}`, page)
})

function runFileGenerator(item, fileName) {
	//Check if it's a directory
	if(fs.statSync(item).isDirectory()) {
		return runSubFolderGenerator(item)
	}

	codeTagHolder = [] //always empty for new file
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
		runFileGenerator(`${dir.page}/${subFolder}/${page}`, `${subFolder}/${page}`)
	})
	return
}

function renderPage(content) {
	
	//Render Layout
	const layoutLabel = content.match(patterns.layout)
	if(layoutLabel != null) {
		content = content.replace(patterns.layout, renderTag.bind(this, 'layout'))
	}
	content = maskCodeTag(content)

	//Render simple section
	const simpleSectionLabels = content.match(patterns.simpleSection)
	if(simpleSectionLabels != null) {
		simpleSectionLabels.forEach(function(match){
			content = content.replace(patterns.attach, renderSimpleSection.bind(this, content))
		})

		content = content.replace(patterns.simpleSection, '')
	}

	//Render complex section / swap attach & section
	const attachLabels = content.match(patterns.attach)
	if(attachLabels != null) {
		attachLabels.forEach(function(match){
			content = content.replace(patterns.attach, renderLayout.bind(this, content))
		})

		content = content.replace(patterns.section, '')
	}

	//Render Import pages
	const importLabels = content.match(patterns.import)
	if(importLabels != null) {
		importLabels.forEach(function(match){
			content = content.replace(patterns.import, renderTag.bind(this, 'import'))
		})
	}

	//Render components
	const componentLabels = content.match(patterns.component)
	if(componentLabels != null) {
		componentLabels.forEach(function(match){
			content = content.replace(patterns.component, renderComponent.bind(this, content))
		})
	}

	return unMaskCodeTag(content.trim())
}

function maskCodeTag(content) {
	const codeTags = content.match(patterns.codeTag)
	if(codeTags != null) {
		codeTags.forEach(function(match){
			let newHolder = 'code-nr-' + Math.floor(Math.random() * 99999)
			codeTagHolder[newHolder] = match
			content = content.replace(match, newHolder)
		})
	}

	return content
}

function unMaskCodeTag(content) {
	if(codeTagHolder != null)  {
		for (const [key, value] of Object.entries(codeTagHolder)) {
		  content = content.replace(key, value)
		}
	}

	return content
}

function renderTag(type, text) {
	const fileName = getCompleteFileName(text, type)
	const content = readFile(fileName)
	return content
}

function renderSimpleSection(content, text) {
	const attachName = getTagContent(text.split(',')[0])
	
	const patternBetweenSection = /(?<=@section\()(.*),(.*)(?=\))/g
	const matchSection = content.match(patternBetweenSection).filter(
							item => item.startsWith(attachName) 
						)[0]
	
	//Since attach can include both simple & not simple Section
		//we need to make an exception
	if(matchSection == undefined)
		return text

	const value = matchSection.split(',')[1].trim()
	return value
}

function renderLayout(content, text) {
	const attachName = getTagContent(text) 
	const patternBetweenSection = /(?<=@section)([\S\s]*?)(?=@endsection)/g

	const matchSection = content.match(patternBetweenSection).filter(
						item => item.startsWith("(" + attachName) 
					)[0]

	if(matchSection == undefined) return text;

	const sectionContent = matchSection.replace(`(${attachName})`,'')
	return sectionContent
}

function renderComponent(content, rawComp) {
	const compName = rawComp.split(")")[0].replace('@component(', '')
	let compContent = maskCodeTag(renderTag('component', compName))
	compContent = compContent.replace(patterns.attach, renderSlot.bind(this, rawComp))
	
	return compContent
}

function renderSlot(rawComp, rawAttach) {
	const attachName = getTagContent(rawAttach) 

	const patternBetweenSlot = /(?<=@slot)([\S\s]*?)(?=@endslot)/g
	const slots = rawComp.match(patternBetweenSlot)

	let matchSlot = ''
	
	if(slots == null) { //If No slots mean simple component
		matchSlot = rawComp.split(')').slice(1).toString()
							.replace('@endcomponent', '')
	} else {
		matchSlot = slots.filter(
							item => item.startsWith("(" + attachName) 
						)[0]
	}
	const slotContent = matchSlot.replace(`(${attachName})`,'')

	return slotContent
}

function readFile(filename) {
	return maskCodeTag(fs.readFileSync(filename).toString())
}

function getCompleteFileName(text, type) {
	let filename = ''
	switch(type) {	
		case 'import':
			filename = getTagContent(text)
			return `${dir.partial}/${filename}.html`
		break
		case 'layout':
			filename = getTagContent(text)
			return `${dir.layout}/${filename}.html`
		break
		case 'component':
			filename = text
			return `${dir.component}/${filename}.html`
		break
		default:
			console.log('No type file matched.')
		break;
	}
}

function getTagContent(tag){
	return tag.split("(")[1].replace(")","")
}
#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path');

const dir = {
	static: "./dev/static",
	pages : "./dev/pages",
	layout : "./dev/_layouts",
	import : "./dev/_imports",
	component : "./dev/_components",
	public : "./public"
}

const patterns = {
	codeTag: /(<code([\S\s]*?)>([\S\s]*?)<\/code>)/g,
	import: /@import\((.*?)\)/g,
	layout: /@layout\((.*?)\)/g,
	attach: /@attach\((.*?)\)/g,
	section : /(@section)([\S\s]*?)(@endsection)/gi,
	simpleSection: /(@section\()(.*?),(.*?)(\))/g,
	component: /(@component)([\S\s]*?)(@endcomponent)/g,
	slot: /(@slot)([\S\s]*?)(@endslot)/g,
}


function runSSG() { 

let codeTagHolder = []

//Pages file
const pages = fs.readdirSync(dir.pages)
removeDir(dir.public)
createFolderIfNone(dir.public)
pages.forEach(function(page) {
	generateFile(`${dir.pages}/${page}`, page)
})

//Static folder
fs.copy(dir.static, './public/')
	.then(() => console.log('success!'))
	.catch(err => err)


function generateFile(item, fileName) {	
	//check if DIR
	if(fs.statSync(item).isDirectory()) { 
		return generatePageSubFolder(item)
	}

	//restart for new files
	codeTagHolder = [] 

	let content = readFile(item)

	const ext = path.extname(fileName);
	if(ext == ".html") {
		content = renderPage(content)
		const folder = fileName.split('.')[0] //get name with subfolder
		
		//except index, no folder.
		if(folder != 'index') {
			createFolderIfNone('./public/'+folder)
			fileName = folder + '/index.html'
		}
	}

	//save to new Dir
	fs.writeFileSync(`./public/${fileName}`, content)
	return
}

function generatePageSubFolder(item) {
	let subFolder = item.replace('./dev/pages/', '')

	const subPages = fs.readdirSync(item)
	createFolderIfNone(`./public/${subFolder}`)

	subPages.forEach(function(page) {
		generateFile(`${dir.pages}/${subFolder}/${page}`, `${subFolder}/${page}`)
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
	
	const value = removeKeyName(matchSection)
	return value
}

function renderLayout(content, text) {
	const attachName = getTagContent(text) 
	const patternBetweenSection = /(?<=@section)([\S\s]*?)(?=@endsection)/g

	const matchSection = content.match(patternBetweenSection).filter(
						item => item.startsWith("(" + attachName) 
					)[0]

	if(matchSection == undefined) {

		if(attachName.includes(",")) {
			//attach has default value
			return removeKeyName(attachName)
		}
		return text;
	}

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

function readFileRaw(filename) {
	return fs.readFileSync(filename).toString()
}

function readFile(filename) {
	return maskCodeTag(fs.readFileSync(filename).toString())
}

function getCompleteFileName(text, type) {
	let filename = ''
	switch(type) {	
		case 'import':
			filename = getTagContent(text)
			return `${dir.import}/${filename}.html`
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

function createFolderIfNone(dirName) {
	if (!fs.existsSync(dirName))
	    fs.mkdirSync(dirName);
	
	return
}

function removeKeyName(text) {
	const arrayOfText = text.split(",")
	arrayOfText.shift()
	return arrayOfText.toString().trim()
}

//remove whole dir helper
function removeDir (path) {
  if (fs.existsSync(path)) {
    const files = fs.readdirSync(path)

    if (files.length > 0) {
      files.forEach(function(filename) {
        if (fs.statSync(path + "/" + filename).isDirectory()) {
          removeDir(path + "/" + filename)
        } else {
          fs.unlinkSync(path + "/" + filename)
        }
      })
      fs.rmdirSync(path)
    } else {
      fs.rmdirSync(path)
    }
  } else {
    console.log("Directory path not found.")
  }
}

} //end runSSG
runSSG() //autoRun 1st time

//=================================
//==== LIVE RELOAD AND WATCH  =====
//=================================
const isWatching = process.argv.includes('--watch');
if(isWatching) {
	const liveServer = require("live-server");
	const chokidar = require('chokidar');

	var params = {
		watch: "./public",
		root: "./public",
		file: "index.html",
		wait: 1000,
		logLevel: 0,
	};
	liveServer.start(params);
	
	chokidar.watch('./dev').on('all', (event, path) => {
	  runSSG()
	});
}
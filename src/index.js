const fs = require('fs');

const pageLocation = "./dev/pages"
const partialLocation = "./dev/_partials"

//Get pages
const pages = fs.readdirSync(pageLocation)

const patternImport = /@ssg-import\((.*?)\)/g

//Loop all pages
pages.forEach(function(page) {
	//get & render contents
	const content = fs.readFileSync(`${pageLocation}/${page}`).toString()
	const renderedContent = renderPage(content)

	//save to new location
	fs.writeFileSync(`./public/${page}`, renderedContent)
})


function renderPage(content) {
	let newContent = content
	const matches = content.match(patternImport)
		
	if(matches == null)
		return content
	
	matches.forEach(function(match){
		const patternWithoutCode = /(<code>(?:[^<](?!\/code))*<\/code>)|@ssg-import\((.*?)\)/gi
		newContent = newContent.replace(patternWithoutCode, changePartial)
	})

	return newContent
}

function changePartial(text)
{
	//If in <code> tag, return plain
	if(text.includes('<code>'))
		return text

	const fileName = text.replace("@ssg-import(", "")
						 .replace(")",".html")
	
	const partialContent = fs.readFileSync(`${partialLocation}/${fileName}`)
							.toString()

	return partialContent
}
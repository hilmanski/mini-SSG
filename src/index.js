const fs = require('fs');

const pageLocation = "./dev/pages"
const partialLocation = "./dev/_partials"

//Get pages
const pages = fs.readdirSync(pageLocation)

//Loop all pages
pages.forEach(function(page) {
	//get and render contents
	const content = fs.readFileSync(`${pageLocation}/${page}`).toString()
	const renderedContent = renderPage(content)

	//save to new location
	fs.writeFileSync(`./public/${page}`, renderedContent)
})

function renderPage(content) {
	let newContent = content
	const matches = content.match(/@ssg-import\((.*?)\)/g)
	if(matches == null)
		return content

	matches.forEach(function(match){
		const partialFile = match.replace("@ssg-import(", "").replace(")",".html")
		const partialContent = fs.readFileSync(`${partialLocation}/${partialFile}`)
								.toString()

		newContent = newContent.replace(match, partialContent)
	})

	return newContent
}
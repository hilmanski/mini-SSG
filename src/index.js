const fs = require('fs');

const config = {
  location: {
    inputdir: "./dev",
    outputdir: "./public"
  }
};

//Todo: read file
	//attach header
	//attach content
	//attach footer

const pages = fs.readdirSync(`${config.location.inputdir}/pages`)
				.map( page => page )
console.log(pages)


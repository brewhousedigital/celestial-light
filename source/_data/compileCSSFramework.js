/*
Compile CSS Function - Using PurgeCSS

This file needs to compile before 11ty finishes the site
because the 11ty Watch command wont pick up on changed CSS
tags inside your NJK files.
This way, you can work locally and purge your CSS on the fly.
*/

const fs = require("fs");
const MinifyCSS = require("clean-css");
const postCSS = require('postcss');
const purgeCSS = require('@fullhuman/postcss-purgecss');

module.exports = async function() {
	// Create a custom, purged, version of Bootstrap
	let sourceCSS = "source/_includes/partial-css/_bootstrap.css";
	let destinationCSS = "_site/css/bootstrap.css";
	// Add in your file types here
	let sourceContent = [
		'source/**/*.njk',
		'source/**/*.html',
		'source/**/*.md',
		'source/**/*.liquid',
		'source/**/*.js'
	];

	fs.readFile(sourceCSS, (err, css) => {
		postCSS([
			// Purge CSS will scan through and remove the styles that arent in your files
			purgeCSS({
				content: sourceContent,
				variables: true,
				keyframes: true
			})
		])
			.process(css, {
				from: sourceCSS,
				to: destinationCSS
			})
			.then(result => {
				let newCSS = result.css;
				let rebootCSS = fs.readFileSync("source/_includes/partial-css/_reboot.css");
				let allCSS = rebootCSS + newCSS;

				let compiledCSS = new MinifyCSS().minify(allCSS)['styles'];

				fs.writeFileSync(destinationCSS, compiledCSS, {encoding:"utf8"})
			})
			.catch(error => {
				console.log(error)
			});
	})
};

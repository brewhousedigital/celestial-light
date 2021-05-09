/*
Compile CSS Function - Using PurgeCSS

This file needs to compile before 11ty finishes the site
because the 11ty Watch command wont pick up on changed CSS
tags inside your NJK files.
This way, you can work locally and purge your CSS on the fly.

To read more, check out this dev.to article:
https://dev.to/brewhousedigital/using-purgecss-with-bootstrap-and-eleventy-j7p
*/

const fs = require("fs");
const MinifyCSS = require("clean-css");
const postCSS = require('postcss');
const purgeCSS = require('@fullhuman/postcss-purgecss');

module.exports = async function() {
	// You must create the folder structure first. WriteFile does not create files if parent folders are missing
	if (!fs.existsSync('_site')){fs.mkdirSync('_site');}
	if (!fs.existsSync('_site/css')){fs.mkdirSync('_site/css');}

	// Create a custom, purged, version of Bootstrap
	const sourceCSS = "source/_includes/partial-css/_bootstrap.css";
	const destinationCSS = "_site/css/bootstrap.css";
	// Add in your file types here
	const sourceContent = [
		'source/**/*.njk',
		'source/**/*.html',
		'source/**/*.md',
		'source/**/*.liquid',
		'source/**/*.js'
	];

	fs.readFile(sourceCSS, (err, css) => {
		postCSS([
			// Purge CSS will scan through and remove the styles that aren't in your project
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
				// Combine with Reboot
				let newCSS = result.css;
				let rebootCSS = fs.readFileSync('source/_includes/partial-css/_reboot.css');
				let allCSS = rebootCSS + newCSS;

				// Minify
				let compiledCSS = new MinifyCSS().minify(allCSS)['styles'];

				// Save
				fs.writeFileSync(destinationCSS, compiledCSS, {encoding:"utf8"})
			})
			.catch(error => {
				console.log(error)
			});
	})
};

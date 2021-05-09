const { DateTime } = require("luxon");
const fs = require("fs");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginNavigation = require("@11ty/eleventy-navigation");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");


// Custom additions
require('dotenv').config();
const MinifyCSS = require("clean-css");
const slugify = require("slugify");
const { minify } = require("terser");


module.exports = function(eleventyConfig) {
	eleventyConfig.addPlugin(pluginRss);
	eleventyConfig.addPlugin(pluginSyntaxHighlight);
	eleventyConfig.addPlugin(pluginNavigation);
	eleventyConfig.setDataDeepMerge(true);
	eleventyConfig.addLayoutAlias("post", "source/layouts/post.njk");


	eleventyConfig.addFilter("readableDate", dateObj => {
		return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("dd LLL yyyy");
	});


	// https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
	eleventyConfig.addFilter('htmlDateString', (dateObj) => {
		return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
	});


	// Get the first `n` elements of a collection.
	eleventyConfig.addFilter("head", (array, n) => {
		if( n < 0 ) {return array.slice(n);}
		return array.slice(0, n);
	});


	eleventyConfig.addCollection("tagList", function(collection) {
		let tagSet = new Set();
		collection.getAll().forEach(function(item) {
			if( "tags" in item.data ) {
				let tags = item.data.tags;

				tags = tags.filter(function(item) {
					switch(item) {
						// this list should match the `filter` list in tags.njk
						case "all":
						case "nav":
						case "post":
						case "posts":
							return false;
					}

					return true;
				});

				for (const tag of tags) {
					tagSet.add(tag);
				}
			}
		});

		// returning an array in addCollection works in Eleventy 0.5.3
		return [...tagSet];
	});


	// Custom - Extended
	// Minify CSS
	eleventyConfig.addFilter("minifyCSS", function(code) {
		return new MinifyCSS({
			level: {
				1: {
					specialComments: 0
				}
			}
		}).minify(code)['styles'];
	});


	// Creates a URL safe string
	eleventyConfig.addFilter("slugURL", function(urlString) {
		return slugify(urlString, {
			replacement: '-',
			remove: undefined,
			lower: true,
			strict: true
		});
	});


	// Returns the current year
	eleventyConfig.addShortcode("dateYear", function() {
		/* {% dateYear %} */
		return DateTime.local().toFormat("yyyy");
	});


	// Returns a bootstrap icon
	eleventyConfig.addShortcode("icon", function(name) {
		/* {% icon house %} */
		let iconName = "node_modules/bootstrap-icons/icons/" + name + ".svg";
		return fs.readFileSync(iconName).toString();
	});


	// Accordion Code | Nunjucks Paired Shortcode
	// Easily create accordions without having to write tons of bootstrap HTML
	// {% accordion "Tab 1", "#my-accordion" %}
	// 		Content Goes Here
	// {% endaccordion %}
	eleventyConfig.addPairedNunjucksShortcode("accordion", function(content, title, parent) {
		let accordionID = slugify(title, {
			replacement: '-',
			remove: undefined,
			lower: true,
			strict: true
		});

		return `
		<div class="accordion-item">
			<h2 class="accordion-header" id="accordion-header-${accordionID}">
				<button class="accordion-button collapsed"
					    type="button"
					    data-bs-toggle="collapse"
					    data-bs-target="#accordion-${accordionID}"
					    aria-expanded="false"
					    aria-controls="accordion-${accordionID}">${title}</button>
			</h2>

			<div id="accordion-${accordionID}"
				 class="accordion-collapse collapse"
				 aria-labelledby="accordion-header-${accordionID}"
				 data-bs-parent="${parent}">
				<div class="accordion-body">
					${content}
				</div><!-- end padding -->
			</div><!-- end collapse -->
		</div><!-- end item -->
		`;
	});


	// Minify JS in production
	eleventyConfig.addNunjucksAsyncFilter("jsmin", async function (
		code,
		callback
	) {
		try {
			if(process.env.ENVIRONMENT === "production") {
				const minified = await minify(code);
				callback(null, minified.code);
			} else {
				callback(null, code);
			}
		} catch (err) {
			console.error("Terser error: ", err);
			// Fail gracefully.
			callback(null, code);
		}
	});


	// Eleventy will move these files to the _site folder on built
	eleventyConfig.addPassthroughCopy({"source/images": "images"});
	eleventyConfig.addPassthroughCopy({"source/manifest.json": "manifest.json"});
	eleventyConfig.addPassthroughCopy({"source/robots.txt": "robots.txt"});

	// If you want to have a standalone css file for bootstrap, uncomment this line
	// eleventyConfig.addPassthroughCopy({"source/_includes/partial-css/bootstrap.css": "css/bootstrap.css"});
	eleventyConfig.addPassthroughCopy({"source/_includes/partial-js/bootstrap.js": "js/bootstrap.js"});


	/* Markdown Overrides */
	let markdownLibrary = markdownIt({
		html: true,
		breaks: true,
		linkify: true
	}).use(markdownItAnchor, {
		permalink: true,
		permalinkClass: "direct-link",
		permalinkSymbol: "#"
	});
	eleventyConfig.setLibrary("md", markdownLibrary);

	// Browsersync Overrides
	eleventyConfig.setBrowserSyncConfig({
		callbacks: {
			ready: function(err, browserSync) {
				const content_404 = fs.readFileSync('_site/404.html');

				browserSync.addMiddleware("*", (req, res) => {
					// Provides the 404 content without redirect.
					res.write(content_404);
					res.end();
				});
			},
		},
		ui: false,
		ghostMode: false
	});

	return {
		templateFormats: [
			"md",
			"njk",
			"html",
			"liquid"
		],


		markdownTemplateEngine: "liquid",
		htmlTemplateEngine: "njk",
		dataTemplateEngine: "njk",

		// These are all optional, defaults are shown:
		dir: {
			input: ".",
			includes: "source/_includes",
			data: "source/_data",
			output: "_site"
		}
	};
};

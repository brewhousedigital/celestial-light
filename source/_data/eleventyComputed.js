/*
This function will remove posts from your website if the date is in the future

It does this by referencing a environment variable called "environment".
You can experiment with this behavior by modifying the .env file located in the root of the project
If you need help setting this up on a platform like Netlify, you can follow this related tutorial:
https://dev.to/brewhousedigital/minifying-js-in-eleventy-on-production-1848

This file is named eleventyComputed.js because of how the Eleventy platform works:
https://www.11ty.dev/docs/data-computed/
The specific file name tells 11ty to use this function when it is building the website

This function was modified from the below tutorial:
https://saneef.com/tutorials/hiding-posts-with-future-dates-in-eleventy/
*/


// Required to access what environment you are on
require('dotenv').config();


// Calculates if the date is in the future or not
function isPageFromFuture({date}) {
	if(process.env.ENVIRONMENT === "production" && date.getTime() > Date.now()) {
		return true;
	}

	return false;
}


// Run when 11ty processes each page
module.exports = {
	permalink: (data) => {
		const { permalink, page } = data;
		if (isPageFromFuture(page)) {
			return false;
		}

		return permalink;
	},
	eleventyExcludeFromCollections: (data) => {
		const { eleventyExcludeFromCollections, page } = data;
		if (isPageFromFuture(page)) {
			return true;
		}

		return eleventyExcludeFromCollections;
	},
};

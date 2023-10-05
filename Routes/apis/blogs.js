const express = require("express");
const router = express.Router();
const axios = require("axios");
const lodash = require("lodash");
const config = require('../../Default/config');

//@route    GET api/blog-stats
router.get("/blog-stats", async (req, res) => {
  try {
    const blogStats = await AnalyzeBlogData();
    // Respond with the analyzed blog data
    res.json(blogStats);
  } catch (error) {
    console.error("Error fetching or analyzing blog data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Function to fetch blog data from the API
const fetchBlogData = async () => {
  const axiosConfig = {
    method: "GET",
    url: "https://intent-kit-16.hasura.app/api/rest/blogs",
    headers: {
      "x-hasura-admin-secret": config.Key,
    },
  };

  const { data } = await axios(axiosConfig); // API call to fetch the data

  if (!Array.isArray(data.blogs)) {
    // Checking the data validity
    throw new Error("Invalid response from the third-party API");
  }
  return data;
}

// Memoize the function to fetch blog data with a cache duration of 10 minutes
const memoizeFetchBlogData = lodash.memoize(fetchBlogData, () => parseInt(Date.now() / 600000));

// Function to analyze the fetched blog data
async function AnalyzeBlogData() {
  const data = await memoizeFetchBlogData(); // Fetch the data

  

  const totalBlogs = data.blogs.length; // Number of blogs
  const blogWithLongestTitle = lodash.maxBy(
    data.blogs,
    (blog) => blog.title.length
  ); // Longest title
  const blogsWithPrivacyKeyword = lodash.filter(
    data.blogs,
    (blog) => lodash.includes(lodash.toLower(blog.title), "privacy")
  ); // Title with word "privacy"
  const uniqueBlogTitles = lodash.uniqBy(data.blogs, "title"); // All unique titles

  const responseObj = {
    totalBlogs,
    longestBlogTitle: blogWithLongestTitle.title,
    blogsContainingPrivacyKeyword: blogsWithPrivacyKeyword.length,
    uniqueBlogTitles: uniqueBlogTitles.map((blog) => blog.title),
  };

  return responseObj;
}

//@route    GET api/blog-search
router.get('/blog-search', async (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "query" is missing.' });
  }

  try {
    const searchResults = await SearchBlogs(query);
    // Respond with the search results
    res.json(searchResults);
  } catch (error) {
    console.error('Error searching blogs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to search for blogs based on a query
async function SearchBlogs(query) {
  const data = await memoizeFetchBlogData(); // Fetch the data

  const matchingBlogs = lodash.filter(data.blogs, (blog) =>
    lodash.includes(lodash.toLower(blog.title), lodash.toLower(query))
  );

  return matchingBlogs;
}

module.exports = router;

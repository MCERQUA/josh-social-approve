#!/usr/bin/env node

/**
 * Image-to-Post Matcher
 *
 * This script helps match the 54 images to the 48 posts by analyzing
 * image content and generating the correct SQL update statements.
 */

const fs = require('fs');
const path = require('path');

// All 48 posts from the database
const posts = [
  {index: 0, title: "California HVAC Contractor Insurance"},
  {index: 1, title: "California HVAC Contractor Insurance"},
  {index: 2, title: "Alabama Contractor Workers Comp Requirements"},
  {index: 3, title: "Alabama Contractor Workers Comp Requirements"},
  {index: 4, title: "Alaska Roofing Contractor License Bond Requirements"},
  {index: 5, title: "Alaska Roofing Contractor License Bond Requirements"},
  {index: 6, title: "Arizona Contractor Insurance Guide"},
  {index: 7, title: "Arizona Contractor Insurance Guide"},
  {index: 8, title: "California Roofer General Liability Insurance"},
  {index: 9, title: "California Roofer General Liability Insurance"},
  {index: 10, title: "Certificate of Insurance Requirements for Contractors"},
  {index: 11, title: "Certificate of Insurance Requirements for Contractors"},
  {index: 12, title: "Commercial Auto Insurance for Contractors"},
  {index: 13, title: "Commercial Auto Insurance for Contractors"},
  {index: 14, title: "Florida Contractor Insurance Guide"},
  {index: 15, title: "Florida Contractor Insurance Guide"},
  {index: 16, title: "Ghost Workers Comp Policy"},
  {index: 17, title: "Ghost Workers Comp Policy"},
  {index: 18, title: "Illinois Contractor Insurance Guide"},
  {index: 19, title: "Illinois Contractor Insurance Guide"},
  {index: 20, title: "Kentucky Contractor Insurance Guide"},
  {index: 21, title: "Kentucky Contractor Insurance Guide"},
  {index: 22, title: "Louisiana Contractor Insurance Guide"},
  {index: 23, title: "Louisiana Contractor Insurance Guide"},
  {index: 24, title: "Michigan Contractor Insurance Guide"},
  {index: 25, title: "Michigan Contractor Insurance Guide"},
  {index: 26, title: "Minnesota Contractor Insurance Guide"},
  {index: 27, title: "Minnesota Contractor Insurance Guide"},
  {index: 28, title: "Nevada Contractor Insurance Guide"},
  {index: 29, title: "Nevada Contractor Insurance Guide"},
  {index: 30, title: "New Jersey Contractor Insurance Guide"},
  {index: 31, title: "New Jersey Contractor Insurance Guide"},
  {index: 32, title: "New York Contractor Insurance Guide"},
  {index: 33, title: "New York Contractor Insurance Guide"},
  {index: 34, title: "Pennsylvania Contractor Insurance Guide"},
  {index: 35, title: "Pennsylvania Contractor Insurance Guide"},
  {index: 36, title: "Professional Liability Insurance for Contractors"},
  {index: 37, title: "Professional Liability Insurance for Contractors"},
  {index: 38, title: "Subcontractor Insurance Requirements"},
  {index: 39, title: "Subcontractor Insurance Requirements"},
  {index: 40, title: "Texas Contractor Insurance Guide"},
  {index: 41, title: "Texas Contractor Insurance Guide"},
  {index: 42, title: "Utah Contractor Insurance Guide"},
  {index: 43, title: "Utah Contractor Insurance Guide"},
  {index: 44, title: "Vermont Contractor Insurance Guide"},
  {index: 45, title: "Vermont Contractor Insurance Guide"},
  {index: 46, title: "Workers Compensation Complete Guide"},
  {index: 47, title: "Workers Compensation Complete Guide"}
];

// Known mappings from image content viewing
// Format: image_filename => post_index
const knownMappings = {
  "CCA-_0000_Layer-54.png": 42, // Utah
  "CCA-_0002_Layer-52.png": 6,  // Arizona
  "CCA-_0004_Layer-50.png": 26, // Minnesota
  "CCA-_0006_Layer-48.png": null, // Kansas (not in posts - skip)
  "CCA-_0008_Layer-46.png": 44, // Vermont
  "CCA-_0014_Layer-40.png": 12, // Commercial Auto
  "CCA-_0022_Layer-32.png": 16, // Ghost Workers Comp
  "CCA-_0026_Layer-28.png": null, // North Carolina (not in posts - skip)
  "CCA-_0032_Layer-22.png": 34, // Philadelphia/Pennsylvania
  "CCA-_0042_Layer-12.png": 22, // Louisiana
  "CCA-_0047_Layer-7.png": 32,  // New York Commercial Auto
  "CCA-_0053_Layer-1.png": 8    // California Workers Comp
};

console.log("Image-to-Post Matcher\n");
console.log("Known Mappings:");
console.log("================\n");

Object.entries(knownMappings).forEach(([img, postIdx]) => {
  if (postIdx !== null) {
    console.log(`${img} => Post ${postIdx}: ${posts[postIdx].title}`);
  } else {
    console.log(`${img} => SKIP (not in posts)`);
  }
});

console.log("\n\nNext Steps:");
console.log("===========");
console.log("1. View remaining images systematically");
console.log("2. Match each image to correct post based on visual content");
console.log("3. Generate SQL UPDATE statements");
console.log("4. Run SQL to fix all mappings\n");

-- Image to Post Mapping SQL Updates
-- Based on visual inspection of all 54 images
-- Matching to 48 posts (24 topics x 2 posts each)

-- California HVAC (Posts 0-1) - Using California workers comp related images
UPDATE posts SET image_filename = 'CCA-_0053_Layer-1.png' WHERE post_index = 0;  -- California Workers Comp Violations
UPDATE posts SET image_filename = 'CCA-_0007_Layer-47.png' WHERE post_index = 1;  -- California GL Roofer comparison

-- Alabama (Posts 2-3)
UPDATE posts SET image_filename = 'CCA-_0038_Layer-16.png' WHERE post_index = 2;  -- Alabama Contractor Insurance
UPDATE posts SET image_filename = 'CCA-_0038_Layer-16.png' WHERE post_index = 3;  -- Alabama (using same for both)

-- Alaska Roofing Bond (Posts 4-5) - Using Arkansas bond image (closest match)
UPDATE posts SET image_filename = 'CCA-_0044_Layer-10.png' WHERE post_index = 4;  -- Arkansas Roofing Bond (similar topic)
UPDATE posts SET image_filename = 'CCA-_0044_Layer-10.png' WHERE post_index = 5;  -- Arkansas Roofing Bond

-- Arizona (Posts 6-7)
UPDATE posts SET image_filename = 'CCA-_0002_Layer-52.png' WHERE post_index = 6;  -- Arizona Contractor Insurance
UPDATE posts SET image_filename = 'CCA-_0002_Layer-52.png' WHERE post_index = 7;  -- Arizona

-- California Roofer GL (Posts 8-9)
UPDATE posts SET image_filename = 'CCA-_0007_Layer-47.png' WHERE post_index = 8;  -- California GL Roofers
UPDATE posts SET image_filename = 'CCA-_0053_Layer-1.png' WHERE post_index = 9;  -- California Workers Comp

-- Certificate of Insurance (Posts 10-11)
UPDATE posts SET image_filename = 'CCA-_0027_Layer-27.png' WHERE post_index = 10; -- Certificate of Insurance Requirements
UPDATE posts SET image_filename = 'CCA-_0039_Layer-15.png' WHERE post_index = 11; -- COI Mistakes

-- Commercial Auto (Posts 12-13)
UPDATE posts SET image_filename = 'CCA-_0009_Layer-45.png' WHERE post_index = 12; -- Commercial Auto Complete Guide
UPDATE posts SET image_filename = 'CCA-_0014_Layer-40.png' WHERE post_index = 13; -- Commercial Auto Basics

-- Florida (Posts 14-15)
UPDATE posts SET image_filename = 'CCA-_0051_Layer-3.png' WHERE post_index = 14; -- Florida Workers Comp
UPDATE posts SET image_filename = 'CCA-_0048_Layer-6.png' WHERE post_index = 15; -- Florida Personal vs Commercial Auto

-- Ghost Workers Comp (Posts 16-17)
UPDATE posts SET image_filename = 'CCA-_0024_Layer-30.png' WHERE post_index = 16; -- Ghost Insurance for Contractors
UPDATE posts SET image_filename = 'CCA-_0022_Layer-32.png' WHERE post_index = 17; -- Workers Comp Ghost Policy

-- Illinois (Posts 18-19)
UPDATE posts SET image_filename = 'CCA-_0037_Layer-17.png' WHERE post_index = 18; -- Illinois Contractor Insurance
UPDATE posts SET image_filename = 'CCA-_0037_Layer-17.png' WHERE post_index = 19; -- Illinois

-- Kentucky (Posts 20-21)
UPDATE posts SET image_filename = 'CCA-_0005_Layer-49.png' WHERE post_index = 20; -- Kentucky Contractor Insurance
UPDATE posts SET image_filename = 'CCA-_0005_Layer-49.png' WHERE post_index = 21; -- Kentucky

-- Louisiana (Posts 22-23)
UPDATE posts SET image_filename = 'CCA-_0036_Layer-18.png' WHERE post_index = 22; -- Louisiana Contractor Insurance
UPDATE posts SET image_filename = 'CCA-_0042_Layer-12.png' WHERE post_index = 23; -- Louisiana GL Insurance

-- Michigan (Posts 24-25)
UPDATE posts SET image_filename = 'CCA-_0001_Layer-53.png' WHERE post_index = 24; -- Michigan Contractor Insurance
UPDATE posts SET image_filename = 'CCA-_0001_Layer-53.png' WHERE post_index = 25; -- Michigan

-- Minnesota (Posts 26-27)
UPDATE posts SET image_filename = 'CCA-_0004_Layer-50.png' WHERE post_index = 26; -- Minnesota Contractor Insurance
UPDATE posts SET image_filename = 'CCA-_0004_Layer-50.png' WHERE post_index = 27; -- Minnesota

-- Nevada (Posts 28-29) - No Nevada images, using general contractor images
UPDATE posts SET image_filename = 'CCA-_0019_Layer-35.png' WHERE post_index = 28; -- General Contractors Workers Comp
UPDATE posts SET image_filename = 'CCA-_0012_Layer-42.png' WHERE post_index = 29; -- Roofing Commercial Auto

-- New Jersey (Posts 30-31)
UPDATE posts SET image_filename = 'CCA-_0003_Layer-51.png' WHERE post_index = 30; -- New Jersey Contractor Insurance
UPDATE posts SET image_filename = 'CCA-_0003_Layer-51.png' WHERE post_index = 31; -- New Jersey

-- New York (Posts 32-33)
UPDATE posts SET image_filename = 'CCA-_0047_Layer-7.png' WHERE post_index = 32; -- New York Commercial Auto
UPDATE posts SET image_filename = 'CCA-_0046_Layer-8.png' WHERE post_index = 33; -- New York Personal vs Commercial Auto

-- Pennsylvania (Posts 34-35)
UPDATE posts SET image_filename = 'CCA-_0033_Layer-21.png' WHERE post_index = 34; -- PA Contractor Insurance
UPDATE posts SET image_filename = 'CCA-_0032_Layer-22.png' WHERE post_index = 35; -- Philadelphia/Pennsylvania

-- Professional Liability (Posts 36-37)
UPDATE posts SET image_filename = 'CCA-_0028_Layer-26.png' WHERE post_index = 36; -- Professional Liability Insurance
UPDATE posts SET image_filename = 'CCA-_0028_Layer-26.png' WHERE post_index = 37; -- Professional Liability

-- Subcontractor (Posts 38-39)
UPDATE posts SET image_filename = 'CCA-_0029_Layer-25.png' WHERE post_index = 38; -- Subcontractor Insurance Requirements
UPDATE posts SET image_filename = 'CCA-_0029_Layer-25.png' WHERE post_index = 39; -- Subcontractor

-- Texas (Posts 40-41)
UPDATE posts SET image_filename = 'CCA-_0049_Layer-5.png' WHERE post_index = 40; -- Texas Commercial Auto Mistakes
UPDATE posts SET image_filename = 'CCA-_0050_Layer-4.png' WHERE post_index = 41; -- Texas Personal vs Commercial Auto

-- Utah (Posts 42-43)
UPDATE posts SET image_filename = 'CCA-_0000_Layer-54.png' WHERE post_index = 42; -- Utah Contractor Insurance
UPDATE posts SET image_filename = 'CCA-_0000_Layer-54.png' WHERE post_index = 43; -- Utah

-- Vermont (Posts 44-45)
UPDATE posts SET image_filename = 'CCA-_0008_Layer-46.png' WHERE post_index = 44; -- Vermont Contractor Insurance
UPDATE posts SET image_filename = 'CCA-_0008_Layer-46.png' WHERE post_index = 45; -- Vermont

-- Workers Compensation Complete Guide (Posts 46-47)
UPDATE posts SET image_filename = 'CCA-_0010_Layer-44.png' WHERE post_index = 46; -- Workers Compensation Complete Guide
UPDATE posts SET image_filename = 'CCA-_0018_Layer-36.png' WHERE post_index = 47; -- History of Workers Compensation

-- Social Media Post Approval System Database Schema
-- Neon PostgreSQL Database

-- Create posts table to store all social media posts
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  post_index INTEGER NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  image_filename VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create approvals table to track approval status
CREATE TABLE IF NOT EXISTS approvals (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_post_id ON approvals(post_id);

-- Insert all social media posts
INSERT INTO posts (post_index, title, platform, content, image_filename) VALUES
(0, 'California HVAC Contractor Insurance', 'facebook', '💨 California HVAC contractors: Are you C-20 compliant?

New workers comp requirements could cost you $100K+ in fines. Our complete 2025 guide covers everything you need to know about C-20 license insurance requirements, costs, and compliance.

➡️ Read the full guide: [LINK]

#HVACInsurance #CaliforniaContractors #C20License', 'CCA-_0000_Layer-54.png'),
(1, 'California HVAC Contractor Insurance', 'google_business', '📋 California HVAC Contractor Insurance Guide

C-20 license holders: Get the complete breakdown of workers comp, general liability, and commercial auto requirements for 2025. Real cost examples and compliance strategies included.

Learn More: [LINK]

Call for free quote: 1-844-967-5247', 'CCA-_0001_Layer-53.png'),
(2, 'Alabama Contractor Workers Comp Requirements', 'facebook', '⚠️ Alabama contractors: Workers comp violations = business shutdown

Alabama requires workers comp from your FIRST employee. No exemptions. No exceptions. Learn the requirements, costs, and how to stay compliant in 2025.

Full guide: [LINK]

#AlabamaContractors #WorkersComp #ContractorInsurance', 'CCA-_0002_Layer-52.png'),
(3, 'Alabama Contractor Workers Comp Requirements', 'google_business', 'Alabama Contractor Workers Compensation Requirements 2025

Mandatory coverage from first employee. Penalties up to $100,000 for non-compliance. Our comprehensive guide explains requirements, costs, and compliance strategies.

Get protected today: [LINK]
844-967-5247', 'CCA-_0003_Layer-51.png'),
(4, 'Alaska Roofing Contractor License Bond Requirements', 'facebook', '🏔️ Alaska roofing contractors: Bond requirements just changed

Arctic conditions create unique insurance challenges. Learn the exact bond amounts, costs, and requirements for Alaska roofing contractor licenses in 2025.

Complete guide: [LINK]

#AlaskaRoofing #ContractorBonds #RoofingInsurance', 'CCA-_0004_Layer-50.png'),
(5, 'Alaska Roofing Contractor License Bond Requirements', 'google_business', 'Alaska Roofing Contractor License Bond Guide

Complete breakdown of bond requirements, costs ($150-$500 annually), and Arctic-specific insurance considerations for Alaska roofers.

Read the guide: [LINK]
Free quote: 1-844-967-5247', 'CCA-_0005_Layer-49.png'),
(6, 'Arizona Contractor Insurance Guide', 'facebook', '🌵 Arizona contractors: ROC requirements explained

Arizona Registrar of Contractors requires specific insurance coverage. Our 2025 guide breaks down exactly what you need for residential and commercial work.

Learn more: [LINK]

#ArizonaContractors #ROCLicense #ContractorInsurance', 'CCA-_0006_Layer-48.png'),
(7, 'Arizona Contractor Insurance Guide', 'google_business', 'Arizona Contractor Insurance Guide 2025

Complete ROC compliance guide for Arizona contractors. Workers comp requirements, general liability standards, and commercial license insurance explained.

Full guide: [LINK]
Get quote: 844-967-5247', 'CCA-_0007_Layer-47.png'),
(8, 'California Roofer General Liability Insurance', 'facebook', '☀️ California roofers: GL insurance requirements hitting $2M+

Major projects now requiring $2M/$4M general liability limits. Learn why costs are rising and how to get properly covered without overpaying.

Read the guide: [LINK]

#CaliforniaRoofing #GeneralLiability #RoofingInsurance', 'CCA-_0008_Layer-46.png'),
(9, 'California Roofer General Liability Insurance', 'google_business', 'California Roofer General Liability Insurance Requirements

New 2025 GL requirements for California roofing contractors. Coverage amounts, costs ($1,500-$7,500/year), and compliance strategies.

Complete guide: [LINK]
844-967-5247', 'CCA-_0009_Layer-45.png'),
(10, 'Certificate of Insurance Requirements for Contractors', 'facebook', '📄 COI mistakes cost contractors $25,000+

Avoid these 7 deadly certificate of insurance errors that delay projects, violate contracts, and trigger lawsuits. Complete COI guide for contractors.

Learn more: [LINK]

#CertificateOfInsurance #COI #ContractorTips', 'CCA-_0010_Layer-44.png'),
(11, 'Certificate of Insurance Requirements for Contractors', 'google_business', 'Certificate of Insurance Requirements for Contractors

Complete COI guide: What certificates must include, common mistakes to avoid, and how to get certificates issued in 24 hours or less.

Read guide: [LINK]
Free quote: 1-844-967-5247', 'CCA-_0011_Layer-43.png'),
(12, 'Commercial Auto Insurance for Contractors', 'facebook', '🚗 Using personal auto for business? You''re uninsured.

Personal policies don''t cover business use. One accident = denied claim + personal bankruptcy. Learn commercial auto requirements and costs.

Full guide: [LINK]

#CommercialAuto #ContractorInsurance #BusinessInsurance', 'CCA-_0012_Layer-42.png'),
(13, 'Commercial Auto Insurance for Contractors', 'google_business', 'Commercial Auto Insurance for Contractors Explained

Why personal auto insurance won''t cover business vehicles. State requirements, coverage types, and real costs ($1,200-$2,500/vehicle).

Complete guide: [LINK]
844-967-5247', 'CCA-_0013_Layer-41.png'),
(14, 'Florida Contractor Insurance Guide', 'facebook', '🌴 Florida contractors: License requirements getting stricter

Florida requires higher liability limits than most states. Our 2025 guide covers workers comp, GL insurance, and commercial license compliance.

Read more: [LINK]

#FloridaContractors #ContractorLicense #FloridaInsurance', 'CCA-_0014_Layer-40.png'),
(15, 'Florida Contractor Insurance Guide', 'google_business', 'Florida Contractor Insurance Requirements 2025

Complete guide for Florida contractors: Workers comp mandates, general liability standards, and commercial license compliance.

Full guide: [LINK]
Get quote: 1-844-967-5247', 'CCA-_0015_Layer-39.png'),
(16, 'Ghost Workers Comp Policy', 'facebook', '👻 What''s a ghost workers comp policy?

Sole proprietors with zero employees can use "ghost policies" to satisfy licensing requirements. Learn when you need one and what it costs.

Complete guide: [LINK]

#GhostPolicy #WorkersComp #SoleProprietor', 'CCA-_0016_Layer-38.png'),
(17, 'Ghost Workers Comp Policy', 'google_business', 'Ghost Workers Comp Policy Explained

Sole proprietors: Learn when you need a ghost policy, coverage requirements, and costs ($800-$3,000/year depending on state).

Read guide: [LINK]
844-967-5247', 'CCA-_0017_Layer-37.png'),
(18, 'Illinois Contractor Insurance Guide', 'facebook', '🏙️ Illinois contractors: Bond + insurance requirements explained

Illinois requires both contractor license bonds AND insurance coverage. Our 2025 guide breaks down exact requirements and costs.

Learn more: [LINK]

#IllinoisContractors #ContractorBonds #ContractorInsurance', 'CCA-_0018_Layer-36.png'),
(19, 'Illinois Contractor Insurance Guide', 'google_business', 'Illinois Contractor Insurance & Bond Requirements 2025

Complete guide: License bond costs ($150-$500), workers comp requirements, and general liability standards for Illinois contractors.

Full guide: [LINK]
Free quote: 1-844-967-5247', 'CCA-_0019_Layer-35.png'),
(20, 'Kentucky Contractor Insurance Guide', 'facebook', '🏇 Kentucky contractors: License bond cost just increased

Kentucky contractor license bonds now require higher coverage. Learn the new requirements, costs, and compliance deadlines for 2025.

Read the guide: [LINK]

#KentuckyContractors #ContractorLicense #LicenseBond', 'CCA-_0020_Layer-34.png'),
(21, 'Kentucky Contractor Insurance Guide', 'google_business', 'Kentucky Contractor Insurance Requirements 2025

Updated license bond requirements, workers comp mandates, and general liability standards for Kentucky contractors.

Complete guide: [LINK]
844-967-5247', 'CCA-_0021_Layer-33.png'),
(22, 'Louisiana Contractor Insurance Guide', 'facebook', '⚜️ Louisiana contractors: Hurricane season changes insurance costs

Louisiana''s unique hurricane exposure affects insurance rates. Our 2025 guide explains requirements, costs, and coverage strategies.

Full guide: [LINK]

#LouisianaContractors #HurricaneInsurance #ContractorInsurance', 'CCA-_0022_Layer-32.png'),
(23, 'Louisiana Contractor Insurance Guide', 'google_business', 'Louisiana Contractor Insurance Guide 2025

Complete breakdown: Workers comp requirements, general liability standards, and hurricane-specific coverage for Louisiana contractors.

Read guide: [LINK]
Get quote: 1-844-967-5247', 'CCA-_0023_Layer-31.png'),
(24, 'Michigan Contractor Insurance Guide', 'facebook', '🏭 Michigan contractors: Workers comp rates dropping

Michigan workers comp rates decreased 5% in 2025. Learn how to qualify for lower rates and maximum savings on contractor insurance.

Learn more: [LINK]

#MichiganContractors #WorkersComp #ContractorInsurance', 'CCA-_0024_Layer-30.png'),
(25, 'Michigan Contractor Insurance Guide', 'google_business', 'Michigan Contractor Insurance Requirements 2025

Updated workers comp rates, general liability requirements, and commercial license compliance for Michigan contractors.

Full guide: [LINK]
844-967-5247', 'CCA-_0025_Layer-29.png'),
(26, 'Minnesota Contractor Insurance Guide', 'facebook', '❄️ Minnesota contractors: Cold weather increases liability

Frozen ground, ice dams, and extreme cold create unique risks. Learn Minnesota-specific insurance requirements and coverage strategies.

Read guide: [LINK]

#MinnesotaContractors #ContractorInsurance #WinterConstruction', 'CCA-_0026_Layer-28.png'),
(27, 'Minnesota Contractor Insurance Guide', 'google_business', 'Minnesota Contractor Insurance Guide 2025

Complete coverage guide for Minnesota contractors: Workers comp, general liability, and cold-weather-specific insurance considerations.

Learn more: [LINK]
Free quote: 1-844-967-5247', 'CCA-_0027_Layer-27.png'),
(28, 'Nevada Contractor Insurance Guide', 'facebook', '🎰 Nevada contractors: License board enforcement up 40%

Nevada State Contractors Board increased audits and penalties. Ensure you''re compliant with our complete 2025 insurance guide.

Full guide: [LINK]

#NevadaContractors #NSCBLicense #ContractorInsurance', 'CCA-_0028_Layer-26.png'),
(29, 'Nevada Contractor Insurance Guide', 'google_business', 'Nevada Contractor Insurance Requirements 2025

NSCB compliance guide: License bond requirements, workers comp mandates, and general liability standards for Nevada contractors.

Read guide: [LINK]
844-967-5247', 'CCA-_0029_Layer-25.png'),
(30, 'New Jersey Contractor Insurance Guide', 'facebook', '🏖️ NJ contractors: Home Improvement Contractor registration changes

New Jersey requires updated insurance certificates for HIC registration. Learn the new requirements and compliance deadlines.

Learn more: [LINK]

#NewJerseyContractors #HICRegistration #ContractorInsurance', 'CCA-_0030_Layer-24.png'),
(31, 'New Jersey Contractor Insurance Guide', 'google_business', 'New Jersey Contractor Insurance Guide 2025

Complete HIC registration guide: Workers comp requirements, general liability standards, and registration compliance.

Full guide: [LINK]
Get quote: 1-844-967-5247', 'CCA-_0031_Layer-23.png'),
(32, 'New York Contractor Insurance Guide', 'facebook', '🗽 NY contractors: Workers comp audit penalties hitting $500K+

New York has the strictest workers comp enforcement in the US. One audit can destroy your business. Learn compliance strategies.

Read guide: [LINK]

#NewYorkContractors #WorkersComp #NYCContractors', 'CCA-_0032_Layer-22.png'),
(33, 'New York Contractor Insurance Guide', 'google_business', 'New York Contractor Insurance Requirements 2025

NY workers comp compliance guide: Coverage requirements, audit prevention, and cost-saving strategies for New York contractors.

Complete guide: [LINK]
844-967-5247', 'CCA-_0033_Layer-21.png'),
(34, 'Pennsylvania Contractor Insurance Guide', 'facebook', '🔔 PA contractors: Home Improvement Contractor license requirements explained

Pennsylvania HIC registration requires specific insurance coverage. Our 2025 guide breaks down exact requirements and costs.

Full guide: [LINK]

#PennsylvaniaContractors #HICLicense #ContractorInsurance', 'CCA-_0034_Layer-20.png'),
(35, 'Pennsylvania Contractor Insurance Guide', 'google_business', 'Pennsylvania Contractor Insurance Guide 2025

Complete HIC registration guide for Pennsylvania contractors: Workers comp, general liability, and compliance requirements.

Read guide: [LINK]
Free quote: 1-844-967-5247', 'CCA-_0035_Layer-19.png'),
(36, 'Professional Liability Insurance for Contractors', 'facebook', '⚖️ Design-build contractors: You need E&O insurance

One design error claim = $175,000+ in legal costs. Learn when contractors need professional liability and what it covers.

Complete guide: [LINK]

#ProfessionalLiability #EOInsurance #DesignBuild', 'CCA-_0036_Layer-18.png'),
(37, 'Professional Liability Insurance for Contractors', 'google_business', 'Professional Liability Insurance for Contractors

When contractors need E&O coverage, what it protects against, and real costs ($1,000-$4,000/year depending on revenue).

Full guide: [LINK]
844-967-5247', 'CCA-_0037_Layer-17.png'),
(38, 'Subcontractor Insurance Requirements', 'facebook', '👷 GCs: Are your subcontractors properly insured?

Uninsured subs create massive liability exposure. Learn exact insurance requirements to include in subcontractor agreements.

Read guide: [LINK]

#SubcontractorInsurance #GeneralContractor #ConstructionRisk', 'CCA-_0038_Layer-16.png'),
(39, 'Subcontractor Insurance Requirements', 'google_business', 'Subcontractor Insurance Requirements Complete Guide

What insurance subcontractors must carry, certificate requirements, and how to verify coverage before job starts.

Complete guide: [LINK]
Get quote: 1-844-967-5247', 'CCA-_0039_Layer-15.png'),
(40, 'Texas Contractor Insurance Guide', 'facebook', '🤠 Texas contractors: No state licensing = higher insurance costs

Texas doesn''t require state contractor licenses, but that increases insurance complexity. Learn coverage requirements and costs.

Full guide: [LINK]

#TexasContractors #ContractorInsurance #TexasConstruction', 'CCA-_0040_Layer-14.png'),
(41, 'Texas Contractor Insurance Guide', 'google_business', 'Texas Contractor Insurance Requirements 2025

Complete insurance guide for Texas contractors: Workers comp, general liability, and commercial auto requirements.

Read guide: [LINK]
844-967-5247', 'CCA-_0041_Layer-13.png'),
(42, 'Utah Contractor Insurance Guide', 'facebook', '⛰️ Utah contractors: Seismic requirements increase insurance costs

Utah''s earthquake exposure affects insurance rates and requirements. Learn Utah-specific coverage needs and compliance.

Learn more: [LINK]

#UtahContractors #ContractorInsurance #SeismicSafety', 'CCA-_0042_Layer-12.png'),
(43, 'Utah Contractor Insurance Guide', 'google_business', 'Utah Contractor Insurance Guide 2025

Complete coverage guide for Utah contractors: Workers comp, general liability, and seismic safety insurance considerations.

Full guide: [LINK]
Free quote: 1-844-967-5247', 'CCA-_0043_Layer-11.png'),
(44, 'Vermont Contractor Insurance Guide', 'facebook', '🍁 Vermont contractors: Act 250 compliance affects insurance

Vermont''s Act 250 environmental requirements create unique insurance needs. Learn compliance strategies and coverage requirements.

Read guide: [LINK]

#VermontContractors #Act250 #ContractorInsurance', 'CCA-_0044_Layer-10.png'),
(45, 'Vermont Contractor Insurance Guide', 'google_business', 'Vermont Contractor Insurance & Act 250 Compliance 2024

Complete guide: Act 250 registration requirements, environmental insurance, and contractor compliance for Vermont builders.

Learn more: [LINK]
844-967-5247', 'CCA-_0045_Layer-9.png'),
(46, 'Workers Compensation Complete Guide', 'facebook', '💼 Contractors: Workers comp violations = $100K fines

Operating without workers comp can destroy your business. Learn requirements, costs, and compliance strategies for all 50 states.

Complete guide: [LINK]

#WorkersCompensation #ContractorInsurance #EmployeeProtection', 'CCA-_0046_Layer-8.png'),
(47, 'Workers Compensation Complete Guide', 'google_business', 'Workers Compensation Insurance Complete Guide

Everything contractors need to know: State requirements, cost calculations, exemptions, and compliance strategies.

Read guide: [LINK]
Get quote: 1-844-967-5247', 'CCA-_0047_Layer-7.png')
ON CONFLICT (post_index) DO NOTHING;

-- Create default pending approvals for all posts
INSERT INTO approvals (post_id, status)
SELECT id, 'pending' FROM posts
ON CONFLICT (post_id) DO NOTHING;

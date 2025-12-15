// Verify OneUp API connection and list categories with accounts
require('dotenv').config({ path: '.env.local' });

const ONEUP_BASE_URL = 'https://www.oneupapp.io/api';

async function verifyOneUp() {
  console.log('Verifying OneUp API connection...\n');
  console.log('═══════════════════════════════════════════════════════════');

  const apiKey = process.env.ONEUP_API_KEY;
  if (!apiKey) {
    console.error('ERROR: ONEUP_API_KEY not set in .env.local');
    process.exit(1);
  }
  console.log('API Key: ✓ Found\n');

  try {
    // List all categories
    console.log('Fetching all categories...\n');
    const catResponse = await fetch(`${ONEUP_BASE_URL}/listcategory?apiKey=${encodeURIComponent(apiKey)}`);
    const catData = await catResponse.json();

    if (catData.error) {
      throw new Error(catData.message);
    }

    console.log('Available OneUp Categories:');
    console.log('───────────────────────────────────────────────────────────');

    // Find ICA and CCA specifically
    const targetIds = [29153, 156826]; // ICA and CCA

    for (const cat of catData.data) {
      const isTarget = targetIds.includes(cat.id);
      const prefix = isTarget ? '→ ' : '  ';
      console.log(`${prefix}${cat.id}: ${cat.category_name} ${cat.isPaused ? '(PAUSED)' : ''}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('Checking ICA Category (29153) accounts...\n');

    // Get ICA accounts
    const icaResponse = await fetch(`${ONEUP_BASE_URL}/listcategoryaccount?apiKey=${encodeURIComponent(apiKey)}&category_id=29153`);
    const icaData = await icaResponse.json();

    if (icaData.error) {
      console.log('ERROR fetching ICA accounts:', icaData.message);
    } else if (icaData.data && icaData.data.length > 0) {
      console.log('ICA Connected Social Accounts:');
      console.log('───────────────────────────────────────────────────────────');
      for (const account of icaData.data) {
        console.log(`  - ${account.social_network_name} (${account.social_network_type})`);
        console.log(`    ID: ${account.social_network_id}`);
      }
    } else {
      console.log('  No accounts connected to ICA category yet');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('Checking CCA Category (156826) accounts...\n');

    // Get CCA accounts for comparison
    const ccaResponse = await fetch(`${ONEUP_BASE_URL}/listcategoryaccount?apiKey=${encodeURIComponent(apiKey)}&category_id=156826`);
    const ccaData = await ccaResponse.json();

    if (ccaData.error) {
      console.log('ERROR fetching CCA accounts:', ccaData.message);
    } else if (ccaData.data && ccaData.data.length > 0) {
      console.log('CCA Connected Social Accounts:');
      console.log('───────────────────────────────────────────────────────────');
      for (const account of ccaData.data) {
        console.log(`  - ${account.social_network_name} (${account.social_network_type})`);
        console.log(`    ID: ${account.social_network_id}`);
      }
    } else {
      console.log('  No accounts connected to CCA category');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  OneUp API VERIFICATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

verifyOneUp();

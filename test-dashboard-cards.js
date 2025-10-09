// Test script for all 4 dashboard cards endpoints
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api/dashboard';

async function testAllEndpoints() {
  console.log('=== Dashboard Cards Data Test ===\n');

  const endpoints = [
    { name: 'Monthly Revenue', url: '/monthly-revenue' },
    { name: 'This Year Revenue', url: '/this-year-revenue' },
    { name: 'Total Orders', url: '/total-orders' },
    { name: 'Total Items', url: '/total-items' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const response = await fetch(`${BASE_URL}${endpoint.url}`);
      const data = await response.json();
      
      console.log(`✅ ${endpoint.name} - Status: ${response.status}`);
      console.log(`   Success: ${data.success}`);
      console.log(`   Data:`, JSON.stringify(data.data, null, 2));
      console.log('');
      
    } catch (error) {
      console.error(`❌ ${endpoint.name} failed:`, error.message);
      console.log('');
    }
  }

  // Test the summary format for the cards
  console.log('=== Summary for Dashboard Cards ===');
  try {
    const [monthlyRev, yearRev, totalOrders, totalItems] = await Promise.all([
      fetch(`${BASE_URL}/monthly-revenue`).then(r => r.json()),
      fetch(`${BASE_URL}/this-year-revenue`).then(r => r.json()),
      fetch(`${BASE_URL}/total-orders`).then(r => r.json()),
      fetch(`${BASE_URL}/total-items`).then(r => r.json())
    ]);

    console.log('Card 1 - Monthly Revenue:');
    console.log(`   Amount: LKR ${monthlyRev.data?.revenue?.toLocaleString() || 0}`);
    console.log(`   Period: ${monthlyRev.data?.month || 'N/A'} ${monthlyRev.data?.year || ''}`);
    console.log('');

    console.log('Card 2 - This Year Revenue:');
    console.log(`   Amount: LKR ${yearRev.data?.revenue?.toLocaleString() || 0}`);
    console.log(`   Period: ${yearRev.data?.description || 'N/A'}`);
    console.log('');

    console.log('Card 3 - Total Orders:');
    console.log(`   Count: ${totalOrders.data?.count?.toLocaleString() || 0} orders`);
    console.log(`   Description: ${totalOrders.data?.description || 'N/A'}`);
    console.log('');

    console.log('Card 4 - Available Inventory:');
    console.log(`   Total Quantity: ${totalItems.data?.totalQuantity?.toLocaleString() || 0} units`);
    console.log(`   Items in Stock: ${totalItems.data?.inStock || 0} different items`);
    console.log(`   Out of Stock: ${totalItems.data?.outOfStock || 0} items`);
    console.log(`   Total Items: ${totalItems.data?.totalItems || 0} different items`);

  } catch (error) {
    console.error('Error in summary test:', error.message);
  }
}

testAllEndpoints();
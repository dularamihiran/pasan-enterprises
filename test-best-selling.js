// Quick test script for the best selling machines endpoint
const fetch = require('node-fetch');

async function testBestSellingMachines() {
  try {
    const response = await fetch('http://localhost:5000/api/dashboard/best-selling-machines');
    const data = await response.json();
    
    console.log('=== Best Selling Machines Test ===');
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    console.log('Data:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log('\n=== Top 3 Best Selling Machines ===');
      data.data.forEach((machine, index) => {
        console.log(`${index + 1}. ${machine.machineName}`);
        console.log(`   Category: ${machine.category}`);
        console.log(`   Units Sold: ${machine.totalQuantitySold}`);
        console.log(`   Revenue: LKR ${machine.totalRevenue.toLocaleString()}`);
        console.log(`   Current Stock: ${machine.currentStock}`);
        console.log(`   Order Count: ${machine.orderCount}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error testing endpoint:', error);
  }
}

testBestSellingMachines();
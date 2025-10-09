// Script to show detailed inventory breakdown
const fetch = require('node-fetch');

async function explainInventoryNumbers() {
  try {
    console.log('=== INVENTORY BREAKDOWN EXPLANATION ===\n');
    
    const response = await fetch('http://localhost:5000/api/dashboard/total-items');
    const data = await response.json();
    
    if (data.success) {
      const inventory = data.data;
      
      console.log('📊 INVENTORY SUMMARY:');
      console.log(`Total Quantity: ${inventory.totalQuantity} units`);
      console.log(`Total Items: ${inventory.totalItems} different machine types`);
      console.log(`In Stock: ${inventory.inStock} machine types have inventory > 0`);
      console.log(`Out of Stock: ${inventory.outOfStock} machine types have 0 inventory`);
      console.log('');
      
      console.log('🔍 WHAT THESE NUMBERS MEAN:');
      console.log(`• Main Card Number (${inventory.totalQuantity}): Total units across ALL machines`);
      console.log(`• Subtitle (${inventory.inStock} items in stock): How many different machine types are available`);
      console.log('');
      
      console.log('📝 EXAMPLE:');
      console.log('If you have:');
      console.log('- Machine A: 50 units');
      console.log('- Machine B: 30 units'); 
      console.log('- Machine C: 12 units');
      console.log('- Machine D: 0 units');
      console.log('');
      console.log('Then:');
      console.log('- Total Quantity = 92 units (50+30+12+0)');
      console.log('- In Stock = 3 items (A, B, C have inventory)');
      console.log('- Out of Stock = 1 item (D has no inventory)');
      console.log('- Total Items = 4 different machine types');
      
    } else {
      console.log('Failed to fetch inventory data');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

explainInventoryNumbers();
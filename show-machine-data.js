// Script to show actual machine inventory data
const fetch = require('node-fetch');

async function showActualMachineData() {
  try {
    console.log('=== ACTUAL MACHINE INVENTORY DATA ===\n');
    
    // This would require a new endpoint to show actual machine data
    // For now, let's show what we can deduce from the current endpoints
    
    const [totalItems, bestSelling] = await Promise.all([
      fetch('http://localhost:5000/api/dashboard/total-items').then(r => r.json()),
      fetch('http://localhost:5000/api/dashboard/best-selling-machines').then(r => r.json())
    ]);
    
    console.log('📋 INVENTORY SUMMARY:');
    if (totalItems.success) {
      console.log(`Total Units Available: ${totalItems.data.totalQuantity}`);
      console.log(`Machine Types in Stock: ${totalItems.data.inStock}`);
      console.log(`Machine Types Out of Stock: ${totalItems.data.outOfStock}`);
      console.log(`Total Machine Types: ${totalItems.data.totalItems}`);
    }
    
    console.log('\n🏆 BEST SELLING MACHINES STOCK:');
    if (bestSelling.success && bestSelling.data.length > 0) {
      bestSelling.data.forEach((machine, index) => {
        console.log(`${index + 1}. ${machine.machineName}`);
        console.log(`   Current Stock: ${machine.currentStock} units`);
        console.log(`   Category: ${machine.category}`);
        console.log(`   Total Sold: ${machine.totalQuantitySold} units`);
        console.log('');
      });
    }
    
    console.log('💡 EXPLANATION:');
    console.log('The numbers you see (like 11 and 92) represent:');
    console.log('• Large number (92): Total quantity of ALL machine units in inventory');
    console.log('• Small number (11): Count of different machine types that have stock > 0');
    console.log('• Individual machine stock: Shown in Best Selling section');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

showActualMachineData();
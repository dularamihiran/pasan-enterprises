import jsPDF from 'jspdf';

// Function to convert number to words
const numberToWords = (num) => {
  const ones = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
    'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
  ];
  
  const tens = [
    '', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'
  ];
  
  const scales = ['', 'THOUSAND', 'MILLION', 'BILLION'];
  
  if (num === 0) return 'ZERO';
  
  const convertChunk = (chunk) => {
    let result = '';
    
    if (chunk >= 100) {
      result += ones[Math.floor(chunk / 100)] + ' HUNDRED ';
      chunk %= 100;
    }
    
    if (chunk >= 20) {
      result += tens[Math.floor(chunk / 10)] + ' ';
      chunk %= 10;
    }
    
    if (chunk > 0) {
      result += ones[chunk] + ' ';
    }
    
    return result.trim();
  };
  
  let result = '';
  let scaleIndex = 0;
  
  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      const chunkWords = convertChunk(chunk);
      if (scaleIndex > 0) {
        result = chunkWords + ' ' + scales[scaleIndex] + ' ' + result;
      } else {
        result = chunkWords + ' ' + result;
      }
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }
  
  return result.trim() + ' RUPEES ONLY';
};

// Function to format number with comma separators
const formatNumberWithCommas = (num) => {
  if (typeof num !== 'number') {
    num = parseFloat(num) || 0;
  }
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Function to load image as base64
const loadImageAsBase64 = (imagePath) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = this.naturalWidth;
      canvas.height = this.naturalHeight;
      ctx.drawImage(this, 0, 0);
      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = imagePath;
  });
};

export const generateQuotationPDF = async (quotationData) => {
  try {
    // Create new PDF document
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const marginBottom = 30;
    
    let yPosition = 20;
    let currentPage = 1;
    
    // Generate unique quotation ID
    const quotationId = `QT-${Date.now()}`;
    
    // Load logo
    let logoBase64 = null;
    try {
      logoBase64 = await loadImageAsBase64('/images/logo1.png');
    } catch (error) {
      console.warn('Could not load logo:', error);
    }
    
    // Function to add header to each page
    const addHeader = () => {
      // Add logo and watermark
      if (logoBase64) {
        const logoSize = 40;
        doc.addImage(logoBase64, 'PNG', 15, 10, logoSize, logoSize);
        
        const watermarkSize = 150;
        const watermarkX = (pageWidth - watermarkSize) / 2;
        const watermarkY = (pageHeight - watermarkSize) / 2;
        
        doc.saveGraphicsState();
        doc.setGState(doc.GState({ opacity: 0.15 }));
        doc.addImage(logoBase64, 'PNG', watermarkX, watermarkY, watermarkSize, watermarkSize);
        doc.restoreGraphicsState();
      }
      
      // Company details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('P.E. INDUSTRIAL AUTOMATION (PVT). LTD', pageWidth - 15, 15, { align: 'right' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('194/20/12, Thalgahahena Road, Kesbewa,', pageWidth - 15, 22, { align: 'right' });
      doc.text('Piliyandala, Sri Lanka.', pageWidth - 15, 27, { align: 'right' });
      doc.text('+94717694334', pageWidth - 15, 32, { align: 'right' });
      doc.text('+94763995483', pageWidth - 15, 37, { align: 'right' });
      
      if (currentPage > 1) {
        doc.setFontSize(8);
        doc.text(`Page ${currentPage}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    };
    
    // Function to check if we need a new page
    const checkNewPage = (requiredSpace = 15) => {
      if (yPosition + requiredSpace > pageHeight - marginBottom) {
        doc.addPage();
        currentPage++;
        addHeader();
        yPosition = 55;
        return true;
      }
      return false;
    };
    
    // Add header to first page
    addHeader();
    
    yPosition = 55;
    
    // Document title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Quotation details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const currentDate = new Date();
    const quotationDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
    const quotationTime = currentDate.toLocaleTimeString();
    
    doc.text(`To: ${quotationData.customerInfo.name}`, 15, yPosition);
    doc.text(`Quotation Number: ${quotationId}`, pageWidth - 15, yPosition, { align: 'right' });
    yPosition += 6;
    
    // Add customer address if exists
    if (quotationData.customerInfo.address && quotationData.customerInfo.address.trim()) {
      doc.setFontSize(9);
      doc.text(`Address: ${quotationData.customerInfo.address}`, 15, yPosition);
      yPosition += 6;
      doc.setFontSize(10);
    }
    
    doc.text(`Date: ${quotationDate}`, 15, yPosition);
    doc.text(`Time: ${quotationTime}`, pageWidth - 15, yPosition, { align: 'right' });
    yPosition += 15;
    
    // Items section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ITEMS:', 15, yPosition);
    yPosition += 10;
    
    // Process each item with details and images
    let itemNumber = 1;
    for (const item of quotationData.items) {
      checkNewPage(60); // Ensure space for item
      
      // Item header
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${itemNumber}. ${item.name}`, 15, yPosition);
      yPosition += 6;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Item ID: ${item.itemId}`, 15, yPosition);
      yPosition += 6;
      
      // Item details in a box
      const detailsStartY = yPosition;
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, yPosition - 2, pageWidth - 30, 30);
      
      doc.setFontSize(9);
      doc.text(`Quantity: ${item.quantity}`, 20, yPosition + 3);
      doc.text(`Unit Price: Rs. ${formatNumberWithCommas(item.unitPrice)}`, 20, yPosition + 8);
      doc.text(`VAT: ${item.vatPercentage}%`, 20, yPosition + 13);
      doc.text(`Warranty: ${item.warrantyMonths} months`, 20, yPosition + 18);
      
      const itemTotal = item.unitPrice * item.quantity;
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: Rs. ${formatNumberWithCommas(itemTotal)}`, 20, yPosition + 23);
      doc.setFont('helvetica', 'normal');
      
      yPosition += 32;
      
      // Extra description if provided
      if (item.extraDescription && item.extraDescription.trim()) {
        checkNewPage(15);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text('Description:', 15, yPosition);
        yPosition += 5;
        
        // Split long descriptions into multiple lines
        const descLines = doc.splitTextToSize(item.extraDescription, pageWidth - 35);
        for (const line of descLines) {
          checkNewPage(5);
          doc.text(line, 20, yPosition);
          yPosition += 4;
        }
        yPosition += 3;
        doc.setFont('helvetica', 'normal');
      }
      
      // Display images if available
      if (item.images && item.images.length > 0) {
        checkNewPage(50);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Product Images:', 15, yPosition);
        yPosition += 5;
        doc.setFont('helvetica', 'normal');
        
        const imageSize = 35;
        const imagesPerRow = 4;
        let imageX = 15;
        let imageCount = 0;
        
        for (const image of item.images) {
          if (imageCount > 0 && imageCount % imagesPerRow === 0) {
            yPosition += imageSize + 5;
            imageX = 15;
            checkNewPage(imageSize + 10);
          }
          
          try {
            doc.addImage(image.data, 'JPEG', imageX, yPosition, imageSize, imageSize);
            imageX += imageSize + 5;
            imageCount++;
          } catch (err) {
            console.warn('Error adding image:', err);
          }
        }
        
        yPosition += imageSize + 10;
      }
      
      // Add spacing between items
      yPosition += 5;
      itemNumber++;
    }
    
    // Extra charges section
    if (quotationData.extras && quotationData.extras.length > 0) {
      checkNewPage(30);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('EXTRA CHARGES:', 15, yPosition);
      yPosition += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      quotationData.extras.forEach((extra) => {
        if (extra.description && extra.amount > 0) {
          checkNewPage(6);
          doc.text(`• ${extra.description}`, 20, yPosition);
          doc.text(`Rs. ${formatNumberWithCommas(extra.amount)}`, pageWidth - 15, yPosition, { align: 'right' });
          yPosition += 6;
        }
      });
      
      yPosition += 5;
    }
    
    // Summary section
    checkNewPage(50);
    
    doc.setLineWidth(1);
    doc.line(15, yPosition, pageWidth - 15, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('QUOTATION SUMMARY', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Subtotal
    doc.text('Subtotal (Machine Prices):', 15, yPosition);
    doc.text(`Rs. ${formatNumberWithCommas(quotationData.subtotal)}`, pageWidth - 15, yPosition, { align: 'right' });
    yPosition += 6;
    
    // VAT
    if (quotationData.vatAmount > 0) {
      doc.text('VAT:', 15, yPosition);
      doc.text(`Rs. ${formatNumberWithCommas(quotationData.vatAmount)}`, pageWidth - 15, yPosition, { align: 'right' });
      yPosition += 6;
    }
    
    // Discount
    if (quotationData.discountAmount > 0) {
      doc.text(`Discount (${quotationData.discountPercentage}%):`, 15, yPosition);
      doc.text(`-Rs. ${formatNumberWithCommas(quotationData.discountAmount)}`, pageWidth - 15, yPosition, { align: 'right' });
      yPosition += 6;
    }
    
    // Extra charges total
    const extrasTotal = quotationData.extras ? quotationData.extras.reduce((sum, extra) => sum + (extra.amount || 0), 0) : 0;
    if (extrasTotal > 0) {
      doc.text('Extra Charges:', 15, yPosition);
      doc.text(`Rs. ${formatNumberWithCommas(extrasTotal)}`, pageWidth - 15, yPosition, { align: 'right' });
      yPosition += 6;
    }
    
    // Total
    doc.setLineWidth(0.5);
    doc.line(15, yPosition, pageWidth - 15, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('TOTAL AMOUNT:', 15, yPosition);
    doc.text(`Rs. ${formatNumberWithCommas(quotationData.finalTotal)}`, pageWidth - 15, yPosition, { align: 'right' });
    yPosition += 12;
    
    // Amount in words
    checkNewPage(10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const amountInWords = numberToWords(Math.floor(quotationData.finalTotal));
    doc.text(`SAY TOTAL: ${amountInWords}`, 15, yPosition);
    yPosition += 15;
    
    // Terms and conditions
    checkNewPage(50);
    
    doc.setFont('helvetica', 'bold');
    doc.text('TERMS & CONDITIONS:', 15, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition += 6;
    
    doc.setFontSize(9);
    doc.text('• This quotation is valid for 3 days from the date of issue.', 15, yPosition);
    yPosition += 5;
    doc.text('• Prices are subject to change without notice.', 15, yPosition);
    yPosition += 5;
    doc.text('• Payment terms: 100% by cash on delivery or by cheque drawn to', 15, yPosition);
    yPosition += 5;
    doc.text('  "P.E.INDUSTRIAL AUTOMATION (PVT).LTD"', 15, yPosition);
    yPosition += 5;
    doc.text('• Warranty period as specified per item from invoice date.', 15, yPosition);
    yPosition += 5;
    doc.text('• Delivery time will be confirmed upon order confirmation.', 15, yPosition);
    yPosition += 15;
    
    // Bank details
    checkNewPage(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('BANK DETAILS', 15, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    yPosition += 6;
    doc.text('BANK NAME - BOC BANK (KESBEWA BRANCH)', 15, yPosition);
    yPosition += 5;
    doc.text('ACCOUNT NAME - P.E. INDUSTRIAL AUTOMATION (PVT). LTD', 15, yPosition);
    yPosition += 5;
    doc.text('ACCOUNT NUMBER - 0094292544', 15, yPosition);
    yPosition += 5;
    doc.text('BRANCH CODE - 620', 15, yPosition);
    yPosition += 15;
    
    // Closing
    checkNewPage(25);
    doc.setFontSize(10);
    doc.text('Thank you for your interest in our products.', 15, yPosition);
    yPosition += 5;
    doc.text('We look forward to serving you.', 15, yPosition);
    yPosition += 10;
    doc.text('Yours Faithfully,', 15, yPosition);
    yPosition += 5;
    doc.text('P.E.INDUSTRIAL AUTOMATION (PVT).LTD', 15, yPosition);
    yPosition += 10;
    doc.text('Approved', 15, yPosition);
    yPosition += 5;
    doc.text('Pradeep Jayawardana', 15, yPosition);
    yPosition += 5;
    doc.text('Director', 15, yPosition);
    
    // Add footer to all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text('Note: Computer Generated Document', 15, pageHeight - 10);
      if (i > 1) {
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    }
    
    // Generate filename
    const filename = `Quotation_${quotationId}_${currentDate.toISOString().split('T')[0]}.pdf`;
    
    // Save the PDF
    doc.save(filename);
    
    return {
      success: true,
      filename: filename,
      quotationId: quotationId,
      message: 'Quotation generated successfully'
    };
    
  } catch (error) {
    console.error('Error generating quotation:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to generate quotation'
    };
  }
};

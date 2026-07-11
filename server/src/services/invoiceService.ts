import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import prisma from '../config/db';

class InvoiceService {
  async generateInvoicePdf(orderId: string): Promise<string> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: {
            product: { select: { name: true } }
          }
        }
      }
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Create directories
    const invoicesDir = path.join(__dirname, '..', '..', 'public', 'invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const invoiceNumber = `INV-${order.id.substring(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const filename = `${invoiceNumber}.pdf`;
    const filePath = path.join(invoicesDir, filename);

    // Write PDF
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Header
    doc
      .fillColor('#4F46E5')
      .fontSize(24)
      .text('E-COMMERCE MARKETPLACE', 50, 45)
      .fillColor('#4B5563')
      .fontSize(10)
      .text('123 Enterprise Way, Suite 400', 200, 50, { align: 'right' })
      .text('San Francisco, CA 94103', 200, 65, { align: 'right' })
      .text('support@market.com', 200, 80, { align: 'right' })
      .moveDown();

    // Line separator
    doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, 105).lineTo(550, 105).stroke();

    // Invoice Title & Info
    doc
      .fillColor('#111827')
      .fontSize(18)
      .text('INVOICE', 50, 120)
      .fontSize(10)
      .text(`Invoice Number: ${invoiceNumber}`, 50, 145)
      .text(`Invoice Date: ${new Date().toLocaleDateString()}`, 50, 160)
      .text(`Order Reference: #${order.id.substring(0, 8)}`, 50, 175)
      .text(`Payment Method: Cards / Stripe`, 50, 190);

    // Bill To
    doc
      .fontSize(12)
      .fillColor('#4F46E5')
      .text('BILL TO:', 350, 120)
      .fontSize(10)
      .fillColor('#111827')
      .text(order.user.name, 350, 140)
      .text(order.user.email, 350, 155)
      .text(`Shipping Address ID: ${order.addressId}`, 350, 170);

    doc.moveDown(4);

    // Table Header
    let tableTop = 240;
    doc
      .fillColor('#F3F4F6')
      .rect(50, tableTop, 500, 20)
      .fill();

    doc
      .fillColor('#374151')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Item Description', 60, tableTop + 5)
      .text('Qty', 350, tableTop + 5, { width: 30, align: 'right' })
      .text('Price', 400, tableTop + 5, { width: 60, align: 'right' })
      .text('Total', 480, tableTop + 5, { width: 60, align: 'right' });

    // Table Items
    doc.font('Helvetica');
    let currentY = tableTop + 20;
    
    order.items.forEach((item) => {
      const itemTitle = item.product.name;
      const sizeColorStr = (item.selectedSize || item.selectedColor) 
        ? ` (${[item.selectedSize, item.selectedColor].filter(Boolean).join(', ')})`
        : '';
      const displayTitle = `${itemTitle}${sizeColorStr}`;
      
      const itemTotal = item.quantity * item.priceAtBuy;

      doc
        .fillColor('#111827')
        .text(displayTitle, 60, currentY + 5, { width: 280, lineBreak: false })
        .text(item.quantity.toString(), 350, currentY + 5, { width: 30, align: 'right' })
        .text(`Rs. ${item.priceAtBuy.toFixed(2)}`, 400, currentY + 5, { width: 60, align: 'right' })
        .text(`Rs. ${itemTotal.toFixed(2)}`, 480, currentY + 5, { width: 60, align: 'right' });

      doc.strokeColor('#F3F4F6').lineWidth(1).moveTo(50, currentY + 20).lineTo(550, currentY + 20).stroke();
      currentY += 20;
    });

    // Summary calculation
    const summaryY = currentY + 15;
    doc
      .fontSize(10)
      .text('Subtotal:', 380, summaryY)
      .text(`Rs. ${(order.totalAmount - order.taxAmount + order.discountAmount - order.shippingCost).toFixed(2)}`, 480, summaryY, { align: 'right' })
      
      .text('Tax:', 380, summaryY + 15)
      .text(`Rs. ${order.taxAmount.toFixed(2)}`, 480, summaryY + 15, { align: 'right' })
      
      .text('Shipping:', 380, summaryY + 30)
      .text(`Rs. ${order.shippingCost.toFixed(2)}`, 480, summaryY + 30, { align: 'right' });

    if (order.discountAmount > 0) {
      doc
        .fillColor('#EF4444')
        .text('Coupon Discount:', 380, summaryY + 45)
        .text(`-Rs. ${order.discountAmount.toFixed(2)}`, 480, summaryY + 45, { align: 'right' });
    }

    const finalTotalY = order.discountAmount > 0 ? summaryY + 65 : summaryY + 50;
    
    // Total line
    doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(380, finalTotalY - 5).lineTo(540, finalTotalY - 5).stroke();

    doc
      .fillColor('#111827')
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('Grand Total:', 380, finalTotalY)
      .text(`Rs. ${order.totalAmount.toFixed(2)}`, 480, finalTotalY, { align: 'right' });

    // Footer
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#9CA3AF')
      .text('Thank you for shopping with us! Have a wonderful day.', 50, 700, { align: 'center', width: 500 });

    doc.end();

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });


    // Save to invoice model
    await prisma.invoice.upsert({
      where: { orderId: order.id },
      update: {
        invoiceNumber,
        pdfPath: `/invoices/${filename}`
      },
      create: {
        orderId: order.id,
        invoiceNumber,
        pdfPath: `/invoices/${filename}`
      }
    });

    return `/invoices/${filename}`;
  }
}

export const invoiceService = new InvoiceService();

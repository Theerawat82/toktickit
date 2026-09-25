const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== BEFORE MIGRATION ===');
  console.log('Ticket count:', await prisma.ticket.count());
  console.log('User count:', await prisma.user.count());
  console.log('Attachment count:', await prisma.attachment.count());
  console.log('Comment count:', await prisma.comment.count());
  console.log('InternalNote count:', await prisma.internalNote.count());
}

main().catch(console.error).finally(() => prisma.$disconnect());

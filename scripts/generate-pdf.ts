import fs from 'node:fs';
import path from 'node:path';
import { generateVoiceQuestionsPdfDocument } from '../src/utils/voiceQuestionsPdfGenerator.js';

const mockSnapshot = {
  walletBalance: 24880.3,
  walletVpa: 'yash@jainpay',
  accounts: [],
  linkedBanks: [],
  transactions: [],
  ledgerEntries: [],
  khataEntries: [],
  milestoneDeals: [],
  autopayMandates: [],
  creditSanctions: [],
  fxTreasuryVaults: [],
  disputeChargebacks: [],
  securityAuditLogs: [],
};

const doc = generateVoiceQuestionsPdfDocument(mockSnapshot);
const pdfArrayBuffer = doc.output('arraybuffer');
const buffer = Buffer.from(pdfArrayBuffer);

const targetDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const targetPath = path.join(targetDir, 'jain_pay_20_voice_queries_guide.pdf');
fs.writeFileSync(targetPath, buffer);

console.log(`Generated PDF at ${targetPath} (${buffer.length} bytes)`);

#!/usr/bin/env node

/**
 * Automated Translation Script for React Components
 *
 * This script automatically adds translation support to React components by:
 * 1. Adding useLanguage import
 * 2. Adding const { t } = useLanguage() hook
 * 3. Replacing common hardcoded strings with t() calls
 */

const fs = require('fs');
const path = require('path');

// Common translation mappings
const translations = {
  // Dashboard
  'Dashboard': 'dashboard.title',
  'Loading...': 'common.loading',
  'Create New Campaign': 'dashboard.createCampaign',
  'Total Campaigns': 'dashboard.totalCampaigns',
  'Running': 'dashboard.runningCampaigns',
  'Completed': 'dashboard.completedCampaigns',
  'Emails Sent': 'dashboard.emailsSent',
  'View all': 'dashboard.viewAll',
  'View All': 'dashboard.viewAll',
  'Recent Campaigns': 'dashboard.recentCampaigns',
  'No campaigns yet': 'dashboard.noCampaigns',
  'Create your first campaign to start sending cold emails': 'dashboard.noCampaignsDesc',
  'Status': 'dashboard.status',
  'Recipients': 'dashboard.recipients',
  'Sent': 'dashboard.sent',
  'Actions': 'dashboard.actions',
  'Send': 'dashboard.send',
  'View': 'dashboard.view',
  'Sending...': 'dashboard.sending',
  'Expired': 'dashboard.expired',
  'days': 'dashboard.days',

  // Campaigns
  'Campaigns': 'campaigns.title',
  'Search campaigns...': 'campaigns.searchPlaceholder',
  'Filter': 'campaigns.filter',
  'All': 'campaigns.all',
  'Draft': 'campaigns.draft',
  'Paused': 'campaigns.paused',
  'No campaigns found': 'campaigns.noCampaigns',
  'Create your first campaign': 'campaigns.createFirst',
  'Name': 'campaigns.name',
  'Created': 'campaigns.createdAt',

  // Contact Lists
  'Contact Lists': 'contactLists.title',
  'Create New List': 'contactLists.createNew',
  'Search contact lists...': 'contactLists.searchPlaceholder',
  'No contact lists yet': 'contactLists.noLists',
  'Create your first contact list to organize your contacts': 'contactLists.createFirst',
  'Contacts': 'contactLists.contacts',
  'Edit': 'contactLists.edit',
  'Delete': 'contactLists.delete',

  // Companies
  'Company Database': 'companies.title',
  'Browse and select companies from our verified database': 'companies.subtitle',
  'Search companies...': 'companies.searchPlaceholder',
  'Filter by Industry': 'companies.filterByIndustry',
  'All Industries': 'companies.allIndustries',
  'Filter by City': 'companies.filterByCity',
  'All Cities': 'companies.allCities',
  'Showing': 'companies.showing',
  'of': 'companies.of',
  'companies': 'companies.companies',
  'No companies found': 'companies.noCompanies',
  'Try adjusting your search or filters': 'companies.adjustFilters',
  'Company Name': 'companies.companyName',
  'Industry': 'companies.industry',
  'City': 'companies.city',
  'Email': 'companies.email',
  'Phone': 'companies.phone',
  'Add to List': 'companies.addToList',

  // Settings
  'Settings': 'settings.title',
  'Profile': 'settings.profile',
  'SMTP Configuration': 'settings.smtp',
  'Subscription & Billing': 'settings.subscription',
  'Email Settings': 'settings.emailSettings',
  'Save Changes': 'settings.save',
  'Saving...': 'settings.saving',
  'SMTP Host': 'settings.smtpHost',
  'SMTP Port': 'settings.smtpPort',
  'SMTP Username': 'settings.smtpUser',
  'SMTP Password': 'settings.smtpPassword',
  'Test Connection': 'settings.testConnection',
  'Testing...': 'settings.testing',
  'From Name': 'settings.fromName',
  'From Email': 'settings.fromEmail',

  // Create Campaign
  'Create New Campaign': 'createCampaign.title',
  'Step': 'createCampaign.step',
  'Campaign Details': 'createCampaign.campaignDetails',
  'Select Contacts': 'createCampaign.selectContacts',
  'Email Settings': 'createCampaign.emailSettings',
  'Review & Create': 'createCampaign.reviewAndCreate',
  'Campaign Name': 'createCampaign.campaignName',
  'Enter campaign name': 'createCampaign.campaignNamePlaceholder',
  'Select Contact List': 'createCampaign.selectContactList',
  'Choose a contact list': 'createCampaign.selectContactListPlaceholder',
  'Email Subject': 'createCampaign.emailSubject',
  'Enter email subject': 'createCampaign.emailSubjectPlaceholder',
  'Value Proposition': 'createCampaign.valueProposition',
  'AI Model': 'createCampaign.aiModel',
  'Tone': 'createCampaign.tone',
  'Professional': 'createCampaign.professional',
  'Friendly': 'createCampaign.friendly',
  'Casual': 'createCampaign.casual',
  'Formal': 'createCampaign.formal',
  'Email Length': 'createCampaign.length',
  'Short': 'createCampaign.short',
  'Medium': 'createCampaign.medium',
  'Long': 'createCampaign.long',
  'Language': 'createCampaign.language',
  'Back': 'createCampaign.back',
  'Continue': 'createCampaign.continue',
  'Create Campaign': 'createCampaign.createCampaign',
  'Creating...': 'createCampaign.creating',

  // Common
  'Save': 'common.save',
  'Cancel': 'common.cancel',
  'Search': 'common.search',
  'Close': 'common.close',
  'Next': 'common.next',
  'Finish': 'common.finish',
  'Error': 'common.error',
  'Success': 'common.success',
  'Warning': 'common.warning',
  'Info': 'common.info',
};

function addTranslationSupport(filePath) {
  console.log(`\nProcessing: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if already has translation support
  if (content.includes('useLanguage')) {
    console.log('  ✓ Already has translation support');
    return false;
  }

  // Add import for useLanguage if not present
  if (!content.includes("import { useLanguage }")) {
    // Find the last import statement
    const importRegex = /import .+ from .+\n/g;
    const imports = content.match(importRegex);
    if (imports) {
      const lastImport = imports[imports.length - 1];
      const importIndex = content.lastIndexOf(lastImport);
      const afterLastImport = importIndex + lastImport.length;

      content = content.slice(0, afterLastImport) +
                "import { useLanguage } from '../contexts/LanguageContext'\n" +
                content.slice(afterLastImport);
      modified = true;
      console.log('  ✓ Added useLanguage import');
    }
  }

  // Add useLanguage hook after component declaration
  const componentMatch = content.match(/export default function (\w+)\([^)]*\) \{/);
  if (componentMatch && !content.includes('const { t } = useLanguage()')) {
    const hookPosition = content.indexOf(componentMatch[0]) + componentMatch[0].length;
    content = content.slice(0, hookPosition) +
              "\n  const { t } = useLanguage()" +
              content.slice(hookPosition);
    modified = true;
    console.log('  ✓ Added useLanguage hook');
  }

  // Replace hardcoded strings with t() calls
  let replacementCount = 0;
  for (const [original, key] of Object.entries(translations)) {
    // Match strings in JSX text content: >text<
    const jsxTextRegex = new RegExp(`>\\s*${escapeRegExp(original)}\\s*<`, 'g');
    const beforeCount = (content.match(jsxTextRegex) || []).length;
    content = content.replace(jsxTextRegex, `>{t('${key}')}<`);
    const afterJsxCount = (content.match(jsxTextRegex) || []).length;

    // Match strings in quotes: "text" or 'text'
    const quotedRegex = new RegExp(`["']${escapeRegExp(original)}["']`, 'g');
    const beforeQuotedCount = (content.match(quotedRegex) || []).length;
    content = content.replace(quotedRegex, `{t('${key}')}`);
    const afterQuotedCount = (content.match(quotedRegex) || []).length;

    const replaced = (beforeCount - afterJsxCount) + (beforeQuotedCount - afterQuotedCount);
    if (replaced > 0) {
      replacementCount += replaced;
      console.log(`  ✓ Replaced "${original}" → t('${key}') [${replaced}x]`);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Modified with ${replacementCount} translations`);
    return true;
  } else {
    console.log('  ⚠ No changes made');
    return false;
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Main execution
const componentsDir = path.join(__dirname, 'src', 'components');
const componentFiles = [
  'Dashboard.jsx',
  'Campaigns.jsx',
  'CampaignDetails.jsx',
  'CreateCampaign.jsx',
  'ContactLists.jsx',
  'ContactListDetail.jsx',
  'Companies.jsx',
  'Settings.jsx',
  'Help.jsx',
  'SupportButton.jsx',
];

console.log('🌍 Starting Automatic Translation Process...\n');
console.log('=' .repeat(60));

let totalModified = 0;
componentFiles.forEach(file => {
  const filePath = path.join(componentsDir, file);
  if (fs.existsSync(filePath)) {
    if (addTranslationSupport(filePath)) {
      totalModified++;
    }
  } else {
    console.log(`\n⚠️  File not found: ${file}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n✅ Translation complete! Modified ${totalModified} files.`);
console.log('\n💡 Next steps:');
console.log('   1. Review the changes: git diff');
console.log('   2. Test the app to ensure translations work');
console.log('   3. Commit changes: git add . && git commit -m "Add translations"');
console.log('   4. Add any missing custom translations manually\n');

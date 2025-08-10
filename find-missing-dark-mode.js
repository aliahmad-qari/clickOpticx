const fs = require('fs');
const path = require('path');

console.log('🌙 FINDING ADMIN PAGES WITHOUT DARK MODE SUPPORT');
console.log('================================================');

const adminDirs = [
  'view/AddUsers',
  'view/Billing-Payments', 
  'view/userEquipment',
  'view/AdminComplaint',
  'view/AdminSlider_Img',
  'view/AddTeam',
  'view/Customization',
  'view/Notification',
  'view/PasswordRequest',
  'view/ReviewAdmin'
];

const pagesMissingDarkMode = [];
const pagesWithDarkMode = [];

for (const dir of adminDirs) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(file => file.endsWith('.ejs'));
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes('[data-theme="dark"]') || content.includes("data-theme='dark'")) {
        pagesWithDarkMode.push(filePath);
      } else {
        pagesMissingDarkMode.push(filePath);
      }
    }
  }
}

console.log('✅ ADMIN PAGES WITH DARK MODE SUPPORT:');
pagesWithDarkMode.forEach(page => {
  console.log(`   ✅ ${page}`);
});

console.log('\n❌ ADMIN PAGES MISSING DARK MODE SUPPORT:');
pagesMissingDarkMode.forEach(page => {
  console.log(`   ❌ ${page}`);
});

console.log('\n📊 SUMMARY:');
console.log(`   ✅ Pages with dark mode: ${pagesWithDarkMode.length}`);
console.log(`   ❌ Pages missing dark mode: ${pagesMissingDarkMode.length}`);

console.log('\n🎯 PAGES THAT NEED DARK MODE FIXES:');
pagesMissingDarkMode.forEach((page, index) => {
  console.log(`   ${index + 1}. ${page}`);
});
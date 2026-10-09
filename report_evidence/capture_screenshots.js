const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture() {
  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  async function take(name, waitTime = 1000) {
    if (waitTime) await sleep(waitTime);
    const dest = path.join(SCREENSHOTS_DIR, name);
    await page.screenshot({ path: dest, fullPage: true });
    console.log(`[+] Captured: ${name}`);
  }

  try {
    // 01. Home
    console.log('Navigating to Home...');
    await page.goto('http://localhost:5173/home', { waitUntil: 'networkidle2' });
    await take('01_home.png', 1500);

    // 02. Signup
    console.log('Navigating to Signup...');
    await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle2' });
    await take('02_signup.png', 1000);

    // 03. Login
    console.log('Navigating to Login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await take('03_login.png', 1000);

    // Perform Farmer Login
    console.log('Logging in as Farmer (Vikram Singh)...');
    await page.select('select[name="role"]', 'farmer');
    await page.type('input[name="email"]', 'vikram.singh@agriassist.com');
    await page.type('input[name="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await sleep(2000);

    // 04. Farmer Dashboard
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
    await take('04_farmer_dashboard.png', 2000);

    // 05. Crop Recommendation Result (Realistic full inputs)
    console.log('Crop Recommendation...');
    await page.goto('http://localhost:5173/crop-recommendation', { waitUntil: 'networkidle2' });
    await sleep(1000);
    // Fill form
    await page.evaluate(() => {
      const setVal = (name, val) => {
        const el = document.querySelector(`input[name="${name}"]`);
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };
      setVal('N', '90');
      setVal('P', '42');
      setVal('K', '43');
      setVal('ph', '6.5');
      setVal('temperature', '24.5');
      setVal('humidity', '62.0');
      setVal('rainfall', '140.0');
    });
    await sleep(500);
    // Click submit
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Get Crop Recommendation'));
      if (btn) btn.click();
    });
    await sleep(2500);
    await take('05_crop_recommendation_result.png', 500);

    // 21. Crop Prediction Estimated Flag (blank climate fields)
    console.log('Crop Recommendation with Blank Climate (Estimated Flag)...');
    await page.evaluate(() => {
      const setVal = (name, val) => {
        const el = document.querySelector(`input[name="${name}"]`);
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };
      setVal('N', '85');
      setVal('P', '40');
      setVal('K', '35');
      setVal('ph', '6.5');
      setVal('temperature', '');
      setVal('humidity', '');
      setVal('rainfall', '');
    });
    await sleep(500);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Get Crop Recommendation'));
      if (btn) btn.click();
    });
    await sleep(2500);
    await take('21_crop_prediction_estimated_flag.png', 500);

    // 06. Pest Prediction Result
    console.log('Pest Prediction...');
    await page.goto('http://localhost:5173/pest-prediction', { waitUntil: 'networkidle2' });
    await sleep(1000);
    // Select Qualitative mode button if shown
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Qualitative') || b.textContent.includes('Quick Estimate') || b.textContent.includes('Manual'));
      if (btn) btn.click();
    });
    await sleep(800);
    // Click submit on Pest form
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Predict Pest Risk') || b.textContent.includes('Detect Pest Risk'));
      if (btn) btn.click();
    });
    await sleep(2500);
    await take('06_pest_prediction_result.png', 500);

    // 07. Yield Prediction Result
    console.log('Yield Prediction...');
    await page.goto('http://localhost:5173/yield-prediction', { waitUntil: 'networkidle2' });
    await sleep(1000);
    // Select Qualitative mode button if shown
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Qualitative') || b.textContent.includes('Quick Estimate') || b.textContent.includes('Manual'));
      if (btn) btn.click();
    });
    await sleep(800);
    await page.evaluate(() => {
      const setVal = (name, val) => {
        const el = document.querySelector(`input[name="${name}"], select[name="${name}"]`);
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };
      setVal('area', '2');
    });
    await sleep(500);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Forecast Crop Yield') || b.textContent.includes('Predict Yield'));
      if (btn) btn.click();
    });
    await sleep(2500);
    await take('07_yield_prediction_result.png', 500);

    // 08. Market Price Forecast
    console.log('Market Price Forecast...');
    await page.goto('http://localhost:5173/market-price', { waitUntil: 'networkidle2' });
    await sleep(2000);
    // Scroll to forecast section and click Generate Forecast
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Generate Forecast'));
      if (btn) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        btn.click();
      }
    });
    await sleep(3500);
    await take('08_market_price_forecast.png', 500);

    // 09. Soil Health Result
    console.log('Soil Health...');
    await page.goto('http://localhost:5173/soil-health', { waitUntil: 'networkidle2' });
    await sleep(1000);
    await page.evaluate(() => {
      const setVal = (name, val) => {
        const el = document.querySelector(`input[name="${name}"]`);
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };
      setVal('N', '85');
      setVal('P', '42');
      setVal('K', '38');
      setVal('ph', '6.8');
    });
    await sleep(500);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Analyze Soil Health') || b.textContent.includes('Run Soil Diagnostic'));
      if (btn) btn.click();
    });
    await sleep(2500);
    await take('09_soil_health_result.png', 500);

    // 10. Financial Planning Result
    console.log('Financial Planning...');
    await page.goto('http://localhost:5173/financial-planning', { waitUntil: 'networkidle2' });
    await sleep(1500);
    await page.evaluate(() => {
      const setVal = (name, val) => {
        const el = document.querySelector(`input[name="${name}"]`);
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };
      setVal('seed_cost', '3200');
      setVal('fertilizer_cost', '4800');
      setVal('labor_cost', '6500');
      setVal('other_cost', '2000');
      setVal('price_per_kg', '26');
      setVal('expected_yield_kg', '2200');
    });
    await sleep(500);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Calculate Budget') || b.textContent.includes('Calculate Financials'));
      if (btn) btn.click();
    });
    await sleep(2500);
    await take('10_financial_planning_result.png', 500);

    // 11. Risk Monitoring
    console.log('Risk Monitoring...');
    await page.goto('http://localhost:5173/risk-monitoring', { waitUntil: 'networkidle2' });
    await take('11_risk_monitoring.png', 2000);

    // 12. Sustainability Result
    console.log('Sustainability...');
    await page.goto('http://localhost:5173/sustainability', { waitUntil: 'networkidle2' });
    await sleep(1500);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Run Sustainability Audit') || b.textContent.includes('Calculate Sustainability'));
      if (btn) btn.click();
    });
    await sleep(2500);
    await take('12_sustainability_result.png', 500);

    // 13. Analytics
    console.log('Analytics...');
    await page.goto('http://localhost:5173/analytics', { waitUntil: 'networkidle2' });
    await take('13_analytics.png', 2500);

    // 14. Marketplace
    console.log('Marketplace...');
    await page.goto('http://localhost:5173/marketplace', { waitUntil: 'networkidle2' });
    await take('14_marketplace.png', 2000);

    // 15. Community
    console.log('Community...');
    await page.goto('http://localhost:5173/community', { waitUntil: 'networkidle2' });
    await take('15_community.png', 2000);

    // 16. Profile
    console.log('Profile...');
    await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle2' });
    await take('16_profile.png', 1500);

    // Logout Farmer and Login as Primary Admin
    console.log('Switching to Primary Admin...');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await sleep(1000);
    await page.select('select[name="role"]', 'admin');
    await page.type('input[name="email"]', 'admin@agrismart.in');
    await page.type('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await sleep(2500);

    // 17. Admin Dashboard
    console.log('Admin Dashboard...');
    await page.goto('http://localhost:5173/admin?tab=overview', { waitUntil: 'networkidle2' });
    await take('17_admin_dashboard.png', 2500);

    // 18. Admin User Management
    console.log('Admin User Management...');
    await page.goto('http://localhost:5173/admin?tab=users', { waitUntil: 'networkidle2' });
    await take('18_admin_user_management.png', 2500);

    // 19. Admin Activity Logs
    console.log('Admin Activity Logs...');
    await page.goto('http://localhost:5173/admin?tab=activity', { waitUntil: 'networkidle2' });
    await take('19_admin_activity_logs.png', 2500);

    // 20. Admin ML Diagnostics
    console.log('Admin ML Diagnostics...');
    await page.goto('http://localhost:5173/admin?tab=ml', { waitUntil: 'networkidle2' });
    await take('20_admin_ml_diagnostics.png', 2500);

    console.log('All 21 screenshots captured successfully!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

capture();

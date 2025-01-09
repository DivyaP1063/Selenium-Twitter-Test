const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('chromedriver'); // Add this line to import chrome
const mongoose = require('mongoose');
const cors = require('cors');
const express = require('express');
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log("DB Connected Successfully"))
    .catch((error) => {
        console.log("DB Connection Failed");
        console.error(error);
        process.exit(1);
    });

const TrendSchema = new mongoose.Schema({
  uniqueId: String,
  trends: [String],
  dateTime: String,
  ipAddress: String,
});
const Trend = mongoose.model('Trend', TrendSchema);

app.use(cors());
app.use(cors({
  origin: 'http://localhost:5173',  // Allow only requests from this frontend
}));
app.use(express.json());

async function scrapeTrends() {
  console.log("Initializing WebDriver...");

  let driver;

  try {
    // Initialize WebDriver with Chrome options
    driver = await new Builder().forBrowser('chrome').build();

    console.log("Navigating to login page...");
    await driver.get('https://x.com/i/flow/login');
    await driver.sleep(3000);  // Wait for 3 seconds just to make sure the page is loading
    console.log("Login page loaded.");

    // Step 1: Enter username and click 'Next'
    console.log("Entering username...");
    await driver.findElement(By.name('text')).sendKeys('your-username');  // Replace with actual username
    console.log("Username entered, clicking Next...");
    await driver.findElement(By.xpath("//span[contains(text(), 'Next')]")).click(); // Click "Next" button

    // Wait for the password field to appear
    console.log("Waiting for password field...");
    await driver.wait(until.elementLocated(By.name('password')), 10000); // Wait for the password field
    console.log("Password field found, entering password...");
    
    // Step 2: Enter password and log in
    await driver.findElement(By.name('password')).sendKeys('your-password', Key.RETURN); // Replace with actual password
    console.log("Password entered, logging in...");

    // Wait for the home page to fully load
    console.log("Waiting for home page to load...");
    await driver.wait(until.elementLocated(By.css('section[aria-labelledby="accessible-list-1"]')), 30000); // Wait for 30 seconds for the entire page to load
    
    console.log("Home page loaded, scraping trends...");
    
    // Extract trending topics from the new trend container
    const trendContainers = await driver.findElements(By.css('section[aria-labelledby="accessible-list-1"]')); // Trend container updated
    const top5Topics = [];

    // Loop through each trend container and extract the topic text
    for (let i = 0; i < Math.min(5, trendContainers.length); i++) {
      const trendContainer = trendContainers[i];
      try {
        // Extract text for each trend container
        const topicText = await trendContainer.getText();
        if (topicText) {
          top5Topics.push(topicText);
        }
      } catch (error) {
        console.log(`Failed to extract topic from trend container ${i}:`, error);
      }
    }

    console.log("Trending topics extracted:", top5Topics);

    // Try an alternative method to get IP Address
    console.log("Fetching IP address...");
    await driver.get('https://api.ipify.org');  // Directly visit the IP API
    const ipElement = await driver.findElement(By.tagName('pre'));  // Get the IP from the JSON response
    const ipAddress = await ipElement.getText();

    console.log("IP Address:", ipAddress);

    // Prepare the data to save in MongoDB
    const data = {
      uniqueId: new mongoose.Types.ObjectId(),
      trends: top5Topics,
      dateTime: new Date().toISOString(),
      ipAddress,
    };

    // Save data to MongoDB
    const newTrend = new Trend(data);
    await newTrend.save();
    console.log("Trending data saved to MongoDB.");

    return data;
  } catch (error) {
    console.error("Error during scraping process:", error);
    throw error;
  } finally {
    if (driver) await driver.quit();
  }
}

app.get('/run-script', async (req, res) => {
  try {
    const data = await scrapeTrends();
    res.json({ message: 'Script executed successfully', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/get-results', async (req, res) => {
  const results = await Trend.find().sort({ dateTime: -1 }).limit(1);
  res.json(results);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
require("dotenv").config(); 

const app = express();
app.use(cors());
app.use(express.json());

const websitesFilePath = path.join(__dirname, "data", "websites.json");
let websites = JSON.parse(fs.readFileSync(websitesFilePath));
let searchCache = {};

const saveWebsitesToFile = () => {
  fs.writeFileSync(websitesFilePath, JSON.stringify(websites, null, 2));
};

const sendEmail = async (recipient, emailType, data, cb) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.webmyway.ca",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
    socketTimeout: 10000,
    family: 4,
  });

  let subject = "";
  let text = "";
  let html = "";

  if (emailType === "websiteDown") {
    subject = "Website Down Notification";
    text = `The website ${data.url} is down. Status: ${data.message}`;
  }

  let mailOptions = {
    from: `"Downtime" <${process.env.EMAIL}>`,
    to: recipient,
    subject: subject,
    text: text,
    html: html,
  };

  try {
    await transporter.sendMail(mailOptions, (err, info) => {
      if (info) {
        console.log("Message sent: %s", info);
      }
      if (err) {
        console.log(err);
        cb("error-" + err.message);
      } else {
        cb("sent");
      }
    });
  } catch (error) {
    console.log(error);
    cb("error-" + JSON.stringify(error));
  }
};

const sendEmailNotification = (website) => {
  sendEmail(
    "mishkat606@gmail.com",
    "websiteDown",
    { url: website.url, message: website.status.message },
    (result) => {
      if (result.startsWith("error")) {
        console.error("Error sending email:", result);
      } else {
        console.log("Email sent successfully");
      }
    }
  );
};

const checkWebsiteStatus = async (website) => {
  try {
    const response = await axios.get(website.url, {
      httpsAgent: new (require("https").Agent)({ rejectUnauthorized: false }),
    });
    const newStatus = {
      up: true,
      message: `Website is Running. Status code: ${response.status}`,
    };
    if (website.status && !website.status.up) {
      console.log(`Website ${website.url} is back up. Status changed.`);
    }
    website.status = newStatus;
  } catch (error) {
    const newStatus = {
      up: false,
      message: `Website is Down. Error: ${error.message}`,
    };
    if (!website.status || website.status.up !== newStatus.up) {
      console.log(`Website ${website.url} is down. Sending notification.`);
      sendEmailNotification(website);
    }
    website.status = newStatus;
  }
};


const checkAllWebsites = async () => {
  for (const website of websites) {
    await checkWebsiteStatus(website);
  }
  saveWebsitesToFile();
};

setInterval(checkAllWebsites, 43200000);

app.get("/websites", (req, res) => {
  res.json(websites);
});

app.post("/search", async (req, res) => {
  const { url } = req.body;
  let website = websites.find((w) => w.url === url);

  if (!website && searchCache[url]) {
    return res.json(searchCache[url]);
  }

  if (!website) {
    try {
      const response = await axios.get(url, {
        httpsAgent: new (require("https").Agent)({ rejectUnauthorized: false }),
      });
      website = {
        url,
        status: { up: true, message: `Website is Running. Status code: ${response.status}` },
      };
    } catch (error) {
      website = {
        url,
        status: { up: false, message: `Website is Down. Error: ${error.message}` },
      };
      sendEmailNotification(website); // Send email notification
    }
    searchCache[url] = website;
  }
  res.json(website);
});

app.post("/add", (req, res) => {
  const { url } = req.body;
  if (!websites.some((website) => website.url === url)) {
    websites.push({ url, status: { up: null, message: "Checking..." } });
    saveWebsitesToFile();
  }
  res.json({ message: "Website added for monitoring" });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  checkAllWebsites(); // Initial status check on startup
});

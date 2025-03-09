const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config(); // Load environment variables from .env

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Enable CORS for all routes

// Middleware to parse JSON request bodies
app.use(express.json());

// Function to access spreadsheet data
async function accessSpreadsheet(spreadsheetId, range) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.SERVICE_ACCOUNT_KEY_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    google.options({ auth: client });

    const response = await google.sheets('v4').spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    });

    return response.data;
  } catch (error) {
    console.error('Error accessing spreadsheet:', error);
    throw error; // Re-throw the error to be caught by the route handler
  }
}

// API endpoint to get spreadsheet data
app.get('/api/sheets/:range', async (req, res) => {
  const range = req.params.range;
  const spreadsheetId = process.env.SPREADSHEET_ID;

  try {
    const data = await accessSpreadsheet(spreadsheetId, range);
    res.json(data);
  } catch (error) {
    console.error('Error in API endpoint:', error);
    res.status(500).json({ error: 'Failed to retrieve spreadsheet data' });
  }
});

 // API endpoint to update spreadsheet data
 app.put('/api/sheets/:range', async (req, res) => {
     const range = req.params.range;
     const spreadsheetId = process.env.SPREADSHEET_ID;
     const values = req.body.values; // Expect the request body to contain a 'values' array

     if (!values || !Array.isArray(values)) {
         return res.status(400).json({ error: 'Missing or invalid "values" in request body' });
     }

     try {
         const auth = new google.auth.GoogleAuth({
             keyFile: process.env.SERVICE_ACCOUNT_KEY_PATH,
             scopes: ['https://www.googleapis.com/auth/spreadsheets'],
         });

         const client = await auth.getClient();
         google.options({ auth: client });

         const response = await google.sheets('v4').spreadsheets.values.update({
             spreadsheetId: spreadsheetId,
             range: range,
             valueInputOption: 'USER_ENTERED',
             resource: { values },
         });

         res.json(response.data);
     } catch (error) {
         console.error('Error updating spreadsheet:', error);
         res.status(500).json({ error: 'Failed to update spreadsheet data' });
     }
 });

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
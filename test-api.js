// test-api.js
// Run this with Node.js: node test-api.js

const fetch = require("node-fetch");

async function testPlaylistsAPI() {
  // Replace with a valid JWT token from your application
  const token = "REPLACE_WITH_VALID_TOKEN";

  try {
    console.log("Testing /playlists/user endpoint...");
    const response = await fetch("http://localhost:8000/api/playlists/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const statusCode = response.status;
    console.log("Status code:", statusCode);

    const responseText = await response.text();
    console.log("Response body:", responseText);

    try {
      const data = JSON.parse(responseText);
      console.log("Parsed response:", data);

      if (data.success && Array.isArray(data.data)) {
        console.log("Number of playlists:", data.data.length);
        if (data.data.length > 0) {
          console.log("First playlist sample:", data.data[0]);
        }
      }
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
    }
  } catch (error) {
    console.error("Error calling API:", error);
  }
}

testPlaylistsAPI().catch(console.error);

const express = require("express");

const app = express();

//get route
app.get("/get", (req, res) => {
  res.json({
    message: "API is working",
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
});

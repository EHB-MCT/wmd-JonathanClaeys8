const express = require("express");

const app = express();

//get route
app.get("/get", (req, res) => {
  res.json({
    message: "API is working",
  });
});

// Start server
app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});

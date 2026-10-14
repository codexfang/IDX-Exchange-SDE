const express = require("express");
const cors = require("cors");
const healthRouter = require("./routes/health");
const propertiesRouter = require("./routes/properties");
const requestLogger = require("./middleware/requestLogger");

const app = express();

app.use(requestLogger);
app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/properties", propertiesRouter);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

module.exports = app;

const { pingDatabase } = require("../utils/dbHealth");

const healthCheck = async (req, res) => {
  try {
    const db = await pingDatabase();

    res.json({
      success: true,
      data: {
        message: "Luv Kush Classes API is running",
        database: db,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "API is running but database is unavailable",
      data: {
        database: { status: "disconnected", error: error.message },
        timestamp: new Date().toISOString(),
      },
    });
  }
};

const keepAlive = async (req, res) => {
  try {
    const db = await pingDatabase();

    res.json({
      success: true,
      data: {
        message: "MongoDB keep-alive successful",
        database: db,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Keep-alive failed — database unreachable",
      data: {
        database: { status: "disconnected", error: error.message },
        timestamp: new Date().toISOString(),
      },
    });
  }
};

module.exports = { healthCheck, keepAlive };
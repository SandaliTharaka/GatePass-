const jwt = require("jsonwebtoken");
const User = require("../models/User");
const axios = require("axios");
const NodeCache = require("node-cache");
const axiosRetry = require("axios-retry").default;

// Initialize cache with 30 minute TTL
const userCache = new NodeCache({ stdTTL: 1800 });
const EMPLOYEE_API_BASE_URL = "http://hq-saturn/CAP/api/ERPApi";

// Configure axios retry behavior
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 2000; // Wait 2s, 4s, 6s between retries
  },
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429
    ); // Retry on rate limit errors
  },
});

const getEmployeeFromAPI = async (employeeNumber) => {
  try {
    if (!employeeNumber) {
      console.error("Employee number is required");
      return null;
    }

    // Check cache first
    const cachedUser = userCache.get(employeeNumber);
    if (cachedUser) {
      console.log("Returning cached user data for:", employeeNumber);
      return cachedUser;
    }

    console.log("Fetching user data from API for:", employeeNumber);
    const response = await axios.get(
      `${EMPLOYEE_API_BASE_URL}/GetEmployeeDetails`,
      {
        params: {
          queryParameter: "serviceNumber",
          queryValue: employeeNumber,
        },
        headers: {
          clientId: "TestingApp",
          clientSecret: "Fw4t#$THf4ff3rff3543v#22",
          authenticationTypeId: "1",
        },
      }
    );

    if (response.data.isSuccess && response.data.dataBundle.length > 0) {
      const apiData = response.data.dataBundle[0];
      const userData = {
        serviceNo: apiData.EMPLOYEE_NUMBER,
        name: `${apiData.EMPLOYEE_TITLE} ${apiData.EMPLOYEE_FIRST_NAME} ${apiData.EMPLOYEE_SURNAME}`.trim(),
        designation: apiData.EMPLOYEE_DESIGNATION,
        section: apiData.EMPLOYEE_SECTION || apiData.EMPLOYEE_DIVISION,
        group: apiData.EMPLOYEE_GROUP_NAME,
        contactNo:
          apiData.EMPLOYEE_MOBILE_PHONE || apiData.EMPLOYEE_OFFICE_PHONE,
        email: apiData.EMPLOYEE_OFFICIAL_EMAIL,
        role: "User",
      };

      // Cache the user data
      userCache.set(employeeNumber, userData);
      return userData;
    }
    return null;
  } catch (error) {
    console.error(
      "Error fetching from Employee API:",
      error.response?.data || error.message
    );
    // Return cached data if available, even if expired
    const cachedUser = userCache.get(employeeNumber, true);
    if (cachedUser) {
      console.log("Returning stale cached data due to API error");
      return cachedUser;
    }
    return null;
  }
};

const protect = async (req, res, next) => {
  let token = req.headers.authorization;
  if (token && token.startsWith("Bearer")) {
    try {
      token = token.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded);

      // First check database
      let user = await User.findOne({ serviceNo: decoded.serviceNo }).select(
        "-password"
      );

      // If not in database, check API
      if (!user) {
        console.log("User not found in database, checking Employee API...");
        user = await getEmployeeFromAPI(decoded.serviceNo);

        if (!user) {
          throw new Error("User not found in both database and API");
        }
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Token verification failed:", error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    console.error("No token provided");
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

const superAdmin = (req, res, next) => {
  if (req.user && req.user.role === "SuperAdmin") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized, admin access required" });
  }
};

const generateToken = (serviceNo) => {
  console.log("Generating token for service number:", serviceNo);
  return jwt.sign({ serviceNo }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

module.exports = { protect, superAdmin, generateToken };

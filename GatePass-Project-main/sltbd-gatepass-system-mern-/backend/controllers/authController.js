"use strict";

require("dotenv").config();
const axios = require("axios");
const bcrypt = require("bcryptjs");
const { ConfidentialClientApplication } = require("@azure/msal-node");

const User = require("../models/User");
const { generateToken } = require("../middleware/authMiddleware");
const { useEmployeeAPI } = require("../utils/flags"); // USE_EMPLOYEE_API toggle

// ---------------------- ENV ----------------------
const {
  // Azure
  AZURE_CLIENT_ID,
  AZURE_CLIENT_SECRET,
  AZURE_TENANT_ID,
  AZURE_REDIRECT_URI,

  // ERP / Employee API
  EMPLOYEE_API_BASE_URL,
  EMPLOYEE_API_CLIENT_ID,
  EMPLOYEE_API_CLIENT_SECRET,
  EMPLOYEE_API_AUTH_TYPE_ID = "1",
} = process.env;

// ---------------------- MSAL (Azure) ----------------------
let msalInstance = null;
if (AZURE_CLIENT_ID && AZURE_CLIENT_SECRET && AZURE_TENANT_ID) {
  const msalConfig = {
    auth: {
      clientId: AZURE_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`,
      clientSecret: AZURE_CLIENT_SECRET,
    },
  };
  msalInstance = new ConfidentialClientApplication(msalConfig);
} else {
  console.warn(
    "[authController] Azure env not fully set; Azure login URL will be disabled."
  );
}

// ---------------------- Helpers ----------------------
const mapApiDataToUser = (apiData) => {
  return {
    serviceNo: apiData.EMPLOYEE_NUMBER,
    name: `${apiData.EMPLOYEE_TITLE || ""} ${
      apiData.EMPLOYEE_FIRST_NAME || ""
    } ${apiData.EMPLOYEE_SURNAME || ""}`.trim(),
    designation: apiData.EMPLOYEE_DESIGNATION,
    section: apiData.EMPLOYEE_SECTION || apiData.EMPLOYEE_DIVISION,
    group: apiData.EMPLOYEE_GROUP_NAME,
    contactNo: apiData.EMPLOYEE_MOBILE_PHONE || apiData.EMPLOYEE_OFFICE_PHONE,
    email: apiData.EMPLOYEE_OFFICIAL_EMAIL,
    // keep the raw bundle if you need it later
    apiData: {
      employeeNumber: apiData.EMPLOYEE_NUMBER,
      employeeTitle: apiData.EMPLOYEE_TITLE,
      employeeFirstName: apiData.EMPLOYEE_FIRST_NAME,
      employeeInitials: apiData.EMPLOYEE_INITIALS,
      employeeSurname: apiData.EMPLOYEE_SURNAME,
      employeeOfficePhone: apiData.EMPLOYEE_OFFICE_PHONE,
      employeeMobilePhone: apiData.EMPLOYEE_MOBILE_PHONE,
      employeeOfficialEmail: apiData.EMPLOYEE_OFFICIAL_EMAIL,
      employeeOfficialAddress: apiData.EMPLOYEE_OFFICIAL_ADDRESS,
      employeeCostCentreCode: apiData.EMPLOYEE_COST_CENTRE_CODE,
      employeeCostCentreName: apiData.EMPLOYEE_COST_CENTRE_NAME,
      employeeSalaryGrade: apiData.EMPLOYEE_SALARY_GRADE,
      employeeGroupName: apiData.EMPLOYEE_GROUP_NAME,
      employeeDivision: apiData.EMPLOYEE_DIVISION,
      employeeSection: apiData.EMPLOYEE_SECTION,
      employeePermanentResiAdd: apiData.EMPLOYEE_PERMANENT_RESI_ADD,
      fingerScanLocation: apiData.FINGER_SCAN_LOCATION,
      employeeImmEsServiceNo: apiData.EMPLOYEE_IMM_ES_SERVICE_NO,
      organizationName: apiData.ORGANIZATION_NAME,
      supervisorName: apiData.SUPERVISOR_NAME,
      supervisorSalaryGrade: apiData.SUPERVISOR_SALARY_GRADE,
      activeAssignmentStatus: apiData.ACTIVE_ASSIGNMENT_STATUS,
      nicNumber: apiData.NIC_NUMBER,
      employeeDob: apiData.EMPLOYEE_DOB,
      orgId: apiData.ORG_ID,
      empSecId: apiData.EMP_SEC_ID,
      empSecHeadNo: apiData.EMP_SEC_HEAD_NO,
      empDivId: apiData.EMP_DIV_ID,
      empDivHeadNo: apiData.EMP_DIV_HEAD_NO,
      empGrpId: apiData.EMP_GRP_ID,
      empGrpHeadNo: apiData.EMP_GRP_HEAD_NO,
      empPersonType: apiData.EMP_PERSON_TYPE,
      gender: apiData.GENDER,
      leaveAgent: apiData.LEAVE_AGENT,
      leavingReason: apiData.LEAVING_REASON,
      leavingDate: apiData.LEAVING_DATE,
      personId: apiData.PERSON_ID,
      currentAssignmentStart: apiData.CURRENT_ASSIGNMENT_START,
      payroll: apiData.PAYROLL,
    },
  };
};

const authenticateWithEmployeeAPI = async (username, password) => {
  if (!useEmployeeAPI()) {
    return { success: false, error: "ERP disabled" };
  }
  try {
    const url = `${EMPLOYEE_API_BASE_URL}/common/authenticate`;
    const resp = await axios.post(
      url,
      { username, password },
      {
        headers: {
          clientId: EMPLOYEE_API_CLIENT_ID,
          clientSecret: EMPLOYEE_API_CLIENT_SECRET,
          authenticationTypeId: EMPLOYEE_API_AUTH_TYPE_ID,
        },
        timeout: 10000,
      }
    );

    const d = resp?.data;
    if (d?.isSuccess && d?.dataBundle?.token) {
      return {
        success: true,
        token: d.dataBundle.token,
        user: d.dataBundle.user,
        expiresIn: d.dataBundle.expiresIn,
      };
    }
    return { success: false, error: "Invalid credentials (ERP)" };
  } catch (err) {
    console.error("[ERP] authenticate error:", err?.message || err);
    return { success: false, error: "ERP authenticate failed" };
  }
};

const getEmployeeFromAPI = async (employeeNumber) => {
  if (!useEmployeeAPI()) return null;
  try {
    const resp = await axios.get(
      `${EMPLOYEE_API_BASE_URL}/GetEmployeeDetails`,
      {
        params: { queryParameter: "serviceNumber", queryValue: employeeNumber },
        headers: {
          clientId: EMPLOYEE_API_CLIENT_ID,
          clientSecret: EMPLOYEE_API_CLIENT_SECRET,
          authenticationTypeId: EMPLOYEE_API_AUTH_TYPE_ID,
        },
        timeout: 10000,
      }
    );

    const d = resp?.data;
    if (d?.dataBundle?.length > 0) {
      return d.dataBundle[0];
    }
    return null;
  } catch (err) {
    console.error("[ERP] GetEmployeeDetails error:", err?.message || err);
    return null;
  }
};

const determineUserRole = (salaryGrade) => {
  const approverGrades = ["A.1.", "A.2.", "A.3.", "A.4.", "A.5."];
  return approverGrades.includes(salaryGrade?.trim()) ? "Approver" : "User";
};

// ---------------------- Controllers ----------------------
const registerUser = async (req, res) => {
  try {
    const {
      userType,
      userId,
      password,
      serviceNo,
      name,
      designation,
      section,
      group,
      contactNo,
      role,
      email,
    } = req.body;

    const userExists = await User.findOne({ userId });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      userType,
      userId,
      password: hashedPassword,
      serviceNo,
      name,
      designation,
      section,
      group,
      contactNo,
      role,
      email,
    });

    const token = generateToken(user.serviceNo);
    return res.status(201).json({
      token, // keep token at top-level
      role: user.role, // convenience for your frontend
      roles: Array.isArray(user.role) ? user.role : [user.role],
      user: {
        // structured user payload
        _id: user.id,
        userType: user.userType,
        userId: user.userId,
        serviceNo: user.serviceNo,
        name: user.name,
        designation: user.designation,
        section: user.section,
        group: user.group,
        contactNo: user.contactNo,
        role: user.role,
        email: user.email,
        branches: user.branches,
      },
    });
  } catch (error) {
    console.error("registerUser error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { userId, password, userType } = req.body;
    console.log("Login attempt:", { userId, userType });

    // 1) Try local DB first (works in both offline/online)
    let user = await User.findOne({ userId, userType });
    if (user) {
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ message: "Invalid credentials" });

      // Optional ERP sync on login ONLY when ERP enabled and we have a serviceNo
      if (useEmployeeAPI() && user.serviceNo && user.serviceNo !== "API_USER") {
        const employeeData = await getEmployeeFromAPI(user.serviceNo);
        if (employeeData) {
          const mapped = mapApiDataToUser(employeeData);
          user.name = mapped.name;
          user.designation = mapped.designation;
          user.section = mapped.section;
          user.group = mapped.group;
          user.contactNo = mapped.contactNo;
          user.email = mapped.email;
          user.apiData = mapped.apiData;
          await user.save();
        }
      }

      const token = generateToken(user.serviceNo);
      return res.json({
        token,
        role: user.role,
        roles: Array.isArray(user.role) ? user.role : [user.role],
        user: {
          _id: user.id,
          userType: user.userType,
          userId: user.userId,
          serviceNo: user.serviceNo,
          name: user.name,
          designation: user.designation,
          section: user.section,
          group: user.group,
          contactNo: user.contactNo,
          role: user.role,
          branches: user.branches,
          email: user.email,
        },
      });
    }

    // 2) If user doesn't exist locally:
    //    a) Offline => we cannot verify against ERP, so reject.
    //    b) Online  => authenticate against ERP, upsert a local user, return token.
    if (!useEmployeeAPI()) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const authResult = await authenticateWithEmployeeAPI(userId, password);
    if (!authResult.success) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Try to get ERP profile
    let employeeData = await getEmployeeFromAPI(userId);

    let mappedData;
    if (employeeData) {
      mappedData = mapApiDataToUser(employeeData);
    } else {
      // Minimal user when ERP details are missing (rare)
      mappedData = {
        serviceNo: userId,
        name: authResult.user?.username || userId,
        designation: authResult.user?.role || "API User",
        section: "API",
        group: "API Users",
        contactNo: "N/A",
        email: authResult.user?.email || `${userId}@example.com`,
        apiData: {},
      };
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    user = await User.create({
      userType: userType || "SLT",
      userId,
      password: hashedPassword, // local password (not used when ERP authenticates)
      role: authResult.user?.role === "admin" ? "Admin" : "User",
      isApiUser: true,
      ...mappedData,
    });

    const token = generateToken(user.serviceNo);
    return res.json({
      token,
      role: user.role,
      roles: Array.isArray(user.role) ? user.role : [user.role],
      apiToken: authResult.token, // if you need to call ERP later from client
      apiTokenExpiresIn: authResult.expiresIn,
      user: {
        _id: user.id,
        userType: user.userType,
        userId: user.userId,
        serviceNo: user.serviceNo,
        name: user.name,
        designation: user.designation,
        section: user.section,
        group: user.group,
        contactNo: user.contactNo,
        role: user.role,
        branches: user.branches,
        email: user.email,
        isApiUser: true,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const azureLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ message: "Access token is required" });
    }

    // Graph user
    const userInfo = await getUserInfoFromGraph(accessToken);
    const upn = userInfo.userPrincipalName || "";
    const serviceNoMatch = upn.match(/\d{6}/);
    const serviceNo = serviceNoMatch ? serviceNoMatch[0] : null;

    let roles = new Set();
    let userData;

    // Prefer existing local user
    const existingUser = serviceNo ? await User.findOne({ serviceNo }) : null;
    if (existingUser) {
      if (Array.isArray(existingUser.role)) {
        existingUser.role.forEach((r) => roles.add(r));
      } else if (existingUser.role) {
        roles.add(existingUser.role);
      }

      // Try to enrich with ERP only when enabled
      if (useEmployeeAPI()) {
        const employeeData = await getEmployeeFromAPI(serviceNo);
        if (employeeData) {
          const mapped = mapApiDataToUser(employeeData);
          const apiRole = determineUserRole(employeeData.EMPLOYEE_SALARY_GRADE);
          roles.add(apiRole);

          await User.findByIdAndUpdate(existingUser._id, {
            name: mapped.name,
            designation: mapped.designation,
            section: mapped.section,
            group: mapped.group,
            contactNo: mapped.contactNo,
            email: mapped.email,
            isAzureUser: true,
            lastAzureSync: new Date(),
          });
        }
      }

      userData = {
        token: generateToken(existingUser.serviceNo),
        role: existingUser.role,
        roles: Array.from(roles).length
          ? Array.from(roles)
          : [existingUser.role || "User"],
        user: {
          _id: existingUser._id,
          userType: existingUser.userType,
          userId: upn,
          serviceNo: existingUser.serviceNo,
          name: existingUser.name,
          designation: existingUser.designation,
          section: existingUser.section,
          group: existingUser.group,
          contactNo: existingUser.contactNo,
          email: existingUser.email,
          branches: existingUser.branches,
          isAzureUser: true,
        },
      };
      return res.json(userData);
    }

    // No local user yet
    let mapped = null;
    if (useEmployeeAPI() && serviceNo) {
      const employeeData = await getEmployeeFromAPI(serviceNo);
      if (employeeData) {
        mapped = mapApiDataToUser(employeeData);
        roles.add(determineUserRole(employeeData.EMPLOYEE_SALARY_GRADE));
      }
    }

    // If ERP disabled or no data, create minimal local profile
    const base = mapped || {
      serviceNo: serviceNo || upn,
      name: userInfo.displayName || upn,
      designation: "User",
      section: "N/A",
      group: "N/A",
      contactNo: "N/A",
      email:
        userInfo.mail ||
        userInfo.userPrincipalName ||
        `${serviceNo || "user"}@example.com`,
      apiData: {},
    };

    const tempPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const created = await User.create({
      userType: "SLT",
      userId: upn,
      password: hashedPassword,
      role: "User",
      isAzureUser: true,
      ...base,
    });

    userData = {
      token: generateToken(created.serviceNo),
      role: created.role,
      roles: Array.from(roles).length
        ? Array.from(roles)
        : [created.role || "User"],
      user: {
        _id: created._id,
        userType: created.userType,
        userId: upn,
        serviceNo: created.serviceNo,
        name: created.name,
        designation: created.designation,
        section: created.section,
        group: created.group,
        contactNo: created.contactNo,
        email: created.email,
        branches: created.branches,
        isAzureUser: true,
      },
    };
    return res.json(userData);
  } catch (error) {
    console.error("Azure login error:", error);
    res
      .status(500)
      .json({ message: "Azure authentication failed", error: error.message });
  }
};

const getAzureLoginUrl = async (req, res) => {
  try {
    if (!msalInstance) {
      return res
        .status(501)
        .json({ message: "Azure login is not configured on this server" });
    }
    const authCodeUrlParameters = {
      scopes: ["https://graph.microsoft.com/User.Read"],
      redirectUri: AZURE_REDIRECT_URI || "http://localhost:5173/callback",
    };
    const authUrl = await msalInstance.getAuthCodeUrl(authCodeUrlParameters);
    res.json({ authUrl });
  } catch (error) {
    console.error("Error generating Azure login URL:", error);
    res.status(500).json({ message: "Failed to generate login URL" });
  }
};

// Microsoft Graph helper
const getUserInfoFromGraph = async (accessToken) => {
  try {
    const response = await axios.get("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching user info from Graph:",
      error?.message || error
    );
    throw new Error("Failed to fetch user information from Microsoft Graph");
  }
};

module.exports = {
  registerUser,
  loginUser,
  azureLogin,
  getAzureLoginUrl,
};

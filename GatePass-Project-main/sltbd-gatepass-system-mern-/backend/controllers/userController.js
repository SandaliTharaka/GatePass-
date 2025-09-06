require("dotenv").config();
const User = require("../models/User");
const axios = require("axios");
const { useEmployeeAPI } = require("../utils/flags");

const EMPLOYEE_API_BASE_URL = process.env.EMPLOYEE_API_BASE_URL;
const EMPLOYEE_API_CLIENT_ID = process.env.EMPLOYEE_API_CLIENT_ID;
const EMPLOYEE_API_CLIENT_SECRET = process.env.EMPLOYEE_API_CLIENT_SECRET;
const EMPLOYEE_API_AUTH_TYPE_ID = process.env.EMPLOYEE_API_AUTH_TYPE_ID || "1";

const mapApiDataToUser = (apiData) => {
  return {
    serviceNo: apiData.EMPLOYEE_NUMBER,
    name: `${apiData.EMPLOYEE_TITLE} ${apiData.EMPLOYEE_FIRST_NAME} ${apiData.EMPLOYEE_SURNAME}`.trim(),
    designation: apiData.EMPLOYEE_DESIGNATION,
    section: apiData.EMPLOYEE_SECTION || apiData.EMPLOYEE_DIVISION,
    group: apiData.EMPLOYEE_GROUP_NAME,
    contactNo: apiData.EMPLOYEE_MOBILE_PHONE || apiData.EMPLOYEE_OFFICE_PHONE,
    email: apiData.EMPLOYEE_OFFICIAL_EMAIL,
    role: "User",
    branches: [],
  };
};

const getEmployeeFromAPI = async (employeeNumber) => {
  try {
    if (!useEmployeeAPI()) return null;

    const response = await axios.get(
      `${EMPLOYEE_API_BASE_URL}/GetEmployeeDetails`,
      {
        params: {
          queryParameter: "serviceNumber",
          queryValue: employeeNumber,
        },
        headers: {
          clientId: EMPLOYEE_API_CLIENT_ID,
          clientSecret: EMPLOYEE_API_CLIENT_SECRET,
          authenticationTypeId: EMPLOYEE_API_AUTH_TYPE_ID,
        },
        timeout: 10000,
      }
    );

    if (response.data?.dataBundle?.length > 0) {
      return response.data.dataBundle[0];
    }
    return null;
  } catch (error) {
    console.error("Error fetching employee data from API:", error.message);
    return null;
  }
};

const getUserByServiceNo = async (req, res) => {
  try {
    const { serviceNo } = req.params;

    // 1) Try local DB
    let user = await User.findOne({ serviceNo });

    if (user) {
      // 2) Optional sync only when ERP is enabled
      const employeeData = await getEmployeeFromAPI(serviceNo);
      if (employeeData) {
        const mappedData = mapApiDataToUser(employeeData);
        user.name = mappedData.name;
        user.designation = mappedData.designation;
        user.section = mappedData.section;
        user.group = mappedData.group;
        user.contactNo = mappedData.contactNo;
        user.email = mappedData.email;
        await user.save();
      }

      const userData = {
        serviceNo: user.serviceNo,
        name: user.name,
        designation: user.designation,
        section: user.section,
        group: user.group,
        contactNo: user.contactNo,
        role: user.role,
        email: user.email,
        branches: user.branches,
      };
      return res.status(200).json(userData);
    }

    // 3) Not in local DB -> use ERP only if enabled
    const employeeData = await getEmployeeFromAPI(serviceNo);
    if (!employeeData) {
      return res.status(404).json({ message: "User not found" });
    }

    const mapped = mapApiDataToUser(employeeData);
    const userData = {
      serviceNo: mapped.serviceNo,
      name: mapped.name,
      designation: mapped.designation,
      section: mapped.section,
      group: mapped.group,
      contactNo: mapped.contactNo,
      role: mapped.role,
      email: mapped.email,
      branches: mapped.branches,
    };
    return res.status(200).json(userData);
  } catch (error) {
    console.error("Error in getUserByServiceNo:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const users = await User.findByRole(role);
    const usersData = users.map((user) => ({
      serviceNo: user.serviceNo,
      name: user.name,
      designation: user.designation,
      section: user.section,
      group: user.group,
      contactNo: user.contactNo,
      role: user.role,
      email: user.email,
    }));
    res.status(200).json(usersData);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserByRoleAndBranch = async (req, res) => {
  try {
    const { branch } = req.params;
    const users = await User.find({
      role: "Pleader",
      branches: { $in: [branch] },
    });

    const usersData = users.map((user) => ({
      serviceNo: user.serviceNo,
      name: user.name,
      designation: user.designation,
      section: user.section,
      group: user.group,
      contactNo: user.contactNo,
      role: user.role,
      email: user.email,
    }));

    res.status(200).json(usersData);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getSupervisorHierarchy = async (req, res) => {
  try {
    const { serviceNumber } = req.params;
    console.log(
      "Fetching supervisor hierarchy for service number:",
      serviceNumber
    );

    if (!useEmployeeAPI()) {
      // Try best-effort local inference
      const me = await User.findOne({ serviceNo: serviceNumber });
      if (me?.supervisorServiceNo) {
        const sup = await User.findOne({ serviceNo: me.supervisorServiceNo });
        if (sup) {
          return res.status(200).json([
            {
              serviceNo: sup.serviceNo,
              name: sup.name,
              designation: sup.designation,
              section: sup.section,
              division: sup.division,
              email: sup.email,
              contactNo: sup.contactNo,
              salaryGrade: sup.salaryGrade,
            },
          ]);
        }
      }
      // No local supervisor data → return empty list (UI-friendly)
      return res.status(200).json([]);
    }

    const response = await axios.get(
      `${EMPLOYEE_API_BASE_URL}/GetSupervisorHierachy`,
      {
        params: { serviceNumber },
        headers: {
          clientId: EMPLOYEE_API_CLIENT_ID,
          clientSecret: EMPLOYEE_API_CLIENT_SECRET,
          authenticationTypeId: EMPLOYEE_API_AUTH_TYPE_ID,
        },
        timeout: 10000,
      }
    );

    if (response.data?.dataBundle) {
      const supervisors = response.data.dataBundle.map((supervisor) => ({
        serviceNo: supervisor.EMPLOYEE_NUMBER,
        name: `${supervisor.EMPLOYEE_TITLE} ${supervisor.EMPLOYEE_FIRST_NAME} ${supervisor.EMPLOYEE_SURNAME}`,
        designation: supervisor.EMPLOYEE_DESIGNATION,
        section: supervisor.EMPLOYEE_SECTION,
        division: supervisor.EMPLOYEE_DIVISION,
        email: supervisor.EMPLOYEE_OFFICIAL_EMAIL,
        contactNo:
          supervisor.EMPLOYEE_MOBILE_PHONE || supervisor.EMPLOYEE_OFFICE_PHONE,
        salaryGrade: supervisor.EMPLOYEE_SALARY_GRADE,
      }));
      return res.status(200).json(supervisors);
    }
    return res.status(404).json({ message: "No supervisors found" });
  } catch (error) {
    console.error("Error fetching supervisor hierarchy:", error.message);
    res.status(500).json({ message: "Failed to fetch supervisor hierarchy" });
  }
};

module.exports = {
  getUserByServiceNo,
  getUserByRole,
  getUserByRoleAndBranch,
  getSupervisorHierarchy,
};

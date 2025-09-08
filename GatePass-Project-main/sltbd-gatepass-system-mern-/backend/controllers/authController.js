const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { ConfidentialClientApplication } = require('@azure/msal-node');
const { generateToken } = require('../middleware/authMiddleware');

process.env.AZURE_CLIENT_ID = 'fb3e75a7-554f-41f8-9da3-2b162c255349';
process.env.AZURE_CLIENT_SECRET = 'c0c3b66f-4558-412c-895d-645e9ae79712';
process.env.AZURE_TENANT_ID = '534253fc-dfb6-462f-b5ca-cbe81939f5ee';
process.env.AZURE_REDIRECT_URI = 'http://localhost:5173/callback';

// Debug environment variables
// console.log('Azure Config Check:');
// console.log('AZURE_CLIENT_ID:', process.env.AZURE_CLIENT_ID ? 'Set' : 'Not set');
// console.log('AZURE_CLIENT_SECRET:', process.env.AZURE_CLIENT_SECRET ? 'Set' : 'Not set');
// console.log('AZURE_TENANT_ID:', process.env.AZURE_TENANT_ID ? 'Set' : 'Not set');

const EMPLOYEE_API_BASE_URL = 'http://hq-saturn/CAP/api/ERPApi';

//const EMPLOYEE_API_BASE_URL = 'https://employee-api-without-category-production.up.railway.app/api';
let apiToken = null;

const mapApiDataToUser = (apiData) => {
    return {
        // Map API fields to your existing model fields
        serviceNo: apiData.EMPLOYEE_NUMBER,
        name: `${apiData.EMPLOYEE_TITLE} ${apiData.EMPLOYEE_FIRST_NAME} ${apiData.EMPLOYEE_SURNAME}`.trim(),
        designation: apiData.EMPLOYEE_DESIGNATION,
        section: apiData.EMPLOYEE_SECTION || apiData.EMPLOYEE_DIVISION,
        group: apiData.EMPLOYEE_GROUP_NAME,
        contactNo: apiData.EMPLOYEE_MOBILE_PHONE || apiData.EMPLOYEE_OFFICE_PHONE,
        email: apiData.EMPLOYEE_OFFICIAL_EMAIL,

        // Store full API data for future reference
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
            payroll: apiData.PAYROLL
        }
    };
};

const authenticateWithEmployeeAPI = async (username = "admin", password = "password") => {
    try {
        const response = await axios.post(`${EMPLOYEE_API_BASE_URL}/common/authenticate`, {
            username,
            password
        });

        if (response.data.isSuccess) {
            apiToken = response.data.dataBundle.token;
            return {
                success: true,
                token: apiToken,
                user: response.data.dataBundle.user,
                expiresIn: response.data.dataBundle.expiresIn
            };
        }
        throw new Error('API authentication failed');
    } catch (error) {
        //console.error('Employee API authentication error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

const getEmployeeFromAPI = async (employeeNumber) => {
    try {
        // if (!apiToken) {
        //     await authenticateWithEmployeeAPI();
        // }

        const response = await axios.get(
            `${EMPLOYEE_API_BASE_URL}/GetEmployeeDetails`,
            {
                headers: {
                    'Authorization': `Bearer ${apiToken}`
                },
                params: {
                    queryParameter: 'serviceNumber',
                    queryValue: employeeNumber
                },
                headers: {
                    clientId: 'TestingApp',
                    clientSecret: 'Fw4t#$THf4ff3rff3543v#22',
                    authenticationTypeId: '1'
                }
            }
        );

        if (response.data.isSuccess && response.data.dataBundle.length > 0) {
            return response.data.dataBundle[0];
        }
        return null;
    } catch (error) {
        console.error('Error fetching employee data:', error);
        // If token expired, try to re-authenticate
        if (error.response && error.response.status === 401) {
            try {
                //await authenticateWithEmployeeAPI();
                const retryResponse = await axios.get(
                    `${EMPLOYEE_API_BASE_URL}/GetEmployeeDetails`,
                    {
                        headers: {
                            'Authorization': `Bearer ${apiToken}`
                        },
                        params: {
                            queryParameter: 'serviceNumber',
                            queryValue: employeeNumber
                        },
                        headers: {
                            clientId: 'TestingApp',
                            clientSecret: 'Fw4t#$THf4ff3rff3543v#22',
                            authenticationTypeId: '1'
                        }
                    }
                );

                if (retryResponse.data.isSuccess && retryResponse.data.dataBundle.length > 0) {
                    return retryResponse.data.dataBundle[0];
                }
            } catch (retryError) {
                console.error('Retry failed:', retryError);
            }
        }
        return null;
    }
};


// Azure AD configuration
const msalConfig = {
    auth: {
        clientId: process.env.AZURE_CLIENT_ID || 'fb3e75a7-554f-41f8-9da3-2b162c255349',
        clientSecret: process.env.AZURE_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || '534253fc-dfb6-462f-b5ca-cbe81939f5ee'}`
    }
};

// Validate required environment variables
if (!process.env.AZURE_CLIENT_SECRET) {
    console.error('AZURE_CLIENT_SECRET is not set in environment variables');
    process.exit(1);
}

const msalInstance = new ConfidentialClientApplication(msalConfig);

const registerUser = async (req, res) => {
    try {
        const { userType, userId, password, serviceNo, name, designation, section, group, contactNo, role, email } = req.body;

        const userExists = await User.findOne({ userId });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

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
            email
        });

        res.status(201).json({
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
            token: generateToken(user.serviceNo)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const loginUser = async (req, res) => {
    try {
        const { userId, password, userType } = req.body;

        console.log('Login attempt:', { userId, userType, password });

        // First, try to find user in local database
        let user = await User.findOne({ userId, userType });

        if (user) {
            // User exists in local database - verify password
            if (!(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Optionally sync with API data on login for existing users
            if (user.serviceNo && user.serviceNo !== 'API_USER') {
                const employeeData = await getEmployeeFromAPI(user.serviceNo);
                if (employeeData) {
                    const mappedData = mapApiDataToUser(employeeData);

                    // Update user with latest API data
                    user.name = mappedData.name;
                    user.designation = mappedData.designation;
                    user.section = mappedData.section;
                    user.group = mappedData.group;
                    user.contactNo = mappedData.contactNo;
                    user.email = mappedData.email;
                    user.apiData = mappedData.apiData;

                    await user.save();
                }
            }

            // Return successful login response
            return res.json({
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
                token: generateToken(user.serviceNo)
            });
        }

        // User not found in local database - try Employee API authentication
        console.log('User not found in local database, trying Employee API authentication...');

        // Authenticate with Employee API using provided credentials
        //const authResult = await authenticateWithEmployeeAPI(userId, password);

        if (!authResult.success) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Try to get employee details from API using userId as employee number
        let employeeData = await getEmployeeFromAPI('12345');

        // If not found by userId, try to search by email
        if (!employeeData) {
            // You might need to implement a search by email function
            // For now, we'll create a basic user with API auth info
            employeeData = null;
        }

        let mappedData;
        if (employeeData) {
            // Map full employee data
            mappedData = mapApiDataToUser(employeeData);
        } else {
            // Create minimal user data from API auth response
            mappedData = {
                serviceNo: userId, // Use userId as serviceNo if no employee data found
                name: authResult.user.username || userId,
                designation: authResult.user.role || 'API User',
                section: 'API',
                group: 'API Users',
                contactNo: 'N/A',
                email: `${userId}@slt.com.lk`,
                apiData: {
                    employeeNumber: userId,
                    employeeFirstName: authResult.user.username || userId,
                    employeeSurname: '',
                    employeeOfficialEmail: `${userId}@slt.com.lk`,
                    employeeDesignation: authResult.user.role || 'API User',
                    activeAssignmentStatus: 'Active Assignment'
                }
            };
        }

        // Hash a temporary password (user authenticated via API)
        const tempPassword = Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        // Create new user with API authentication
        user = await User.create({
            userType: userType || 'SLT',
            userId: userId,
            password: hashedPassword, // Temporary password since they use API auth
            role: authResult.user.role === 'admin' ? 'Admin' : 'User',
            isApiUser: true,
            ...mappedData
        });

        console.log('New user created from Employee API authentication');

        // Return successful login response
        res.json({
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
            apiToken: authResult.token,
            apiTokenExpiresIn: authResult.expiresIn,
            token: generateToken(user.serviceNo)
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// Azure AD Login - Fixed version
const determineUserRole = (salaryGrade) => {
    const approverGrades = ['A.1.', 'A.2.', 'A.3.', 'A.4.', 'A.5.'];
    return approverGrades.includes(salaryGrade?.trim()) ? 'Approver' : 'User';
};

const azureLogin = async (req, res) => {
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({ message: 'Access token is required' });
        }

        // Get user info from Microsoft Graph
        const userInfo = await getUserInfoFromGraph(accessToken);
        const empleeId = await axios.get('https://graph.microsoft.com/v1.0/me?$select=employeeId', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        console.log('User Info from Graph:', userInfo.userPrincipalName);

        const serviceNoMatch = userInfo.userPrincipalName.match(/\d{6}/);
        console.log("serviceNoMatch", serviceNoMatch);
        const serviceNo = serviceNoMatch ? serviceNoMatch[0] : null;
        console.log("serviceNo", serviceNo);

        // if (!serviceNo) {
        //     return res.status(400).json({ message: 'Service number not found in Azure profile' });
        // }


        // if (!empleeId.data.employeeId) {
        //     return res.status(400).json({ message: 'Employee ID not found in Azure profile' });
        // }


        let roles = new Set(); // Use Set to avoid duplicates
        let userData = null;

        // First check if user exists in database
        const existingUser = await User.findOne({ serviceNo });
        console.log('Existing user found:', existingUser);

        if (existingUser) {
            // Add existing database role(s)
            if (Array.isArray(existingUser.role)) {
                existingUser.role.forEach(role => roles.add(role));
            } else if (existingUser.role) {
                roles.add(existingUser.role);
            }

            // Get fresh data from API
            const employeeData = await getEmployeeFromAPI(serviceNo);

            if (employeeData) {
                const mappedData = mapApiDataToUser(employeeData);

                // Add API-determined role based on salary grade
                const apiRole = determineUserRole(employeeData.EMPLOYEE_SALARY_GRADE);
                roles.add(apiRole);

                // Update user data without changing roles
                await User.findByIdAndUpdate(existingUser._id, {
                    name: mappedData.name,
                    designation: mappedData.designation,
                    section: mappedData.section,
                    group: mappedData.group,
                    contactNo: mappedData.contactNo,
                    email: mappedData.email,
                    // azureId: userInfo.id,
                    isAzureUser: true,
                    lastAzureSync: new Date()
                });

                userData = {
                    _id: existingUser._id,
                    userType: existingUser.userType,
                    userId: userInfo.userPrincipalName,
                    serviceNo: mappedData.serviceNo,
                    name: mappedData.name,
                    designation: mappedData.designation,
                    section: mappedData.section,
                    group: mappedData.group,
                    contactNo: mappedData.contactNo,
                    email: mappedData.email,
                    branches: existingUser.branches,
                    roles: Array.from(roles), // Convert Set back to array
                    isAzureUser: true,
                    token: generateToken(serviceNo),
                    empleeId: serviceNo
                };

                console.log('User roles combined:', Array.from(roles));
                return res.json(userData);
            }
        }

        // If user not found in database, use API data only
        const employeeData = await getEmployeeFromAPI(serviceNo);
        if (!employeeData) {
            return res.status(404).json({ message: 'Employee not found in system' });
        }

        const mappedData = mapApiDataToUser(employeeData);
        roles.add(determineUserRole(employeeData.EMPLOYEE_SALARY_GRADE));

        userData = {
            serviceNo: mappedData.serviceNo,
            name: mappedData.name,
            designation: mappedData.designation,
            section: mappedData.section,
            group: mappedData.group,
            contactNo: mappedData.contactNo,
            email: mappedData.email,
            userType: 'SLT',
            userId: userInfo.userPrincipalName,
            roles: Array.from(roles),
            isAzureUser: true,
            empleeId: serviceNo,
            token: generateToken(serviceNo)
        };

        console.log('Employee Salary Grade:', employeeData.EMPLOYEE_SALARY_GRADE);
        console.log('Assigned Roles:', Array.from(roles));
        res.json(userData);

    } catch (error) {
        console.error('Azure login error:', error);
        res.status(500).json({ message: 'Azure authentication failed', error: error.message });
    }
};

// Get Azure login URL
const getAzureLoginUrl = async (req, res) => {
    try {
        const authCodeUrlParameters = {
            scopes: ['https://graph.microsoft.com/User.Read'],
            redirectUri: process.env.AZURE_REDIRECT_URI || 'http://localhost:5173/callback',
        };

        const authUrl = await msalInstance.getAuthCodeUrl(authCodeUrlParameters);
        res.json({ authUrl });
    } catch (error) {
        console.error('Error generating Azure login URL:', error);
        res.status(500).json({ message: 'Failed to generate login URL' });
    }
};

// Helper function to get user info from Microsoft Graph
const getUserInfoFromGraph = async (accessToken) => {
    try {
        const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching user info from Graph:', error);
        throw new Error('Failed to fetch user information from Microsoft Graph');
    }
};

module.exports = { registerUser, loginUser, azureLogin, getAzureLoginUrl };

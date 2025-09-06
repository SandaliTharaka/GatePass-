import { useState, useEffect } from 'react';
import { FaUserPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaEye, FaEyeSlash, FaUserShield, FaUser, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { userManagementService, searchEmployeeByServiceNo } from '../services/userManagementService.js';
import { getLocations } from '../services/requestService.js';
import { useToast } from '../components/ToastProvider.jsx';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [currentUser, setCurrentUser] = useState(null);
    const [filterRole, setFilterRole] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [showPassword, setShowPassword] = useState(false);
    const [locations, setLocations] = useState([]);
    const [formData, setFormData] = useState({
        userType: 'SLT',
        userId: '',
        password: '',
        serviceNo: '',
        name: '',
        designation: '',
        section: '',
        group: '',
        contactNo: '',
        email: '',
        role: 'User',
        branches: []
    });
    const [searchServiceNo, setSearchServiceNo] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const { showToast } = useToast();

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers();
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const data = await getLocations();
            console.log(data);
            setLocations(data);
        } catch (error) {
            console.error('Failed to fetch locations:', error);
        }
    };

    console.log(locations);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'branches') {
            if (formData.role === 'Dispatcher') {
                // For Dispatcher, only allow single branch selection
                setFormData(prev => ({
                    ...prev,
                    [name]: [value] // Wrap single value in array
                }));
            } else {
                // For Pleader, allow multiple branch selection
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                setFormData(prev => ({
                    ...prev,
                    [name]: selectedOptions
                }));
            }
        } else if (name === 'role') {
            // Reset branches when role changes
            setFormData(prev => ({
                ...prev,
                [name]: value,
                branches: [] // Clear branches when role changes
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };


    // Apply filters and search
    useEffect(() => {
        let result = [...users];

        // Apply role filter
        if (filterRole !== 'All') {
            result = result.filter(user => user.role === filterRole);
        }

        // Apply type filter
        if (filterType !== 'All') {
            result = result.filter(user => user.userType === filterType);
        }

        // Apply search
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(user =>
                user.name.toLowerCase().includes(search) ||
                user.userId.toLowerCase().includes(search) ||
                user.serviceNo.toLowerCase().includes(search) ||
                user.email.toLowerCase().includes(search)
            );
        }

        setFilteredUsers(result);
    }, [users, searchTerm, filterRole, filterType]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await userManagementService.getAllUsers();
            setUsers(data);
            setFilteredUsers(data);
        } catch (error) {
            toast.error('Failed to fetch users');
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setFormData({
            userType: 'SLT',
            userId: '',
            password: '',
            serviceNo: '',
            name: '',
            designation: '',
            section: '',
            group: '',
            contactNo: '',
            email: '',
            role: 'User',
            branches: []
        });
        setModalMode('create');
        setShowModal(true);
        setShowPassword(false);
    };

    const openEditModal = (user) => {
        setCurrentUser(user);
        setFormData({
            userType: user.userType,
            userId: user.userId,
            password: '',
            serviceNo: user.serviceNo,
            name: user.name,
            designation: user.designation,
            section: user.section,
            group: user.group,
            contactNo: user.contactNo,
            email: user.email,
            role: user.role,
            branches: user.branches || []
        });
        setModalMode('edit');
        setShowModal(true);
        setShowPassword(false);
    };

    const openViewModal = (user) => {
        setCurrentUser(user);
        setFormData({
            userType: user.userType,
            userId: user.userId,
            serviceNo: user.serviceNo,
            name: user.name,
            designation: user.designation,
            section: user.section,
            group: user.group,
            contactNo: user.contactNo,
            email: user.email,
            role: user.role
        });
        setModalMode('view');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        console.log('Form Data:', formData);
        e.preventDefault();

        try {
            if (modalMode === 'create') {
                // Validate required fields
                if (!formData.userId || !formData.name || !formData.email) {
                    return toast.error('Please fill all required fields');
                }

                await userManagementService.createUser(formData);
                toast.success('User created successfully');
            } else if (modalMode === 'edit') {
                // For edit, password is optional
                if (!formData.userId || !formData.name || !formData.email) {
                    return toast.error('Please fill all required fields');
                }

                // Remove password if empty
                const dataToSend = { ...formData };
                if (!dataToSend.password) delete dataToSend.password;

                await userManagementService.updateUser(currentUser._id, dataToSend);
                toast.success('User updated successfully');
            }

            // Refresh user list and close modal
            fetchUsers();
            setShowModal(false);
            setSearchServiceNo('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
            console.error('Error:', error);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await userManagementService.deleteUser(userId);
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (error) {
            toast.error('Failed to delete user');
            console.error('Error deleting user:', error);
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'SuperAdmin': return 'bg-red-100 text-red-800';
            case 'Admin': return 'bg-purple-100 text-purple-800';
            case 'Approver': return 'bg-blue-100 text-blue-800';
            case 'Verifier': return 'bg-green-100 text-green-800';
            case 'Dispatcher': return 'bg-yellow-100 text-yellow-800';
            case 'User': return 'bg-gray-100 text-gray-800';
            case 'Pleader': return 'bg-orange-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleDisplayName = (role) => {
        switch (role) {
            case 'Dispatcher': return 'Receiver';
            case 'Pleader': return 'Patrol Leader';
            case 'Verifier': return 'Duty Officer';
            case 'Admin': return 'Administrator';
            case 'User': return 'Employee';
            default: return role;
        }
    };

    const handleEmployeeSearch = async () => {
        if (!searchServiceNo.trim()) {
            toast.warning('Please enter a service number');
            return;
        }

        setIsSearching(true);
        try {
            const employeeData = await searchEmployeeByServiceNo(searchServiceNo);

            // Pre-fill the form with employee data
            setFormData({
                userType: 'SLT',
                userId: employeeData.email || '',
                password: '',
                serviceNo: employeeData.serviceNo,
                name: employeeData.name,
                designation: employeeData.designation,
                section: employeeData.section,
                group: employeeData.group,
                contactNo: employeeData.contactNo,
                email: employeeData.email,
                role: 'User',
                branches: []
            });

            // Open create modal with pre-filled data
            setModalMode('create');
            setShowModal(true);
            toast.success('Employee found! Please assign a role.');
        } catch (error) {
            toast.error('Employee not found or error occurred');
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="relative flex-grow max-w-md">
                <div className="flex gap-2">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by service number..."
                            value={searchServiceNo}
                            onChange={(e) => setSearchServiceNo(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button
                        onClick={handleEmployeeSearch}
                        disabled={isSearching}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        {isSearching ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                <span>Searching...</span>
                            </>
                        ) : (
                            <>
                                <FaSearch />
                                <span>Search</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="relative flex-grow max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <FaFilter className="text-gray-500" />
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="All">All Roles</option>
                        <option value="Verifier">Duty Officer</option>
                        <option value="Dispatcher">Receiver</option>
                        <option value="Pleader">Patrol Leader</option>
                        <option value="Admin">Administrator</option>
                    </select>
                </div>

                {/* <div className="flex items-center space-x-2">
                    <FaUserShield className="text-gray-500" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="All">All Types</option>
                        <option value="SLT">SLT</option>
                        <option value="Non-SLT">Non-SLT</option>
                    </select>
                </div> */}
            </div>

            {/* User Table */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="flex justify-center items-center p-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                        {searchTerm || filterRole !== 'All' || filterType !== 'All'
                            ? "No users match your search criteria"
                            : "No users found in the system"}
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role & Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">ID: {user.userId}</div>
                                                <div className="text-sm text-gray-500">Service No: {user.serviceNo}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.email}</div>
                                        <div className="text-sm text-gray-500">{user.contactNo}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                            {getRoleDisplayName(user.role)}
                                        </span>
                                        <div className="text-sm text-gray-500 mt-1">{user.userType}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.designation}</div>
                                        <div className="text-sm text-gray-500 mt-1">{user.section} - {user.group}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => openViewModal(user)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                                        >
                                            <FaEye />
                                        </button>
                                        <button
                                            onClick={() => openEditModal(user)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user._id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* User Modal */}
            {/* User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white flex items-center">
                                    {modalMode === 'create' ? (
                                        <><FaUserPlus className="mr-3" /> Add New User</>
                                    ) : modalMode === 'edit' ? (
                                        <><FaEdit className="mr-3" /> Edit User</>
                                    ) : (
                                        <><FaUser className="mr-3" /> User Details</>
                                    )}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-white/80 hover:text-white transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            {currentUser && modalMode !== 'create' && (
                                <div className="mt-2 text-blue-100">User ID: {currentUser.userId}</div>
                            )}
                        </div>

                        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* User Type & Role Section */}
                                    <div className="md:col-span-2 bg-blue-50 rounded-xl p-5 mb-4">
                                        <h3 className="text-lg font-semibold text-blue-800 flex items-center mb-4">
                                            <FaUserShield className="mr-2" /> Account Type & Permissions
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* <div>
                                                <label className="block text-sm font-medium text-blue-600 mb-1">User Type*</label>
                                                <select
                                                    name="userType"
                                                    value={formData.userType}
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                                    required
                                                >
                                                    <option value="SLT">SLT</option>
                                                    <option value="Non-SLT">Non-SLT</option>
                                                </select>
                                            </div> */}

                                            <div>
                                                <label className="block text-sm font-medium text-blue-600 mb-1">Role*</label>
                                                <select
                                                    name="role"
                                                    value={formData.role}
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                                    required
                                                >
                                                    <option value="User">Employee</option>
                                                    <option value="Verifier">Duty Officer</option>
                                                    <option value="Dispatcher">Receiver</option>
                                                    <option value="Pleader">Patrol Leader</option>
                                                    <option value="Admin">Administrator</option>
                                                </select>
                                            </div>
                                            {(formData.role === 'Pleader' || formData.role === 'Dispatcher') && (
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-blue-600 mb-1">
                                                        {formData.role === 'Pleader' ? 'Branches* (Multiple selection allowed)' : 'Branch*'}
                                                    </label>
                                                    <div className="relative">
                                                        <select
                                                            name="branches"
                                                            value={formData.branches}
                                                            onChange={handleInputChange}
                                                            disabled={modalMode === 'view'}
                                                            multiple={formData.role === 'Pleader'}
                                                            size={formData.role === 'Pleader' ? 4 : 1}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                                            required
                                                        >
                                                            {locations.map((location) => (
                                                                <option
                                                                    key={location._id}
                                                                    value={location.name}
                                                                    className="py-1 px-2 hover:bg-blue-50"
                                                                >
                                                                    {location.name}
                                                                </option>
                                                            ))}
                                                        </select>

                                                        {/* Selected branches preview */}
                                                        {formData.branches.length > 0 && (
                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                {formData.branches.map((branch) => (
                                                                    <span
                                                                        key={branch}
                                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                                    >
                                                                        {branch}
                                                                        {modalMode !== 'view' && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setFormData(prev => ({
                                                                                        ...prev,
                                                                                        branches: prev.branches.filter(b => b !== branch)
                                                                                    }));
                                                                                }}
                                                                                className="ml-1 text-blue-600 hover:text-blue-800"
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        )}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {formData.role === 'Pleader' && (
                                                            <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                                                                <span className="flex items-center">
                                                                    <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-md mr-1">Ctrl</kbd>
                                                                    <span>or</span>
                                                                    <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-md ml-1">⌘</kbd>
                                                                </span>
                                                                <span>+ click to select multiple branches</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* User Credentials */}
                                    <div className="md:col-span-2 bg-gray-50 rounded-xl p-5 mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                                            <FaUser className="mr-2" /> User Credentials
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">User ID*</label>
                                                <input
                                                    type="text"
                                                    name="userId"
                                                    value={formData.userId}
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                                    required
                                                />
                                            </div>

                                            {/* {modalMode !== 'view' && (
                                                <div className="relative">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Password {modalMode === 'edit' ? '(Leave blank to keep current)' : '*'}
                                                    </label>
                                                    <div className="flex">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            name="password"
                                                            value={formData.password}
                                                            onChange={handleInputChange}
                                                            className="w-full border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            required={modalMode === 'create'}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="px-3 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                                                        >
                                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                        </button>
                                                    </div>
                                                </div>
                                            )} */}
                                        </div>
                                    </div>

                                    {/* Personal Information */}
                                    <div className="md:col-span-2 bg-gray-50 rounded-xl p-5 mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                                            <FaUser className="mr-2" /> Personal Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Service No*</label>
                                                <input
                                                    type="text"
                                                    name="serviceNo"
                                                    value={formData.serviceNo}
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number*</label>
                                                <input
                                                    type="text"
                                                    name="contactNo"
                                                    value={formData.contactNo}
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Department Information */}
                                    <div className="md:col-span-2 bg-gray-50 rounded-xl p-5">
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                                            <FaMapMarkerAlt className="mr-2" /> Department Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Designation*</label>
                                                <input
                                                    type="text"
                                                    name="designation"
                                                    value={formData.designation}
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Section*</label>
                                                <input
                                                    type="text"
                                                    name="section"
                                                    value={formData.section}
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Group*</label>
                                                <input
                                                    type="text"
                                                    name="group"
                                                    value={formData.group}
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-6 py-4 flex justify-end">
                            {modalMode !== 'view' ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 mr-3"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        {modalMode === 'create' ? 'Create User' : 'Update User'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default UserManagement;


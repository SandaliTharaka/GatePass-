import { useState, useEffect } from "react";
import {
  createStatus,
  getPendingStatuses,
  getApprovedStatuses,
  getRejectedStatuses,
  approveStatus,
  rejectStatus,
  searchUserByServiceNo,
  markItemsAsReturned,
} from "../services/ApproveService.js";
import {
  getImageUrl,
  getImageUrlSync,
  searchReceiverByServiceNo,
  searchEmployeeByServiceNo,
  getGatePassRequest,
} from "../services/RequestService.js";
import { useToast } from "../components/ToastProvider.jsx";
// Email notifications are handled server-side by backend controllers
import { FaSearch } from "react-icons/fa";
import { jsPDF } from "jspdf";
import logoUrl from "../assets/SLTMobitel_Logo.png";
import {
  getCachedUser,
  getCachedUserAllowRefresh,
  setCachedUser,
} from "../utils/userCache.js";
import { useAutoRefetch } from "../hooks/useRealtimeUpdates.js";
import {
  FaClock,
  FaEye,
  FaUser,
  FaBoxOpen,
  FaMapMarkerAlt,
  FaUserCheck,
  FaTimes,
  FaInfoCircle,
  FaTimesCircle,
  FaCheckCircle,
  FaUndo,
  FaTruck,
  FaFilePdf,
} from "react-icons/fa";

// Helper function to check if a service number is a Non-SLT identifier
const isNonSltIdentifier = (serviceNo) => {
  if (!serviceNo) return false;
  // Check if it starts with NSL (Non-SLT prefix)
  if (serviceNo.startsWith("NSL")) return true;
  return false;
};

const ensureReceiverDetails = (receiverDetails, receiverServiceNo, request) => {
  if (receiverDetails || !receiverServiceNo) return receiverDetails;
  return {
    name:
      request?.receiverName ||
      request?.requestDetails?.receiverName ||
      request?.request?.receiverName ||
      "N/A",
    serviceNo: receiverServiceNo,
    group: "N/A",
    contactNo:
      request?.receiverContact ||
      request?.requestDetails?.receiverContact ||
      request?.request?.receiverContact ||
      "N/A",
  };
};

const mapErpEmployeeToReceiver = (employee, fallbackServiceNo) => {
  if (!employee) return null;

  return {
    name: `${employee.employeeTitle || ""} ${
      employee.employeeFirstName || ""
    } ${employee.employeeSurname || ""}`.trim(),
    serviceNo: employee.employeeNo || fallbackServiceNo || "N/A",
    designation: employee.designation || "-",
    section: employee.empSection || "-",
    group: employee.empGroup || "-",
    contactNo: employee.mobileNo || "-",
  };
};

const fetchReceiverFromErp = async (serviceNo) => {
  try {
    const response = await searchEmployeeByServiceNo(serviceNo);
    const employee =
      response?.data?.data?.[0] ||
      response?.data?.data ||
      response?.data?.[0] ||
      response?.data ||
      null;
    return mapErpEmployeeToReceiver(employee, serviceNo);
  } catch {
    return null;
  }
};

const fetchReceiverDetails = async (serviceNo) => {
  try {
    const userData = await searchUserByServiceNo(serviceNo);
    if (userData) return userData;
  } catch {}
  return await fetchReceiverFromErp(serviceNo);
};

const ExecutiveApproval = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setselectedItem] = useState(null);
  const [comment, setComment] = useState("");
  const [pendingItems, setpendingItems] = useState([]);
  const [approvedItems, setapprovedItems] = useState([]);
  const [rejectedDESCRIPTIONs, setRejectedDESCRIPTIONs] = useState([]);
  const [transportData, setTransportData] = useState(null);
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [companyTypeFilter, setCompanyTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role?.toUpperCase();
  const isSuperAdmin = role === "SUPERADMIN";

  // Real-time auto-refetch when new requests come in or status changes
  useAutoRefetch(
    async () => {
      // Only refetch the active tab
      if (activeTab === "pending") {
        try {
          // const data = await getPendingStatuses(user.serviceNo);
          const data = await getPendingStatuses();
          const formattedData = await Promise.all(
            data.map(async (status) => {
              const senderServiceNo = status.request?.employeeServiceNo;
              const receiverServiceNo = status.request?.receiverServiceNo;
              const transportData = status.request?.transport;
              const isNonSltPlace = status.request?.isNonSltPlace;
              let senderDetails = null;

              if (senderServiceNo === user.serviceNo) {
                senderDetails = {
                  serviceNo: user.serviceNo,
                  name: user.name,
                  section: user.section || "N/A",
                  group: user.group || "N/A",
                  designation: user.designation || "N/A",
                  contactNo: user.contactNo || "N/A",
                  email: user.email || "N/A",
                  branches: user.branches || "N/A",
                };
                setCachedUser(user.serviceNo, senderDetails);
              } else if (senderServiceNo) {
                // Fetch sender details for any service number
                try {
                  senderDetails = await getCachedUser(
                    senderServiceNo,
                    searchUserByServiceNo,
                  );
                } catch {}
              }

              // Fallback for missing sender details
              if (!senderDetails && senderServiceNo) {
                senderDetails = {
                  serviceNo: senderServiceNo,
                  name: "N/A",
                  section: "N/A",
                  group: "N/A",
                  designation: "N/A",
                  contactNo: "N/A",
                };
              }

              let receiverDetails = null;
              if (
                receiverServiceNo &&
                !isNonSltPlace &&
                !isNonSltIdentifier(receiverServiceNo)
              ) {
                try {
                  receiverDetails = await getCachedUserAllowRefresh(
                    receiverServiceNo,
                    fetchReceiverDetails,
                  );
                } catch (error) {
                  // Silently handle missing users
                }
              } else if (
                isNonSltPlace ||
                isNonSltIdentifier(receiverServiceNo)
              ) {
                receiverDetails = {
                  name: status.request?.receiverName || "N/A",
                  nic: status.request?.receiverNIC || receiverServiceNo,
                  contactNo: status.request?.receiverContact || "N/A",
                };
              }
              receiverDetails = ensureReceiverDetails(
                receiverDetails,
                receiverServiceNo,
                status.request,
              );

              return {
                refNo: status.referenceNumber,
                senderDetails,
                receiverDetails,
                transportData,
                inLocation: status.request?.inLocation,
                outLocation: status.request?.outLocation,
                createdAt: new Date(
                  status.request?.createdAt || status.createdAt,
                ).toLocaleString(),
                items: status.request?.items || [],
                comment: status.executiveOfficerComment || "",
                request: status.request,
                requestDetails: { ...status.request },
              };
            }),
          );
          setpendingItems(formattedData);
        } catch (error) {
          console.error("Error in real-time refetch:", error);
        }
      }
    },
    [user, activeTab],
    { status: 1 }, // Only refetch for pending status updates
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // const data = await getPendingStatuses(user.serviceNo);
        const data = await getPendingStatuses();

        // Process each status with async operations
        const formattedData = await Promise.all(
          data.map(async (status) => {
            const senderServiceNo = status.request?.employeeServiceNo;
            const receiverServiceNo = status.request?.receiverServiceNo;
            const transportData = status.request?.transport;
            const isNonSltPlace = status.request?.isNonSltPlace;
            let senderDetails = null;

            // Check if the sender is the logged-in user
            if (senderServiceNo === user.serviceNo) {
              // Use logged-in user's data for sender details
              senderDetails = {
                serviceNo: user.serviceNo,
                name: user.name,
                section: user.section || "N/A",
                group: user.group || "N/A",
                designation: user.designation || "N/A",
                contactNo: user.contactNo || "N/A",
                email: user.email || "N/A",
                branches: user.branches || "N/A",
              };
              // Cache the logged-in user data
              setCachedUser(user.serviceNo, senderDetails);
            } else if (senderServiceNo) {
              // Fetch user data for ANY service number (SLT or Non-SLT)
              try {
                senderDetails = await getCachedUser(
                  senderServiceNo,
                  searchUserByServiceNo,
                );
              } catch (error) {
                // User not found - will use fallback
              }
            }

            // If sender details couldn't be fetched, create a basic object with at least the service number
            if (!senderDetails && senderServiceNo) {
              senderDetails = {
                serviceNo: senderServiceNo,
                name: "N/A",
                section: "N/A",
                group: "N/A",
                designation: "N/A",
                contactNo: "N/A",
              };
            }

            let receiverDetails = null;

            // Only fetch receiver details if it's an SLT Branch destination
            // Check if receiverServiceNo is not a Non-SLT identifier (like NSL789)
            if (
              receiverServiceNo &&
              !isNonSltPlace &&
              !isNonSltIdentifier(receiverServiceNo)
            ) {
              try {
                receiverDetails = await getCachedUserAllowRefresh(
                  receiverServiceNo,
                  fetchReceiverDetails,
                );
              } catch (error) {
                // Silently handle missing users - this is expected for test data
              }
            } else if (isNonSltPlace || isNonSltIdentifier(receiverServiceNo)) {
              // For Non-SLT destinations, use the receiver details from the request
              receiverDetails = {
                name: status.request?.receiverName || "N/A",
                nic: status.request?.receiverNIC || receiverServiceNo,
                contactNo: status.request?.receiverContact || "N/A",
              };
            }
            receiverDetails = ensureReceiverDetails(
              receiverDetails,
              receiverServiceNo,
              status.request,
            );

            return {
              refNo: status.referenceNumber,
              senderDetails: senderDetails,
              receiverDetails: receiverDetails,
              transportData: transportData,
              inLocation: status.request?.inLocation,
              outLocation: status.request?.outLocation,
              createdAt: new Date(
                status.request?.createdAt || status.createdAt,
              ).toLocaleString(),
              items: status.request?.items || [],
              comment: status.executiveOfficerComment || "",
              request: status.request,
              requestDetails: { ...status.request },
            };
          }),
        );

        setpendingItems(formattedData);
      } catch (error) {
        console.error("Error fetching pending statuses:", error);
      }
    };

    fetchData();
  }, [activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getApprovedStatuses();

        // Process each status with async operations
        const formattedData = await Promise.all(
          data.map(async (status) => {
            const senderServiceNo = status.request?.employeeServiceNo;
            const receiverServiceNo = status.request?.receiverServiceNo;
            const transportData = status.request?.transport;
            const isNonSltPlace = status.request?.isNonSltPlace;
            let senderDetails = null;

            // Check if the sender is the logged-in user
            if (senderServiceNo === user.serviceNo) {
              // Use logged-in user's data for sender details
              senderDetails = {
                serviceNo: user.serviceNo,
                name: user.name,
                section: user.section || "N/A",
                group: user.group || "N/A",
                designation: user.designation || "N/A",
                contactNo: user.contactNo || "N/A",
                email: user.email || "N/A",
                branches: user.branches || "N/A",
              };
              setCachedUser(user.serviceNo, senderDetails);
            } else if (senderServiceNo) {
              // Fetch sender details for any service number
              try {
                senderDetails = await getCachedUser(
                  senderServiceNo,
                  searchUserByServiceNo,
                );
              } catch (error) {
                // Silently handle missing users
              }
            }

            // Fallback for missing sender details
            if (!senderDetails && senderServiceNo) {
              senderDetails = {
                serviceNo: senderServiceNo,
                name: "N/A",
                section: "N/A",
                group: "N/A",
                designation: "N/A",
                contactNo: "N/A",
              };
            }

            let receiverDetails = null;

            // Only fetch receiver details if it's an SLT Branch destination
            // Check if receiverServiceNo is not a Non-SLT identifier (like NSL789)
            if (
              receiverServiceNo &&
              !isNonSltPlace &&
              !isNonSltIdentifier(receiverServiceNo)
            ) {
              try {
                const userData = await getCachedUserAllowRefresh(
                  receiverServiceNo,
                  fetchReceiverDetails,
                );
                if (userData) {
                  receiverDetails = userData;
                  // console.log("Receiver Details", receiverDetails);
                }
              } catch (error) {
                // Silently handle missing users - this is expected for test data
              }
            } else if (isNonSltPlace || isNonSltIdentifier(receiverServiceNo)) {
              // For Non-SLT destinations, use the receiver details from the request
              receiverDetails = {
                name: status.request?.receiverName || "N/A",
                nic: status.request?.receiverNIC || receiverServiceNo,
                contactNo: status.request?.receiverContact || "N/A",
              };
            }
            receiverDetails = ensureReceiverDetails(
              receiverDetails,
              receiverServiceNo,
              status.request,
            );

            return {
              refNo: status.referenceNumber,
              senderDetails: senderDetails,
              receiverDetails: receiverDetails,
              transportData: transportData,
              inLocation: status.request?.inLocation,
              outLocation: status.request?.outLocation,
              createdAt: new Date(
                status.request?.createdAt || status.createdAt,
              ).toLocaleString(),
              items: status.request?.items || [],
              comment: status.executiveOfficerComment,
              request: status.request,
              requestDetails: { ...status.request },
            };
          }),
        );
        setapprovedItems(formattedData);
      } catch (error) {
        console.error("Error fetching pending statuses:", error);
      }
    };
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getRejectedStatuses();

        // Process each status with async operations
        const formattedData = await Promise.all(
          data.map(async (status) => {
            const senderServiceNo = status.request?.employeeServiceNo;
            const receiverServiceNo = status.request?.receiverServiceNo;
            const transportData = status.request?.transport;
            const isNonSltPlace = status.request?.isNonSltPlace;
            let senderDetails = null;

            // Check if the sender is the logged-in user
            if (senderServiceNo === user.serviceNo) {
              // Use logged-in user's data for sender details
              senderDetails = {
                serviceNo: user.serviceNo,
                name: user.name,
                section: user.section || "N/A",
                group: user.group || "N/A",
                designation: user.designation || "N/A",
                contactNo: user.contactNo || "N/A",
                email: user.email || "N/A",
                branches: user.branches || "N/A",
              };
              setCachedUser(user.serviceNo, senderDetails);
            } else if (senderServiceNo) {
              // Fetch sender details for any service number
              try {
                senderDetails = await getCachedUser(
                  senderServiceNo,
                  searchUserByServiceNo,
                );
              } catch (error) {
                // Silently handle missing users
              }
            }

            // If sender details couldn't be fetched, create a basic object with at least the service number
            if (!senderDetails && senderServiceNo) {
              senderDetails = {
                serviceNo: senderServiceNo,
                name: "N/A",
                section: "N/A",
                group: "N/A",
                designation: "N/A",
                contactNo: "N/A",
              };
            }

            let receiverDetails = null;

            // Only fetch receiver details if it's an SLT Branch destination
            // Check if receiverServiceNo is not a Non-SLT identifier (like NSL789)
            if (
              receiverServiceNo &&
              !isNonSltPlace &&
              !isNonSltIdentifier(receiverServiceNo)
            ) {
              try {
                const userData = await getCachedUserAllowRefresh(
                  receiverServiceNo,
                  fetchReceiverDetails,
                );
                if (userData) {
                  receiverDetails = userData;
                  // console.log("Receiver Details", receiverDetails);
                }
              } catch (error) {
                // Silently handle missing users - this is expected for test data
              }
            } else if (isNonSltPlace || isNonSltIdentifier(receiverServiceNo)) {
              // For Non-SLT destinations, use the receiver details from the request
              receiverDetails = {
                name: status.request?.receiverName || "N/A",
                nic: status.request?.receiverNIC || receiverServiceNo,
                contactNo: status.request?.receiverContact || "N/A",
              };
            }
            receiverDetails = ensureReceiverDetails(
              receiverDetails,
              receiverServiceNo,
              status.request,
            );

            return {
              refNo: status.referenceNumber,
              senderDetails: senderDetails,
              receiverDetails: receiverDetails,
              transportData: transportData,
              inLocation: status.request?.inLocation,
              outLocation: status.request?.outLocation,
              createdAt: new Date(
                status.request?.createdAt || status.createdAt,
              ).toLocaleString(),
              items: status.request?.items || [],
              comment: status.executiveOfficerComment,
              request: status.request,
              requestDetails: { ...status.request },
              rejectedBy: status.rejectedBy,
              rejectedByServiceNo: status.rejectedByServiceNo,
              rejectedByBranch: status.rejectedByBranch,
              rejectedAt: status.rejectedAt,
              rejectionLevel: status.rejectionLevel,
            };
          }),
        );

        setRejectedDESCRIPTIONs(formattedData);
      } catch (error) {
        console.error("Error fetching pending statuses:", error);
      }
    };
    fetchData();
  }, [activeTab]);

  const StatusPill = ({ status }) => {
    const styles = {
      pending: "bg-amber-100 text-amber-800",
      approved: "bg-emerald-100 text-emerald-800",
      rejected: "bg-rose-100 text-rose-800",
    };
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleApprove = async (item) => {
    try {
      // Call API to approve status with comment
      const branches =
        item?.senderDetails?.branches ||
        item?.requestDetails?.senderBranches ||
        item?.request?.senderBranches ||
        "N/A";
      const updatedStatus = await approveStatus(item.refNo, comment, branches);

      // Format the approved item in the same structure as your UI expects
      const approvedItem = {
        ...item, // Keep all item properties
        refNo: updatedStatus.referenceNumber,
        name: updatedStatus.request?.name,
        inLocation: updatedStatus.request?.inLocation,
        outLocation: updatedStatus.request?.outLocation,
        createdAt: new Date(
          updatedStatus.request?.createdAt || updatedStatus.createdAt,
        ).toLocaleString(),
        items: updatedStatus.request?.items || [],
        comment: updatedStatus.executiveOfficerComment,
        requestDetails: { ...updatedStatus.request },
      };

      // Update UI state
      setpendingItems(pendingItems.filter((i) => i.refNo !== item.refNo));
      setapprovedItems([...approvedItems, approvedItem]);

      // Email notification is sent server-side by the backend controller

      // Reset modal and comment
      setShowModal(false);
      setComment("");
      showToast(
        "Request approved successfully and notified petrol leader",
        "success",
      );
    } catch (error) {
      console.error("Error approving status:", error.message);
      showToast("Failed to approve request", "error");
    }
  };

  // Email sending functions removed â€” all notifications are now sent
  // server-side by backend controllers (sendMail.js)



  const handleReject = async (item) => {
    try {
      if (!comment || comment.trim() === "") {
        showToast("Comment is required to reject the item.", "warning");
        return;
      }

      // Call API to reject status with comment
      const updatedStatus = await rejectStatus(item.refNo, comment);

      // Email notification is sent server-side by the backend controller

      // Format the rejected item in the same structure as your UI expects
      const rejectedItem = {
        refNo: updatedStatus.referenceNumber,
        name: updatedStatus.request?.name,
        inLocation: updatedStatus.request?.inLocation,
        outLocation: updatedStatus.request?.outLocation,
        createdAt: new Date(
          updatedStatus.request?.createdAt || updatedStatus.createdAt,
        ).toLocaleString(),
        items: updatedStatus.request?.items || [],
        comment: updatedStatus.executiveOfficerComment,
        requestDetails: { ...updatedStatus.request },
      };

      // Update UI state
      setpendingItems(pendingItems.filter((i) => i.refNo !== item.refNo));
      setRejectedDESCRIPTIONs([...rejectedDESCRIPTIONs, rejectedItem]);

      // Reset modal and comment
      setShowModal(false);
      setComment("");
    } catch (error) {
      console.error("Error rejecting status:", error.message);
    }
  };

  const handleModelOpen = async (item) => {
    setselectedItem(item);

    if (item.requestDetails?.transport.transporterServiceNo) {
      try {
        const transportResponse = await searchEmployeeByServiceNo(
          item.requestDetails.transport.transporterServiceNo,
        );

        console.log("Transport response:", transportResponse); // Debug log

        // Extract the employee data from the nested response
        const employee = transportResponse?.data?.data?.[0];

        if (employee) {
          setTransportData({
            name: `${employee.employeeTitle || ""} ${employee.employeeFirstName || ""} ${employee.employeeSurname || ""}`.trim(),
            serviceNo:
              employee.employeeNo ||
              item.requestDetails.transport.transporterServiceNo,
            designation: employee.designation || "-",
            section: employee.empSection || "-",
            group: employee.empGroup || "-",
            contactNo: employee.mobileNo || "-",
          });
        } else {
          console.log("No employee data found");
          setTransportData(null);
        }
      } catch (error) {
        console.error("Error fetching transporter details:", error);
        setTransportData(null);
      }
    } else {
      setTransportData(item.requestDetails?.transport || null);
    }

    setShowModal(true);
  };

  // Enhanced filtering function
  const applyFilters = (items) => {
    return items.filter((item) => {
      // Search term filter (reference number or name)
      const matchesSearch =
        item.refNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.senderDetails?.name &&
          item.senderDetails.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      // Location filter (check both in and out locations)
      const matchesLocation =
        !locationFilter ||
        item.inLocation?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        item.outLocation
          ?.toLowerCase()
          .includes(locationFilter.toLowerCase()) ||
        (item.request?.companyName &&
          item.request.companyName
            .toLowerCase()
            .includes(locationFilter.toLowerCase()));

      // Company type filter (SLT vs Non-SLT)
      const matchesCompanyType =
        companyTypeFilter === "all" ||
        (companyTypeFilter === "slt" && !item.request?.isNonSltPlace) ||
        (companyTypeFilter === "non-slt" && item.request?.isNonSltPlace);

      // Date range filter
      const itemDate = new Date(item.createdAt);
      const matchesDateFrom = !dateFrom || itemDate >= new Date(dateFrom);
      const matchesDateTo =
        !dateTo || itemDate <= new Date(dateTo + "T23:59:59");

      return (
        matchesSearch &&
        matchesLocation &&
        matchesCompanyType &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  };

  const filteredpendingItems = applyFilters(pendingItems);
  const filteredapprovedItems = applyFilters(approvedItems);
  const filteredRejectedItems = applyFilters(rejectedDESCRIPTIONs);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gate Pass Approvals
        </h1>
        <p className="text-gray-500 flex items-center">
          <FaInfoCircle className="mr-2 text-blue-500" />
          Manage and review all gate pass requests
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Pending Card */}
        <div
          onClick={() => setActiveTab("pending")}
          className={`rounded-2xl shadow-lg overflow-hidden transition-all cursor-pointer ${
            activeTab === "pending"
              ? "bg-gradient-to-br from-amber-500 to-orange-500 transform scale-105"
              : "bg-white hover:shadow-xl"
          }`}
        >
          <div
            className={`p-6 flex flex-col items-center ${
              activeTab === "pending" ? "text-white" : "text-gray-700"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                activeTab === "pending" ? "bg-white/20" : "bg-amber-100"
              }`}
            >
              <FaClock
                className={
                  activeTab === "pending"
                    ? "text-white text-2xl"
                    : "text-amber-500 text-2xl"
                }
              />
            </div>
            <h3 className="text-xl font-semibold mb-1">Pending</h3>
            <div
              className={`text-3xl font-bold ${
                activeTab === "pending" ? "text-white" : "text-amber-500"
              }`}
            >
              {pendingItems.length}
            </div>
            <p
              className={
                activeTab === "pending"
                  ? "text-white/80 mt-2 text-sm"
                  : "text-gray-500 mt-2 text-sm"
              }
            >
              Awaiting your review
            </p>
          </div>
        </div>

        {/* Approved Card */}
        <div
          onClick={() => setActiveTab("approved")}
          className={`rounded-2xl shadow-lg overflow-hidden transition-all cursor-pointer ${
            activeTab === "approved"
              ? "bg-gradient-to-br from-emerald-500 to-green-500 transform scale-105"
              : "bg-white hover:shadow-xl"
          }`}
        >
          <div
            className={`p-6 flex flex-col items-center ${
              activeTab === "approved" ? "text-white" : "text-gray-700"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                activeTab === "approved" ? "bg-white/20" : "bg-emerald-100"
              }`}
            >
              <FaCheckCircle
                className={
                  activeTab === "approved"
                    ? "text-white text-2xl"
                    : "text-emerald-500 text-2xl"
                }
              />
            </div>
            <h3 className="text-xl font-semibold mb-1">Approved</h3>
            <div
              className={`text-3xl font-bold ${
                activeTab === "approved" ? "text-white" : "text-emerald-500"
              }`}
            >
              {approvedItems.length}
            </div>
            <p
              className={
                activeTab === "approved"
                  ? "text-white/80 mt-2 text-sm"
                  : "text-gray-500 mt-2 text-sm"
              }
            >
              Successfully processed
            </p>
          </div>
        </div>

        {/* Rejected Card */}
        <div
          onClick={() => setActiveTab("rejected")}
          className={`rounded-2xl shadow-lg overflow-hidden transition-all cursor-pointer ${
            activeTab === "rejected"
              ? "bg-gradient-to-br from-rose-500 to-red-500 transform scale-105"
              : "bg-white hover:shadow-xl"
          }`}
        >
          <div
            className={`p-6 flex flex-col items-center ${
              activeTab === "rejected" ? "text-white" : "text-gray-700"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                activeTab === "rejected" ? "bg-white/20" : "bg-rose-100"
              }`}
            >
              <FaTimesCircle
                className={
                  activeTab === "rejected"
                    ? "text-white text-2xl"
                    : "text-rose-500 text-2xl"
                }
              />
            </div>
            <h3 className="text-xl font-semibold mb-1">Rejected</h3>
            <div
              className={`text-3xl font-bold ${
                activeTab === "rejected" ? "text-white" : "text-rose-500"
              }`}
            >
              {rejectedDESCRIPTIONs.length}
            </div>
            <p
              className={
                activeTab === "rejected"
                  ? "text-white/80 mt-2 text-sm"
                  : "text-gray-500 mt-2 text-sm"
              }
            >
              Declined requests
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Search & Filter Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reference number or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Company Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={companyTypeFilter}
                onChange={(e) => setCompanyTypeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Types</option>
                <option value="slt">SLT Branch</option>
                <option value="non-slt">Non-SLT</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm ||
            locationFilter ||
            companyTypeFilter !== "all" ||
            dateFrom ||
            dateTo) && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setLocationFilter("");
                  setCompanyTypeFilter("all");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            {activeTab === "pending" && (
              <FaClock className="mr-2 text-amber-500" />
            )}
            {activeTab === "approved" && (
              <FaCheckCircle className="mr-2 text-emerald-500" />
            )}
            {activeTab === "rejected" && (
              <FaTimesCircle className="mr-2 text-rose-500" />
            )}
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Gate Passes
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Ref No
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Entry Point
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Exit Point
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                {activeTab === "rejected" && (
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Rejected By
                  </th>
                )}
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(activeTab === "pending"
                ? filteredpendingItems
                : activeTab === "approved"
                  ? filteredapprovedItems
                  : filteredRejectedItems
              ).map((item) => (
                <tr
                  key={item.refNo}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.refNo}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.senderDetails?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.inLocation}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.request?.isNonSltPlace
                        ? item.request?.outLocation
                        : item.outLocation}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.request?.isNonSltPlace
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {item.request?.isNonSltPlace
                        ? "Non-SLT Organization"
                        : "SLT Branch"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {item.createdAt}
                    </div>
                  </td>
                  {activeTab === "rejected" && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.rejectedByBranch
                          ? `${item.rejectedByBranch} ${item.rejectedBy || ""}`
                          : item.rejectedBy || "N/A"}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => {
                        //setselectedItem(item);
                        handleModelOpen(item);
                        //setShowModal(true);
                      }}
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
                                                ${
                                                  activeTab === "pending"
                                                    ? "bg-amber-100 hover:bg-amber-200 text-amber-800"
                                                    : activeTab === "approved"
                                                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                                      : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                                                }`}
                    >
                      <FaEye className="mr-2" /> View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {(activeTab === "pending"
          ? filteredpendingItems
          : activeTab === "approved"
            ? filteredapprovedItems
            : filteredRejectedItems
        ).length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FaBoxOpen className="text-4xl text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No requests found</p>
            <p className="text-gray-400 text-sm">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "Your gate pass requests will appear here"}
            </p>
          </div>
        )}
      </div>

      <RequestDetailsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        request={selectedItem}
        activeTab={activeTab}
        comment={comment}
        handleApprove={handleApprove}
        handleReject={handleReject}
        // sendReturnEmail removed — handled server-side
        setComment={setComment}
        showToast={showToast}
        transporterDetails={transportData}
        isSuperAdmin={isSuperAdmin}
        // user={user}
        // receiver={receiver}
      />
    </div>
  );
};

const RequestDetailsModal = ({
  isOpen,
  onClose,
  request,
  user,
  receiver,
  activeTab,
  comment,
  setComment,
  handleApprove,
  handleReject,

  showToast,
  transporterDetails,
  isSuperAdmin,
}) => {
  // Initialize with the correct value from request
  const [selectedExecutive, setSelectedExecutive] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedDESCRIPTIONImages, setSelectedDESCRIPTIONImages] = useState(
    [],
  );
  const [selecteditemDescription, setselecteditemDescription] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [selectedItems, setselectedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !request) return null;

  const handleBulkReturn = async () => {
    if (selectedItems.length === 0) {
      showToast("Please select at least one item to return", "warning");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to mark ${selectedItems.length} item(s) as 'return'?`,
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      console.log("Starting bulk return process...");
      console.log("Selected serial numbers:", selectedItems);
      console.log("Reference number:", request.refNo);

      // Get full details of selected items
      const selecteditemDetails = request.items.filter((item) =>
        selectedItems.includes(item.serialNumber),
      );

      console.log("Selected item details:", selecteditemDetails);

      // Call backend to update DB
      const response = await markItemsAsReturned(request.refNo, selectedItems);

      console.log("Backend response:", response);

      // Email notification is sent server-side by the backend controller

      // Show success message
      showToast(
        `Successfully marked ${
          response.updatedCount || selectedItems.length
        } item(s) as returned.`,
        "success",
      );

      console.log("Bulk return process completed successfully");

      // Clear selected items
      setselectedItems([]);

      // Refresh / close modal
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Error marking items as returned:", error);
      console.error("Error details:", error.response?.data);

      showToast(
        error.message || "Failed to update items. Please try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (serialNo) => {
    setselectedItems((prev) => {
      if (prev.includes(serialNo)) {
        return prev.filter((sn) => sn !== serialNo);
      } else {
        return [...prev, serialNo];
      }
    });
  };

  const handleViewImages = (item) => {
    setSelectedDESCRIPTIONImages(item.itemPhotos);
    setselecteditemDescription(item.itemDescription);
    setIsImageModalOpen(true);
  };

  const generateitemDetailsPDF = (fullRequest) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const usableWidth = pageWidth - margin * 2;
    const lh = 12;
    const palette = {
      navy: [20, 55, 120],
      slate: [78, 92, 115],
      headingBg: [240, 245, 255],
      border: [210, 218, 230],
      tableHeader: [226, 234, 247],
      text: [33, 37, 41],
      rowAlt: [249, 251, 255],
    };

    const addHeader = () => {
      try {
        doc.addImage(logoUrl, "PNG", margin, 16, 96, 36);
      } catch (e) {
        // ignore logo rendering issues
      }

      // Header top rule (moved up to reduce gap under reference)
      doc.setDrawColor(...palette.navy);
      doc.setLineWidth(1.1);
      doc.line(margin, 64, pageWidth - margin, 64);

      doc.setFontSize(17);
      doc.setTextColor(...palette.navy);
      doc.text("SLT Gate Pass - Item Details", pageWidth / 2, 31, {
        align: "center",
      });

      doc.setFontSize(9);
      doc.setTextColor(...palette.slate);
      doc.text("Official Item Movement Record", pageWidth / 2, 46, {
        align: "center",
      });

      doc.setFontSize(9);
      doc.setTextColor(...palette.slate);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 24, {
        align: "right",
      });

      doc.setFontSize(10);
      doc.setTextColor(...palette.text);
      const refText = `Reference: ${fullRequest.referenceNumber || fullRequest.refNo || "-"}`;
      doc.text(refText, pageWidth / 2, 58, { align: "center" });

    };

    const ensurePage = (neededHeight) => {
      if (currentY + neededHeight > pageHeight - margin - 22) {
        doc.addPage();
        addHeader();
        currentY = 84;
      }
    };

    const drawKeyValueBox = (title, fields) => {
      const titleH = 18;
      const valueMaxWidth = usableWidth * 0.62;
      const rows = fields.map((f) => {
        const valueLines = doc.splitTextToSize(String(f[1] || "-"), valueMaxWidth);
        const rowHeight = Math.max(18, valueLines.length * lh + 6);
        return { key: f[0], valueLines, rowHeight };
      });
      const contentHeight = rows.reduce((sum, r) => sum + r.rowHeight, 0);

      ensurePage(titleH + contentHeight + 18);

      doc.setFillColor(...palette.headingBg);
      doc.setDrawColor(...palette.border);
      doc.rect(margin, currentY, usableWidth, titleH, "FD");

      doc.setFontSize(10.5);
      doc.setTextColor(...palette.navy);
      doc.text(title, margin + 8, currentY + 12);

      let rowTop = currentY + titleH;
      rows.forEach((row, idx) => {
        if (idx % 2 === 1) {
          doc.setFillColor(...palette.rowAlt);
          doc.rect(margin, rowTop, usableWidth, row.rowHeight, "F");
        }

        doc.setFontSize(9);
        doc.setTextColor(...palette.slate);
        doc.text(String(row.key || "-"), margin + 8, rowTop + 12);

        doc.setTextColor(...palette.text);
        row.valueLines.forEach((line, lineIdx) => {
          doc.text(line, margin + usableWidth * 0.34 + 8, rowTop + 12 + lineIdx * lh);
        });

        doc.setDrawColor(...palette.border);
        doc.setLineWidth(0.4);
        doc.line(margin, rowTop + row.rowHeight, margin + usableWidth, rowTop + row.rowHeight);
        rowTop += row.rowHeight;
      });

      doc.rect(margin, currentY, usableWidth, titleH + contentHeight);
      currentY = rowTop + 12;
    };

    addHeader();
    let currentY = 84;

    const formatDateValue = (dateValue) => {
      if (!dateValue) return "-";
      const dateObj = new Date(dateValue);
      if (Number.isNaN(dateObj.getTime())) return String(dateValue);
      return dateObj.toLocaleDateString();
    };

    const items = Array.isArray(fullRequest.items) ? fullRequest.items : [];
    const senderInfo = fullRequest.senderDetails || fullRequest.sender || {};

    drawKeyValueBox("Sender Details", [
      ["Name", senderInfo.name || senderInfo.displayName || "-"],
      ["Service No", senderInfo.serviceNo || senderInfo.employeeNo || fullRequest.senderServiceNo || "-"],
      ["Designation", senderInfo.designation || senderInfo.jobTitle || "-"],
      ["Section", senderInfo.section || senderInfo.department || "-"],
      ["Group", senderInfo.group || senderInfo.officeLocation || "-"],
      ["Contact", senderInfo.contactNo || senderInfo.mobilePhone || senderInfo.phoneNumber || "-"],
    ]);

    if (!items.length) {
      drawKeyValueBox("Item Details", [["Items", "No items available"]]);
    } else {
      items.forEach((it, idx) => {
        const itemFields = [
          ["Description", it.itemDescription || it.description || "-"],
          ["Serial No", it.serialNumber || "-"],
          ["Item Code", it.itemCode || "-"],
          ["Category", it.categoryDescription || it.category || "-"],
          ["Quantity", String(it.itemQuantity || it.quantity || "-")],
          ["Status", it.status || "-"],
        ];

        const isReturnable =
          it.itemReturnable ||
          it.isReturnable ||
          String(it.status || "").toLowerCase() === "return to sender" ||
          String(it.status || "").toLowerCase() === "returnable";

        if (isReturnable) {
          itemFields.push([
            "Return Date",
            formatDateValue(it.returnDate || it.returnBy || it.expectedReturnDate),
          ]);
        }

        drawKeyValueBox(`Item Details - Item ${idx + 1}`, itemFields);
      });
    }

    const hdrH = 20;
    const returnableItems = items.filter(it => it.itemReturnable || it.isReturnable || it.status === "return to Sender");
    if (returnableItems.length > 0) {
      ensurePage(30 + 40);
      doc.setFontSize(10.5);
      doc.setTextColor(...palette.navy);
      doc.text("Returnable Items", margin, currentY);
      currentY += 14;

      const retCols = ["Description", "Serial No", "Item Code", "Category", "Qty", "Return Date"];
      const retColW = [usableWidth * 0.28, usableWidth * 0.14, usableWidth * 0.12, usableWidth * 0.12, usableWidth * 0.09, usableWidth * 0.25];
      const retColX = [margin];
      for (let i = 1; i < retColW.length; i++) retColX[i] = retColX[i - 1] + retColW[i - 1];

      doc.setFillColor(...palette.tableHeader);
      doc.setDrawColor(...palette.border);
      doc.rect(margin, currentY, usableWidth, hdrH, "FD");
      doc.setFontSize(9);
      doc.setTextColor(...palette.navy);
      retCols.forEach((c, i) => doc.text(c, retColX[i] + 4, currentY + 13));
      currentY += hdrH + 6;

      returnableItems.forEach((it, idx) => {
        const desc = it.itemDescription || it.description || "-";
        const descLines = doc.splitTextToSize(desc, retColW[0] - 8);
        const rowH = Math.max(20, descLines.length * lh + 6);

        if (currentY + rowH > pageHeight - margin) {
          doc.addPage();
          addHeader();
          currentY = 84;
          doc.setFillColor(...palette.tableHeader);
          doc.setDrawColor(...palette.border);
          doc.rect(margin, currentY, usableWidth, hdrH, "FD");
          doc.setFontSize(9);
          doc.setTextColor(...palette.navy);
          retCols.forEach((c, i) => doc.text(c, retColX[i] + 4, currentY + 13));
          currentY += hdrH + 6;
        }

        if (idx % 2 === 1) {
          doc.setFillColor(...palette.rowAlt);
          doc.rect(margin, currentY - 2, usableWidth, rowH + 4, "F");
        }
        doc.setDrawColor(...palette.border);
        doc.rect(margin, currentY - 2, usableWidth, rowH + 4);

        doc.setFontSize(9);
        doc.setTextColor(...palette.text);
        descLines.forEach((ln, li) => doc.text(ln, retColX[0] + 4, currentY + 10 + li * lh));
        doc.text(it.serialNumber || "-", retColX[1] + 4, currentY + 12);
        doc.text(it.itemCode || "-", retColX[2] + 4, currentY + 12);
        doc.text(it.categoryDescription || it.category || "-", retColX[3] + 4, currentY + 12);
        doc.text(String(it.itemQuantity || it.quantity || "-"), retColX[4] + 4, currentY + 12);
        doc.text(
          formatDateValue(it.returnDate || it.returnBy || it.expectedReturnDate),
          retColX[5] + 4,
          currentY + 12,
        );

        currentY += rowH + 8;
      });
      currentY += 4;
    }

    const requestCore = fullRequest.requestDetails || fullRequest.request || fullRequest;
    const isNonSltDestination = fullRequest.isNonSltPlace ?? requestCore.isNonSltPlace ?? false;

    drawKeyValueBox("Location Details", [
      [
        "Out Location",
        fullRequest.outLocation ||
          requestCore.outLocation ||
          fullRequest.companyName ||
          requestCore.companyName ||
          "-",
      ],
      [
        "In Location",
        fullRequest.inLocation || requestCore.inLocation || "-",
      ],
    ]);

    const recv = fullRequest.receiver || fullRequest.receiverDetails || {
      name: requestCore.receiverName || fullRequest.receiverName || "-",
      nic: requestCore.receiverNIC || fullRequest.receiverNIC || "-",
      contactNo: requestCore.receiverContact || fullRequest.receiverContact || "-",
      serviceNo: requestCore.receiverServiceNo || fullRequest.receiverServiceNo || "-",
      group: requestCore.receiverGroup || fullRequest.receiverGroup || "-",
    };

    if (isNonSltDestination) {
      drawKeyValueBox("Receiver Details", [
        ["Name", recv.name || requestCore.receiverName || "-"],
        ["Company", fullRequest.companyName || requestCore.companyName || recv.companyName || "-"],
        ["Contact", recv.contactNo || requestCore.receiverContact || fullRequest.receiverContact || "-"],
        ["NIC", recv.nic || requestCore.receiverNIC || fullRequest.receiverNIC || "-"],
      ]);
    } else {
      drawKeyValueBox("Receiver Details", [
        ["Name", recv.name || requestCore.receiverName || "-"],
        ["Service No", recv.serviceNo || requestCore.receiverServiceNo || fullRequest.receiverServiceNo || "-"],
        ["Group", recv.group || requestCore.receiverGroup || "-"],
        ["Section", recv.section || requestCore.receiverSection || "-"],
        ["Designation", recv.designation || requestCore.receiverDesignation || "-"],
        ["Contact", recv.contactNo || requestCore.receiverContact || fullRequest.receiverContact || "-"],
      ]);
    }

    const t = fullRequest.transport || fullRequest.transportData || requestCore.transport || {};

    const transportRows = [
      ["Transport Method", t.transportMethod || "-"],
      ["Transporter Type", t.transporterType || "-"],
    ];

    if (String(t.transporterType || "").toUpperCase() === "SLT") {
      transportRows.push(["Service No", t.transporterServiceNo || requestCore.transporterServiceNo || "-"]);
      transportRows.push(["Name", transporterDetails?.name || t.transporterName || requestCore.transporterName || "-"]);
      transportRows.push(["Section", transporterDetails?.section || t.transporterSection || requestCore.transporterSection || "-"]);
      transportRows.push(["Group", transporterDetails?.group || t.transporterGroup || requestCore.transporterGroup || "-"]);
      transportRows.push(["Designation", transporterDetails?.designation || t.transporterDesignation || requestCore.transporterDesignation || "-"]);
      transportRows.push(["Contact", transporterDetails?.contactNo || t.transporterContact || requestCore.transporterContact || "-"]);
    } else {
      transportRows.push(["Name", t.nonSLTTransporterName || requestCore.nonSLTTransporterName || "-"]);
      transportRows.push(["NIC", t.nonSLTTransporterNIC || requestCore.nonSLTTransporterNIC || "-"]);
      transportRows.push(["Contact", t.nonSLTTransporterPhone || requestCore.nonSLTTransporterPhone || "-"]);
      transportRows.push(["Email", t.nonSLTTransporterEmail || requestCore.nonSLTTransporterEmail || "-"]);
    }

    if (String(t.transportMethod || "").toLowerCase() === "vehicle") {
      transportRows.push(["Vehicle No", t.vehicleNumber || requestCore.vehicleNumber || "-"]);
      transportRows.push(["Vehicle Model", t.vehicleModel || requestCore.vehicleModel || "-"]);
    }

    drawKeyValueBox("Transport Details", transportRows);

    const pageCount = doc.getNumberOfPages();
    for (let pageNo = 1; pageNo <= pageCount; pageNo++) {
      doc.setPage(pageNo);
      const footerY = pageHeight - 24;
      doc.setDrawColor(...palette.border);
      doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
      doc.setFontSize(8);
      doc.setTextColor(...palette.slate);
      doc.text("Electronically generated gate pass document", margin, footerY);
      doc.text(`Page ${pageNo} of ${pageCount}`, pageWidth - margin, footerY, {
        align: "right",
      });
    }

    const safeRef = fullRequest.referenceNumber || fullRequest.refNo || "gatepass";
    doc.save(`SLT_GatePass_${safeRef}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full flex flex-col h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        {/* <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-3 pl-6 pr-6 flex-shrink-0"> */}
        <div
          className={`p-3 pl-6 pr-6 flex-shrink-0 ${
            activeTab === "pending"
              ? "bg-gradient-to-r from-amber-600 to-orange-300"
              : activeTab === "approved"
                ? "bg-gradient-to-br from-emerald-600 to-green-600"
                : "bg-gradient-to-br from-rose-600 to-red-400"
          }`}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <FaBoxOpen className="mr-3" /> Request Details
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
          <div className="mt-2 text-blue-100">Reference: {request.refNo}</div>
        </div>

        {/* Main Content - Make this scrollable */}
        <div className="flex-grow overflow-y-auto p-6">
          {/* Sender Details */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
              <FaUser className="mr-2" /> Sender Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Service No
                </label>
                <p className="text-gray-800">
                  {request?.senderDetails?.serviceNo ||
                    request?.requestDetails?.employeeServiceNo ||
                    request?.request?.employeeServiceNo ||
                    "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Name
                </label>
                <p className="text-gray-800">
                  {request?.senderDetails?.name || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Section
                </label>
                <p className="text-gray-800">
                  {request?.senderDetails?.section || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Group
                </label>
                <p className="text-gray-800">
                  {request?.senderDetails?.group || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Designation
                </label>
                <p className="text-gray-800">
                  {request?.senderDetails?.designation || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Contact
                </label>
                <p className="text-gray-800">
                  {request?.senderDetails?.contactNo || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* items Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
              <FaBoxOpen className="mr-2" /> item Details
              <button
                onClick={() =>
                  generateitemDetailsPDF(request)
                }
                className="ml-auto px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center transition-colors"
              >
                <FaFilePdf className="mr-2" /> Download Items PDF
              </button>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      item{" "}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Serial Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Item Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Image
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {request.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{item?.itemDescription}</td>
                      <td className="px-6 py-4">{item?.serialNumber}</td>
                      <td className="px-6 py-4">{item?.categoryDescription}</td>
                      <td className="px-6 py-4">{item?.itemQuantity}</td>
                      <td className="px-6 py-4">{item?.itemCode}</td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item?.status === "returnable"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item?.status}
                        </span>{" "}
                        {item?.returnDate
                          ? new Date(item.returnDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewImages(item)}
                          className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                        >
                          <FaEye className="mr-2" /> View Images
                        </button>
                        <ImageViewerModal
                          images={selectedDESCRIPTIONImages}
                          isOpen={isImageModalOpen}
                          onClose={() => setIsImageModalOpen(false)}
                          itemDescription={selecteditemDescription}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Returnable items Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
              <FaUndo className="mr-2" /> Returnable items
            </h3>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      item{" "}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Serial Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Item Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {request?.items
                    ?.filter(
                      (item) => item.status === "return to Executive Officer",
                    )
                    .map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedItems?.includes(item.serialNumber)}
                            onChange={() => handleSelect(item.serialNumber)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">{item.itemDescription}</td>
                        <td className="px-6 py-4">{item.serialNumber}</td>
                        <td className="px-6 py-4">{item?.itemQuantity}</td>
                        <td className="px-6 py-4">{item?.itemCode}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="text-right mt-4">
              <button
                onClick={handleBulkReturn}
                disabled={
                  isSuperAdmin || selectedItems?.length === 0 || loading
                }
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                  isSuperAdmin || selectedItems?.length === 0
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Mark as 'Returned' ({selectedItems?.length || 0})
              </button>
            </div>
          </div>

          {/* Location and Receiver Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                <FaMapMarkerAlt className="mr-2" /> Location Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Out Location
                  </label>
                  <p className="text-gray-800">
                    {request?.outLocation ||
                      request?.requestDetails?.outLocation ||
                      request?.request?.outLocation ||
                      "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    In Location
                  </label>
                  <p className="text-gray-800">
                    {request?.inLocation ||
                      request?.requestDetails?.inLocation ||
                      request?.request?.inLocation ||
                      "N/A"}
                  </p>
                </div>
                {(request?.isNonSltPlace ||
                  request?.requestDetails?.isNonSltPlace ||
                  request?.request?.isNonSltPlace) && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Company
                      </label>
                      <p className="text-gray-800">
                        {request?.companyName ||
                          request?.requestDetails?.companyName ||
                          request?.request?.companyName ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Address
                      </label>
                      <p className="text-gray-800">
                        {request?.companyAddress ||
                          request?.requestDetails?.companyAddress ||
                          request?.request?.companyAddress ||
                          "N/A"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {request?.isNonSltPlace ||
            request?.requestDetails?.isNonSltPlace ||
            request?.request?.isNonSltPlace ? (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                  <FaUserCheck className="mr-2" /> Receiver Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Name
                    </label>
                    <p className="text-gray-800">
                      {request?.receiverName ||
                        request?.requestDetails?.receiverName ||
                        request?.request?.receiverName ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      NIC
                    </label>
                    <p className="text-gray-800">
                      {request?.receiverNIC ||
                        request?.requestDetails?.receiverNIC ||
                        request?.request?.receiverNIC ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Contact
                    </label>
                    <p className="text-gray-800">
                      {request?.receiverContact ||
                        request?.requestDetails?.receiverContact ||
                        request?.request?.receiverContact ||
                        "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                  <FaUserCheck className="mr-2" /> Receiver Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Name
                    </label>
                    <p className="text-gray-800">
                      {request?.receiverDetails?.name ||
                        request?.receiverName ||
                        request?.requestDetails?.receiverName ||
                        request?.request?.receiverName ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Group
                    </label>
                    <p className="text-gray-800">
                      {request?.receiverDetails?.group || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Service No
                    </label>
                    <p className="text-gray-800">
                      {request?.receiverDetails?.serviceNo ||
                        request?.receiverServiceNo ||
                        request?.requestDetails?.receiverServiceNo ||
                        request?.request?.receiverServiceNo ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Contact
                    </label>
                    <p className="text-gray-800">
                      {request?.receiverDetails?.contactNo ||
                        request?.receiverContact ||
                        request?.requestDetails?.receiverContact ||
                        request?.request?.receiverContact ||
                        "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transport Details Section - Add this new section */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
              <FaTruck className="mr-2" /> Transport Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Transport Method
                </label>
                <p className="text-gray-800">
                  {request?.requestDetails?.transport.transportMethod || "N/A"}
                </p>
              </div>

              {request.requestDetails?.transport.transportMethod ===
                "Vehicle" && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Transporter Type
                    </label>
                    <p className="text-gray-800">
                      {request?.requestDetails?.transport.transporterType ||
                        "N/A"}
                    </p>
                  </div>

                  {request?.requestDetails?.transport.transporterType ===
                  "SLT" ? (
                    <>
                      {/* <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">SLT Transporter</label>
                                <p className="text-gray-800">
                                  {transporterDetails?.name || 'N/A'} 
                                  {request?.transporterServiceNo ? ` (${request.transporterServiceNo})` : ''}
                                </p>
                              </div> */}

                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Service No
                        </label>
                        <p className="text-gray-800">
                          {request?.requestDetails?.transport
                            .transporterServiceNo || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Name
                        </label>
                        <p className="text-gray-800">
                          {transporterDetails?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Section
                        </label>
                        <p className="text-gray-800">
                          {transporterDetails?.section || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Group
                        </label>
                        <p className="text-gray-800">
                          {transporterDetails?.group || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Designation
                        </label>
                        <p className="text-gray-800">
                          {transporterDetails?.designation || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Contact
                        </label>
                        <p className="text-gray-800">
                          {transporterDetails?.contactNo || "N/A"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Transporter Name
                        </label>
                        <p className="text-gray-800">
                          {request?.requestDetails?.transport
                            .nonSLTTransporterName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Transporter NIC
                        </label>
                        <p className="text-gray-800">
                          {request?.requestDetails?.transport
                            .nonSLTTransporterNIC || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Transporter Phone
                        </label>
                        <p className="text-gray-800">
                          {request?.requestDetails?.transport
                            .nonSLTTransporterPhone || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Transporter Email
                        </label>
                        <p className="text-gray-800">
                          {request?.requestDetails?.transport
                            .nonSLTTransporterEmail || "N/A"}
                        </p>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Vehicle Number
                    </label>
                    <p className="text-gray-800">
                      {request?.requestDetails?.transport.vehicleNumber ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Vehicle Item Code
                    </label>
                    <p className="text-gray-800">
                      {request?.requestDetails?.transport.vehicleModel || "N/A"}
                    </p>
                  </div>
                </>
              )}
              {request?.requestDetails?.transport.transportMethod ===
                "By Hand" && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Transporter Type
                    </label>
                    <p className="text-gray-800">
                      {request?.requestDetails?.transport.transporterType ||
                        "N/A"}
                    </p>
                  </div>

                  {request?.requestDetails?.transport.transporterType ===
                  "SLT" ? (
                    <>
                      {/* <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">SLT Transporter</label>
                                <p className="text-gray-800">
                                  {transporterDetails?.name || 'N/A'} 
                                  {request?.transporterServiceNo ? ` (${request.transporterServiceNo})` : ''}
                                </p>
                              </div> */}
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Service No
                        </label>
                        <p className="text-gray-800">
                          {request?.requestDetails?.transport
                            .transporterServiceNo || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Name
                        </label>
                        <p className="text-gray-800">
                          {transporterDetails?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Section
                        </label>
                        <p className="text-gray-800">
                          {transporterDetails?.section || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Group
                        </label>
                        <p className="text-gray-800">
                          {transporterDetails?.group || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Designation
                        </label>
                        <p className="text-gray-800">
                          {transporterDetails?.designation || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Contact
                        </label>
                        <p className="text-gray-800">
                          {transporterDetails?.contactNo || "N/A"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Transporter Name
                        </label>
                        <p className="text-gray-800">
                          {request?.requestDetails?.transport
                            .nonSLTTransporterName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Transporter NIC
                        </label>
                        <p className="text-gray-800">
                          {request?.requestDetails?.transport
                            .nonSLTTransporterNIC || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Transporter Phone
                        </label>
                        <p className="text-gray-800">
                          {request?.requestDetails?.transport
                            .nonSLTTransporterPhone || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Transporter Email
                        </label>
                        <p className="text-gray-800">
                          {request?.requestDetails?.transport
                            .nonSLTTransporterEmail || "N/A"}
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Fixed bottom section for comments and buttons */}
        <div className="flex-shrink-0">
          {activeTab === "pending" && (
            <div className="border-t border-gray-200 bg-white">
              <div className="mb-3 mt-3 mr-6 ml-6">
                {/* <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                  <FaClipboardCheck className="mr-2" /> Approval Action
                </h3> */}

                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Comment
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="1"
                    placeholder="Add your comments here..."
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => handleReject(request)}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FaTimesCircle /> Reject
                  </button>
                  <button
                    onClick={() => handleApprove(request)}
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FaCheckCircle /> Approve
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab != "pending" && (
            <div className="border-t border-gray-200 bg-white">
              {/* Comment Display Section */}
              {request.comment && request.comment.length > 0 && (
                <div className="mb-3 mt-3 mr-6 ml-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Previous Comments
                  </h3>

                  <div className="max-h-35 overflow-y-auto mb-3">
                    <div className="mb-2 p-2 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-700">
                          {request.comment}
                        </span>
                        <span className="text-sm font-medium text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          {/* <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
};

// In the ImageViewerModal component
const ImageViewerModal = ({ images, isOpen, onClose, itemDescription }) => {
  const [imageUrls, setImageUrls] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (images && images.length > 0) {
      setLoading(true);

      const urls = images
        .slice(0, 5)
        .map((img) => getImageUrlSync(img))
        .filter(Boolean);

      setImageUrls(urls);
      setLoading(false);
    } else {
      setImageUrls([]);
      setLoading(false);
    }
  }, [images]);

  if (!isOpen) return null;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-gray-700">
        <div className="relative">
          {/* Main display area */}
          <div className="h-80 md:h-96 overflow-hidden relative bg-black flex items-center justify-center">
            <img
              src={imageUrls[activeIndex]}
              alt={`${itemDescription} ${activeIndex + 1}`}
              className="max-h-full max-w-full object-contain"
            />

            {/* Navigation arrows */}
            {imageUrls.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {activeIndex + 1} / {imageUrls.length}
            </div>
          </div>

          {/* Header with close button */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">
                {itemDescription}
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-white/80 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        </div>

        {/* Thumbnail gallery */}
        <div className="p-4 flex justify-center gap-2 bg-gray-900 overflow-x-auto">
          {imageUrls.map((url, index) => (
            <div
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer transition-all transform hover:scale-105 ${
                index === activeIndex
                  ? "ring-2 ring-blue-500 scale-105"
                  : "opacity-70"
              }`}
            >
              <img
                src={url}
                alt={`${itemDescription} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveApproval;

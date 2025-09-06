import { useState, useEffect } from "react";
import {
  createStatus,
  getPendingStatuses,
  getApprovedStatuses,
  getRejectedStatuses,
  approveStatus,
  rejectStatus,
  searchUserByServiceNo,
} from "../services/receiveService.js";
import {
  getImageUrl,
  searchReceiverByServiceNo,
} from "../services/requestService.js";
import { useToast } from "../components/ToastProvider.jsx";
import { jsPDF } from "jspdf";
import logoUrl from "../assets/SLTMobitel_Logo.png";
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
  FaSearch,
  FaCheck,
  FaClipboardCheck,
  FaTruck,
  FaBuilding,
  FaUserFriends,
  FaHardHat,
  FaUserTie,
  FaBoxes,
  FaArrowLeft,
  FaArrowRight,
  FaFilePdf,
  FaPrint,
} from "react-icons/fa";

const Receive = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [comment, setComment] = useState("");
  const [pendingItems, setPendingItems] = useState([]);
  const [approvedItems, setApprovedItems] = useState([]);
  const [rejectedItems, setRejectedItems] = useState([]);
  const [transportData, setTransportData] = useState(null);
  const { showToast } = useToast();
  const [userDetails, setUserDetails] = useState(null);
  const [staffType, setStaffType] = useState("SLT");
  const [searchedEmployee, setSearchedEmployee] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedReturnableItems, setSelectedReturnableItems] = useState([]);
  const [nonSltStaffDetails, setNonSltStaffDetails] = useState({
    name: "",
    companyName: "",
    nic: "",
    contactNo: "",
    email: "",
  });
  // console.log('selectedItem', selectedItem);

  useEffect(() => {
      const userData = JSON.parse(localStorage.getItem('user'));
      setUser(userData);
    }, []);

  
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.branches) return;

      try {
        const data = await getPendingStatuses();

        const filteredData = data.filter(status =>
          user.branches.includes(status.request?.inLocation)
        );

        
        // Process each status with async operations
        const formattedData = await Promise.all(
          filteredData.map(async (status) => {
            const senderServiceNo = status.request?.employeeServiceNo;
            const receiverServiceNo = status.request?.receiverServiceNo;
            const transportData = status.request?.transport;
            const loadingDetails = status.request?.loading;
            const statusDetails = status;
            let senderDetails = null; // Default name

            // Only fetch user name if serviceNo exists
            if (senderServiceNo) {
              try {
                const userData = await searchUserByServiceNo(senderServiceNo);
                senderDetails = userData;
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${senderServiceNo}:`,
                  error
                );
              }
            }

            let receiverDetails = null;

            if (receiverServiceNo) {
              try {
                const userData = await searchUserByServiceNo(receiverServiceNo);
                if (userData) {
                  receiverDetails = userData;
                  console.log("Receiver Details", receiverDetails);
                }
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${receiverServiceNo}:`,
                  error
                );
              }
            }

            let loadUserData = null;

            if (loadingDetails.staffType === "SLT") {
              try {
                const userData = await searchUserByServiceNo(
                  loadingDetails.staffServiceNo
                );
                loadUserData = userData;
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${loadingDetails.staffServiceNo}:`,
                  error
                );
              }
            }

            let unLoadUserData = null;

            if (statusDetails.recieveOfficerServiceNumber) {
              try {
                const userData = await searchUserByServiceNo(
                  statusDetails.recieveOfficerServiceNumber
                );
                unLoadUserData = userData;
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${statusDetails.recieveOfficerServiceNumber}:`,
                  error
                );
              }
            }

            let exerctiveOfficerData = null;

            if (status.executiveOfficerServiceNo) {
              try {
                const userData = await searchUserByServiceNo(
                  status.executiveOfficerServiceNo
                );
                exerctiveOfficerData = userData;
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${status.executiveOfficerServiceNo}:`,
                  error
                );
              }
            }

            let verifyOfficerData = null;

            if (status.verifyOfficerServiceNumber) {
              try {
                const userData = await searchUserByServiceNo(
                  status.verifyOfficerServiceNumber
                );
                verifyOfficerData = userData;
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${status.verifyOfficerServiceNumber}:`,
                  error
                );
              }
            }

            let receiveOfficerData = null;

            if (status.recieveOfficerServiceNumber) {
              try {
                const userData = await searchUserByServiceNo(
                  status.recieveOfficerServiceNumber
                );
                receiveOfficerData = userData;
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${status.recieveOfficerServiceNumber}:`,
                  error
                );
              }
            }

            return {
              refNo: status.referenceNumber,
              senderDetails: senderDetails,
              receiverDetails: receiverDetails,
              transportData: transportData,
              loadingDetails: loadingDetails,
              inLocation: status.request?.inLocation,
              outLocation: status.request?.outLocation,
              createdAt: new Date(status.createdAt).toLocaleString(),
              items: status.request?.items || [],
              comment: comment,
              requestDetails: { ...status.request },
              loadUserData: loadUserData,
              unLoadUserData: unLoadUserData,
              statusDetails: statusDetails,
              executiveOfficerData: exerctiveOfficerData,
              verifyOfficerData: verifyOfficerData,
              receiveOfficerData: receiveOfficerData,
            };
          })
        );

        setPendingItems(formattedData);
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
            const loadingDetails = status.request?.loading;
            const statusDetails = status;
            let senderDetails = null; // Default name

            console.log("Status Details", statusDetails);

            // Only fetch user name if serviceNo exists
            if (senderServiceNo) {
              try {
                const userData = await searchUserByServiceNo(senderServiceNo);
                senderDetails = userData;
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${senderServiceNo}:`,
                  error
                );
              }
            }

            let receiverDetails = null;

            if (receiverServiceNo) {
              try {
                const userData = await searchUserByServiceNo(receiverServiceNo);
                if (userData) {
                  receiverDetails = userData;
                  console.log("Receiver Details", receiverDetails);
                }
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${receiverServiceNo}:`,
                  error
                );
              }
            }

            let loadUserData = null;

            if (loadingDetails.staffType === "SLT") {
              try {
                const userData = await searchUserByServiceNo(
                  loadingDetails.staffServiceNo
                );
                loadUserData = userData;
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${loadingDetails.staffServiceNo}:`,
                  error
                );
              }
            }

            let unLoadUserData = null;

            if (loadingDetails.staffType === "SLT") {
              try {
                const userData = await searchUserByServiceNo(
                  statusDetails.recieveOfficerServiceNumber
                );
                unLoadUserData = userData;
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${loadingDetails.staffServiceNo}:`,
                  error
                );
              }
            }

            let exerctiveOfficerData = null;

            if (status.executiveOfficerServiceNo) {
              try {
                const userData = await searchUserByServiceNo(
                  status.executiveOfficerServiceNo
                );
                exerctiveOfficerData = userData;
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${status.executiveOfficerServiceNo}:`,
                  error
                );
              }
            }

            let verifyOfficerData = null;

            if (status.verifyOfficerServiceNumber) {
              try {
                const userData = await searchUserByServiceNo(
                  status.verifyOfficerServiceNumber
                );
                verifyOfficerData = userData;
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${status.verifyOfficerServiceNumber}:`,
                  error
                );
              }
            }

            let receiveOfficerData = null;

            if (status.recieveOfficerServiceNumber) {
              try {
                const userData = await searchUserByServiceNo(
                  status.recieveOfficerServiceNumber
                );
                receiveOfficerData = userData;
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${status.recieveOfficerServiceNumber}:`,
                  error
                );
              }
            }

            return {
              refNo: status.referenceNumber,
              senderDetails: senderDetails,
              receiverDetails: receiverDetails,
              transportData: transportData,
              loadingDetails: loadingDetails,
              inLocation: status.request?.inLocation,
              outLocation: status.request?.outLocation,
              createdAt: new Date(status.createdAt).toLocaleString(),
              items: status.request?.items || [],
              comment: status.comment,
              requestDetails: { ...status.request },
              loadUserData: loadUserData,
              unLoadUserData: unLoadUserData,
              statusDetails: statusDetails,
              executiveOfficerData: exerctiveOfficerData,
              verifyOfficerData: verifyOfficerData,
              receiveOfficerData: receiveOfficerData,
            };
          })
        );
        setApprovedItems(formattedData);
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
            const loadingDetails = status.request?.loading;
            const statusDetails = status;
            let senderDetails = null; // Default name

            // Only fetch user name if serviceNo exists
            if (senderServiceNo) {
              try {
                const userData = await searchUserByServiceNo(senderServiceNo);
                senderDetails = userData;
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${senderServiceNo}:`,
                  error
                );
              }
            }

            let receiverDetails = null;

            if (receiverServiceNo) {
              try {
                const userData = await searchUserByServiceNo(receiverServiceNo);
                if (userData) {
                  receiverDetails = userData;
                  console.log("Receiver Details", receiverDetails);
                }
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${receiverServiceNo}:`,
                  error
                );
              }
            }

            let loadUserData = null;

            if (loadingDetails.staffType === "SLT") {
              try {
                const userData = await searchUserByServiceNo(
                  loadingDetails.staffServiceNo
                );
                loadUserData = userData;
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${senderServiceNo}:`,
                  error
                );
              }
            }

            let unLoadUserData = null;

            if (loadingDetails.staffType === "SLT") {
              try {
                const userData = await searchUserByServiceNo(
                  statusDetails.recieveOfficerServiceNumber
                );
                unLoadUserData = userData;
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${loadingDetails.staffServiceNo}:`,
                  error
                );
              }
            }

            let receiveOfficerData = null;

            if (status.recieveOfficerServiceNumber) {
              try {
                const userData = await searchUserByServiceNo(
                  status.recieveOfficerServiceNumber
                );
                receiveOfficerData = userData;
              } catch (error) {
                console.error(
                  `Error fetching user for service number ${status.recieveOfficerServiceNumber}:`,
                  error
                );
              }
            }

            return {
              refNo: status.referenceNumber,
              senderDetails: senderDetails,
              receiverDetails: receiverDetails,
              transportData: transportData,
              loadingDetails: loadingDetails,
              inLocation: status.request?.inLocation,
              outLocation: status.request?.outLocation,
              createdAt: new Date(status.createdAt).toLocaleString(),
              items: status.request?.items || [],
              comment: status.comment,
              requestDetails: { ...status.request },
              loadUserData: loadUserData,
              unLoadUserData: unLoadUserData,
              statusDetails: statusDetails,
              receiveOfficerData: receiveOfficerData,
            };
          })
        );

        setRejectedItems(formattedData);
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

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUserDetails(userData);
    console.log("Stored Role:", userDetails);
  }, [activeTab]);

  const handleApprove = async (item) => {
    try {
      // Prepare unloading details based on staff type
      let unloadingDetails = {
        unloadingLocation: item.inLocation,
        staffType: staffType,
      };
      console.log("Serched Employee", searchedEmployee);

      if (staffType === "SLT") {
        if (!searchedEmployee) {
          showToast(
            "Please search and select an SLT employee for unloading",
            "warning"
          );
          return;
        }
        unloadingDetails.staffServiceNo = searchedEmployee.serviceNo;
      } else {
        // Validate non-SLT staff details
        if (!nonSltStaffDetails.name || !nonSltStaffDetails.nic) {
          showToast(
            "Please fill in all required non-SLT staff details",
            "warning"
          );
          return;
        }

        unloadingDetails = {
          ...unloadingDetails,
          nonSLTStaffName: nonSltStaffDetails.name,
          nonSLTStaffCompany: nonSltStaffDetails.companyName,
          nonSLTStaffNIC: nonSltStaffDetails.nic,
          nonSLTStaffContact: nonSltStaffDetails.contactNo,
          nonSLTStaffEmail: nonSltStaffDetails.email,
        };
      }

      // Call API to approve status with comment and unloading details
      const updatedStatus = await approveStatus(
        item.refNo,
        comment,
        unloadingDetails,
        userDetails.serviceNo,
        selectedReturnableItems
      );

      // Format the approved item in the same structure as your UI expects
      const approvedItem = {
        refNo: updatedStatus.referenceNumber,
        name: updatedStatus.request?.name,
        inLocation: updatedStatus.request?.inLocation,
        outLocation: updatedStatus.request?.outLocation,
        createdAt: new Date(updatedStatus.createdAt).toLocaleString(),
        items: updatedStatus.request?.items || [],
        comment: updatedStatus.comment,
        requestDetails: { ...updatedStatus.request },
      };

      // Update UI state
      setPendingItems(pendingItems.filter((i) => i.refNo !== item.refNo));
      setApprovedItems([...approvedItems, approvedItem]);

      // Reset modal and comment
      setShowModal(false);
      setStaffType("");
      setComment("");
      showToast("Request received successfully", "success");
    } catch (error) {
      console.error("Error approving status:", error.message);
      showToast("Failed to receive request", "error");
    }
  };

  const handleReject = async (item) => {
    try {
      if (!comment || comment.trim() === "") {
        showToast("Comment is required to reject the item.", "warning");
        return;
      }

      // Call API to reject status with comment
      const updatedStatus = await rejectStatus(item.refNo, comment);

      // Format the rejected item in the same structure as your UI expects
      const rejectedItem = {
        refNo: updatedStatus.referenceNumber,
        name: updatedStatus.request?.name,
        inLocation: updatedStatus.request?.inLocation,
        outLocation: updatedStatus.request?.outLocation,
        createdAt: new Date(updatedStatus.createdAt).toLocaleString(),
        items: updatedStatus.request?.items || [],
        comment: updatedStatus.comment,
        requestDetails: { ...updatedStatus.request },
      };

      // Update UI state
      setPendingItems(pendingItems.filter((i) => i.refNo !== item.refNo));
      setRejectedItems([...rejectedItems, rejectedItem]);

      // Reset modal and comment
      setShowModal(false);
      setComment("");
    } catch (error) {
      console.error("Error rejecting status:", error.message);
    }
  };

  const handleModelOpen = async (item) => {
    setSelectedItem(item);

    if (item.requestDetails?.transport.transporterServiceNo) {
      try {
        const transport = await searchReceiverByServiceNo(
          item.requestDetails?.transport.transporterServiceNo
        );
        setTransportData(transport);
      } catch (error) {
        console.error("Error fetching transporter details:", error);
        setTransportData(null);
      }
    } else {
      setTransportData(item.requestDetails?.transport || null);
    }

    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gate Pass Receive
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
              {rejectedItems.length}
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
                  Date & Time
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(activeTab === "pending"
                ? pendingItems
                : activeTab === "approved"
                ? approvedItems
                : rejectedItems
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
                      {item.outLocation}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {item.createdAt}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => {
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
          ? pendingItems
          : activeTab === "approved"
          ? approvedItems
          : rejectedItems
        ).length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FaBoxOpen className="text-4xl text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No requests found</p>
            <p className="text-gray-400 text-sm">
              Your gate pass requests will appear here
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
        setComment={setComment}
        transporterDetails={transportData}
        showToast={showToast}
        setSearchedEmployee={setSearchedEmployee}
        searchedEmployee={searchedEmployee}
        selectedReturnableItems={selectedReturnableItems}
        setSelectedReturnableItems={setSelectedReturnableItems}
        nonSltStaffDetails={nonSltStaffDetails}
        setNonSltStaffDetails={setNonSltStaffDetails}
        staffType={staffType}
        setStaffType={setStaffType}
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
  transporterDetails,
  showToast,
  setSearchedEmployee,
  searchedEmployee,
  selectedReturnableItems,
  setSelectedReturnableItems,
  nonSltStaffDetails,
  setNonSltStaffDetails,
  setStaffType,
  staffType
}) => {
  console.log("Request", request);
  // Initialize with the correct value from request
  const [selectedExecutive, setSelectedExecutive] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedItemImages, setSelectedItemImages] = useState([]);
  const [selectedItemName, setSelectedItemName] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [currentTab, setCurrentTab] = useState("details");
  //const [selectedReturnableItems, setSelectedReturnableItems] = useState([]);
  const tabOrder =
    activeTab === "pending"
      ? //? ['details', 'loading', 'transport', 'navigation']
        ["details", "loading", "returnable", "navigation"]
      : ["details", "navigation"];
  const DispatchStatus = false;

  // States for loading/unloading details
  
  const [serviceId, setServiceId] = useState("");
  //const [searchedEmployee, setSearchedEmployee] = useState(null);
  

  // States for transportation details
  const [transportStaffType, setTransportStaffType] = useState("SLT");
  const [transportServiceId, setTransportServiceId] = useState("");
  const [transportEmployee, setTransportEmployee] = useState(null);
  const [nonSltTransportDetails, setNonSltTransportDetails] = useState({
    name: "",
    companyName: "",
    nic: "",
    contactNo: "",
  });
  const [vehicleDetails, setVehicleDetails] = useState({
    vehicleNumber: "",
    vehicleType: "",
  });

  if (!isOpen || !request) return null;

  const handleViewImages = (item) => {
    setSelectedItemImages(item.itemPhotos);
    setSelectedItemName(item.itemName);
    setIsImageModalOpen(true);
  };

  const handleEmployeeSearch = async () => {
    if (!serviceId.trim()) {
      showToast("Please enter a service number", "warning");
      return;
    }

    try {
      setSearchedEmployee(null); // Reset previous results

      const userData = await searchUserByServiceNo(serviceId);
      if (userData) {
        setSearchedEmployee(userData);
        showToast("Employee found", "success");
      } else {
        showToast("No employee found with that service number", "error");
      }
    } catch (error) {
      console.error("Error searching for employee:", error);
      showToast("Error searching for employee", "error");
    }
  };

  // Handle tab navigation
  const goToNextTab = () => {
    const currentIndex = tabOrder.indexOf(currentTab);
    if (currentIndex < tabOrder.length - 1) {
      setCurrentTab(tabOrder[currentIndex + 1]);
    }
  };

  const goToPreviousTab = () => {
    const currentIndex = tabOrder.indexOf(currentTab);
    if (currentIndex > 0) {
      setCurrentTab(tabOrder[currentIndex - 1]);
    }
  };

  // Print function
  const printReport = (request, transporterDetails, loadingStaff, selectedReturnableItems) => {
  // Create a temporary iframe to hold the printable content
  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'absolute';
  printFrame.style.top = '-9999px';
  document.body.appendChild(printFrame);

  const contentDocument = printFrame.contentDocument;

  // Create the print content with styling
  contentDocument.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SLT Gate Pass - ${request.refNo}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }
          .logo {
            max-height: 60px;
            margin-bottom: 10px;
          }
          .title {
            font-size: 24px;
            color: #003399;
            margin: 0;
          }
          .ref {
            font-size: 14px;
            color: #666;
            margin: 5px 0;
          }
          .date {
            font-size: 12px;
            color: #888;
            margin: 5px 0 15px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #eee;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .item {
            margin-bottom: 5px;
          }
          .itemComm{
            margin-bottom: 40px;
          }
          .label {
            font-weight: bold;
            color: #555;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-top: 40px;
          }
          .signature-box {
            height: 70px;
            border-bottom: 1px solid #ccc;
          }
          .signature-title {
            text-align: center;
            font-weight: bold;
            margin-top: 5px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #999;
          }
          @media print {
            body {
              margin: 0;
              padding: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src=${logoUrl} alt="SLT Logo" class="logo" />
          <h1 class="title">SLT Gate Pass</h1>
          <p class="ref">Reference: ${request.refNo}</p>
          <p class="date">Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="section">
          <h2 class="section-title">Sender Details</h2>
          <div class="grid">
            <div class="item">
              <span class="label">Name:</span> ${request.senderDetails?.name || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Service No:</span> ${request.senderDetails?.serviceNo || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Section:</span> ${request.senderDetails?.section || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Group:</span> ${request.senderDetails?.group || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Designation:</span> ${request.senderDetails?.designation || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Contact:</span> ${request.senderDetails?.contactNo || 'N/A'}
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Receiver Details</h2>
          <div class="grid">
            <div class="item">
              <span class="label">Name:</span> ${request.receiverDetails?.name || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Service No:</span> ${request.receiverDetails?.serviceNo || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Section:</span> ${request.receiverDetails?.section || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Group:</span> ${request.receiverDetails?.group || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Designation:</span> ${request.receiverDetails?.designation || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Contact:</span> ${request.receiverDetails?.contactNo || 'N/A'}
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">Location Details</h2>
          <div class="grid">
            <div class="item">
              <span class="label">From:</span> ${request.outLocation || 'N/A'}
            </div>
            <div class="item">
              <span class="label">To:</span> ${request.inLocation || 'N/A'}
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">Transport Details</h2>
          <div class="grid">
            <div class="item">
              <span class="label">Method:</span> ${request?.transportData?.transportMethod || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Type:</span> ${request?.transportData?.transporterType || 'N/A'}
            </div>
            ${request?.transportData?.transporterType === 'SLT' ? `
              
            <div class="item">
              <span class="label">Transporter:</span> ${transporterDetails?.name || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Service No:</span> ${transporterDetails?.serviceNo || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Contact:</span> ${transporterDetails?.contactNo || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Section:</span> ${transporterDetails?.section || 'N/A'}
            </div>
            
            ${request?.transportData?.transportMethod === 'Vehicle' ? `
            <div class="item">
              <span class="label">Vehicle No:</span> ${request?.requestDetails?.vehicleNumber || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Vehicle Model:</span> ${request?.requestDetails?.vehicleModel || 'N/A'}
            </div>
            `: ''} 
            ` : `
            <div class="item">
              <span class="label">Transporter:</span> ${request?.transportData?.nonSLTTransporterName || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Service No:</span> ${request?.transportData?.nonSLTTransporterEmail || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Contact:</span> ${request?.transportData?.nonSLTTransporterNIC || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Section:</span> ${request?.transportData?.nonSLTTransporterPhone || 'N/A'}
            </div>
            
            ${request?.transportData?.transportMethod === 'Vehicle' ? `
            <div class="item">
              <span class="label">Vehicle No:</span> ${request?.requestDetails?.vehicleNumber || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Vehicle Model:</span> ${request?.requestDetails?.vehicleModel || 'N/A'}
            </div>
            `: ''}
            `}
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Exerctive Officer Details</h2>
          <div class="grid">
            <div class="item">
              <span class="label">Name:</span> ${request.executiveOfficerData?.name || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Service No:</span> ${request.executiveOfficerData?.serviceNo || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Section:</span> ${request.executiveOfficerData?.section || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Group:</span> ${request.executiveOfficerData?.group || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Designation:</span> ${request.executiveOfficerData?.designation || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Contact:</span> ${request.executiveOfficerData?.contactNo || 'N/A'}
            </div>
            <div class="itemComm">
              <span class="label">Exerctive Officer Comment:</span> ${request.statusDetails?.executiveOfficerComment || 'N/A'}
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Verify Officer Details</h2>
          <div class="grid">
            <div class="item">
              <span class="label">Name:</span> ${request.verifyOfficerData?.name || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Service No:</span> ${request.verifyOfficerData?.serviceNo || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Section:</span> ${request.verifyOfficerData?.section || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Group:</span> ${request.verifyOfficerData?.group || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Designation:</span> ${request.verifyOfficerData?.designation || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Contact:</span> ${request.verifyOfficerData?.contactNo || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Verify Officer Comment:</span> ${request.statusDetails?.verifyOfficerComment || 'N/A'}
            </div>
          </div>
        </div>
        
        <!-- Loading Details Section -->
    <div class="section">
      <h2 class="section-title">Loading Details</h2>
      <div class="grid">
        <div class="item">
          <span class="label">Loading Location:</span> ${request?.requestDetails?.loading?.loadingLocation || 'N/A'}
        </div>
        <div class="item">
          <span class="label">Loading Time:</span> ${request?.requestDetails?.loading?.loadingTime ? new Date(request.requestDetails.loading.loadingTime).toLocaleString() : 'N/A'}
        </div>
        <div class="item">
          <span class="label">Staff Type:</span> ${request?.requestDetails?.loading?.staffType || 'N/A'}
        </div>
        
        ${request?.requestDetails?.loading?.staffType === 'SLT' ? `
          <div class="item">
            <span class="label">Staff Service No:</span> ${request?.requestDetails?.loading?.staffServiceNo || 'N/A'}
          </div>
          <div class="item">
              <span class="label">Name:</span> ${request.loadUserData?.serviceNo || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Service No:</span> ${request.loadUserData?.name || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Section:</span> ${request.loadUserData?.section || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Group:</span> ${request.loadUserData?.group || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Designation:</span> ${request.loadUserData?.designation || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Contact:</span> ${request.loadUserData?.contactNo || 'N/A'}
            </div>
        ` : `
          <div class="item">
            <span class="label">Staff Name:</span> ${request?.requestDetails?.loading?.nonSLTStaffName || 'N/A'}
          </div>
          <div class="item">
            <span class="label">Company:</span> ${request?.requestDetails?.loading?.nonSLTStaffCompany || 'N/A'}
          </div>
          <div class="item">
            <span class="label">NIC:</span> ${request?.requestDetails?.loading?.nonSLTStaffNIC || 'N/A'}
          </div>
          <div class="item">
            <span class="label">Contact:</span> ${request?.requestDetails?.loading?.nonSLTStaffContact || 'N/A'}
          </div>
          <div class="item">
            <span class="label">Email:</span> ${request?.requestDetails?.loading?.nonSLTStaffEmail || 'N/A'}
          </div>
        `}
      </div>
    </div>

    <div class="section">
          <h2 class="section-title">Receive Officer Details</h2>
          <div class="grid">
            <div class="item">
              <span class="label">Name:</span> ${request.receiveOfficerData?.name || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Service No:</span> ${request.receiveOfficerData?.serviceNo || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Section:</span> ${request.receiveOfficerData?.section || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Group:</span> ${request.receiveOfficerData?.group || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Designation:</span> ${request.receiveOfficerData?.designation || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Contact:</span> ${request.receiveOfficerData?.contactNo || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Receive Officer Comment:</span> ${request.statusDetails?.recieveOfficerComment || 'N/A'}
            </div>
          </div>
        </div>
        
        <!-- Loading Details Section -->
    <div class="section">
      <h2 class="section-title">Unloading Details</h2>
      <div class="grid">
        <div class="item">
          <span class="label">Loading Location:</span> ${request?.requestDetails?.unLoading?.loadingLocation || 'N/A'}
        </div>
        <div class="item">
          <span class="label">Loading Time:</span> ${request?.requestDetails?.unLoading?.loadingTime ? new Date(request.requestDetails.loading.loadingTime).toLocaleString() : 'N/A'}
        </div>
        <div class="item">
          <span class="label">Staff Type:</span> ${request?.requestDetails?.unLoading?.staffType || 'N/A'}
        </div>
        
        ${request?.requestDetails?.unLoading?.staffType === 'SLT' ? `
          <div class="item">
            <span class="label">Staff Service No:</span> ${request?.requestDetails?.unLoading?.staffServiceNo || 'N/A'}
          </div>
          <div class="item">
              <span class="label">Name:</span> ${request.unLoadUserData?.serviceNo || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Service No:</span> ${request.unLoadUserData?.name || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Section:</span> ${request.unLoadUserData?.section || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Group:</span> ${request.unLoadUserData?.group || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Designation:</span> ${request.unLoadUserData?.designation || 'N/A'}
            </div>
            <div class="item">
              <span class="label">Contact:</span> ${request.unLoadUserData?.contactNo || 'N/A'}
            </div>
        ` : `
          <div class="item">
            <span class="label">Staff Name:</span> ${request?.requestDetails?.unLoading?.nonSLTStaffName || 'N/A'}
          </div>
          <div class="item">
            <span class="label">Company:</span> ${request?.requestDetails?.unLoading?.nonSLTStaffCompany || 'N/A'}
          </div>
          <div class="item">
            <span class="label">NIC:</span> ${request?.requestDetails?.unLoading?.nonSLTStaffNIC || 'N/A'}
          </div>
          <div class="item">
            <span class="label">Contact:</span> ${request?.requestDetails?.unLoading?.nonSLTStaffContact || 'N/A'}
          </div>
          <div class="item">
            <span class="label">Email:</span> ${request?.requestDetails?.unLoading?.nonSLTStaffEmail || 'N/A'}
          </div>
        `}
      </div>
    </div>

        <div class="section">
          <h2 class="section-title">Items</h2>
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Serial No</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Model</th>
              </tr>
            </thead>
            <tbody>
              ${request.items.map(item => `
                <tr>
                  <td>${item?.itemName || '-'}</td>
                  <td>${item?.serialNo || '-'}</td>
                  <td>${item?.itemCategory || '-'}</td>
                  <td>${item?.itemQuantity || '-'}</td>
                  <td>${item?.itemModel || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
      <h2 class="section-title">Selected Returnable Items</h2>
      ${request.requestDetails.returnableItems
        ? `<table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Serial No</th>
                <th>Category</th>
                <th>Return Quantity</th>
                <th>Model</th>
              </tr>
            </thead>
            <tbody>
              ${request.requestDetails.returnableItems.map(item => `
                <tr>
                  <td>${item?.itemName || '-'}</td>
                  <td>${item?.serialNo || '-'}</td>
                  <td>${item?.itemCategory || '-'}</td>
                  <td>${item?.returnQuantity || item?.itemQuantity || '-'}</td>
                  <td>${item?.itemModel || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>`
        : '<p>No returnable items selected</p>'
      }
    </div>
        
        
        <div class="footer">
          This is an electronically generated document and does not require signature.
        </div>
      </body>
      </html>
    `);

  contentDocument.close();

  // Wait for content to load then print
  printFrame.onload = function () {
    printFrame.contentWindow.focus();
    printFrame.contentWindow.print();

    // Remove the iframe after printing
    setTimeout(() => {
      document.body.removeChild(printFrame);
    }, 1000);
  };
};


  const generateItemDetailsPDF = (items, refNo) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Add SLT logo
    try {
      doc.addImage(logoUrl, "PNG", margin, 10, 40, 20);
    } catch (error) {
      console.error("Error adding logo:", error);
    }

    // Header
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 153); // SLT blue color
    doc.text("SLT Gate Pass - Item Details", pageWidth / 2, 20, {
      align: "center",
    });

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Reference: ${request.refNo}`, pageWidth / 2, 30, {
      align: "center",
    });

    // Add current date
    const currentDate = new Date().toLocaleDateString();
    doc.setFontSize(10);
    doc.text(`Generated on: ${currentDate}`, pageWidth - margin, 20, {
      align: "right",
    });

    // Horizontal line
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, 35, pageWidth - margin, 35);

    // Items Table
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Item Details", margin, 45);

    // Table header
    let yPos = 55;
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.setDrawColor(200, 200, 200);

    // Define column widths
    const col1Width = 60; // Item Name
    const col2Width = 40; // Serial No
    const col3Width = 30; // Category
    const col4Width = 20; // Quantity
    const col5Width = 30; // Status

    // Draw table header
    doc.setFillColor(240, 240, 240);
    doc.rect(
      margin,
      yPos,
      col1Width + col2Width + col3Width + col4Width + col5Width,
      8,
      "F"
    );

    doc.text("Item Name", margin + 3, yPos + 5.5);
    doc.text("Serial No", margin + col1Width + 3, yPos + 5.5);
    doc.text("Category", margin + col1Width + col2Width + 3, yPos + 5.5);
    doc.text("Qty", margin + col1Width + col2Width + col3Width + 3, yPos + 5.5);
    doc.text(
      "Model",
      margin + col1Width + col2Width + col3Width + col4Width + 3,
      yPos + 5.5
    );

    yPos += 8;

    // Draw table content
    items.forEach((item, index) => {
      if (yPos > 270) {
        // Add new page if content exceeds page height
        doc.addPage();
        yPos = 20;

        // Add table header on new page
        doc.setFillColor(240, 240, 240);
        doc.rect(
          margin,
          yPos,
          col1Width + col2Width + col3Width + col4Width + col5Width,
          8,
          "F"
        );

        doc.text("Item Name", margin + 3, yPos + 5.5);
        doc.text("Serial No", margin + col1Width + 3, yPos + 5.5);
        doc.text("Category", margin + col1Width + col2Width + 3, yPos + 5.5);
        doc.text(
          "Qty",
          margin + col1Width + col2Width + col3Width + 3,
          yPos + 5.5
        );
        doc.text(
          "Model",
          margin + col1Width + col2Width + col3Width + col4Width + 3,
          yPos + 5.5
        );

        yPos += 8;
      }

      // Alternate row colors for better readability
      if (index % 2 === 1) {
        doc.setFillColor(248, 248, 248);
        doc.rect(
          margin,
          yPos,
          col1Width + col2Width + col3Width + col4Width + col5Width,
          8,
          "F"
        );
      }

      // Truncate long text to fit in columns
      const truncateText = (text, maxLength) => {
        if (!text) return "N/A";
        return text.length > maxLength
          ? text.substring(0, maxLength) + "..."
          : text;
      };

      doc.text(
        truncateText(item?.itemName || "N/A", 25),
        margin + 3,
        yPos + 5.5
      );
      doc.text(
        truncateText(item?.serialNo || "N/A", 15),
        margin + col1Width + 3,
        yPos + 5.5
      );
      doc.text(
        truncateText(item?.itemCategory || "N/A", 12),
        margin + col1Width + col2Width + 3,
        yPos + 5.5
      );
      doc.text(
        item?.itemQuantity?.toString() || "1",
        margin + col1Width + col2Width + col3Width + 3,
        yPos + 5.5
      );
      doc.text(
        item?.itemModel || "N/A",
        margin + col1Width + col2Width + col3Width + col4Width + 3,
        yPos + 5.5
      );
      // doc.text(item?.itemReturnable ? 'Returnable' : 'Non-Returnable',
      //          margin + col1Width + col2Width + col3Width + col4Width + 3, yPos + 5.5);

      // Draw horizontal line after each row
      doc.line(
        margin,
        yPos + 8,
        margin + col1Width + col2Width + col3Width + col4Width + col5Width,
        yPos + 8
      );

      yPos += 8;
    });

    // Footer
    const footerYPos = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "This is an electronically generated document and does not require signature.",
      pageWidth / 2,
      footerYPos,
      { align: "center" }
    );

    // Save the PDF
    doc.save(`SLT_GatePass_Items_${request.refNo}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full flex flex-col h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
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
          <div className="mt-2 text-white/80">Reference: {request.refNo}</div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors flex items-center ${
              currentTab === "details"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setCurrentTab("details")}
          >
            <FaInfoCircle className="mr-2" /> Request Details
          </button>
          {activeTab === "pending" && (
            <>
              <button
                className={`px-6 py-3 text-sm font-medium transition-colors flex items-center ${
                  currentTab === "loading"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setCurrentTab("loading")}
              >
                <FaBoxes className="mr-2" />
                {DispatchStatus ? "Loading Details" : "Unloading Details"}
              </button>
              {/* <button
                className={`px-6 py-3 text-sm font-medium transition-colors flex items-center ${
                  currentTab === 'transport'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setCurrentTab('transport')}
              >
                <FaTruck className="mr-2" /> Transportation Details
              </button> */}
            </>
          )}

          <button
            className={`px-6 py-3 text-sm font-medium transition-colors flex items-center ${
              currentTab === "returnable"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setCurrentTab("returnable")}
          >
            <FaClipboardCheck className="mr-2" /> Returnable Items
          </button>

          <button
            className={`px-6 py-3 text-sm font-medium transition-colors flex items-center ${
              currentTab === "navigation"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setCurrentTab("navigation")}
          >
            <FaCheckCircle className="mr-2" /> Approval
          </button>
        </div>

        {/* Main Content - Make this scrollable */}
        <div className="flex-grow overflow-y-auto p-6">
          {/* Request Details Tab */}
          {currentTab === "details" && (
            <>
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
                      {request.senderDetails?.serviceNo}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Name
                    </label>
                    <p className="text-gray-800">
                      {request.senderDetails?.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Section
                    </label>
                    <p className="text-gray-800">
                      {request.senderDetails?.section}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Group
                    </label>
                    <p className="text-gray-800">
                      {request.senderDetails?.group}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Designation
                    </label>
                    <p className="text-gray-800">
                      {request.senderDetails?.designation}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Contact
                    </label>
                    <p className="text-gray-800">
                      {request.senderDetails?.contactNo}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                  <FaBoxOpen className="mr-2" /> Item Details
                  <button
                    onClick={() =>
                      generateItemDetailsPDF(request.items, request.refNo)
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
                          Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Serial No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Model
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Image
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {request.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4">{item?.itemName}</td>
                          <td className="px-6 py-4">{item?.serialNo}</td>
                          <td className="px-6 py-4">{item?.itemCategory}</td>
                          <td className="px-6 py-4">{item?.itemQuantity}</td>
                          <td className="px-6 py-4">{item?.itemModel}</td>
                          {/* <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item?.itemReturnable
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.itemReturnable ? 'Returnable' : 'Non-Returnable'}
                            </span>
                          </td> */}
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleViewImages(item)}
                              className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                            >
                              <FaEye className="mr-2" /> View Images
                            </button>
                            <ImageViewerModal
                              images={selectedItemImages}
                              isOpen={isImageModalOpen}
                              onClose={() => setIsImageModalOpen(false)}
                              itemName={selectedItemName}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                      <p className="text-gray-800">{request?.outLocation}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        In Location
                      </label>
                      <p className="text-gray-800">{request?.inLocation}</p>
                    </div>
                  </div>
                </div>

                {request.receiverDetails ? (
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
                          {request.receiverDetails?.name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Group
                        </label>
                        <p className="text-gray-800">
                          {request.receiverDetails?.group}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Service No
                        </label>
                        <p className="text-gray-800">
                          {request.receiverDetails?.serviceNo}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Contact
                        </label>
                        <p className="text-gray-800">
                          {request.receiverDetails?.contactNo}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                      <FaUserCheck className="mr-2" /> Receiver Details
                    </h3>
                    <div className="text-center py-4 text-gray-500">
                      <p>No receiver information available</p>
                    </div>
                  </div>
                )}
              </div>

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
                      {request?.requestDetails?.transport.transportMethod ||
                        "N/A"}
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
                          Vehicle Model
                        </label>
                        <p className="text-gray-800">
                          {request?.requestDetails?.transport.vehicleModel ||
                            "N/A"}
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
            </>
          )}

          {/* Loading/Unloading Details Tab */}
          {currentTab === "loading" && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                  <FaHardHat className="mr-2" />
                  {DispatchStatus ? "Loading Details" : "Unloading Detail"}
                </h3>

                {/* Toggle between SLT and Non-SLT */}
                <div className="flex space-x-4 mb-6">
                  <button
                    className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center ${
                      staffType === "SLT"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setStaffType("SLT")}
                  >
                    <FaBuilding className="mr-2" /> SLT Employee
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center ${
                      staffType === "Non-SLT"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setStaffType("Non-SLT")}
                  >
                    <FaUserFriends className="mr-2" /> Non-SLT Employee
                  </button>
                </div>

                {staffType === "SLT" ? (
                  <>
                    {/* SLT Employee Search */}
                    <div className="mb-4">
                      <div className="flex items-center mb-4">
                        <input
                          type="text"
                          value={serviceId}
                          onChange={(e) => setServiceId(e.target.value)}
                          placeholder="Enter Service ID"
                          className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleEmployeeSearch}
                          className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-r-lg transition-colors"
                        >
                          <FaSearch />
                        </button>
                      </div>

                      {searchedEmployee && (
                        <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Name
                              </label>
                              <p className="text-gray-800">
                                {searchedEmployee.name}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Service No
                              </label>
                              <p className="text-gray-800">{serviceId}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Email
                              </label>
                              <p className="text-gray-800">
                                {searchedEmployee.email}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Section
                              </label>
                              <p className="text-gray-800">
                                {searchedEmployee.section}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Branch
                              </label>
                              <p className="text-gray-800">
                                {searchedEmployee.branch}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Contact
                              </label>
                              <p className="text-gray-800">
                                {searchedEmployee.contactNo}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Non-SLT Employee Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={nonSltStaffDetails.name}
                          onChange={(e) =>
                            setNonSltStaffDetails({
                              ...nonSltStaffDetails,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={nonSltStaffDetails.companyName}
                          onChange={(e) =>
                            setNonSltStaffDetails({
                              ...nonSltStaffDetails,
                              companyName: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter company name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          NIC
                        </label>
                        <input
                          type="text"
                          value={nonSltStaffDetails.nic}
                          onChange={(e) =>
                            setNonSltStaffDetails({
                              ...nonSltStaffDetails,
                              nic: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter NIC"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Number
                        </label>
                        <input
                          type="text"
                          value={nonSltStaffDetails.contactNo}
                          onChange={(e) =>
                            setNonSltStaffDetails({
                              ...nonSltStaffDetails,
                              contactNo: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter contact number"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={nonSltStaffDetails.email}
                          onChange={(e) =>
                            setNonSltStaffDetails({
                              ...nonSltStaffDetails,
                              email: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter email"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Transportation Details Tab */}
          {currentTab === "transport" && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                  <FaUserTie className="mr-2" /> Transportation Staff Details
                </h3>

                {/* Toggle between SLT and Non-SLT */}
                <div className="flex space-x-4 mb-6">
                  <button
                    className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center ${
                      transportStaffType === "SLT"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setTransportStaffType("SLT")}
                  >
                    <FaBuilding className="mr-2" /> SLT Employee
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center ${
                      transportStaffType === "Non-Slt"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setTransportStaffType("Non-SLT")}
                  >
                    <FaUserFriends className="mr-2" /> Non-SLT Employee
                  </button>
                </div>

                {transportStaffType === "SLT" ? (
                  <>
                    {/* SLT Employee Search */}
                    <div className="mb-4">
                      <div className="flex items-center mb-4">
                        <input
                          type="text"
                          value={transportServiceId}
                          onChange={(e) =>
                            setTransportServiceId(e.target.value)
                          }
                          placeholder="Enter Service ID"
                          className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() =>
                            handleEmployeeSearch(
                              transportServiceId,
                              "transport"
                            )
                          }
                          className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-r-lg transition-colors"
                        >
                          <FaSearch />
                        </button>
                      </div>

                      {transportEmployee && (
                        <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Name
                              </label>
                              <p className="text-gray-800">
                                {transportEmployee.name}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Service No
                              </label>
                              <p className="text-gray-800">
                                {transportEmployee.serviceNo}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Email
                              </label>
                              <p className="text-gray-800">
                                {transportEmployee.email}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Section
                              </label>
                              <p className="text-gray-800">
                                {transportEmployee.section}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Branch
                              </label>
                              <p className="text-gray-800">
                                {transportEmployee.branch}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Contact
                              </label>
                              <p className="text-gray-800">
                                {transportEmployee.contactNo}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Non-SLT Employee Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={nonSltTransportDetails.name}
                          onChange={(e) =>
                            setNonSltTransportDetails({
                              ...nonSltTransportDetails,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={nonSltTransportDetails.companyName}
                          onChange={(e) =>
                            setNonSltTransportDetails({
                              ...nonSltTransportDetails,
                              companyName: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter company name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          NIC
                        </label>
                        <input
                          type="text"
                          value={nonSltTransportDetails.nic}
                          onChange={(e) =>
                            setNonSltTransportDetails({
                              ...nonSltTransportDetails,
                              nic: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter NIC"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Number
                        </label>
                        <input
                          type="text"
                          value={nonSltTransportDetails.contactNo}
                          onChange={(e) =>
                            setNonSltTransportDetails({
                              ...nonSltTransportDetails,
                              contactNo: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter contact number"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Vehicle Details */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                  <FaTruck className="mr-2" /> Vehicle Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Number
                    </label>
                    <input
                      type="text"
                      value={vehicleDetails.vehicleNumber}
                      onChange={(e) =>
                        setVehicleDetails({
                          ...vehicleDetails,
                          vehicleNumber: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter vehicle number (e.g., ABC-1234)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={vehicleDetails.vehicleType}
                      onChange={(e) =>
                        setVehicleDetails({
                          ...vehicleDetails,
                          vehicleType: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select vehicle type</option>
                      <option value="car">Car</option>
                      <option value="van">Van</option>
                      <option value="truck">Truck</option>
                      <option value="lorry">Lorry</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Returnable Items Tab */}
          {currentTab === "returnable" && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                  <FaClipboardCheck className="mr-2" /> Select Returnable Items
                </h3>

                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-700 text-sm">
                    Please select the items that are being returned and adjust
                    quantities as needed.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Select
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Serial No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Model
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {request.items.map((item, idx) => {
                        const selectedItem = selectedReturnableItems.find(
                          (i) => i.serialNo === item.serialNo
                        );
                        const selectedQuantity = selectedItem
                          ? selectedItem.returnQuantity || item.itemQuantity
                          : item.itemQuantity;

                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedReturnableItems.some(
                                  (i) => i.serialNo === item.serialNo
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedReturnableItems([
                                      ...selectedReturnableItems,
                                      {
                                        ...item,
                                        returnQuantity: item.itemQuantity,
                                      },
                                    ]);
                                  } else {
                                    setSelectedReturnableItems(
                                      selectedReturnableItems.filter(
                                        (i) => i.serialNo !== item.serialNo
                                      )
                                    );
                                  }
                                }}
                              />
                            </td>
                            <td className="px-6 py-4">{item.itemName}</td>
                            <td className="px-6 py-4">{item.serialNo}</td>
                            <td className="px-6 py-4">{item.itemCategory}</td>
                            <td className="px-6 py-4">
                              {selectedReturnableItems.some(
                                (i) => i.serialNo === item.serialNo
                              ) ? (
                                <input
                                  type="number"
                                  min="1"
                                  max={item.itemQuantity}
                                  value={selectedQuantity}
                                  onChange={(e) => {
                                    const newValue =
                                      parseInt(e.target.value) || 1;
                                    const updatedValue = Math.min(
                                      Math.max(1, newValue),
                                      item.itemQuantity
                                    );
                                    setSelectedReturnableItems(
                                      selectedReturnableItems.map((i) =>
                                        i.serialNo === item.serialNo
                                          ? {
                                              ...i,
                                              returnQuantity: updatedValue,
                                            }
                                          : i
                                      )
                                    );
                                  }}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded-md"
                                />
                              ) : (
                                item.itemQuantity
                              )}
                            </td>
                            <td className="px-6 py-4">{item.itemModel}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {request.items.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FaBoxOpen className="text-2xl text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-2">
                      No returnable items found
                    </p>
                    <p className="text-gray-400 text-sm">
                      This request doesn't contain any returnable items
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation/Approval Tab */}
          {currentTab === "navigation" && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                  <FaCheckCircle className="mr-2" /> Approval Information
                </h3>

                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 shadow-sm">
                  <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="mb-4 md:mb-0">
                      <h4 className="text-lg font-semibold text-blue-800 mb-1">
                        Generate Gate Pass Report
                      </h4>
                      <p className="text-sm text-blue-600">
                        Download a PDF report with all gate pass details
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      {/* <button
                        onClick={() => generatePDF(request, transporterDetails, searchedEmployee)}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center"
                      >
                        <FaFilePdf className="mr-2" /> Download PDF
                      </button> */}
                      <button
                        onClick={() =>
                          printReport(
                            request,
                            transporterDetails,
                            searchedEmployee,
                            selectedReturnableItems
                          )
                        }
                        className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all flex items-center"
                      >
                        <FaPrint className="mr-2" /> Print
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-blue-700">Please review all details before approving or rejecting this request.</p>
                  </div> */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        Request Summary
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        <li>Reference: {request.refNo}</li>
                        <li>Sender: {request.senderDetails?.name}</li>
                        <li>Items: {request.items.length}</li>
                        <li>From: {request.outLocation}</li>
                        <li>To: {request.inLocation}</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        Loding Information
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        <li>
                          Name: {searchedEmployee?.name || "Not specified"}
                        </li>
                        <li>
                          Company:{" "}
                          {searchedEmployee?.companyName || "Not specified"}
                        </li>
                        <li>NIC: {searchedEmployee?.nic || "Not specified"}</li>
                        <li>
                          Mobile:{" "}
                          {searchedEmployee?.contactNo || "Not specified"}
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        Transport Information
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        <li>
                          Transport Method:{" "}
                          {request?.requestDetails?.transportMethod ||
                            "Not specified"}
                        </li>
                        <li>
                          Transporter Type:{" "}
                          {request?.requestDetails?.transporterType ||
                            "Not specified"}
                        </li>
                        <li>
                          Service No:{" "}
                          {transporterDetails?.serviceNo || "Not specified"}
                        </li>
                        <li>
                          Name: {transporterDetails?.name || "Not specified"}
                        </li>
                        <li>
                          Section:{" "}
                          {transporterDetails?.section || "Not specified"}
                        </li>
                        <li>
                          Group: {transporterDetails?.group || "Not specified"}
                        </li>
                        <li>
                          Designation:{" "}
                          {transporterDetails?.designation || "Not specified"}
                        </li>
                        <li>
                          Contact:{" "}
                          {transporterDetails?.contactNo || "Not specified"}
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        Returnable Items
                      </h4>
                      {selectedReturnableItems.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {selectedReturnableItems.map((item, index) => (
                            <li key={index}>
                              {item.itemName} - {item.serialNo}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">
                          No returnable items selected
                        </p>
                      )}
                    </div>
                    {DispatchStatus !== true && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">
                          Unloading Information
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          <li>
                            Name: {searchedEmployee?.name || "Not specified"}
                          </li>
                          <li>
                            Company:{" "}
                            {searchedEmployee?.companyName || "Not specified"}
                          </li>
                          <li>
                            NIC: {searchedEmployee?.nic || "Not specified"}
                          </li>
                          <li>
                            Mobile:{" "}
                            {searchedEmployee?.contactNo || "Not specified"}
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                  {activeTab !== "pending" && request?.comment && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Comment
                      </h4>
                      <p className="text-gray-600">{request.comment}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed bottom section for comments and buttons */}
        <div className="flex-shrink-0">
          <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Previous/Next Buttons */}
              {currentTab != "navigation" && (
                <div className="flex items-center justify-between w-full ">
                  <button
                    onClick={goToPreviousTab}
                    disabled={currentTab === tabOrder[0]}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${
                      currentTab === tabOrder[0]
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    <FaArrowLeft className="mr-2" /> Previous
                  </button>
                  {currentTab !== "navigation" && (
                    <button
                      onClick={goToNextTab}
                      className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium flex items-center"
                    >
                      Next <FaArrowRight className="ml-2" />
                    </button>
                  )}
                </div>
              )}

              {/* Comments Section - Only show in Navigation tab */}
              {currentTab === "navigation" && activeTab === "pending" && (
                <div className="md:w-full space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Comment
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Add your comments here..."
                    rows={2}
                  ></textarea>

                  <div className="flex justify-between mt-4">
                    {/* Previous Button - Aligned Left */}
                    <button
                      onClick={goToPreviousTab}
                      disabled={currentTab === tabOrder[0]}
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${
                        currentTab === tabOrder[0]
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                    >
                      <FaArrowLeft className="mr-2" /> Previous
                    </button>

                    {/* Approve & Reject Buttons - Aligned Right */}
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleReject(request)}
                        className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium flex items-center"
                      >
                        <FaTimes className="mr-2" /> Reject
                      </button>
                      <button
                        onClick={() => handleApprove(request)}
                        className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium flex items-center"
                      >
                        <FaCheck className="mr-2" /> Approve
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// In the ImageViewerModal component
const ImageViewerModal = ({ images, isOpen, onClose, itemName }) => {
  const [imageUrls, setImageUrls] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images && images.length > 0) {
      Promise.all(
        images.slice(0, 5).map((image) => getImageUrl(image.path))
      ).then((urls) => {
        setImageUrls(urls.filter((url) => url !== null));
      });
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
          <div className="h-80 md:h-96 overflow-hidden relative bg-black">
            {imageUrls.length > 0 && (
              <img
                src={imageUrls[activeIndex]}
                alt={`${itemName} ${activeIndex + 1}`}
                className="w-full h-full object-contain"
              />
            )}

            {/* Navigation arrows */}
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

            {/* Image counter */}
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {activeIndex + 1} / {imageUrls.length}
            </div>
          </div>

          {/* Header with close button */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">{itemName}</h3>
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
        <div className="p-4 flex justify-center gap-2 bg-gray-900">
          {imageUrls.map((url, index) => (
            <div
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-16 h-16 rounded-lg overflow-hidden cursor-pointer transition-all transform hover:scale-105 ${
                index === activeIndex
                  ? "ring-2 ring-blue-500 scale-105"
                  : "opacity-70"
              }`}
            >
              <img
                src={url}
                alt={`${itemName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Receive;

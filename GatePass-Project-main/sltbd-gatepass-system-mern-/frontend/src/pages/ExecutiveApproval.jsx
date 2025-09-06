import { useState, useEffect } from 'react';
import { createStatus, getPendingStatuses, getApprovedStatuses, getRejectedStatuses, approveStatus, rejectStatus, searchUserByServiceNo } from '../services/ApproveService.js';
import { getImageUrl, searchReceiverByServiceNo, getGatePassRequest } from '../services/requestService.js';
import { useToast } from '../components/ToastProvider.jsx';
import { emailSent } from '../services/emailService.js';
import { FaSearch } from 'react-icons/fa';
import { jsPDF } from "jspdf";
import logoUrl from '../assets/SLTMobitel_Logo.png';
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
  FaTruck,
  FaFilePdf,
  FaBoxes,
  FaHardHat,
  FaBuilding,
  FaUserFriends,
  FaArrowLeft,
  FaArrowRight,
  FaCheck
} from 'react-icons/fa';

const ExecutiveApproval = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [comment, setComment] = useState('');
  const [pendingItems, setPendingItems] = useState([]);
  const [approvedItems, setApprovedItems] = useState([]);
  const [rejectedItems, setRejectedItems] = useState([]);
  const [transportData, setTransportData] = useState(null);
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));
  console.log("User:", user);

  const [staffType, setStaffType] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [searchedEmployee, setSearchedEmployee] = useState(null);
  const [nonSltStaffDetails, setNonSltStaffDetails] = useState({
    name: '',
    companyName: '',
    nic: '',
    contactNo: '',
    email: ''
  });


  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPendingStatuses(user.serviceNo);
        // Process each status with async operations
        const formattedData = await Promise.all(data.map(async (status) => {
          const senderServiceNo = status.request?.employeeServiceNo;
          const receiverServiceNo = status.request?.receiverServiceNo;
          const transportData = status.request?.transport;
          let senderDetails = null; // Default name

          // Only fetch user name if serviceNo exists
          if (senderServiceNo) {
            try {
              const userData = await searchUserByServiceNo(senderServiceNo);
              senderDetails = userData;
            } catch (error) {
              console.error(`Error fetching user for service number ${senderServiceNo}:`, error);
            }
          }

          let receiverDetails = null;

          if (receiverServiceNo) {
            try {
              const userData = await searchUserByServiceNo(receiverServiceNo);
              if (userData) {
                receiverDetails = userData;
                //console.log("Receiver Details", receiverDetails);
              }
            } catch (error) {
              console.error(`Error fetching user for service number ${receiverServiceNo}:`, error);
            }
          }



          return {
            refNo: status.referenceNumber,
            senderDetails: senderDetails,
            receiverDetails: receiverDetails,
            transportData: transportData,
            inLocation: status.request?.inLocation,
            outLocation: status.request?.outLocation,
            createdAt: new Date(status.createdAt).toLocaleString(),
            items: status.request?.items || [],
            comment: comment,
            requestDetails: { ...status.request },
          };
        }));

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
        //console.log("Approved Data", data);

        // Process each status with async operations
        const formattedData = await Promise.all(data.map(async (status) => {
          const senderServiceNo = status.request?.employeeServiceNo;
          const receiverServiceNo = status.request?.receiverServiceNo;
          const transportData = status.request?.transport;
          let senderDetails = null; // Default name

          // Only fetch user name if serviceNo exists
          if (senderServiceNo) {
            try {
              const userData = await searchUserByServiceNo(senderServiceNo);
              senderDetails = userData;
            } catch (error) {
              console.error(`Error fetching user for service number ${senderServiceNo}:`, error);
            }
          }

          let receiverDetails = null;

          if (receiverServiceNo) {
            try {
              const userData = await searchUserByServiceNo(receiverServiceNo);
              if (userData) {
                receiverDetails = userData;
                // console.log("Receiver Details", receiverDetails);
              }
            } catch (error) {
              console.error(`Error fetching user for service number ${receiverServiceNo}:`, error);
            }
          }



          return {
            refNo: status.referenceNumber,
            senderDetails: senderDetails,
            receiverDetails: receiverDetails,
            transportData: transportData,
            inLocation: status.request?.inLocation,
            outLocation: status.request?.outLocation,
            createdAt: new Date(status.createdAt).toLocaleString(),
            items: status.request?.items || [],
            comment: status.executiveOfficerComment,
            requestDetails: { ...status.request },
          };
        }));
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
        const formattedData = await Promise.all(data.map(async (status) => {
          const senderServiceNo = status.request?.employeeServiceNo;
          const receiverServiceNo = status.request?.receiverServiceNo;
          const transportData = status.request?.transport;
          let senderDetails = null; // Default name

          // Only fetch user name if serviceNo exists
          if (senderServiceNo) {
            try {
              const userData = await searchUserByServiceNo(senderServiceNo);
              senderDetails = userData;
            } catch (error) {
              console.error(`Error fetching user for service number ${senderServiceNo}:`, error);
            }
          }

          let receiverDetails = null;

          if (receiverServiceNo) {
            try {
              const userData = await searchUserByServiceNo(receiverServiceNo);
              if (userData) {
                receiverDetails = userData;
                // console.log("Receiver Details", receiverDetails);
              }
            } catch (error) {
              console.error(`Error fetching user for service number ${receiverServiceNo}:`, error);
            }
          }



          return {
            refNo: status.referenceNumber,
            senderDetails: senderDetails,
            receiverDetails: receiverDetails,
            transportData: transportData,
            inLocation: status.request?.inLocation,
            outLocation: status.request?.outLocation,
            createdAt: new Date(status.createdAt).toLocaleString(),
            items: status.request?.items || [],
            comment: status.executiveOfficerComment,
            requestDetails: { ...status.request },
          };
        }));

        setRejectedItems(formattedData);



      } catch (error) {
        console.error("Error fetching pending statuses:", error);
      }
    };
    fetchData();
  }, [activeTab]);






  const StatusPill = ({ status }) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800',
      approved: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-rose-100 text-rose-800'
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };


  const handleApprove = async (item) => {
    try {
      let loadingDetails = null;

      if (item.outLocation !== "Colombo - Head Office") {
        if (!staffType) {
          showToast('Please select staff type', 'error');
          return;
        }

        if (staffType === 'SLT' && !searchedEmployee) {
          showToast('Please search and select an SLT employee', 'error');
          return;
        }

        if (staffType === 'Non-SLT' && !nonSltStaffDetails.name) {
          showToast('Please fill in non-SLT staff details', 'error');
          return;
        }

        loadingDetails = {
          staffType: staffType,
          loadingLocation: item.outLocation,
          ...(staffType === 'SLT' ? {
            staffServiceNo: searchedEmployee.serviceNo,
          } : {
            nonSLTStaffName: nonSltStaffDetails.name,
            nonSLTStaffCompany: nonSltStaffDetails.companyName,
            nonSLTStaffNIC: nonSltStaffDetails.nic,
            nonSLTStaffContact: nonSltStaffDetails.contactNo,
            nonSLTStaffEmail: nonSltStaffDetails.email,
          })
        };
      }
      // Call API to approve status with comment
      const updatedStatus = await approveStatus(item.refNo, comment, item.outLocation, loadingDetails);

      // Format the approved item in the same structure as your UI expects
      const approvedItem = {
        refNo: updatedStatus.referenceNumber,
        name: updatedStatus.request?.name,
        inLocation: updatedStatus.request?.inLocation,
        outLocation: updatedStatus.request?.outLocation,
        createdAt: new Date(updatedStatus.createdAt).toLocaleString(),
        items: updatedStatus.request?.items || [],
        comment: updatedStatus.executiveOfficerComment,
        requestDetails: { ...updatedStatus.request },
      };


      // Update UI state
      setPendingItems(pendingItems.filter(i => i.refNo !== item.refNo));
      setApprovedItems([...approvedItems, approvedItem]);

      // Reset modal and comment
      setShowModal(false);
      setComment('');
    } catch (error) {
      console.log(error)
      console.error("Error approving status:", error.message);
    }
  };



  // Add this function inside the ExecutiveApproval component
  const sendRejectionEmail = async (request, comment) => {
    console.log("Request:", request);
    try {
      if (!request.senderDetails?.email) {
        showToast('Sender email not available', 'error');
        return;
      }

      const emailSubject = `Gate Pass Request ${request.refNo} - Rejected`;

      // Create a professional email body with HTML formatting
      const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #d32f2f; margin-bottom: 5px;">Gate Pass Request Rejected</h2>
          <p style="color: #757575; font-size: 14px;">Reference Number: ${request.refNo}</p>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 4px;">
          <p>Dear ${request.senderDetails.name},</p>
          <p>We regret to inform you that your gate pass request has been <strong>rejected</strong> by the executive approver.</p>
          
          <div style="margin-top: 15px;">
            <p><strong>Reason for Rejection:</strong></p>
            <p style="padding: 10px; background-color: #fff; border-left: 3px solid #d32f2f; margin-top: 5px;">${comment}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #424242; font-size: 16px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">Request Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #757575; width: 40%;">From Location:</td>
              <td style="padding: 8px 0;">${request.outLocation}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #757575;">To Location:</td>
              <td style="padding: 8px 0;">${request.inLocation}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #757575;">Items:</td>
              <td style="padding: 8px 0;">${request.items.map(item => `${item.itemName} (${item.serialNo})`).join(', ')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #757575;">Requested Date:</td>
              <td style="padding: 8px 0;">${new Date(request.createdAt).toLocaleDateString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p>You may submit a new request with the necessary corrections or contact the approver for more information.</p>
          <p>If you believe this rejection was made in error, please contact the IT support team.</p>
        </div>
        
        <div style="font-size: 12px; color: #757575; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
          <p>This is an automated email from the SLT Gate Pass Management System. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Sri Lanka Telecom. All rights reserved.</p>
        </div>
      </div>
    `;

      // Send the email
      await emailSent({
        to: request.senderDetails.email,
        subject: emailSubject,
        html: emailBody
      });

      showToast('Rejection notification email sent to requester', 'success');
    } catch (error) {
      console.error('Failed to send rejection email:', error);
      showToast('Failed to send rejection email', 'error');
    }
  };



  const handleReject = async (item) => {
    try {

      if (!comment || comment.trim() === '') {
        showToast('Comment is required to reject the item.', 'warning');
        return;
      }

      // Call API to reject status with comment
      const updatedStatus = await rejectStatus(item.refNo, comment);

      // Send rejection email to the requester
      await sendRejectionEmail(item, comment);

      // Format the rejected item in the same structure as your UI expects
      const rejectedItem = {
        refNo: updatedStatus.referenceNumber,
        name: updatedStatus.request?.name,
        inLocation: updatedStatus.request?.inLocation,
        outLocation: updatedStatus.request?.outLocation,
        createdAt: new Date(updatedStatus.createdAt).toLocaleString(),
        items: updatedStatus.request?.items || [],
        comment: updatedStatus.executiveOfficerComment,
        requestDetails: { ...updatedStatus.request },
      };

      // Update UI state
      setPendingItems(pendingItems.filter(i => i.refNo !== item.refNo));
      setRejectedItems([...rejectedItems, rejectedItem]);

      // Reset modal and comment
      setShowModal(false);
      setComment('');
    } catch (error) {
      console.error("Error rejecting status:", error.message);
    }
  };

  const handleModelOpen = async (item) => {
    setSelectedItem(item);

    //console.log("Selected Item:", item);

    if (item.requestDetails?.transport.transporterServiceNo) {
      try {
        const transport = await searchReceiverByServiceNo(item.requestDetails.transport.transporterServiceNo);
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

  const filteredPendingItems = pendingItems.filter(item =>
    item.refNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.senderDetails?.name && item.senderDetails.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredApprovedItems = approvedItems.filter(item =>
    item.refNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.senderDetails?.name && item.senderDetails.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredRejectedItems = rejectedItems.filter(item =>
    item.refNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.senderDetails?.name && item.senderDetails.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gate Pass Approvals</h1>
        <p className="text-gray-500 flex items-center">
          <FaInfoCircle className="mr-2 text-blue-500" />
          Manage and review all gate pass requests
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Pending Card */}
        <div
          onClick={() => setActiveTab('pending')}
          className={`rounded-2xl shadow-lg overflow-hidden transition-all cursor-pointer ${activeTab === 'pending'
            ? 'bg-gradient-to-br from-amber-500 to-orange-500 transform scale-105'
            : 'bg-white hover:shadow-xl'
            }`}
        >
          <div className={`p-6 flex flex-col items-center ${activeTab === 'pending' ? 'text-white' : 'text-gray-700'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${activeTab === 'pending' ? 'bg-white/20' : 'bg-amber-100'
              }`}>
              <FaClock className={activeTab === 'pending' ? 'text-white text-2xl' : 'text-amber-500 text-2xl'} />
            </div>
            <h3 className="text-xl font-semibold mb-1">Pending</h3>
            <div className={`text-3xl font-bold ${activeTab === 'pending' ? 'text-white' : 'text-amber-500'}`}>
              {pendingItems.length}
            </div>
            <p className={activeTab === 'pending' ? 'text-white/80 mt-2 text-sm' : 'text-gray-500 mt-2 text-sm'}>
              Awaiting your review
            </p>
          </div>
        </div>

        {/* Approved Card */}
        <div
          onClick={() => setActiveTab('approved')}
          className={`rounded-2xl shadow-lg overflow-hidden transition-all cursor-pointer ${activeTab === 'approved'
            ? 'bg-gradient-to-br from-emerald-500 to-green-500 transform scale-105'
            : 'bg-white hover:shadow-xl'
            }`}
        >
          <div className={`p-6 flex flex-col items-center ${activeTab === 'approved' ? 'text-white' : 'text-gray-700'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${activeTab === 'approved' ? 'bg-white/20' : 'bg-emerald-100'
              }`}>
              <FaCheckCircle className={activeTab === 'approved' ? 'text-white text-2xl' : 'text-emerald-500 text-2xl'} />
            </div>
            <h3 className="text-xl font-semibold mb-1">Approved</h3>
            <div className={`text-3xl font-bold ${activeTab === 'approved' ? 'text-white' : 'text-emerald-500'}`}>
              {approvedItems.length}
            </div>
            <p className={activeTab === 'approved' ? 'text-white/80 mt-2 text-sm' : 'text-gray-500 mt-2 text-sm'}>
              Successfully processed
            </p>
          </div>
        </div>

        {/* Rejected Card */}
        <div
          onClick={() => setActiveTab('rejected')}
          className={`rounded-2xl shadow-lg overflow-hidden transition-all cursor-pointer ${activeTab === 'rejected'
            ? 'bg-gradient-to-br from-rose-500 to-red-500 transform scale-105'
            : 'bg-white hover:shadow-xl'
            }`}
        >
          <div className={`p-6 flex flex-col items-center ${activeTab === 'rejected' ? 'text-white' : 'text-gray-700'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${activeTab === 'rejected' ? 'bg-white/20' : 'bg-rose-100'
              }`}>
              <FaTimesCircle className={activeTab === 'rejected' ? 'text-white text-2xl' : 'text-rose-500 text-2xl'} />
            </div>
            <h3 className="text-xl font-semibold mb-1">Rejected</h3>
            <div className={`text-3xl font-bold ${activeTab === 'rejected' ? 'text-white' : 'text-rose-500'}`}>
              {rejectedItems.length}
            </div>
            <p className={activeTab === 'rejected' ? 'text-white/80 mt-2 text-sm' : 'text-gray-500 mt-2 text-sm'}>
              Declined requests
            </p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
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
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            {activeTab === 'pending' && <FaClock className="mr-2 text-amber-500" />}
            {activeTab === 'approved' && <FaCheckCircle className="mr-2 text-emerald-500" />}
            {activeTab === 'rejected' && <FaTimesCircle className="mr-2 text-rose-500" />}
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Gate Passes
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Ref No</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Entry Point</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Exit Point</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(activeTab === 'pending' ? filteredPendingItems :
                activeTab === 'approved' ? filteredApprovedItems :
                  filteredRejectedItems).map((item) => (
                    <tr key={item.refNo} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.refNo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.senderDetails?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.inLocation}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.outLocation}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.createdAt}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => {
                            //setSelectedItem(item);
                            handleModelOpen(item);
                            //setShowModal(true);
                          }}
                          className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
                                                ${activeTab === 'pending'
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                              : activeTab === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
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
        {(activeTab === 'pending' ? filteredPendingItems :
          activeTab === 'approved' ? filteredApprovedItems :
            filteredRejectedItems).length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FaBoxOpen className="text-4xl text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">No requests found</p>
              <p className="text-gray-400 text-sm">{searchTerm ? 'Try adjusting your search criteria' : 'Your gate pass requests will appear here'}</p>
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
        setStaffType={setStaffType}
        setServiceId={setServiceId}
        staffType={staffType}
        serviceId={serviceId}
        searchedEmployee={searchedEmployee}
        setSearchedEmployee={setSearchedEmployee}
        showToast={showToast}
        nonSltStaffDetails={nonSltStaffDetails}
        setNonSltStaffDetails={setNonSltStaffDetails}
      // user={user}
      // receiver={receiver}
      />
    </div>

  );
};

const RequestDetailsModal = ({ isOpen, onClose, request, user, receiver, activeTab, comment, setComment, handleApprove, handleReject, transporterDetails, setStaffType, setServiceId, staffType, serviceId, searchedEmployee, setSearchedEmployee, showToast, nonSltStaffDetails, setNonSltStaffDetails }) => {
  console.log("Request", request);
  //console.log("transporterDetails", transporterDetails)
  // Initialize with the correct value from request
  const [selectedExecutive, setSelectedExecutive] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedItemImages, setSelectedItemImages] = useState([]);
  const [selectedItemName, setSelectedItemName] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const tabOrder = request?.outLocation !== "Colombo - Head Office"
    ? ['details', 'loading', 'navigation']
    : ['details', 'navigation'];

  // Add currentTab state and navigation functions
  const [currentTab, setCurrentTab] = useState('details');
  const VerifyStatus = true;


  if (!isOpen || !request) return null;

  const handleViewImages = (item) => {
    setSelectedItemImages(item.itemPhotos);
    setSelectedItemName(item.itemName);
    setIsImageModalOpen(true);
  };

  const generateItemDetailsPDF = (items, refNo) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Add SLT logo
    try {
      doc.addImage(logoUrl, 'PNG', margin, 10, 40, 20);
    } catch (error) {
      console.error("Error adding logo:", error);
    }

    // Header
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 153); // SLT blue color
    doc.text("SLT Gate Pass - Item Details", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Reference: ${refNo}`, pageWidth / 2, 30, { align: "center" });

    // Add current date
    const currentDate = new Date().toLocaleDateString();
    doc.setFontSize(10);
    doc.text(`Generated on: ${currentDate}`, pageWidth - margin, 20, { align: "right" });

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
    doc.rect(margin, yPos, col1Width + col2Width + col3Width + col4Width + col5Width, 8, 'F');

    doc.text("Item Name", margin + 3, yPos + 5.5);
    doc.text("Serial No", margin + col1Width + 3, yPos + 5.5);
    doc.text("Category", margin + col1Width + col2Width + 3, yPos + 5.5);
    doc.text("Qty", margin + col1Width + col2Width + col3Width + 3, yPos + 5.5);
    doc.text("Status", margin + col1Width + col2Width + col3Width + col4Width + 3, yPos + 5.5);

    yPos += 8;

    // Draw table content
    items.forEach((item, index) => {
      if (yPos > 270) {
        // Add new page if content exceeds page height
        doc.addPage();
        yPos = 20;

        // Add table header on new page
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPos, col1Width + col2Width + col3Width + col4Width + col5Width, 8, 'F');

        doc.text("Item Name", margin + 3, yPos + 5.5);
        doc.text("Serial No", margin + col1Width + 3, yPos + 5.5);
        doc.text("Category", margin + col1Width + col2Width + 3, yPos + 5.5);
        doc.text("Qty", margin + col1Width + col2Width + col3Width + 3, yPos + 5.5);
        doc.text("Status", margin + col1Width + col2Width + col3Width + col4Width + 3, yPos + 5.5);

        yPos += 8;
      }

      // Alternate row colors for better readability
      if (index % 2 === 1) {
        doc.setFillColor(248, 248, 248);
        doc.rect(margin, yPos, col1Width + col2Width + col3Width + col4Width + col5Width, 8, 'F');
      }

      // Truncate long text to fit in columns
      const truncateText = (text, maxLength) => {
        if (!text) return 'N/A';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
      };

      doc.text(truncateText(item?.itemName || 'N/A', 25), margin + 3, yPos + 5.5);
      doc.text(truncateText(item?.serialNo || 'N/A', 15), margin + col1Width + 3, yPos + 5.5);
      doc.text(truncateText(item?.itemCategory || 'N/A', 12), margin + col1Width + col2Width + 3, yPos + 5.5);
      doc.text(item?.itemQuantity?.toString() || '1', margin + col1Width + col2Width + col3Width + 3, yPos + 5.5);
      doc.text(item?.itemReturnable ? 'Returnable' : 'Non-Returnable',
        margin + col1Width + col2Width + col3Width + col4Width + 3, yPos + 5.5);

      // Draw horizontal line after each row
      doc.line(margin, yPos + 8, margin + col1Width + col2Width + col3Width + col4Width + col5Width, yPos + 8);

      yPos += 8;
    });

    // Footer
    const footerYPos = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("This is an electronically generated document and does not require signature.", pageWidth / 2, footerYPos, { align: "center" });

    // Save the PDF
    doc.save(`SLT_GatePass_Items_${refNo}.pdf`);
  };

  const handleEmployeeSearch = async () => {
    if (!serviceId.trim()) {
      showToast('Please enter a service number', 'warning');
      return;
    }

    try {
      setSearchedEmployee(null); // Reset previous results

      const userData = await searchUserByServiceNo(serviceId);
      if (userData) {
        setSearchedEmployee(userData);
        showToast('Employee found', 'success');
      } else {
        showToast('No employee found with that service number', 'error');
      }
    } catch (error) {
      console.error('Error searching for employee:', error);
      showToast('Error searching for employee', 'error');
    }
  };

  const handleClose = () => {
    setCurrentTab('details');
    onClose();
  };




  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full flex flex-col h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        {/* <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-3 pl-6 pr-6 flex-shrink-0"> */}
        <div
          className={`p-3 pl-6 pr-6 flex-shrink-0 ${activeTab === "pending"
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
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
          <div className="mt-2 text-blue-100">Reference: {request.refNo}</div>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors flex items-center ${currentTab === 'details'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setCurrentTab('details')}
          >
            <FaInfoCircle className="mr-2" /> Request Details
          </button>

          {request?.outLocation !== "Colombo - Head Office" && (
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors flex items-center ${currentTab === 'loading'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setCurrentTab('loading')}
            >
              <FaBoxes className="mr-2" /> Loading Details
            </button>
          )}


        </div>

        {/* Main Content - Make this scrollable */}
        <div className="flex-grow overflow-y-auto p-6">
          {/* Sender Details */}
          {currentTab === 'details' && (
            <>
              <div className='bg-gray-50 rounded-xl p-6 mb-6'>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                  <FaUser className="mr-2" /> Sender Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Service No</label>
                    <p className="text-gray-800">{request.senderDetails?.serviceNo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-gray-800">{request.senderDetails?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Section</label>
                    <p className="text-gray-800">{request.senderDetails?.section}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Group</label>
                    <p className="text-gray-800">{request.senderDetails?.group}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Designation</label>
                    <p className="text-gray-800">{request.senderDetails?.designation}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Contact</label>
                    <p className="text-gray-800">{request.senderDetails?.contactNo}</p>
                  </div>
                </div>
              </div>


              {/* Items Table */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                  <FaBoxOpen className="mr-2" /> Item Details
                  <button
                    onClick={() => generateItemDetailsPDF(request.items, request.refNo)}
                    className="ml-auto px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center transition-colors"
                  >
                    <FaFilePdf className="mr-2" /> Download Items PDF
                  </button>
                </h3>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th> */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
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
                      <label className="text-sm font-medium text-gray-600">Out Location</label>
                      <p className="text-gray-800">{request?.outLocation}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">In Location</label>
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
                        <label className="text-sm font-medium text-gray-600">Name</label>
                        <p className="text-gray-800">{request.receiverDetails?.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Group</label>
                        <p className="text-gray-800">{request.receiverDetails?.group}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Service No</label>
                        <p className="text-gray-800">{request.receiverDetails?.serviceNo}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Contact</label>
                        <p className="text-gray-800">{request.receiverDetails?.contactNo}</p>
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

              {/* Transport Details Section - Add this new section */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                  <FaTruck className="mr-2" /> Transport Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Transport Method</label>
                    <p className="text-gray-800">{request?.requestDetails?.transport.transportMethod || 'N/A'}</p>
                  </div>

                  {request.requestDetails?.transport.transportMethod === 'Vehicle' && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Transporter Type</label>
                        <p className="text-gray-800">{request?.requestDetails?.transport.transporterType || 'N/A'}</p>
                      </div>

                      {request?.requestDetails?.transport.transporterType === 'SLT' ? (
                        <>
                          {/* <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">SLT Transporter</label>
                                <p className="text-gray-800">
                                  {transporterDetails?.name || 'N/A'} 
                                  {request?.transporterServiceNo ? ` (${request.transporterServiceNo})` : ''}
                                </p>
                              </div> */}

                          <div>
                            <label className="text-sm font-medium text-gray-600">Service No</label>
                            <p className="text-gray-800">{request?.requestDetails?.transport.transporterServiceNo || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Name</label>
                            <p className="text-gray-800">{transporterDetails?.name || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Section</label>
                            <p className="text-gray-800">{transporterDetails?.section || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Group</label>
                            <p className="text-gray-800">{transporterDetails?.group || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Designation</label>
                            <p className="text-gray-800">{transporterDetails?.designation || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Contact</label>
                            <p className="text-gray-800">{transporterDetails?.contactNo || 'N/A'}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Transporter Name</label>
                            <p className="text-gray-800">{request?.requestDetails?.transport.nonSLTTransporterName || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Transporter NIC</label>
                            <p className="text-gray-800">{request?.requestDetails?.transport.nonSLTTransporterNIC || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Transporter Phone</label>
                            <p className="text-gray-800">{request?.requestDetails?.transport.nonSLTTransporterPhone || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Transporter Email</label>
                            <p className="text-gray-800">{request?.requestDetails?.transport.nonSLTTransporterEmail || 'N/A'}</p>
                          </div>
                        </>
                      )}

                      <div>
                        <label className="text-sm font-medium text-gray-600">Vehicle Number</label>
                        <p className="text-gray-800">{request?.requestDetails?.transport.vehicleNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Vehicle Model</label>
                        <p className="text-gray-800">{request?.requestDetails?.transport.vehicleModel || 'N/A'}</p>
                      </div>
                    </>
                  )}
                  {request?.requestDetails?.transport.transportMethod === 'By Hand' && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Transporter Type</label>
                        <p className="text-gray-800">{request?.requestDetails?.transport.transporterType || 'N/A'}</p>
                      </div>

                      {request?.requestDetails?.transport.transporterType === 'SLT' ? (
                        <>
                          {/* <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">SLT Transporter</label>
                                <p className="text-gray-800">
                                  {transporterDetails?.name || 'N/A'} 
                                  {request?.transporterServiceNo ? ` (${request.transporterServiceNo})` : ''}
                                </p>
                              </div> */}
                          <div>
                            <label className="text-sm font-medium text-gray-600">Service No</label>
                            <p className="text-gray-800">{request?.requestDetails?.transport.transporterServiceNo || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Name</label>
                            <p className="text-gray-800">{transporterDetails?.name || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Section</label>
                            <p className="text-gray-800">{transporterDetails?.section || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Group</label>
                            <p className="text-gray-800">{transporterDetails?.group || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Designation</label>
                            <p className="text-gray-800">{transporterDetails?.designation || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Contact</label>
                            <p className="text-gray-800">{transporterDetails?.contactNo || 'N/A'}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Transporter Name</label>
                            <p className="text-gray-800">{request?.requestDetails?.transport.nonSLTTransporterName || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Transporter NIC</label>
                            <p className="text-gray-800">{request?.requestDetails?.transport.nonSLTTransporterNIC || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Transporter Phone</label>
                            <p className="text-gray-800">{request?.requestDetails?.transport.nonSLTTransporterPhone || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Transporter Email</label>
                            <p className="text-gray-800">{request?.requestDetails?.transport.nonSLTTransporterEmail || 'N/A'}</p>
                          </div>
                        </>
                      )}


                    </>
                  )}
                </div>
              </div>
            </>
          )}




          {currentTab === 'loading' && activeTab === 'pending' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                  <FaHardHat className="mr-2" />
                  {VerifyStatus ? "Verification Details" : "Verification Details"}
                </h3>

                {/* Toggle between SLT and Non-SLT */}
                <div className="flex space-x-4 mb-6">
                  <button
                    className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center ${staffType === 'slt'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    onClick={() => setStaffType('SLT')}
                  >
                    <FaBuilding className="mr-2" /> SLT Employee
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center ${staffType === 'non-slt'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    onClick={() => setStaffType('Non-SLT')}
                  >
                    <FaUserFriends className="mr-2" /> Non-SLT Employee
                  </button>
                </div>

                {staffType === 'SLT' ? (
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
                              <label className="text-sm font-medium text-gray-600">Name</label>
                              <p className="text-gray-800">{searchedEmployee.name}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Service No</label>
                              <p className="text-gray-800">{searchedEmployee.serviceNo}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Email</label>
                              <p className="text-gray-800">{searchedEmployee.email}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Section</label>
                              <p className="text-gray-800">{searchedEmployee.section}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Branch</label>
                              <p className="text-gray-800">{searchedEmployee.branch}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Contact</label>
                              <p className="text-gray-800">{searchedEmployee.contactNo}</p>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={nonSltStaffDetails.name}
                          onChange={(e) => setNonSltStaffDetails({ ...nonSltStaffDetails, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                        <input
                          type="text"
                          value={nonSltStaffDetails.companyName}
                          onChange={(e) => setNonSltStaffDetails({ ...nonSltStaffDetails, companyName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter company name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">NIC</label>
                        <input
                          type="text"
                          value={nonSltStaffDetails.nic}
                          onChange={(e) => setNonSltStaffDetails({ ...nonSltStaffDetails, nic: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter NIC"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                        <input
                          type="text"
                          value={nonSltStaffDetails.contactNo}
                          onChange={(e) => setNonSltStaffDetails({ ...nonSltStaffDetails, contactNo: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter contact number"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={nonSltStaffDetails.email}
                          onChange={(e) => setNonSltStaffDetails({ ...nonSltStaffDetails, email: e.target.value })}
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

          {currentTab === 'loading' && activeTab !== 'pending' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Request Summary</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Reference: {request.refNo}</li>
                    <li>Sender: {request.senderDetails?.name}</li>
                    <li>Items: {request.items.length}</li>
                    <li>From: {request.outLocation}</li>
                    <li>To: {request.inLocation}</li>
                  </ul>
                </div>
                
                


                {request?.requestDetails?.loading?.staffType === 'Non-SLT' && (
                  <>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Loading Information</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        <li>Staff Type: {request?.requestDetails?.loading.staffType || 'Not specified'}</li>
                        <li>Name: {request?.requestDetails?.loading.nonSLTStaffName || 'Not specified'}</li>
                        <li>Nic: {request?.requestDetails?.loading.nonSLTStaffNIC || 'Not specified'}</li>
                        <li>Enail: {request?.requestDetails?.loading.nonSLTStaffEmail || 'Not specified'}</li>
                        <li>Contact: {request?.requestDetails?.loading.nonSLTStaffContact || 'Not specified'}</li>
                        <li>Company: {request?.requestDetails?.loading.nonSLTStaffCompany || 'Not specified'}</li>
                        <li>Time: {new Date(request?.requestDetails?.loading.loadingTime).toLocaleString() || 'Not specified'}</li>
                        <li>Loading Location: {request?.requestDetails?.loading.loadingLocation || 'Not specified'}</li>
                      </ul>
                    </div>
                  </>
                )}

                {request?.requestDetails?.loading?.staffType === 'SLT' && (
                  <>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Loading Information</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        <li>Staff Type: {request?.requestDetails?.loading.staffType || 'Not specified'}</li>
                        <li>Service No: {transporterDetails?.serviceNo || 'Not specified'}</li>
                        <li>Name: {transporterDetails?.name || 'Not specified'}</li>
                        <li>Section: {transporterDetails?.section || 'Not specified'}</li>
                        <li>Group: {transporterDetails?.group || 'Not specified'}</li>
                        <li>Designation: {transporterDetails?.designation || 'Not specified'}</li>
                        <li>Contact: {transporterDetails?.contactNo || 'Not specified'}</li>
                      </ul>
                    </div>
                  </>
                )}


              </div>
              
            </div>
          )}
        </div>

        {/* Fixed bottom section for comments and buttons */}
        <div className="flex-shrink-0">
          <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Previous/Next Buttons */}


              {/* Comments Section - Only show in Navigation tab */}
              {activeTab === 'pending' && (
                <div className="md:w-full space-y-2">
                  <label className="text-sm font-medium text-gray-700">Comment</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Add your comments here..."
                    rows={2}
                  ></textarea>

                  <div className="flex justify-between mt-4">
                    {/* Previous Button - Aligned Left */}


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


              {activeTab != 'pending' && (
                <div className="border-t border-gray-200 bg-white">
                  {/* Comment Display Section */}
                  {request.comment && request.comment.length > 0 && (
                    <div className="mb-3 mt-3 mr-6 ml-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Previous Comments</h3>

                      <div className="max-h-35 overflow-y-auto mb-3">

                        <div className="mb-2 p-2 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-700" style={{ marginRight: '665px' }}>{request.comment}</span>
                            <span className="text-sm font-medium text-gray-500">{new Date(request.createdAt).toLocaleDateString()}</span>
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
        images.slice(0, 5).map(image => getImageUrl(image.path))
      ).then(urls => {
        setImageUrls(urls.filter(url => url !== null));
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
              className={`w-16 h-16 rounded-lg overflow-hidden cursor-pointer transition-all transform hover:scale-105 ${index === activeIndex ? 'ring-2 ring-blue-500 scale-105' : 'opacity-70'
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

export default ExecutiveApproval;

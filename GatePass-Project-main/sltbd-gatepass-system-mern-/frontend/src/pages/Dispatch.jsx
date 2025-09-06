import { useState, useEffect } from 'react';
import { createStatus, getPendingStatuses, getApprovedStatuses, getRejectedStatuses, approveStatus, rejectStatus, searchUserByServiceNo } from '../services/DispatchService.js';
import { getImageUrl, searchReceiverByServiceNo } from '../services/requestService.js';
import { jsPDF } from "jspdf";
import { useToast } from '../components/ToastProvider.jsx';
import logoUrl from '../assets/SLTMobitel_Logo.png';
import { emailSent } from '../services/emailService.js';
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
  FaFileDownload,
  FaFilePdf,
  FaPrint
} from 'react-icons/fa';

const Dispatch = () => {
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
  const [user, setUser] = useState(null);

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

        console.log('Data fetched:', data);

        // Filter requests where outLocation matches user's branches
        const filteredData = data.filter(status =>
          user.branches.includes(status.request?.inLocation)
        );

        // Process each status with async operations
        const formattedData = await Promise.all(filteredData.map(async (status) => {
          const senderServiceNo = status.request?.employeeServiceNo;
          const receiverServiceNo = status.request?.receiverServiceNo;
          const transportData = status.request?.transport;
          const loadingDetails = status.request?.loading;
          const statusDetails = status;
          let senderDetails = null;

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
              }
            } catch (error) {
              console.error(`Error fetching user for service number ${receiverServiceNo}:`, error);
            }
          }

          let loadUserData = null;

          if (loadingDetails && loadingDetails.staffType === "SLT") {
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
            statusDetails: statusDetails,
            executiveOfficerData: exerctiveOfficerData,
            verifyOfficerData: verifyOfficerData,
          };
        }));

        setPendingItems(formattedData);
      } catch (error) {
        console.error("Error fetching pending statuses:", error);
      }
    };

    fetchData();
  }, [activeTab, user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getApprovedStatuses();

        const filteredData = data.filter(status =>
          user.branches.includes(status.request?.outLocation)
        );


        // Process each status with async operations
        const formattedData = await Promise.all(filteredData.map(async (status) => {
          const senderServiceNo = status.request?.employeeServiceNo;
          const receiverServiceNo = status.request?.receiverServiceNo;
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
            inLocation: status.request?.inLocation,
            outLocation: status.request?.outLocation,
            createdAt: new Date(status.createdAt).toLocaleString(),
            items: status.request?.items || [],
            comment: status.comment,
            requestDetails: { ...status.request },
          };
        }));
        setApprovedItems(formattedData);


      } catch (error) {
        console.error("Error fetching pending statuses:", error);
      }
    };
    fetchData();
  }, [activeTab, user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getRejectedStatuses();

        const filteredData = data.filter(status =>
          user.branches.includes(status.request?.outLocation)
        );
        // Process each status with async operations
        const formattedData = await Promise.all(filteredData.map(async (status) => {
          const senderServiceNo = status.request?.employeeServiceNo;
          const receiverServiceNo = status.request?.receiverServiceNo;
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
                console.log("Receiver Details", receiverDetails);
              }
            } catch (error) {
              console.error(`Error fetching user for service number ${receiverServiceNo}:`, error);
            }
          }



          return {
            refNo: status.referenceNumber,
            senderDetails: senderDetails,
            receiverDetails: receiverDetails,
            inLocation: status.request?.inLocation,
            outLocation: status.request?.outLocation,
            createdAt: new Date(status.createdAt).toLocaleString(),
            items: status.request?.items || [],
            comment: status.comment,
            requestDetails: { ...status.request },
          };
        }));

        setRejectedItems(formattedData);



      } catch (error) {
        console.error("Error fetching pending statuses:", error);
      }
    };
    fetchData();
  }, [activeTab, user]);






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

  // Add this function to the NewRequest component
  const sendRecieverNotificationEmail = async (receiverData, requestData, referenceNumber) => {
    try {
      if (!receiverData?.email) {
        showToast('Receiver email not available', 'warning');
        return;
      }

      const emailSubject = `Gate Pass Request ${referenceNumber} - Approved`;

      // Create a professional email body with HTML formatting
      const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #3b82f6; margin-bottom: 5px;">Gate Pass Request Approved</h2>
                <p style="color: #757575; font-size: 14px;">Reference Number: ${referenceNumber}</p>
              </div>
              
              <div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 4px;">
                <p>Dear ${receiverData.name},</p>
                <p>A gate pass request has been <strong>approved</strong> and is ready for processing.</p>
                
                <div style="margin-top: 15px;">
                  <p><strong>Request Details:</strong></p>
                  <ul style="padding-left: 20px;">
                    <li>From Location: ${requestData.outLocation}</li>
                    <li>To Location: ${requestData.inLocation}</li>
                    <li>Items: ${requestData.items.length} item(s)</li>
                    <li>Date: ${new Date().toLocaleString()}</li>
                  </ul>
                </div>
              </div>
              
              <div style="margin-bottom: 20px;">
                <h3 style="color: #424242; font-size: 16px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">Item Summary</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr style="background-color: #f5f5f5;">
                    <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0;">Item</th>
                    <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0;">Serial No</th>
                    <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0;">Category</th>
                    <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0;">Status</th>
                  </tr>
                  ${requestData.items.map(item => `
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${item.itemName}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${item.serialNo}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${item.itemCategory}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${item.itemReturnable ? 'Returnable' : 'Non-Returnable'}</td>
                    </tr>
                  `).join('')}
                </table>
              </div>
              
              <div style="margin-bottom: 20px;">
                <p>Please check the Gate Pass Management System for more details.</p>
                <div style="text-align: center; margin-top: 20px;">
                  <a href="${window.location.origin}/receiver" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Details</a>
                </div>
              </div>
              
              <div style="font-size: 12px; color: #757575; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
                <p>This is an automated email from the SLT Gate Pass Management System. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} Sri Lanka Telecom. All rights reserved.</p>
              </div>
            </div>
          `;

      // Send the email - you need to implement this function or use a service
      await emailSent({
        to: receiverData.email,
        subject: emailSubject,
        html: emailBody
      });

      return true;
    } catch (error) {
      console.error('Failed to send notification email:', error);
      return false;
    }
  };


  const handleApprove = async (item) => {
    try {
      // console.log("item", item.refNo);
      // console.log("comment", comment);
      // Call API to approve status with comment
      const updatedStatus = await approveStatus(item.refNo, comment);


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

      //console.log("updated Status", updatedStatus);


      // Update UI state
      setPendingItems(pendingItems.filter(i => i.refNo !== item.refNo));
      setApprovedItems([...approvedItems, approvedItem]);

      // Reset modal and comment
      setShowModal(false);
      setComment('');

      showToast('Approved successfully', 'success');

      try {
        // Find the selected executive officer from the list
        const selectedOfficer = await searchReceiverByServiceNo(updatedStatus.updatedStatus.request.receiverServiceNo);

        if (selectedOfficer) {
          // Send notification email to the executive officer
          await sendRecieverNotificationEmail(selectedOfficer, {
            outLocation: updatedStatus.updatedStatus.request.outLocation,
            inLocation: updatedStatus.updatedStatus.request.inLocation,
            items: updatedStatus.updatedStatus.request.items
          }, updatedStatus.updatedStatus.referenceNumber);

          showToast('Notification email sent to the executive officer.', 'success');
        } else {
          console.error("Selected executive officer not found in the list");
        }
      } catch (emailError) {
        console.error("Error sending notification email:", emailError);
      }

    } catch (error) {
      console.error("Error approving status:", error.message);
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
      setPendingItems(pendingItems.filter(i => i.refNo !== item.refNo));
      setRejectedItems([...rejectedItems, rejectedItem]);

      // Reset modal and comment
      setShowModal(false);
      setComment('');
      showToast('Rejected successfully', 'success');
    } catch (error) {
      showToast('Error rejecting the item.', 'error');
      console.error("Error rejecting status:", error.message);
    }
  };

  const handleModelOpen = async (item) => {
    setSelectedItem(item);



    if (item.requestDetails?.transport.transporterServiceNo) {
      try {
        const transport = await searchReceiverByServiceNo(item.requestDetails?.transport.transporterServiceNo);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome {user?.name || 'Dispatch Officer'}
        </h1>
        <p className="text-gray-500 flex items-center">
          <FaInfoCircle className="mr-2 text-blue-500" />
          View gate pass requests for your assigned branches: {user?.branches?.join(', ') || 'No branches assigned'}
        </p>
      </div>

      {/* Status Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
       
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
      </div> */}

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
            {/* {activeTab === 'pending' && <FaClock className="mr-2 text-amber-500" />}
            {activeTab === 'approved' && <FaCheckCircle className="mr-2 text-emerald-500" />}
            {activeTab === 'rejected' && <FaTimesCircle className="mr-2 text-rose-500" />}
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}  */}
            Gate Passes
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
      // user={user}
      // receiver={receiver}
      />
    </div>

  );
};

const RequestDetailsModal = ({ isOpen, onClose, request, user, receiver, activeTab, comment, setComment, handleApprove, handleReject, transporterDetails }) => {
  //console.log('Request', request);
  //console.log("transporterDetails: ", transporterDetails);
  // Initialize with the correct value from request
  const [selectedExecutive, setSelectedExecutive] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedItemImages, setSelectedItemImages] = useState([]);
  const [selectedItemName, setSelectedItemName] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [currentTab, setCurrentTab] = useState('details');
  const tabOrder = ['details', 'navigation'];
  const DispatchStatus = true;

  // States for loading/unloading details
  const [staffType, setStaffType] = useState('slt');
  const [serviceId, setServiceId] = useState('');
  const [searchedEmployee, setSearchedEmployee] = useState(null);
  const [nonSltStaffDetails, setNonSltStaffDetails] = useState({
    name: '',
    companyName: '',
    nic: '',
    contactNo: '',
    email: ''
  });

  // States for transportation details
  const [transportStaffType, setTransportStaffType] = useState('slt');
  const [transportServiceId, setTransportServiceId] = useState('');
  const [transportEmployee, setTransportEmployee] = useState(null);
  const [nonSltTransportDetails, setNonSltTransportDetails] = useState({
    name: '',
    companyName: '',
    nic: '',
    contactNo: ''
  });
  const [vehicleDetails, setVehicleDetails] = useState({
    vehicleNumber: '',
    vehicleType: ''
  });

  if (!isOpen || !request) return null;

  const handleViewImages = (item) => {
    setSelectedItemImages(item.itemPhotos);
    setSelectedItemName(item.itemName);
    setIsImageModalOpen(true);
  };


  const printReport = (request, transporterDetails, loadingStaff) => {
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
              <h2 class="section-title">Items</h2>
              <table>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Serial No</th>
                    <th>Category</th>
                    <th>Model</th>
                  </tr>
                </thead>
                <tbody>
                  ${request.items.map(item => `
                    <tr>
                      <td>${item?.itemName || '-'}</td>
                      <td>${item?.serialNo || '-'}</td>
                      <td>${item?.itemCategory || '-'}</td>
                      <td>${item?.itemModel || '-'}</td>
                      
                    </tr>
                  `).join('')}
                </tbody>
              </table>
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
    doc.text(`Reference: ${request.refNo}`, pageWidth / 2, 30, { align: "center" });

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
    doc.text("Model", margin + col1Width + col2Width + col3Width + col4Width + 3, yPos + 5.5);

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
        doc.text("Model", margin + col1Width + col2Width + col3Width + col4Width + 3, yPos + 5.5);

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
      doc.text(truncateText(item?.itemModel || 'N/A', 15), margin + col1Width + col2Width + col3Width + col4Width + 3, yPos + 5.5);
      // doc.text(item?.itemReturnable ? 'Returnable' : 'Non-Returnable', 
      //          margin + col1Width + col2Width + col3Width + col4Width + 3, yPos + 5.5);

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
    doc.save(`SLT_GatePass_Items_${request.refNo}.pdf`);
  };

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



  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full flex flex-col h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
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
            className={`px-6 py-3 text-sm font-medium transition-colors flex items-center ${currentTab === 'details'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setCurrentTab('details')}
          >
            <FaInfoCircle className="mr-2" /> Request Details
          </button>
          {activeTab === 'pending' && (
            <>
              {/* <button
                className={`px-6 py-3 text-sm font-medium transition-colors flex items-center ${
                  currentTab === 'loading'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setCurrentTab('loading')}
              >
                <FaBoxes className="mr-2" /> 
                {DispatchStatus ? 'Loading Details' : 'Unloading Details'}
              </button> */}
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
            className={`px-6 py-3 text-sm font-medium transition-colors flex items-center ${currentTab === 'navigation'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setCurrentTab('navigation')}
          >
            <FaCheckCircle className="mr-2" /> Approval
          </button>
        </div>

        {/* Main Content - Make this scrollable */}
        <div className="flex-grow overflow-y-auto p-6">
          {/* Request Details Tab */}
          {currentTab === 'details' && (
            <>
              {/* Sender Details */}
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
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item?.itemReturnable
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



          {/* Navigation/Approval Tab */}
          {currentTab === 'navigation' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                  <FaCheckCircle className="mr-2" /> Approval Information
                </h3>

                {/* Report Generation Card */}
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 shadow-sm">
                  <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="mb-4 md:mb-0">
                      <h4 className="text-lg font-semibold text-blue-800 mb-1">Generate Gate Pass Report</h4>
                      <p className="text-sm text-blue-600">Download a PDF report with all gate pass details</p>
                    </div>
                    <div className="flex space-x-3">
                      {/* <button
                        onClick={() => generatePDF(request, transporterDetails, searchedEmployee)}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center"
                      >
                        <FaFilePdf className="mr-2" /> Download PDF
                      </button> */}
                      <button
                        onClick={() => printReport(request, transporterDetails, searchedEmployee)}
                        className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all flex items-center"
                      >
                        <FaPrint className="mr-2" /> Print
                      </button>
                    </div>
                  </div>
                </div>





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
                    {request?.requestDetails?.transport.transporterType === 'Non-SLT' && (
                      <>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Transport Information</h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            <li>Transport Method: {request?.requestDetails?.transport.transportMethod || 'Not specified'}</li>
                            <li>Transporter Type: {request?.requestDetails?.transport.transporterType || 'Not specified'}</li>
                            <li>Transporter Name: {request?.requestDetails?.transport.nonSLTTransporterName || 'Not specified'}</li>
                            <li>Transporter Contact: {request?.requestDetails?.transport.nonSLTTransporterPhone || 'Not specified'}</li>
                            <li>Email: {request?.requestDetails?.transport.nonSLTTransporterEmail || 'Not specified'}</li>
                            {request?.requestDetails?.transport.transporterType === 'Vehicle' && (
                              <>
                                <li>Vehicle Number: {request?.requestDetails?.transport.vehicleNumber || 'Not specified'}</li>
                                <li>Vehicle Model: {request?.requestDetails?.transport.vehicleModel || 'Not specified'}</li>
                              </>
                            )}



                          </ul>
                        </div>
                      </>
                    )}
                    {request?.requestDetails?.transport.transporterType === 'SLT' && (
                      <>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Transport Information</h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            <li>Transport Method: {request?.requestDetails?.transport.transportMethod || 'Not specified'}</li>
                            <li>Transporter Type: {request?.requestDetails?.transport.transporterType || 'Not specified'}</li>
                            <li>Service No: {transporterDetails?.serviceNo || 'Not specified'}</li>
                            <li>Name: {transporterDetails?.name || 'Not specified'}</li>
                            <li>Section: {transporterDetails?.section || 'Not specified'}</li>
                            <li>Group: {transporterDetails?.group || 'Not specified'}</li>
                            <li>Designation: {transporterDetails?.designation || 'Not specified'}</li>
                            <li>Contact: {transporterDetails?.contactNo || 'Not specified'}</li>
                            {request?.requestDetails?.transport.transporterType === 'Vehicle' && (
                              <>
                                <li>Vehicle Number: {request?.requestDetails?.transport.vehicleNumber || 'Not specified'}</li>
                                <li>Vehicle Model: {request?.requestDetails?.transport.vehicleModel || 'Not specified'}</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </>
                    )}


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
                  {activeTab !== 'pending' && request?.comment && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-2">Comment</h4>
                      <p className="text-gray-600">{request.comment}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>


        <div className="flex-shrink-0">
          <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
            <div className="flex flex-col md:flex-row gap-4">

              {currentTab != 'navigation' && (
                <div className="flex items-center justify-between w-full ">

                  <button
                    onClick={goToPreviousTab}
                    disabled={currentTab === tabOrder[0]}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${currentTab === tabOrder[0]
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                  >
                    <FaArrowLeft className="mr-2" /> Previous
                  </button>
                  {currentTab !== 'navigation' && (
                    <button
                      onClick={goToNextTab}
                      className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium flex items-center"
                    >
                      Next <FaArrowRight className="ml-2" />
                    </button>
                  )}
                </div>
              )}


              {currentTab === 'navigation' && activeTab === 'pending' && (
                <div className="md:w-full space-y-2">
                  {/* <label className="text-sm font-medium text-gray-700">Comment</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Add your comments here..."
                    rows={2}
                  ></textarea> */}



                  <div className="flex justify-between mt-4">
                    <button
                      onClick={goToPreviousTab}
                      disabled={currentTab === tabOrder[0]}
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${currentTab === tabOrder[0]
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                    >
                      <FaArrowLeft className="mr-2" /> Previous
                    </button>


                    {/* <div className="flex space-x-4">
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
                    </div> */}
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

export default Dispatch;

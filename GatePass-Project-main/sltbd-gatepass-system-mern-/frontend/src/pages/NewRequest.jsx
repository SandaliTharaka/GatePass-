import React, { useEffect, useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Package, MapPin, UserCheck, Send, Edit, Trash2, Plus, FileImage, Info } from 'lucide-react';
import { searchSenderByServiceNo, createGatePassRequest, getExecutiveOfficers, searchReceiverByServiceNo, getLocations, getCategories } from '../services/requestService.js';
import { useToast } from '../components/ToastProvider.jsx';
import { emailSent } from '../services/emailService.js';
import { FileSpreadsheet } from 'lucide-react';

const NewRequest = () => {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [inLocation, setInLocation] = useState('');
  const [outLocation, setOutLocation] = useState('');
  const [executiveOfficer, setExecutiveOfficer] = useState('');
  const [isReceiverAvailable, setIsReceiverAvailable] = useState(false);
  const [receiverServiceNo, setReceiverServiceNo] = useState('');
  const [receiverDetails, setReceiverDetails] = useState(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [executiveOfficers, setExecutiveOfficers] = useState([]);
  const [inLocations, setInLocations] = useState([]);
  const [outLocations, setOutLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const { showToast } = useToast();
  const [currentItem, setCurrentItem] = useState({
    itemName: '',
    serialNo: '',
    category: '',
    returnable: 'No',
    qty: 1,
    model: '',
    images: []
  });

  // State for transport details
  const [transportMethod, setTransportMethod] = useState('');
  const [transporterType, setTransporterType] = useState('');
  const [transporterServiceNo, setTransporterServiceNo] = useState('');
  const [transporterDetails, setTransporterDetails] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [nonSLTTransporterName, setNonSLTTransporterName] = useState('');
  const [nonSLTTransporterNIC, setNonSLTTransporterNIC] = useState('');
  const [nonSLTTransporterPhone, setNonSLTTransporterPhone] = useState('');
  const [nonSLTTransporterEmail, setNonSLTTransporterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!token) {
      Navigate("/");
    }

    setUser(userData);
  }, []);



  useEffect(() => {
    const fetchExecutiveOfficers = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData?.serviceNo) {
          const officers = await getExecutiveOfficers(userData.serviceNo);
          

          // Allowed grades
          const allowedGrades = ["A.1.", "A.2.", "A.3.", "A.4.", "A.5."];

          // Filter only matching grades
          const filteredOfficers = officers?.filter(officer =>
            allowedGrades.includes(officer.salaryGrade)
          );

          

          setExecutiveOfficers(filteredOfficers);
        }
      } catch (error) {
        console.error('Error fetching executive officers:', error);
        showToast('Failed to fetch executive officers', 'error');
      }
    };

    fetchExecutiveOfficers();
  }, []);


  useEffect(() => {
    getLocations()
      .then(locations => {
        setInLocations(locations);
        setOutLocations(locations);
      })
      .catch(error => console.error('Error:', error));
  }, []);

  useEffect(() => {
    getCategories()
      .then(categories => {
        setCategories(categories);
      })
      .catch(error => console.error('Error:', error));
  }, []);


  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (currentItem.images.length + files.length > 5) {
      showToast('Maximum 5 photos allowed per item', 'warning');

      return;
    }
    setCurrentItem({
      ...currentItem,
      images: [...currentItem.images, ...files]
    });
  };
  const handleItemSubmit = () => {
    if (currentItem.itemName && currentItem.serialNo && currentItem.category) {
      if (currentItem.id) {
        // Update existing item
        setItems(items.map(item =>
          item.id === currentItem.id ? { ...currentItem } : item
        ));
      } else {
        // Add new item
        setItems([...items, { ...currentItem, id: Date.now() }]);
      }

      // Reset the currentItem
      setCurrentItem({
        itemName: '',
        serialNo: '',
        category: '',
        returnable: '',
        qty: 1,
        model: '',
        images: []
      });
      setShowItemForm(false);
    } else {
      showToast('Please fill in all required fields', 'warning');
    }
  };
  const handleCancelEdit = () => {
    // Reset the currentItem
    setCurrentItem({
      itemName: '',
      serialNo: '',
      category: '',
      returnable: 'No',
      qty: 1,
      model: '',
      images: []
    });
    setShowItemForm(false);
  };
  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const editItem = (item) => {
    setCurrentItem(item);
    setShowItemForm(true);
  };

  const handleSearchReceiver = async () => {
    if (!receiverServiceNo.trim()) {
      showToast('Please enter a service number', 'warning');
      return;
    }

    try {
      const data = await searchReceiverByServiceNo(receiverServiceNo);
      if (data) {
        setReceiverDetails(data);
      } else {
        setReceiverDetails(null);
        showToast('Receiver not found', 'error');
      }
    } catch (error) {
      setReceiverDetails(null);
      showToast('Receiver not found', 'error');
    }
  };

  // Add this function to the NewRequest component
  const sendExecutiveNotificationEmail = async (executiveData, requestData, referenceNumber) => {
    try {
      if (!executiveData?.email) {
        showToast('Executive officer email not available', 'warning');
        return;
      }

      const emailSubject = `New Gate Pass Request ${referenceNumber} - Requires Your Approval`;

      // Create a professional email body with HTML formatting
      const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #3b82f6; margin-bottom: 5px;">New Gate Pass Request</h2>
          <p style="color: #757575; font-size: 14px;">Reference Number: ${referenceNumber}</p>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 4px;">
          <p>Dear ${executiveData.name},</p>
          <p>A new gate pass request has been submitted and <strong>requires your approval</strong>.</p>
          
          <div style="margin-top: 15px;">
            <p><strong>Request Details:</strong></p>
            <ul style="padding-left: 20px;">
              <li>From: ${user?.name} (${user?.serviceNo})</li>
              <li>From Location: ${outLocation}</li>
              <li>To Location: ${inLocation}</li>
              <li>Items: ${items.length} item(s)</li>
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
            ${items.map(item => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${item.itemName}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${item.serialNo}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${item.category}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${item.returnable === 'Yes' ? 'Returnable' : 'Non-Returnable'}</td>
              </tr>
            `).join('')}
          </table>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p>Please review this request at your earliest convenience by logging into the Gate Pass Management System.</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${window.location.origin}/executive-approval" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Review Request</a>
          </div>
        </div>
        
        <div style="font-size: 12px; color: #757575; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
          <p>This is an automated email from the SLT Gate Pass Management System. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} Sri Lanka Telecom. All rights reserved.</p>
        </div>
      </div>
    `;

      // Send the email
      await emailSent({
        to: executiveData.email,
        subject: emailSubject,
        html: emailBody
      });

      showToast('Notification email sent to executive officer', 'success');
    } catch (error) {
      console.error('Failed to send notification email:', error);
      showToast('Failed to send notification email to executive officer', 'warning');
    }
  };

  const resetForm = () => {
    setItems([]);
    setInLocation('');
    setOutLocation('');
    setExecutiveOfficer('');
    setIsReceiverAvailable(false);
    setReceiverServiceNo('');
    setReceiverDetails(null);
    setShowItemForm(false);
    setTransportMethod('');
    setTransporterType('');
    setTransporterServiceNo('');
    setTransporterDetails(null);
    setVehicleNumber('');
    setVehicleModel('');
    setNonSLTTransporterName('');
    setNonSLTTransporterNIC('');
    setNonSLTTransporterPhone('');
    setNonSLTTransporterEmail('');
    setCurrentItem({
      itemName: '',
      serialNo: '',
      category: '',
      returnable: 'No',
      qty: 1,
      model: '',
      images: []
    });
  };

  const handleSubmit = async () => {
    // Validation for receiver service number
    if (!executiveOfficer) {
      showToast('Please select an executive officer', 'warning');
      return;
    }

    if (isReceiverAvailable && !receiverServiceNo.trim()) {
      showToast('Please enter receiver service number', 'warning');
      return;
    }
    if (isReceiverAvailable && !receiverDetails) {
      showToast('Receiver not found. Please search for a valid receiver.', 'error');
      return;
    }

    // Transport validation
    if (!transportMethod) {
      showToast('Please select a transport method', 'warning');
      return;
    }

    if (transportMethod === 'Vehicle') {
      if (!transporterType) {
        showToast('Please select a transporter type', 'warning');
        return;
      }

      if (transporterType === 'SLT' && !transporterDetails) {
        showToast('Please search for a valid SLT transporter', 'warning');
        return;
      }

      if (transporterType === 'Non-SLT' && (!nonSLTTransporterName || !nonSLTTransporterNIC)) {
        showToast('Please fill in all required transporter details', 'warning');
        return;
      }

      if (!vehicleNumber || !vehicleModel) {
        showToast('Please fill in all vehicle details', 'warning');
        return;
      }
    }


    const formData = new FormData();

    formData.append('outLocation', outLocation);
    formData.append('inLocation', inLocation);
    formData.append('executiveOfficerServiceNo', executiveOfficer);
    formData.append('receiverAvailable', isReceiverAvailable);


    // Only append receiverServiceNo if receiver is available
    if (isReceiverAvailable) {
      formData.append('receiverServiceNo', receiverServiceNo);
    }

    // Add transport details
    formData.append('transportMethod', transportMethod);

    if (transportMethod === 'Vehicle') {
      formData.append('transporterType', transporterType);

      if (transporterType === 'SLT') {
        formData.append('transporterServiceNo', transporterServiceNo);
      } else {
        formData.append('nonSLTTransporterName', nonSLTTransporterName);
        formData.append('nonSLTTransporterNIC', nonSLTTransporterNIC);
        formData.append('nonSLTTransporterPhone', nonSLTTransporterPhone);
        formData.append('nonSLTTransporterEmail', nonSLTTransporterEmail);
      }

      formData.append('vehicleNumber', vehicleNumber);
      formData.append('vehicleModel', vehicleModel);
    }

    if (transportMethod === 'By Hand') {
      formData.append('transporterType', transporterType);

      if (transporterType === 'SLT') {
        formData.append('transporterServiceNo', transporterServiceNo);
      } else {
        formData.append('nonSLTTransporterName', nonSLTTransporterName);
        formData.append('nonSLTTransporterNIC', nonSLTTransporterNIC);
        formData.append('nonSLTTransporterPhone', nonSLTTransporterPhone);
        formData.append('nonSLTTransporterEmail', nonSLTTransporterEmail);
      }
    }

    // Prepare items with their respective images
    const itemsWithFileNames = items.map(item => ({
      itemName: item.itemName,
      serialNo: item.serialNo,
      itemCategory: item.category,
      itemReturnable: item.returnable === 'Yes',
      itemModel: item.model,
      qty: item.qty,
      originalFileNames: item.images.map(img => img.name)
    }));

    formData.append('items', JSON.stringify(itemsWithFileNames));

    // Add images in order per item
    items.forEach(item => {
      item.images.forEach(image => {
        formData.append('itemPhotos', image);
      });
    });

    try {
      setIsSubmitting(true);
      const response = await createGatePassRequest(formData);
      setIsSubmitting(false);
      showToast(`Request created successfully! Reference: ${response.referenceNumber}`, 'success');

      // Fetch executive officer details to get their email
      try {
        // Find the selected executive officer from the list
        const selectedOfficer = executiveOfficers.find(officer => officer.serviceNo === executiveOfficer);

        if (selectedOfficer) {
          // Send notification email to the executive officer
          await sendExecutiveNotificationEmail(selectedOfficer, {
            outLocation,
            inLocation,
            items
          }, response.referenceNumber);
        } else {
          console.error("Selected executive officer not found in the list");
        }
      } catch (emailError) {
        console.error("Error sending notification email:", emailError);
      }

      resetForm();

    } catch (error) {
      setIsSubmitting(false);
      showToast(`Failed to create request: ${error.message}`, 'error');

    }
  };

  const handleSearchTransporter = async () => {
    if (!transporterServiceNo.trim()) {
      showToast('Please enter a service number', 'warning');
      return;
    }

    try {
      const data = await searchSenderByServiceNo(transporterServiceNo);
      if (data) {
        setTransporterDetails(data);
      } else {
        setTransporterDetails(null);
        showToast('Transporter not found', 'error');
      }
    } catch (error) {
      setTransporterDetails(null);
      showToast('Transporter not found', 'error');
    }
  };


  // Stats cards data
  const statsData = [
    {
      title: "Total Items",
      value: items.length,
      icon: Package,
      color: "from-amber-500 to-orange-500"
    },
    {
      title: "Returnable Items",
      value: items.filter(item => item.returnable === 'Yes').length,
      icon: UserCheck,
      color: "from-emerald-500 to-green-500"
    },
    {
      title: "Non-Returnable",
      value: items.filter(item => item.returnable === 'No').length,
      icon: Info,
      color: "from-rose-500 to-red-500"
    }
  ];


  // Add this function inside the NewRequest component
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target.result;
      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(header => header.trim());

      // Check if CSV has required headers
      const requiredHeaders = ['itemName', 'serialNo', 'category', 'returnable', 'qty'];
      const hasRequiredHeaders = requiredHeaders.every(header =>
        headers.includes(header)
      );

      if (!hasRequiredHeaders) {
        showToast('CSV file must include itemName, serialNo, category, returnable, and qty columns', 'error');
        return;
      }

      const newItems = [];

      // Start from index 1 to skip headers
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;

        const values = lines[i].split(',').map(value => value.trim());
        if (values.length !== headers.length) continue;

        const item = {};
        headers.forEach((header, index) => {
          item[header] = values[index];
        });

        // Validate item data
        if (!item.itemName || !item.serialNo || !item.category) continue;

        // Convert returnable to Yes/No format
        if (item.returnable) {
          item.returnable = item.returnable.toLowerCase() === 'true' ||
            item.returnable.toLowerCase() === 'yes' ? 'Yes' : 'No';
        } else {
          item.returnable = 'No';
        }

        // Convert qty to number
        item.qty = parseInt(item.qty) || 1;

        item.model = item.model || '';

        // Add empty images array
        item.images = [];

        // Add unique ID
        item.id = Date.now() + Math.random();

        newItems.push(item);
      }

      if (newItems.length === 0) {
        showToast('No valid items found in CSV file', 'warning');
        return;
      }

      // Add items to the state
      setItems([...items, ...newItems]);
      showToast(`Successfully imported ${newItems.length} items`, 'success');
    };

    reader.readAsText(file);
  };

  // Add this function to download a sample CSV template
  const downloadCSVTemplate = () => {
    const headers = ['itemName', 'serialNo', 'category', 'returnable', 'qty', 'model'];
    const sampleData = [
      ['Laptop', 'SN12345', 'Electronics', 'No', '1', 'Dell XPS 13'],
      ['Monitor', 'MON98765', 'Electronics', 'No', '2', 'Dell U2720Q'],
      ['Cables', 'CBL54321', 'Accessories', 'No', '5', 'USB-C to HDMI'],
    ];

    let csvContent = headers.join(',') + '\n';
    sampleData.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'item_template.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">New Gate Pass Request</h1>
        <p className="text-gray-500 flex items-center">
          <Info className="mr-2 h-5 w-5 text-blue-500" />
          Create a new gate pass request for items
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300"
          >
            <div className={`p-6 bg-gradient-to-br ${stat.color}`}>
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-lg font-semibold mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-bold">{stat.value}</h3>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Sender Details & Location */}
        <div className="lg:col-span-1 space-y-8">
          {/* Sender Details Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <UserCheck className="mr-2 h-6 w-6" />
                Sender Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Service No", value: user?.serviceNo },
                { label: "Name", value: user?.name },
                { label: "Designation", value: user?.designation },
                { label: "Section", value: user?.section },
                { label: "Group", value: user?.group },
                { label: "Contact No", value: user?.contactNo }
              ].map((field, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{field.label}</label>
                  <input
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700"
                    type="text"
                    value={field.value || ''}
                    readOnly
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ExecutiveOfficer Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <UserCheck className="mr-2 h-6 w-6" />
                Executive Officer Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Select Executive Officer
                </label>
                <select
                  value={executiveOfficer}
                  onChange={(e) => setExecutiveOfficer(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select an Executive Officer</option>
                  {executiveOfficers
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(officer => (
                      <option key={officer.serviceNo} value={officer.serviceNo}>
                        {officer.name} - {officer.designation} ({officer.serviceNo})
                      </option>
                    ))}
                </select>
              </div>

              {/* Show selected officer details */}
              {executiveOfficer && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  {(() => {
                    const selectedOfficer = executiveOfficers.find(
                      off => off.serviceNo === executiveOfficer
                    );
                    return selectedOfficer ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500">Section</label>
                          <p className="text-sm text-gray-700">{selectedOfficer.section || selectedOfficer.division || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Email</label>
                          <p className="text-sm text-gray-700">{selectedOfficer.email || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Contact</label>
                          <p className="text-sm text-gray-700">{selectedOfficer.contactNo || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Division</label>
                          <p className="text-sm text-gray-700">{selectedOfficer.division || 'N/A'}</p>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <MapPin className="mr-2 h-6 w-6" />
                Location Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">In Location</label>
                <select
                  value={inLocation}
                  onChange={(e) => setInLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Location</option>
                  {inLocations
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((location) => (
                      <option key={location._id} value={location.name}>
                        {location.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Out Location</label>
                <select
                  value={outLocation}
                  onChange={(e) => setOutLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Location</option>
                  {outLocations
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((location) => (
                      <option key={location._id} value={location.name}>
                        {location.name}
                      </option>
                    ))}
                </select>
              </div>


            </div>
          </div>
          {/* Receiver Details Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <UserCheck className="mr-2 h-6 w-6" />
                Receiver Details
              </h2>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-600 mb-3">Is Receiver Available?</label>
                <div className="flex gap-4">
                  {[true, false].map((value) => (
                    <label key={value.toString()} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={isReceiverAvailable === value}
                        onChange={() => {
                          setIsReceiverAvailable(value);
                          if (!value) {
                            setReceiverServiceNo('');
                            setReceiverDetails(null);
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-gray-700">{value ? 'Yes' : 'No'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {isReceiverAvailable && (
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={receiverServiceNo}
                      onChange={(e) => setReceiverServiceNo(e.target.value)}
                      placeholder="Enter receiver's service number"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleSearchReceiver}
                      disabled={!receiverServiceNo.trim()}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <UserCheck className="h-5 w-5" />
                      Search
                    </button>
                  </div>

                  {receiverDetails && (
                    <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: "Name", value: receiverDetails.name },
                          { label: "Designation", value: receiverDetails.designation },
                          { label: "Section", value: receiverDetails.section },
                          { label: "Group", value: receiverDetails.group },
                          { label: "Contact No", value: receiverDetails.contactNo }
                        ].map((field, index) => (
                          <div key={index}>
                            <label className="block text-sm font-medium text-gray-600 mb-1">{field.label}</label>
                            <input
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700"
                              type="text"
                              value={field.value}
                              readOnly
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Items & Receiver */}
        <div className="lg:col-span-2 space-y-8">
          {/* Items Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Package className="mr-2 h-6 w-6" />
                Items List
              </h2>
              <div className="flex gap-2">
                {/* CSV Upload Button */}
                <div className="relative">
                  <button
                    onClick={() => document.getElementById('csv-upload').click()}
                    className="inline-flex items-center px-4 py-2 bg-white text-indigo-600 rounded-full hover:bg-indigo-50 transition-all duration-200"
                  >
                    <FileSpreadsheet className="h-5 w-5 mr-1" />
                    Import CSV
                  </button>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCSVUpload}
                  />
                </div>

                {/* CSV Template Download Link */}
                <button
                  onClick={downloadCSVTemplate}
                  className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-all duration-200"
                >
                  <FileSpreadsheet className="h-5 w-5 mr-1" />
                  Template
                </button>

                {/* Add Item Button */}
                <button
                  onClick={() => setShowItemForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-white text-indigo-600 rounded-full hover:bg-indigo-50 transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-1" />
                  Add Item
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* CSV Upload Info */}
              {!showItemForm && items.length === 0 && (
                <div className="mb-6 bg-blue-50 rounded-xl p-6 border border-blue-100">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">Bulk Import Items</h3>
                  <p className="text-blue-600 mb-4">
                    You can import multiple items at once using a CSV file. The CSV should have columns for itemName, serialNo, category, returnable, and qty.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => document.getElementById('csv-upload').click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                    >
                      <FileSpreadsheet className="h-5 w-5 mr-2" />
                      Upload CSV
                    </button>
                    <button
                      onClick={downloadCSVTemplate}
                      className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center"
                    >
                      <FileSpreadsheet className="h-5 w-5 mr-2" />
                      Download Template
                    </button>
                  </div>
                </div>
              )}

              {showItemForm && (
                <div className="mb-6 bg-gray-50 rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Item Name</label>
                      <input
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        type="text"
                        value={currentItem.itemName}
                        onChange={(e) => setCurrentItem({ ...currentItem, itemName: e.target.value })}
                        placeholder="Enter item name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Serial No</label>
                      <input
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        type="text"
                        value={currentItem.serialNo}
                        onChange={(e) => setCurrentItem({ ...currentItem, serialNo: e.target.value })}
                        placeholder="Enter serial number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Category</label>
                      <select
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={currentItem.category}
                        onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value })}
                      >
                        <option value="">Select category</option>
                        {categories
                          .slice()
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((category) => (
                            <option key={category._id} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Model</label>
                      <input
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        type="text"
                        value={currentItem.model}
                        onChange={(e) => setCurrentItem({ ...currentItem, model: e.target.value })}
                        placeholder="Enter model name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Item Quantity</label>
                      <input
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        type="number"
                        value={currentItem.qty}
                        onChange={(e) => setCurrentItem({ ...currentItem, qty: e.target.value })}
                        placeholder="Enter item quantity"
                        min="0"
                      />
                    </div>
                    {/* <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Returnable</label>
                      <div className="flex gap-4">
                        {['Yes', 'No'].map((option) => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              value={option}
                              checked={currentItem.returnable === option}
                              onChange={(e) => setCurrentItem({...currentItem, returnable: e.target.value})}
                              className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                            />
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div> */}

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Item Images (Up to 5)
                      </label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {currentItem.images.map((image, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={URL.createObjectURL(image)}
                              className="h-20 w-20 object-cover rounded-lg"
                              alt={`Preview ${idx + 1}`}
                            />
                            <button
                              onClick={() => {
                                setCurrentItem({
                                  ...currentItem,
                                  images: currentItem.images.filter((_, i) => i !== idx)
                                });
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {currentItem.images.length < 5 && (
                          <label className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-500">
                            <Plus className="h-8 w-8 text-gray-400" />
                            <input
                              type="file"
                              className="sr-only"
                              multiple
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleItemSubmit}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      {currentItem.id ? 'Update Item' : 'Add Item'}
                    </button>
                  </div>
                </div>
              )}

              {items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.serialNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.qty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.model}</td>
                          {/* <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${item.returnable === 'Yes' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'}`}>
                            {item.returnable === 'Yes' ? 'Returnable' : 'Non-Returnable'}
                          </span>
                        </td> */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.images?.length > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <FileImage className="h-4 w-4 text-indigo-600" />
                                </div>
                                <span className="text-sm text-gray-600">
                                  {item.images.length} {item.images.length === 1 ? 'photo' : 'photos'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => editItem(item)}
                                className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-rose-600 hover:text-rose-900 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No items added</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding a new item.</p>
                </div>
              )}
            </div>

          </div>



          {/* Transport Details Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <MapPin className="mr-2 h-6 w-6" />
                Transport Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Transport Method</label>
                <div className="flex gap-4">
                  {['By Hand', 'Vehicle'].map((method) => (
                    <label key={method} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        value={method}
                        checked={transportMethod === method}
                        onChange={(e) => {
                          setTransportMethod(e.target.value);
                          // Reset related fields when changing transport method
                          setTransporterType('');
                          setTransporterServiceNo('');
                          setTransporterDetails(null);
                          setVehicleNumber('');
                          setVehicleModel('');
                          setNonSLTTransporterName('');
                          setNonSLTTransporterNIC('');
                          setNonSLTTransporterPhone('');
                          setNonSLTTransporterEmail('');
                        }}
                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-gray-700">{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              {transportMethod === 'By Hand' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Carrier Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Carrier Type</label>
                    <div className="flex gap-4">
                      {['SLT', 'Non-SLT'].map((type) => (
                        <label key={type} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            value={type}
                            checked={transporterType === type}
                            onChange={(e) => {
                              setTransporterType(e.target.value);
                              // Reset related fields when changing transporter type
                              setTransporterServiceNo('');
                              setTransporterDetails(null);
                              setNonSLTTransporterName('');
                              setNonSLTTransporterNIC('');
                              setNonSLTTransporterPhone('');
                              setNonSLTTransporterEmail('');
                            }}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {transporterType === 'SLT' && (
                    <div className="space-y-4 mt-4">
                      <div className="flex gap-4">
                        <input
                          type="text"
                          value={transporterServiceNo}
                          onChange={(e) => setTransporterServiceNo(e.target.value)}
                          placeholder="Enter carrier's service number"
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={handleSearchTransporter}
                          disabled={!transporterServiceNo.trim()}
                          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <UserCheck className="h-5 w-5" />
                          Search
                        </button>
                      </div>

                      {/* Display transporter details if found */}
                      {transporterDetails && (
                        <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { label: "Name", value: transporterDetails.name },
                              { label: "Designation", value: transporterDetails.designation },
                              { label: "Section", value: transporterDetails.section },
                              { label: "Group", value: transporterDetails.group },
                              { label: "Contact No", value: transporterDetails.contactNo }
                            ].map((field, index) => (
                              <div key={index}>
                                <label className="block text-sm font-medium text-gray-600 mb-1">{field.label}</label>
                                <input
                                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700"
                                  type="text"
                                  value={field.value}
                                  readOnly
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {transporterType === 'Non-SLT' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Carrier Name</label>
                        <input
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          type="text"
                          value={nonSLTTransporterName}
                          onChange={(e) => setNonSLTTransporterName(e.target.value)}
                          placeholder="Enter carrier name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">NIC</label>
                        <input
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          type="text"
                          value={nonSLTTransporterNIC}
                          onChange={(e) => setNonSLTTransporterNIC(e.target.value)}
                          placeholder="Enter NIC number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                        <input
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          type="text"
                          value={nonSLTTransporterPhone}
                          onChange={(e) => setNonSLTTransporterPhone(e.target.value)}
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                        <input
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          type="email"
                          value={nonSLTTransporterEmail}
                          onChange={(e) => setNonSLTTransporterEmail(e.target.value)}
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {transportMethod === 'Vehicle' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Transporter Type</label>
                    <div className="flex gap-4">
                      {['SLT', 'Non-SLT'].map((type) => (
                        <label key={type} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            value={type}
                            checked={transporterType === type}
                            onChange={(e) => {
                              setTransporterType(e.target.value);
                              // Reset related fields when changing transporter type
                              setTransporterServiceNo('');
                              setTransporterDetails(null);
                              setNonSLTTransporterName('');
                              setNonSLTTransporterNIC('');
                              setNonSLTTransporterPhone('');
                              setNonSLTTransporterEmail('');
                            }}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {transporterType === 'SLT' && (
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <input
                          type="text"
                          value={transporterServiceNo}
                          onChange={(e) => setTransporterServiceNo(e.target.value)}
                          placeholder="Enter transporter's service number"
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={handleSearchTransporter}
                          disabled={!transporterServiceNo.trim()}
                          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <UserCheck className="h-5 w-5" />
                          Search
                        </button>
                      </div>

                      {transporterDetails && (
                        <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { label: "Name", value: transporterDetails.name },
                              { label: "Designation", value: transporterDetails.designation },
                              { label: "Section", value: transporterDetails.section },
                              { label: "Group", value: transporterDetails.group },
                              { label: "Contact No", value: transporterDetails.contactNo }
                            ].map((field, index) => (
                              <div key={index}>
                                <label className="block text-sm font-medium text-gray-600 mb-1">{field.label}</label>
                                <input
                                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700"
                                  type="text"
                                  value={field.value}
                                  readOnly
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {transporterType === 'Non-SLT' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Transporter Name</label>
                        <input
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          type="text"
                          value={nonSLTTransporterName}
                          onChange={(e) => setNonSLTTransporterName(e.target.value)}
                          placeholder="Enter transporter name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">NIC</label>
                        <input
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          type="text"
                          value={nonSLTTransporterNIC}
                          onChange={(e) => setNonSLTTransporterNIC(e.target.value)}
                          placeholder="Enter NIC number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                        <input
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          type="text"
                          value={nonSLTTransporterPhone}
                          onChange={(e) => setNonSLTTransporterPhone(e.target.value)}
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                        <input
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          type="email"
                          value={nonSLTTransporterEmail}
                          onChange={(e) => setNonSLTTransporterEmail(e.target.value)}
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>
                  )}

                  {/* Vehicle Information */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Vehicle Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle Number</label>
                        <input
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          type="text"
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value)}
                          placeholder="Enter vehicle number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle Model</label>
                        <select
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          value={vehicleModel}
                          onChange={(e) => setVehicleModel(e.target.value)}
                        >
                          <option value="">Select vehicle model</option>
                          {['Car', 'Van', 'Bus', 'Truck', 'Motorcycle', 'Other'].map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Submit Button */}
        <div
          onClick={isSubmitting ? null : handleSubmit}
          className={`fixed bottom-8 right-8 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
          <button
            disabled={isSubmitting}
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Submit Request
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default NewRequest;

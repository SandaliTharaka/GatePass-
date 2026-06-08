import { jsPDF } from "jspdf";
import logoUrl from "../assets/SLTMobitel_Logo.png";

const palette = {
  navy: [22, 57, 112],
  blue: [58, 104, 188],
  teal: [20, 137, 126],
  slate: [84, 97, 122],
  text: [33, 37, 41],
  muted: [92, 104, 124],
  border: [215, 223, 235],
  card: [248, 250, 255],
  cardAlt: [241, 246, 255],
  tableHeader: [220, 230, 250],
  accentBg: [231, 245, 243],
  warningBg: [255, 247, 230],
};

const hasText = (value) => {
  if (value === 0 || value === false) return true;
  if (value === null || value === undefined) return false;
  return String(value).trim() !== "";
};

const toDisplayText = (value, fallback = "-") => {
  if (value === 0 || value === false) return String(value);
  if (!hasText(value)) return fallback;
  return String(value);
};

const pickValue = (...values) => {
  for (const value of values) {
    if (hasText(value)) return value;
  }
  return undefined;
};

const formatDateTime = (value) => {
  if (!hasText(value)) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const formatDate = (value) => {
  if (!hasText(value)) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

const asList = (value) => (Array.isArray(value) ? value : hasText(value) ? [value] : []);

const joinValues = (...values) =>
  values
    .filter(hasText)
    .map((value) => String(value).trim())
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const extractRequestCore = (fullRequest = {}) =>
  fullRequest.requestDetails || fullRequest.request || fullRequest;

const extractSender = (fullRequest = {}, senderFallback = {}) => {
  const requestCore = extractRequestCore(fullRequest);
  const fallback = senderFallback || {};

  return {
    name: pickValue(
      fallback.name,
      fullRequest.senderDetails?.name,
      fullRequest.sender?.name,
      fullRequest.user?.name,
      requestCore.senderName,
      requestCore.employeeName,
      requestCore.requesterName,
    ),
    serviceNo: pickValue(
      fallback.serviceNo,
      fullRequest.senderDetails?.serviceNo,
      fullRequest.sender?.serviceNo,
      fullRequest.user?.serviceNo,
      fullRequest.senderServiceNo,
      requestCore.senderServiceNo,
      requestCore.employeeServiceNo,
      requestCore.employeeNo,
    ),
    designation: pickValue(
      fallback.designation,
      fullRequest.senderDetails?.designation,
      fullRequest.sender?.designation,
      fullRequest.user?.designation,
      requestCore.senderDesignation,
      requestCore.employeeDesignation,
      requestCore.jobTitle,
    ),
    section: pickValue(
      fallback.section,
      fullRequest.senderDetails?.section,
      fullRequest.sender?.section,
      fullRequest.user?.section,
      requestCore.senderSection,
      requestCore.section,
      requestCore.department,
    ),
    group: pickValue(
      fallback.group,
      fullRequest.senderDetails?.group,
      fullRequest.sender?.group,
      fullRequest.user?.group,
      requestCore.senderGroup,
      requestCore.group,
      requestCore.officeLocation,
    ),
    contactNo: pickValue(
      fallback.contactNo,
      fullRequest.senderDetails?.contactNo,
      fullRequest.sender?.contactNo,
      fullRequest.user?.contactNo,
      requestCore.senderContact,
      requestCore.contactNo,
      requestCore.phoneNumber,
      requestCore.mobilePhone,
    ),
    email: pickValue(
      fallback.email,
      fullRequest.senderDetails?.email,
      fullRequest.sender?.email,
      fullRequest.user?.email,
      requestCore.senderEmail,
      requestCore.email,
    ),
  };
};

const extractReceiver = (fullRequest = {}, receiverFallback = {}) => {
  const requestCore = extractRequestCore(fullRequest);
  const fallback = receiverFallback || {};

  return {
    name: pickValue(
      fallback.name,
      fullRequest.receiverDetails?.name,
      fullRequest.receiver?.name,
      requestCore.receiverName,
      fullRequest.receiverName,
    ),
    serviceNo: pickValue(
      fallback.serviceNo,
      fullRequest.receiverDetails?.serviceNo,
      fullRequest.receiver?.serviceNo,
      requestCore.receiverServiceNo,
      fullRequest.receiverServiceNo,
    ),
    designation: pickValue(
      fallback.designation,
      fullRequest.receiverDetails?.designation,
      fullRequest.receiver?.designation,
      requestCore.receiverDesignation,
      fullRequest.receiverDesignation,
    ),
    section: pickValue(
      fallback.section,
      fullRequest.receiverDetails?.section,
      fullRequest.receiver?.section,
      requestCore.receiverSection,
      fullRequest.receiverSection,
    ),
    group: pickValue(
      fallback.group,
      fullRequest.receiverDetails?.group,
      fullRequest.receiver?.group,
      requestCore.receiverGroup,
      fullRequest.receiverGroup,
    ),
    contactNo: pickValue(
      fallback.contactNo,
      fullRequest.receiverDetails?.contactNo,
      fullRequest.receiver?.contactNo,
      requestCore.receiverContact,
      fullRequest.receiverContact,
    ),
    nic: pickValue(
      fallback.nic,
      fullRequest.receiverDetails?.nic,
      fullRequest.receiver?.nic,
      requestCore.receiverNIC,
      fullRequest.receiverNIC,
    ),
    companyName: pickValue(
      fallback.companyName,
      fullRequest.receiverDetails?.companyName,
      fullRequest.receiver?.companyName,
      requestCore.companyName,
      fullRequest.companyName,
    ),
    email: pickValue(
      fallback.email,
      fullRequest.receiverDetails?.email,
      fullRequest.receiver?.email,
      requestCore.receiverEmail,
      fullRequest.receiverEmail,
    ),
  };
};

const extractTransport = (fullRequest = {}, transporterDetails = {}) => {
  const requestCore = extractRequestCore(fullRequest);
  const transport =
    fullRequest.transport ||
    fullRequest.transportData ||
    requestCore.transport ||
    requestCore.transportData ||
    {};

  return {
    transportMethod: pickValue(transport.transportMethod, requestCore.transportMethod, fullRequest.transportMethod),
    transporterType: pickValue(transport.transporterType, requestCore.transporterType, fullRequest.transporterType),
    transporterServiceNo: pickValue(
      transport.transporterServiceNo,
      requestCore.transporterServiceNo,
      fullRequest.transporterServiceNo,
    ),
    transporterName: pickValue(
      transporterDetails.name,
      transport.transporterName,
      transport.nonSLTTransporterName,
      requestCore.transporterName,
      requestCore.nonSLTTransporterName,
      fullRequest.transporterName,
    ),
    transporterSection: pickValue(transporterDetails.section, transport.transporterSection, requestCore.transporterSection),
    transporterGroup: pickValue(transporterDetails.group, transport.transporterGroup, requestCore.transporterGroup),
    transporterDesignation: pickValue(transporterDetails.designation, transport.transporterDesignation, requestCore.transporterDesignation),
    transporterContact: pickValue(transporterDetails.contactNo, transport.transporterContact, requestCore.transporterContact),
    transporterNic: pickValue(transport.nonSLTTransporterNIC, requestCore.nonSLTTransporterNIC, fullRequest.nonSLTTransporterNIC),
    transporterPhone: pickValue(transport.nonSLTTransporterPhone, requestCore.nonSLTTransporterPhone, fullRequest.nonSLTTransporterPhone),
    transporterEmail: pickValue(transport.nonSLTTransporterEmail, requestCore.nonSLTTransporterEmail, fullRequest.nonSLTTransporterEmail),
    vehicleNumber: pickValue(transport.vehicleNumber, requestCore.vehicleNumber, fullRequest.vehicleNumber),
    vehicleModel: pickValue(transport.vehicleModel, requestCore.vehicleModel, fullRequest.vehicleModel),
  };
};

const isNonSltRequest = (fullRequest = {}) => {
  const requestCore = extractRequestCore(fullRequest);
  return Boolean(fullRequest.isNonSltPlace ?? requestCore.isNonSltPlace ?? false);
};

const extractItems = (fullRequest = {}) => (Array.isArray(fullRequest.items) ? fullRequest.items : []);

const collectRequestNotes = (fullRequest = {}) => {
  const requestCore = extractRequestCore(fullRequest);
  return [
    fullRequest.comment,
    fullRequest.reason,
    fullRequest.remarks,
    requestCore.comment,
    requestCore.reason,
    requestCore.remarks,
    fullRequest.statusDetails?.executiveOfficerComment,
    fullRequest.statusDetails?.verifyOfficerComment,
    fullRequest.statusDetails?.rejectionComment,
    fullRequest.statusDetails?.returnComment,
  ].filter(hasText);
};

const buildStatusText = (fullRequest = {}) => {
  const requestCore = extractRequestCore(fullRequest);
  return pickValue(
    fullRequest.statusLabel,
    fullRequest.status,
    requestCore.statusLabel,
    requestCore.status,
    fullRequest.currentStatus,
    requestCore.currentStatus,
    fullRequest.statusCode,
    requestCore.statusCode,
  );
};

const formatStatusValue = (value) => {
  if (!hasText(value)) return "-";
  const text = String(value).trim();
  const map = {
    1: "Executive Pending",
    2: "Executive Approved",
    3: "Executive Rejected",
    4: "Verify Pending",
    5: "Verify Approved",
    6: "Verify Rejected",
  };
  return map[text] || text;
};

const makeRow = (label, value, hint = "") => {
  if (!hasText(value)) return null;
  return { label, value: hint ? `${value}\n${hint}` : value };
};

const addRows = (rows, ...entries) => {
  entries.forEach((entry) => {
    if (entry) rows.push(entry);
  });
};

const generateGatePassPdf = (fullRequest = {}, options = {}) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 34;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 12;
  const title = options.title || "SLT Gate Pass Report";
  const subtitle = options.subtitle || "Official gate pass summary";
  const fileNamePrefix = options.fileNamePrefix || "SLT_GatePass";
  const sender = extractSender(fullRequest, options.senderFallback);
  const receiver = extractReceiver(fullRequest, options.receiverFallback);
  const transport = extractTransport(fullRequest, options.transporterDetails);
  const requestCore = extractRequestCore(fullRequest);
  const items = extractItems(fullRequest);
  const isNonSlt = isNonSltRequest(fullRequest);
  const statusDetails = fullRequest.statusDetails || requestCore.statusDetails || {};
  const reference =
    pickValue(
      fullRequest.referenceNumber,
      fullRequest.refNo,
      fullRequest.ref,
      requestCore.referenceNumber,
      requestCore.refNo,
      requestCore.ref,
    ) || "-";
  const generatedAt = new Date().toLocaleString();

  const state = {
    y: 110,
  };

  const drawHeader = () => {
    doc.setFillColor(...palette.navy);
    doc.rect(0, 0, pageWidth, 84, "F");
    doc.setFillColor(...palette.blue);
    doc.rect(0, 84, pageWidth, 6, "F");

    try {
      doc.addImage(logoUrl, "PNG", margin, 18, 92, 34);
    } catch (error) {
      // Ignore image failures and continue rendering the report.
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.text(title, pageWidth / 2, 31, { align: "center" });

    doc.setFontSize(9.5);
    doc.setFont(undefined, "normal");
    doc.text(subtitle, pageWidth / 2, 47, { align: "center" });
    doc.text(`Generated ${generatedAt}`, pageWidth - margin, 24, { align: "right" });

    doc.setFontSize(9);
    doc.text(`Reference: ${reference}`, pageWidth / 2, 62, { align: "center" });
  };

  const ensureSpace = (requiredHeight) => {
    if (state.y + requiredHeight <= pageHeight - margin - 22) return;
    doc.addPage();
    drawHeader();
    state.y = 110;
  };

  const drawSectionTitle = (sectionTitle, accentColor = palette.blue) => {
    const titleHeight = 24;
    ensureSpace(titleHeight + 12);

    doc.setFillColor(...accentColor);
    doc.roundedRect(margin, state.y, contentWidth, titleHeight, 5, 5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11.5);
    doc.setFont(undefined, "bold");
    doc.text(sectionTitle, margin + 10, state.y + 16);

    state.y += titleHeight + 8;
  };

  const drawFieldCard = (sectionTitle, rows, accentColor = palette.blue) => {
    const visibleRows = rows.filter((row) => row && hasText(row.value));
    if (!visibleRows.length) return;

    const prepared = visibleRows.map((row) => {
      const labelText = toDisplayText(row.label);
      const valueText = toDisplayText(row.value);
      const labelLines = doc.splitTextToSize(labelText, contentWidth * 0.24);
      const valueLines = doc.splitTextToSize(valueText, contentWidth * 0.66);
      const rowHeight = Math.max(labelLines.length, valueLines.length) * lineHeight + 10;
      return { labelText, valueLines, rowHeight, labelLines };
    });

    const sectionHeight = 24 + prepared.reduce((sum, row) => sum + row.rowHeight, 0) + 6;
    ensureSpace(sectionHeight);

    drawSectionTitle(sectionTitle, accentColor);

    const labelX = margin + 10;
    const valueX = margin + contentWidth * 0.31;
    const labelWidth = contentWidth * 0.28;

    prepared.forEach((row, index) => {
      const rowY = state.y;
      if (index % 2 === 0) {
        doc.setFillColor(...palette.card);
      } else {
        doc.setFillColor(...palette.cardAlt);
      }
      doc.roundedRect(margin, rowY, contentWidth, row.rowHeight, 4, 4, "F");
      doc.setDrawColor(...palette.border);
      doc.roundedRect(margin, rowY, contentWidth, row.rowHeight, 4, 4, "S");

      doc.setTextColor(...palette.slate);
      doc.setFontSize(9.2);
      doc.setFont(undefined, "bold");
      doc.text(row.labelLines, labelX, rowY + 14);

      doc.setTextColor(...palette.text);
      doc.setFont(undefined, "normal");
      doc.text(row.valueLines, valueX, rowY + 14);

      state.y += row.rowHeight;
    });

    state.y += 6;
  };

  const drawSummaryPills = () => {
    const pills = [
    
    { label: "Items", value: String(items.length) },
    { label: "Type", value: isNonSlt ? "Non-SLT" : "SLT" },
    { label: "Created", value: formatDateTime(fullRequest.createdAt || requestCore.createdAt) },
  ];
    

    const pillWidths = [120, 96, 150 ];
    const totalWidth = pillWidths.reduce((sum, width) => sum + width, 0) + 12 * (pillWidths.length - 1);
    ensureSpace(48);
    let x = margin + Math.max(0, (contentWidth - totalWidth) / 2);

    pills.forEach((pill, index) => {
      doc.setFillColor(...(index % 2 === 0 ? palette.accentBg : palette.warningBg));
      doc.setDrawColor(...palette.border);
      doc.roundedRect(x, state.y, pillWidths[index], 38, 10, 10, "FD");
      doc.setTextColor(...palette.slate);
      doc.setFontSize(8.6);
      doc.setFont(undefined, "bold");
      doc.text(pill.label, x + 10, state.y + 14);
      doc.setTextColor(...palette.text);
      doc.setFontSize(10.6);
      doc.text(doc.splitTextToSize(pill.value, pillWidths[index] - 20), x + 10, state.y + 28);
      x += pillWidths[index] + 12;
    });

    state.y += 52;
  };

  const drawItemsTable = () => {
    const columns = [
      { label: "Description", width: 0.25 },
      { label: "Serial No", width: 0.11 },
      { label: "Item Code", width: 0.10 },
      { label: "Category", width: 0.15 },
      { label: "Qty", width: 0.06 },
      { label: "Status", width: 0.13 },
      { label: "Return Date", width: 0.20 },
    ];

    const rows = items.length
      ? items.map((item) => [
          item.itemDescription || item.description || "-",
          item.serialNumber || "-",
          item.itemCode || "-",
          item.categoryDescription || item.category || "-",
          item.itemQuantity || item.quantity || "-",
          item.status || "-",
          formatDate(item.returnDate || item.returnBy || item.expectedReturnDate),
        ])
      : [["No items available", "-", "-", "-", "-", "-", "-"]];

    const headerHeight = 22;
    const columnWidths = columns.map((column) => contentWidth * column.width);
    const columnX = [margin];
    for (let index = 1; index < columnWidths.length; index += 1) {
      columnX[index] = columnX[index - 1] + columnWidths[index - 1];
    }

    const drawTableHeader = () => {
      doc.setFillColor(...palette.tableHeader);
      doc.setDrawColor(...palette.border);
      doc.roundedRect(margin, state.y, contentWidth, headerHeight, 5, 5, "FD");
      doc.setTextColor(...palette.navy);
      doc.setFontSize(8.8);
      doc.setFont(undefined, "bold");
      columns.forEach((column, index) => {
        const headerText = doc.splitTextToSize(column.label, columnWidths[index] - 10);
        doc.text(headerText, columnX[index] + 5, state.y + 14);
      });
      state.y += headerHeight;
    };

    drawSectionTitle("Item Details", palette.teal);
    drawTableHeader();

    rows.forEach((row, index) => {
      const cellLines = row.map((cell, cellIndex) =>
        doc.splitTextToSize(toDisplayText(cell), columnWidths[cellIndex] - 10),
      );
      const rowHeight = Math.max(...cellLines.map((lines) => lines.length)) * lineHeight + 9;
      ensureSpace(rowHeight + 10);

      if (index % 2 === 0) {
        doc.setFillColor(...palette.card);
      } else {
        doc.setFillColor(...palette.cardAlt);
      }
      doc.roundedRect(margin, state.y, contentWidth, rowHeight, 4, 4, "F");
      doc.setDrawColor(...palette.border);
      doc.roundedRect(margin, state.y, contentWidth, rowHeight, 4, 4, "S");

      cellLines.forEach((lines, cellIndex) => {
        doc.setTextColor(...palette.text);
        doc.setFontSize(8.4);
        doc.setFont(undefined, "normal");
        doc.text(lines, columnX[cellIndex] + 5, state.y + 13);
      });

      state.y += rowHeight;
    });

    state.y += 10;
  };

  const drawApprovalTrail = () => {
    const approvalRows = [];
    addRows(
      approvalRows,
      makeRow("Executive Officer", joinValues(statusDetails.executiveOfficerData?.name, statusDetails.executiveOfficerServiceNo)),
      makeRow("Executive Comment", statusDetails.executiveOfficerComment),
      makeRow("Verify Officer", joinValues(statusDetails.verifyOfficerData?.name, statusDetails.verifyOfficerServiceNo)),
      makeRow("Verify Comment", statusDetails.verifyOfficerComment),
      makeRow("Petrol Leader", joinValues(fullRequest.pleaderOfficerData?.name, fullRequest.pleaderOfficerData?.serviceNo)),
      makeRow("Petrol Leader Comment", statusDetails.petrolLeaderComment || fullRequest.statusDetails?.petrolLeaderComment),
      makeRow("Receiver Officer", joinValues(fullRequest.receiverOfficerData?.name, fullRequest.receiverOfficerData?.serviceNo)),
      makeRow("Receiver Officer Comment", statusDetails.recieveOfficerComment || fullRequest.statusDetails?.recieveOfficerComment),
      makeRow("Rejected By", statusDetails.rejectedBy || statusDetails.rejectedByBranch),
      makeRow("Returned By", statusDetails.returnedBy || statusDetails.returnedByBranch),
      makeRow("Return Comment", statusDetails.returnComment),
    );

    if (!approvalRows.length) return;
    drawFieldCard("Approval Trail", approvalRows, palette.navy);
  };

  const drawNotes = () => {
    const notes = collectRequestNotes(fullRequest);
    if (!notes.length) return;
    drawFieldCard(
      "Notes",
      notes.map((note, index) => ({ label: `Note ${index + 1}`, value: note })),
      palette.warningBg,
    );
  };

  const drawExtraSections = () => {
    const extraSections = Array.isArray(options.extraSections) ? options.extraSections : [];
    extraSections.forEach((section) => {
      if (!section || !Array.isArray(section.rows) || !section.rows.length) return;
      drawFieldCard(section.title || "Additional Details", section.rows, section.accentColor || palette.blue);
    });
  };

  drawHeader();
  drawSummaryPills();

  const requestRows = [];
  addRows(
    requestRows,
    makeRow("Reference Number", reference),
    makeRow("Current Status", formatStatusValue(buildStatusText(fullRequest))),
    makeRow("Request Type", isNonSlt ? "Non-SLT destination" : "SLT branch request"),
    makeRow("Created At", formatDateTime(fullRequest.createdAt || requestCore.createdAt)),
    makeRow("Updated At", formatDateTime(fullRequest.updatedAt || requestCore.updatedAt)),
    makeRow("In Location", fullRequest.inLocation || requestCore.inLocation),
    makeRow(
      isNonSlt ? "Company Name" : "Out Location",
      isNonSlt
        ? pickValue(fullRequest.companyName, requestCore.companyName)
        : pickValue(fullRequest.outLocation, requestCore.outLocation, fullRequest.companyName, requestCore.companyName),
    ),
  );
  drawFieldCard("Request Summary", requestRows, palette.blue);

  const senderRows = [];
  addRows(
    senderRows,
    makeRow("Service No", sender.serviceNo),
    makeRow("Name", sender.name),
    makeRow("Designation", sender.designation),
    makeRow("Section", sender.section),
    makeRow("Group", sender.group),
    makeRow("Contact", sender.contactNo),
    makeRow("Email", sender.email),
  );
  drawFieldCard("Sender Details", senderRows, palette.teal);

  const receiverRows = [];
  if (isNonSlt) {
    addRows(
      receiverRows,
      makeRow("Name", receiver.name),
      makeRow("Company Name", receiver.companyName || fullRequest.companyName || requestCore.companyName),
      makeRow("NIC", receiver.nic),
      makeRow("Contact", receiver.contactNo),
      makeRow("Email", receiver.email),
    );
  } else {
    addRows(
      receiverRows,
      makeRow("Service No", receiver.serviceNo),
      makeRow("Name", receiver.name),
      makeRow("Designation", receiver.designation),
      makeRow("Section", receiver.section),
      makeRow("Group", receiver.group),
      makeRow("Contact", receiver.contactNo),
      makeRow("Email", receiver.email),
    );
  }
  drawFieldCard("Receiver Details", receiverRows, palette.blue);

  const transportRows = [];
  addRows(
    transportRows,
    makeRow("Transport Method", transport.transportMethod),
    makeRow("Transporter Type", transport.transporterType),
  );

  if (String(transport.transporterType || "").toUpperCase() === "SLT") {
    addRows(
      transportRows,
      makeRow("Service No", transport.transporterServiceNo),
      makeRow("Name", transport.transporterName),
      makeRow("Section", transport.transporterSection),
      makeRow("Group", transport.transporterGroup),
      makeRow("Designation", transport.transporterDesignation),
      makeRow("Contact", transport.transporterContact),
    );
  } else {
    addRows(
      transportRows,
      makeRow("Name", transport.transporterName),
      makeRow("NIC", transport.transporterNic),
      makeRow("Contact", transport.transporterPhone),
      makeRow("Email", transport.transporterEmail),
    );
  }

  if (String(transport.transportMethod || "").toLowerCase() === "vehicle") {
    addRows(
      transportRows,
      makeRow("Vehicle Number", transport.vehicleNumber),
      makeRow("Vehicle Model", transport.vehicleModel),
    );
  }

  drawFieldCard("Transport Details", transportRows, palette.teal);
  drawApprovalTrail();
  drawNotes();
  drawExtraSections();
  drawItemsTable();

  const totalPages = doc.getNumberOfPages();
  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    doc.setPage(pageNumber);
    const footerY = pageHeight - 22;
    doc.setDrawColor(...palette.border);
    doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
    doc.setTextColor(...palette.muted);
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.text("Electronically generated gate pass document", margin, footerY);
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, footerY, { align: "right" });
  }

  doc.save(`${fileNamePrefix}_${reference}.pdf`);
};

const printGatePassPdf = (fullRequest = {}, options = {}) => {
  // Build the same PDF as generateGatePassPdf but open in browser for printing
  const saveOrig = options.fileNamePrefix;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 34;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 12;
  const title = options.title || "SLT Gate Pass Report";
  const subtitle = options.subtitle || "Official gate pass summary";
  const sender = extractSender(fullRequest, options.senderFallback);
  const receiver = extractReceiver(fullRequest, options.receiverFallback);
  const transport = extractTransport(fullRequest, options.transporterDetails);
  const requestCore = extractRequestCore(fullRequest);
  const items = extractItems(fullRequest);
  const isNonSlt = isNonSltRequest(fullRequest);
  const statusDetails = fullRequest.statusDetails || requestCore.statusDetails || {};
  const reference = pickValue(fullRequest.referenceNumber, fullRequest.refNo, fullRequest.ref, requestCore.referenceNumber, requestCore.refNo, requestCore.ref) || "-";
  const generatedAt = new Date().toLocaleString();
  const state = { y: 110 };

  const drawHeader = () => {
    doc.setFillColor(...palette.navy); doc.rect(0, 0, pageWidth, 84, "F");
    doc.setFillColor(...palette.blue); doc.rect(0, 84, pageWidth, 6, "F");
    try { doc.addImage(logoUrl, "PNG", margin, 18, 92, 34); } catch {}
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont(undefined, "bold");
    doc.text(title, pageWidth / 2, 31, { align: "center" });
    doc.setFontSize(9.5); doc.setFont(undefined, "normal");
    doc.text(subtitle, pageWidth / 2, 47, { align: "center" });
    doc.text(`Generated ${generatedAt}`, pageWidth - margin, 24, { align: "right" });
    doc.setFontSize(9);
    doc.text(`Reference: ${reference}`, pageWidth / 2, 62, { align: "center" });
  };

  const ensureSpace = (h) => {
    if (state.y + h <= pageHeight - margin - 22) return;
    doc.addPage(); drawHeader(); state.y = 110;
  };

  const drawSectionTitle = (t, color = palette.blue) => {
    ensureSpace(36);
    doc.setFillColor(...color);
    doc.roundedRect(margin, state.y, contentWidth, 24, 5, 5, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(11.5); doc.setFont(undefined, "bold");
    doc.text(t, margin + 10, state.y + 16);
    state.y += 32;
  };

  const drawFieldCard = (sectionTitle, rows, accentColor = palette.blue) => {
    const visible = rows.filter((r) => r && hasText(r.value));
    if (!visible.length) return;
    const prepared = visible.map((row) => {
      const labelLines = doc.splitTextToSize(toDisplayText(row.label), contentWidth * 0.24);
      const valueLines = doc.splitTextToSize(toDisplayText(row.value), contentWidth * 0.66);
      return { labelLines, valueLines, rowHeight: Math.max(labelLines.length, valueLines.length) * lineHeight + 10 };
    });
    ensureSpace(24 + prepared.reduce((s, r) => s + r.rowHeight, 0) + 6);
    drawSectionTitle(sectionTitle, accentColor);
    const lx = margin + 10, vx = margin + contentWidth * 0.31;
    prepared.forEach((row, i) => {
      doc.setFillColor(...(i % 2 === 0 ? palette.card : palette.cardAlt));
      doc.roundedRect(margin, state.y, contentWidth, row.rowHeight, 4, 4, "F");
      doc.setDrawColor(...palette.border);
      doc.roundedRect(margin, state.y, contentWidth, row.rowHeight, 4, 4, "S");
      doc.setTextColor(...palette.slate); doc.setFontSize(9.2); doc.setFont(undefined, "bold");
      doc.text(row.labelLines, lx, state.y + 14);
      doc.setTextColor(...palette.text); doc.setFont(undefined, "normal");
      doc.text(row.valueLines, vx, state.y + 14);
      state.y += row.rowHeight;
    });
    state.y += 6;
  };

  const drawSummaryPills = () => {
    const pills = [
      { label: "Status", value: formatStatusValue(buildStatusText(fullRequest)) },
      { label: "Items", value: String(items.length) },
      { label: "Type", value: isNonSlt ? "Non-SLT" : "SLT" },
      { label: "Created", value: formatDateTime(fullRequest.createdAt || requestCore.createdAt) },
    ];
    const pillWidths = [120, 96, 92, 150];
    ensureSpace(52);
    let x = margin + Math.max(0, (contentWidth - pillWidths.reduce((s, w) => s + w, 0) - 36) / 2);
    pills.forEach((pill, i) => {
      doc.setFillColor(...(i % 2 === 0 ? palette.accentBg : palette.warningBg));
      doc.setDrawColor(...palette.border);
      doc.roundedRect(x, state.y, pillWidths[i], 38, 10, 10, "FD");
      doc.setTextColor(...palette.slate); doc.setFontSize(8.6); doc.setFont(undefined, "bold");
      doc.text(pill.label, x + 10, state.y + 14);
      doc.setTextColor(...palette.text); doc.setFontSize(10.6);
      doc.text(doc.splitTextToSize(pill.value, pillWidths[i] - 20), x + 10, state.y + 28);
      x += pillWidths[i] + 12;
    });
    state.y += 52;
  };

  const drawItemsTable = () => {
    const columns = [
      { label: "Description", width: 0.25 }, { label: "Serial No", width: 0.11 },
      { label: "Item Code", width: 0.10 }, { label: "Category", width: 0.15 },
      { label: "Qty", width: 0.06 }, { label: "Status", width: 0.13 }, { label: "Return Date", width: 0.20 },
    ];
    const rows = items.length
      ? items.map((item) => [item.itemDescription || "-", item.serialNumber || "-", item.itemCode || "-", item.categoryDescription || "-", String(item.itemQuantity || "-"), item.status || "-", formatDate(item.returnDate)])
      : [["No items available", "-", "-", "-", "-", "-", "-"]];
    const hh = 22;
    const cw = columns.map((c) => contentWidth * c.width);
    const cx = [margin];
    for (let i = 1; i < cw.length; i++) cx[i] = cx[i - 1] + cw[i - 1];
    drawSectionTitle("Item Details", palette.teal);
    doc.setFillColor(...palette.tableHeader); doc.setDrawColor(...palette.border);
    doc.roundedRect(margin, state.y, contentWidth, hh, 5, 5, "FD");
    doc.setTextColor(...palette.navy); doc.setFontSize(8.8); doc.setFont(undefined, "bold");
    columns.forEach((col, i) => doc.text(doc.splitTextToSize(col.label, cw[i] - 10), cx[i] + 5, state.y + 14));
    state.y += hh;
    rows.forEach((row, ri) => {
      const cl = row.map((cell, ci) => doc.splitTextToSize(toDisplayText(cell), cw[ci] - 10));
      const rh = Math.max(...cl.map((l) => l.length)) * lineHeight + 9;
      ensureSpace(rh + 10);
      doc.setFillColor(...(ri % 2 === 0 ? palette.card : palette.cardAlt));
      doc.roundedRect(margin, state.y, contentWidth, rh, 4, 4, "F");
      doc.setDrawColor(...palette.border);
      doc.roundedRect(margin, state.y, contentWidth, rh, 4, 4, "S");
      cl.forEach((lines, ci) => { doc.setTextColor(...palette.text); doc.setFontSize(8.4); doc.setFont(undefined, "normal"); doc.text(lines, cx[ci] + 5, state.y + 13); });
      state.y += rh;
    });
    state.y += 10;
  };

  const drawApprovalTrail = () => {
    const ar = [];
    addRows(ar,
      makeRow("Executive Officer", joinValues(fullRequest.executiveOfficerData?.name, statusDetails.executiveOfficerServiceNo)),
      makeRow("Executive Comment", statusDetails.executiveOfficerComment),
      makeRow("Verify Officer", joinValues(fullRequest.verifyOfficerData?.name, statusDetails.verifyOfficerServiceNo)),
      makeRow("Verify Comment", statusDetails.verifyOfficerComment),
      makeRow("Loading Staff", joinValues(fullRequest.loadUserData?.name, fullRequest.requestDetails?.loading?.staffServiceNo)),
      makeRow("Rejected By", statusDetails.rejectedBy || statusDetails.rejectedByBranch),
    );
    if (ar.length) drawFieldCard("Approval Trail", ar, palette.navy);
  };

  drawHeader();
  drawSummaryPills();

  const reqRows = [];
  addRows(reqRows,
    makeRow("Reference Number", reference),
    makeRow("Current Status", formatStatusValue(buildStatusText(fullRequest))),
    makeRow("Request Type", isNonSlt ? "Non-SLT destination" : "SLT branch request"),
    makeRow("Created At", formatDateTime(fullRequest.createdAt || requestCore.createdAt)),
    makeRow("In Location", fullRequest.inLocation || requestCore.inLocation),
    makeRow(isNonSlt ? "Company Name" : "Out Location",
      isNonSlt ? pickValue(fullRequest.companyName, requestCore.companyName) : pickValue(fullRequest.outLocation, requestCore.outLocation)),
  );
  drawFieldCard("Request Summary", reqRows, palette.blue);

  const sRows = [];
  addRows(sRows, makeRow("Service No", sender.serviceNo), makeRow("Name", sender.name), makeRow("Designation", sender.designation), makeRow("Section", sender.section), makeRow("Group", sender.group), makeRow("Contact", sender.contactNo), makeRow("Email", sender.email));
  drawFieldCard("Sender Details", sRows, palette.teal);

  const rRows = [];
  if (isNonSlt) {
    addRows(rRows, makeRow("Name", receiver.name), makeRow("Company", receiver.companyName || fullRequest.companyName), makeRow("NIC", receiver.nic), makeRow("Contact", receiver.contactNo));
  } else {
    addRows(rRows, makeRow("Service No", receiver.serviceNo), makeRow("Name", receiver.name), makeRow("Designation", receiver.designation), makeRow("Section", receiver.section), makeRow("Group", receiver.group), makeRow("Contact", receiver.contactNo));
  }
  drawFieldCard("Receiver Details", rRows, palette.blue);

  const tRows = [];
  addRows(tRows, makeRow("Transport Method", transport.transportMethod), makeRow("Transporter Type", transport.transporterType));
  if (String(transport.transporterType || "").toUpperCase() === "SLT") {
    addRows(tRows, makeRow("Service No", transport.transporterServiceNo), makeRow("Name", transport.transporterName), makeRow("Section", transport.transporterSection), makeRow("Group", transport.transporterGroup), makeRow("Contact", transport.transporterContact));
  } else {
    addRows(tRows, makeRow("Name", transport.transporterName), makeRow("NIC", transport.transporterNic), makeRow("Contact", transport.transporterPhone), makeRow("Email", transport.transporterEmail));
  }
  if (String(transport.transportMethod || "").toLowerCase() === "vehicle") {
    addRows(tRows, makeRow("Vehicle Number", transport.vehicleNumber), makeRow("Vehicle Model", transport.vehicleModel));
  }
  drawFieldCard("Transport Details", tRows, palette.teal);
  drawApprovalTrail();
  drawItemsTable();

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const fy = pageHeight - 22;
    doc.setDrawColor(...palette.border);
    doc.line(margin, fy - 10, pageWidth - margin, fy - 10);
    doc.setTextColor(...palette.muted); doc.setFontSize(8); doc.setFont(undefined, "normal");
    doc.text("Electronically generated gate pass document", margin, fy);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, fy, { align: "right" });
  }

  // Open PDF in new tab and trigger browser print dialog
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    // Wait for the PDF to fully load before triggering print
    win.addEventListener("load", () => {
      setTimeout(() => {
        win.focus();
        win.print();
        // Clean up the URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, 500);
    });
  } else {
    // Fallback if popup is blocked - download the PDF instead
    console.warn("Print popup blocked. Downloading PDF instead.");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${saveOrig || "SLT_GatePass"}_${reference}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

export { generateGatePassPdf, printGatePassPdf };
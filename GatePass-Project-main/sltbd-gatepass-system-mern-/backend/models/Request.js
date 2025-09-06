const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    serialNo: { type: String, required: true },
    itemCategory: { type: String, required: true },
    itemDescription: { type: String },
    itemPhotos: [{
        url: { type: String },
        path: { type: String }
    }],
    itemReturnable: { type: Boolean, required: true },
    itemQuantity: { type: Number, required: true },
    itemModel: { type: String }
});

const TransportSchema = new mongoose.Schema({
    transportMethod: { type: String, enum: ['By Hand', 'Vehicle'], required: true },
    transporterType: { type: String, enum: ['SLT', 'Non-SLT'], required: true },
    transporterServiceNo: { type: String },
    // Non-SLT transporter details
    nonSLTTransporterName: { type: String },
    nonSLTTransporterNIC: { type: String },
    nonSLTTransporterPhone: { type: String },
    nonSLTTransporterEmail: { type: String },
    // Vehicle details
    vehicleNumber: { type: String },
    vehicleModel: { type: String }
});

const LoadingSchema = new mongoose.Schema({
    loadingType: { type: String, enum: ['Loading', 'Unloading'] },
    loadingLocation: { type: String },
    loadingTime: { type: Date },
    // Add new fields for loading/unloading staff
    staffType: { type: String, enum: ['SLT', 'Non-SLT'] },
    staffServiceNo: { type: String }, // For SLT staff
    // Non-SLT staff details
    nonSLTStaffName: { type: String },
    nonSLTStaffCompany: { type: String },
    nonSLTStaffNIC: { type: String },
    nonSLTStaffContact: { type: String },
    nonSLTStaffEmail: { type: String }
});

const UnLoadingSchema = new mongoose.Schema({
    loadingType: { type: String, enum: ['Loading', 'Unloading'] },
    loadingLocation: { type: String },
    loadingTime: { type: Date },
    // Add new fields for loading/unloading staff
    staffType: { type: String, enum: ['SLT', 'Non-SLT'] },
    staffServiceNo: { type: String }, // For SLT staff
    // Non-SLT staff details
    nonSLTStaffName: { type: String },
    nonSLTStaffCompany: { type: String },
    nonSLTStaffNIC: { type: String },
    nonSLTStaffContact: { type: String },
    nonSLTStaffEmail: { type: String }
});


const RequestSchema = new mongoose.Schema({
    referenceNumber: { type: String, required: true, unique: true },
    employeeServiceNo: { type: String, required: true },
    items: [ItemSchema], // Array of items
    outLocation: { type: String, required: true },
    inLocation: { type: String, required: true },
    executiveOfficerServiceNo: { type: String, required: true },
    receiverAvailable: { type: Boolean, required: true },
    status: { type: Number, enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], default: 1 },
    // 1: Executive Pending 
    // 2: Executive Approved 
    // 3: Executive Rejected 
    // 4: Verify Pending 
    // 5: Verify Approved
    // 6: Verify Rejected
    // 7: Dispatch Pending
    // 8: Dispatch Approved
    // 9: Dispatch Rejected
    // 10: Received Pending
    // 11: Received Approved
    // 12: Received Rejected
    // 13: Canceled
    receiverServiceNo: { type: String },
    transport: TransportSchema,
    loading: LoadingSchema,
    unLoading: UnLoadingSchema,
    returnableItems: [
        {
            itemName: String,
            serialNo: String,
            itemCategory: String,
            returnQuantity: Number,
            itemModel: String,
        }
    ],
    show: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Request = mongoose.model('Request', RequestSchema);
module.exports = Request;


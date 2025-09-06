const supabase = require('../supabase');

const uploadImage = async (file, folder) => {
    const fileName = `${Date.now()}_${file.originalname}`;
    const filePath = `${folder}/${fileName}`;
    
    const { data, error } = await supabase.storage
        .from('SLT GATE PASS')
        .upload(filePath, file.buffer);

    if (error) throw error;

    const { publicURL } = supabase.storage
        .from('SLT GATE PASS')
        .getPublicUrl(filePath);

    return {
        url: publicURL,
        path: filePath
    };
};

const getImage = async (path) => {
    const { data } = supabase.storage
        .from('SLT GATE PASS')
        .getPublicUrl(path);

    return data.publicUrl;
};


module.exports = { uploadImage, getImage };;

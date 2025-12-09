import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Upload directory configuration
const UPLOAD_DIR = 'uploads/applicant-documents';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed MIME types for applicant documents
const ALLOWED_MIME_TYPES = [
    // PDF
    'application/pdf',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/plain', // .txt
];

// File size limit: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Configure multer storage
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        // Generate unique filename with original extension
        const ext = path.extname(file.originalname);
        const uniqueName = `${uuidv4()}${ext}`;
        cb(null, uniqueName);
    },
});

// File filter function
const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed. Allowed types: PDF, images (JPEG, PNG, GIF, WebP), and documents (DOC, DOCX, XLS, XLSX, TXT)`));
    }
};

// Create multer instance with configuration
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 10, // Maximum 10 files per request
    },
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string = 'file') => upload.single(fieldName);

// Middleware for multiple files upload (same field)
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 10) => 
    upload.array(fieldName, maxCount);

// Middleware for multiple fields with files
export const uploadFields = (fields: multer.Field[]) => upload.fields(fields);

// Error handling middleware for multer errors
export const handleUploadError = (
    err: Error,
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum is 10 files per request.',
            });
        }
        return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`,
        });
    }
    
    if (err.message.includes('File type not allowed')) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
    
    next(err);
};

// Export constants for use in other modules
export const UPLOAD_CONFIG = {
    UPLOAD_DIR,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE,
};

export default upload;


const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Create uploads directories
const uploadsDir = path.join(__dirname, 'uploads');
const logosDir = path.join(uploadsDir, 'logos');
const docsDir = path.join(uploadsDir, 'documents');

[uploadsDir, logosDir, docsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Initialize SQLite database
const db = new sqlite3.Database('hackathon.db');

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS problem_statements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        org_name TEXT NOT NULL,
        spoc_name TEXT NOT NULL,
        spoc_contact TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        ps_title TEXT NOT NULL,
        ps_description TEXT NOT NULL,
        domain TEXT,
        dataset_link TEXT,
        logo_filename TEXT NOT NULL,
        logo_original_name TEXT NOT NULL,
        logo_file_size INTEGER,
        submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS supporting_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ps_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_size INTEGER,
        file_type TEXT,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ps_id) REFERENCES problem_statements(id) ON DELETE CASCADE
    )`);
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'logo') {
            cb(null, logosDir);
        } else {
            cb(null, docsDir);
        }
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '_' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|ppt|pptx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Middleware
app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Submit problem statement
app.post('/api/submit_problem_statement', upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'documents', maxCount: 10 }
]), (req, res) => {
    try {
        const {
            orgName, spocName, spocContact, contactEmail,
            psTitle, psDescription, domain, datasetLink
        } = req.body;

        // Validate required fields
        if (!orgName || !spocName || !spocContact || !contactEmail || !psTitle || !psDescription) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be filled'
            });
        }

        // Validate logo upload
        if (!req.files || !req.files.logo || req.files.logo.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Organization logo is required'
            });
        }

        const logoFile = req.files.logo[0];
        
        // Insert into database
        const stmt = db.prepare(`
            INSERT INTO problem_statements (
                org_name, spoc_name, spoc_contact, contact_email, ps_title,
                ps_description, domain, dataset_link, logo_filename,
                logo_original_name, logo_file_size
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run([
            orgName, spocName, spocContact, contactEmail, psTitle,
            psDescription, domain || null, datasetLink || null,
            logoFile.filename, logoFile.originalname, logoFile.size
        ], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            const psId = this.lastID;

            // Handle supporting documents
            if (req.files.documents && req.files.documents.length > 0) {
                const docStmt = db.prepare(`
                    INSERT INTO supporting_documents (ps_id, filename, original_name, file_size, file_type)
                    VALUES (?, ?, ?, ?, ?)
                `);

                req.files.documents.forEach(doc => {
                    docStmt.run([psId, doc.filename, doc.originalname, doc.size, doc.mimetype]);
                });
                docStmt.finalize();
            }

            res.json({
                success: true,
                message: 'Problem statement submitted successfully',
                submissionId: psId
            });
        });

        stmt.finalize();

    } catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

// Get all submissions (admin)
app.get('/api/submissions', (req, res) => {
    db.all(`
        SELECT ps.*, COUNT(sd.id) as document_count
        FROM problem_statements ps
        LEFT JOIN supporting_documents sd ON ps.id = sd.ps_id
        GROUP BY ps.id
        ORDER BY ps.submission_date DESC
    `, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get submission details
app.get('/api/submission/:id', (req, res) => {
    const id = req.params.id;
    
    db.get('SELECT * FROM problem_statements WHERE id = ?', [id], (err, submission) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        db.all('SELECT * FROM supporting_documents WHERE ps_id = ?', [id], (err, documents) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            res.json({
                submission: submission,
                documents: documents
            });
        });
    });
});

// Update submission status
app.post('/api/update_status', express.json(), (req, res) => {
    const { id, status } = req.body;
    
    db.run('UPDATE problem_statements SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
        [status, id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: 'Status updated successfully' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Access the application at:');
    console.log(`- Main site: http://localhost:${PORT}/index.html`);
    console.log(`- Submit form: http://localhost:${PORT}/upload-ps.html`);
    console.log(`- Admin panel: http://localhost:${PORT}/admin_access.html`);
});

module.exports = app;
<?php
// Problem Statement Upload Handler - Fixed Version
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// For GET requests, show a simple test page
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'status' => 'ready',
        'message' => 'Upload endpoint is ready',
        'php_version' => phpversion(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit;
}

// Only handle POST requests for uploads
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false, 
        'message' => 'Method not allowed. Use POST for uploads.'
    ]);
    exit;
}

try {
    // Include database config
    require_once 'config/database_config.php';
    
    // Validate required fields
    $required_fields = ['orgName', 'spocName', 'spocContact', 'contactEmail', 'psTitle', 'psDescription'];
    $missing_fields = [];
    
    foreach ($required_fields as $field) {
        if (!isset($_POST[$field]) || empty(trim($_POST[$field]))) {
            $missing_fields[] = $field;
        }
    }
    
    if (!empty($missing_fields)) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'Missing required fields: ' . implode(', ', $missing_fields)
        ]);
        exit;
    }
    
    // Validate logo upload
    if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'Organization logo is required'
        ]);
        exit;
    }
    
    // Get database connection
    $pdo = getDBConnection();
    
    // Create uploads directories
    $uploadsDir = 'uploads';
    $logosDir = $uploadsDir . '/logos';
    $docsDir = $uploadsDir . '/documents';
    
    foreach ([$uploadsDir, $logosDir, $docsDir] as $dir) {
        if (!is_dir($dir)) {
            if (!mkdir($dir, 0755, true)) {
                throw new Exception("Failed to create directory: $dir");
            }
        }
    }
    
    // Handle logo upload
    $logoFile = $_FILES['logo'];
    $logoExtension = strtolower(pathinfo($logoFile['name'], PATHINFO_EXTENSION));
    $allowedLogoTypes = ['jpg', 'jpeg', 'png', 'gif'];
    
    if (!in_array($logoExtension, $allowedLogoTypes)) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'Invalid logo file type. Only JPG, PNG, and GIF are allowed.'
        ]);
        exit;
    }
    
    // Generate unique filename
    $logoFilename = 'logo_' . time() . '_' . rand(1000, 9999) . '.' . $logoExtension;
    $logoPath = $logosDir . '/' . $logoFilename;
    
    if (!move_uploaded_file($logoFile['tmp_name'], $logoPath)) {
        throw new Exception('Failed to upload logo file');
    }
    
    // Insert submission into database
    $stmt = $pdo->prepare("
        INSERT INTO problem_statements (
            org_name, spoc_name, spoc_contact, contact_email, ps_title,
            ps_description, domain, dataset_link, logo_filename,
            logo_original_name, logo_file_size
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $result = $stmt->execute([
        trim($_POST['orgName']),
        trim($_POST['spocName']),
        trim($_POST['spocContact']),
        trim($_POST['contactEmail']),
        trim($_POST['psTitle']),
        trim($_POST['psDescription']),
        isset($_POST['domain']) ? trim($_POST['domain']) : null,
        isset($_POST['datasetLink']) ? trim($_POST['datasetLink']) : null,
        $logoFilename,
        $logoFile['name'],
        $logoFile['size']
    ]);
    
    if (!$result) {
        throw new Exception('Failed to save submission to database');
    }
    
    $submissionId = $pdo->lastInsertId();
    
    // Handle supporting documents
    $documentsProcessed = 0;
    if (isset($_FILES['documents']) && is_array($_FILES['documents']['name'])) {
        $allowedDocTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'];
        
        for ($i = 0; $i < count($_FILES['documents']['name']); $i++) {
            if ($_FILES['documents']['error'][$i] === UPLOAD_ERR_OK) {
                $docName = $_FILES['documents']['name'][$i];
                $docExtension = strtolower(pathinfo($docName, PATHINFO_EXTENSION));
                
                if (in_array($docExtension, $allowedDocTypes)) {
                    $docFilename = 'doc_' . $submissionId . '_' . time() . '_' . rand(1000, 9999) . '.' . $docExtension;
                    $docPath = $docsDir . '/' . $docFilename;
                    
                    if (move_uploaded_file($_FILES['documents']['tmp_name'][$i], $docPath)) {
                        // Save document info to database
                        $docStmt = $pdo->prepare("
                            INSERT INTO supporting_documents (ps_id, filename, original_name, file_size, file_type)
                            VALUES (?, ?, ?, ?, ?)
                        ");
                        $docStmt->execute([
                            $submissionId,
                            $docFilename,
                            $docName,
                            $_FILES['documents']['size'][$i],
                            $_FILES['documents']['type'][$i]
                        ]);
                        $documentsProcessed++;
                    }
                }
            }
        }
    }
    
    // Success response
    echo json_encode([
        'success' => true,
        'message' => 'Problem statement submitted successfully!',
        'submissionId' => $submissionId,
        'documentsProcessed' => $documentsProcessed,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
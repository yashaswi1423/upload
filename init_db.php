<?php
// Initialize database for Smart Horizon Hackathon
require_once 'config/database_config.php';

echo "<h2>Initializing Smart Horizon Hackathon Database...</h2>";

try {
    $pdo = getDBConnection();
    echo "<p>✅ Database connection successful!</p>";
    
    // Create problem_statements table
    $pdo->exec("CREATE TABLE IF NOT EXISTS problem_statements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        org_name VARCHAR(255) NOT NULL,
        spoc_name VARCHAR(255) NOT NULL,
        spoc_contact VARCHAR(20) NOT NULL,
        contact_email VARCHAR(255) NOT NULL,
        ps_title VARCHAR(500) NOT NULL,
        ps_description TEXT NOT NULL,
        domain VARCHAR(100),
        dataset_link VARCHAR(500),
        logo_filename VARCHAR(255) NOT NULL,
        logo_original_name VARCHAR(255) NOT NULL,
        logo_file_size INT,
        submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    echo "<p>✅ Created problem_statements table</p>";
    
    // Create supporting_documents table
    $pdo->exec("CREATE TABLE IF NOT EXISTS supporting_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ps_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_size INT,
        file_type VARCHAR(100),
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ps_id) REFERENCES problem_statements(id) ON DELETE CASCADE
    )");
    echo "<p>✅ Created supporting_documents table</p>";
    
    // Create indexes
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ps_status ON problem_statements(status)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ps_submission_date ON problem_statements(submission_date)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ps_org_name ON problem_statements(org_name)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_docs_ps_id ON supporting_documents(ps_id)");
    echo "<p>✅ Created database indexes</p>";
    
    // Insert sample data
    $stmt = $pdo->prepare("INSERT INTO problem_statements (
        org_name, spoc_name, spoc_contact, contact_email, ps_title, ps_description, 
        domain, dataset_link, logo_filename, logo_original_name, logo_file_size
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    $stmt->execute([
        'Sample Tech Solutions',
        'John Doe',
        '+91 9876543210',
        'john.doe@sampletech.com',
        'AI-Powered Traffic Management System',
        'Develop an intelligent traffic management system using AI and IoT sensors to optimize traffic flow in urban areas. The system should be able to predict traffic patterns, detect congestion, and automatically adjust traffic signals to improve overall traffic efficiency.',
        'AI/ML',
        'https://example.com/traffic-dataset',
        'sample_logo_' . time() . '.png',
        'company_logo.png',
        245760
    ]);
    
    $stmt->execute([
        'Green Energy Corp',
        'Jane Smith',
        '+91 9876543211',
        'jane.smith@greenenergy.com',
        'Smart Grid Optimization Platform',
        'Create a comprehensive platform for optimizing smart grid operations using machine learning algorithms. The platform should monitor energy consumption patterns, predict demand, and optimize energy distribution to reduce waste and improve efficiency.',
        'IoT',
        'https://example.com/energy-dataset',
        'green_logo_' . time() . '.png',
        'green_energy_logo.png',
        189432
    ]);
    
    echo "<p>✅ Inserted sample data</p>";
    
    // Check table contents
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM problem_statements");
    $count = $stmt->fetch()['count'];
    echo "<p>📊 Total submissions in database: <strong>$count</strong></p>";
    
    echo "<h3>🎉 Database initialization completed successfully!</h3>";
    echo "<p><a href='admin_panel.html' style='background: #2b2d73; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Open Admin Panel</a></p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
}
?>
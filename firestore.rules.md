rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // --- FUNGSI PEMBANTU (Membaca langsung dari koleksi master_users) ---
    function getUserData() {
      return get(/databases/$(database)/documents/master_users/$(request.auth.uid)).data;
    }

    function getRole() { 
      return request.auth != null ? getUserData().role : null; 
    }
    
    function isActive() { 
      return request.auth != null && getUserData().is_active == true; 
    }
    
    function isManager() { return isActive() && getRole() == "MANAGER"; }
    function isAdmin() { return isActive() && (getRole() == "ADMIN" || getRole() == "MANAGER"); }
    function isCashier() { return isActive() && (getRole() == "CASHIER" || getRole() == "ADMIN" || getRole() == "MANAGER"); }
    function isGuest() { return isActive() && (getRole() == "GUEST" || getRole() == "CASHIER" || getRole() == "ADMIN" || getRole() == "MANAGER"); }
    
    function canReadReports() { return isCashier() || isGuest(); }

    // --- 1. DATA MASTER ---
    match /master_products/{id} {
      allow read: if canReadReports();
      allow create, delete: if isAdmin();
      allow update: if isAdmin() || (isCashier() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['current_stock', 'updated_at']));
    }
    match /master_suppliers/{id} {
      allow read: if canReadReports();
      allow write: if isAdmin();
    }
    match /master_members/{id} {
      allow read: if canReadReports();
      allow write: if isAdmin();
    }
    match /master_users/{id} {
      allow read: if request.auth != null;
      allow write: if isManager();
    }

    // --- 2. TRANSAKSI OPERASIONAL ---
    match /transactions_sales/{id} {
      allow read: if canReadReports(); 
      allow create: if isCashier();
      allow update: if isAdmin(); 
      allow delete: if isManager();
    }
    match /transactions_sales_items/{id} {
      allow read: if canReadReports();
      allow create: if isCashier();
      allow update: if isAdmin(); 
      allow delete: if isManager();
    }
    match /transactions_purchase/{id} {
      allow read: if canReadReports();
      allow write: if isAdmin();
    }
    match /transactions_purchase_details/{id} {
      allow read: if canReadReports();
      allow write: if isAdmin();
    }
    match /transactions_purchase_returns/{id} {
      allow read: if canReadReports();
      allow write: if isAdmin();
    }
    match /transactions_purchase_return_items/{id} {
      allow read: if canReadReports();
      allow write: if isAdmin();
    }
    match /transactions_adjustments/{id} {
      allow read: if canReadReports();
      allow write: if isAdmin();
    }

    // --- 3. SETTLEMENT & PAYMENT LOGS ---
    match /transactions_purchase_payments/{id} {
      allow read: if canReadReports();
      allow write: if isAdmin();
    }
    match /transactions_sales_payments/{id} {
      allow read: if canReadReports();
      allow write: if isAdmin();
    }

    // --- 4. AUDIT & MUTASI ---
    match /transactions_stock_mutations/{id} {
      allow read: if canReadReports();
      allow create: if isCashier(); 
      allow update: if isAdmin(); 
      allow delete: if isManager();
    }
    match /cash_handovers/{id} {
      allow read: if canReadReports();
      allow create: if isCashier();
      allow update, delete: if isManager();
    }
    match /expenses/{id} {
      allow read: if canReadReports();
      allow create: if isAdmin();
      allow update, delete: if isManager();
    }

    // --- 5. AKUNTANSI & JURNAL ---
    match /journal_entries/{id} {
      allow read: if canReadReports();
      allow create, update: if isAdmin(); 
      allow delete: if isManager();
    }

    // --- 6. MODUL SIMPAN PINJAM ---
    match /member_savings_transactions/{id} {
      allow read: if canReadReports();
      allow create, update: if isAdmin(); 
      allow delete: if isManager();
    }
    match /member_loans/{id} {
      allow read: if canReadReports();
      allow create, update: if isAdmin();
      allow delete: if isManager();
    }
    match /member_loan_payments/{id} {
      allow read: if canReadReports();
      allow create, update: if isAdmin(); 
      allow delete: if isManager();
    }

    // --- 7. PENGATURAN SISTEM & PROMO ---
    match /system_settings/{id} {
      allow read: if isActive();
      allow write: if isAdmin();
    }
  }
}
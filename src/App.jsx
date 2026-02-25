
import React, { useState, useEffect, createContext, useContext } from 'react';

// --- Constants and Configurations ---
const ROLES = {
    ADMIN: ['DASHBOARD', 'PR_LIST', 'PR_DETAIL', 'PR_FORM', 'PO_LIST', 'PO_DETAIL', 'VENDOR_LIST', 'VENDOR_DETAIL', 'ADMIN_SETTINGS'],
    MANAGER: ['DASHBOARD', 'PR_LIST', 'PR_DETAIL', 'PR_FORM', 'APPROVALS_LIST', 'PO_LIST', 'PO_DETAIL', 'VENDOR_LIST', 'VENDOR_DETAIL'],
    PROCUREMENT_OFFICER: ['DASHBOARD', 'PR_LIST', 'PR_DETAIL', 'PR_FORM', 'PO_LIST', 'PO_DETAIL', 'PO_FORM', 'VENDOR_LIST', 'VENDOR_DETAIL', 'VENDOR_FORM'],
    EMPLOYEE: ['DASHBOARD', 'PR_LIST', 'PR_DETAIL', 'PR_FORM'],
    FINANCE_TEAM: ['DASHBOARD', 'PO_LIST', 'PO_DETAIL', 'PAYMENT_TRACKING_LIST'],
};

const STATUS_MAP = {
    APPROVED: { label: 'Approved', color: 'status-APPROVED' },
    PENDING: { label: 'Pending', color: 'status-PENDING' },
    IN_REVIEW: { label: 'In Review', color: 'status-IN_REVIEW' },
    REJECTED: { label: 'Rejected', color: 'status-REJECTED' },
    DRAFT: { label: 'Draft', color: 'status-DRAFT' },
    PAID: { label: 'Paid', color: 'status-PAID' },
    OVERDUE: { label: 'Overdue', color: 'status-OVERDUE' },
    CANCELLED: { label: 'Cancelled', color: 'status-CANCELLED' },
    COMPLETED: { label: 'Completed', color: 'status-COMPLETED' },
    NEW: { label: 'New', color: 'status-DRAFT' }, // Alias for Draft
};

const WorkflowStages = {
    PURCHASE_REQUEST: [
        { id: 'draft', name: 'Draft', status: ['DRAFT'] },
        { id: 'submitted', name: 'Submitted', status: ['PENDING'] },
        { id: 'manager_review', name: 'Manager Review', status: ['IN_REVIEW'] },
        { id: 'procurement_review', name: 'Procurement Review', status: ['IN_REVIEW'] },
        { id: 'approved', name: 'Approved', status: ['APPROVED'] },
    ],
    PURCHASE_ORDER: [
        { id: 'draft', name: 'Draft', status: ['DRAFT'] },
        { id: 'issued', name: 'Issued', status: ['PENDING'] },
        { id: 'vendor_acknowledgement', name: 'Vendor Ack.', status: ['IN_REVIEW'] },
        { id: 'goods_received', name: 'Goods Received', status: ['PENDING'] },
        { id: 'invoiced', name: 'Invoiced', status: ['IN_REVIEW'] },
        { id: 'paid', name: 'Paid', status: ['PAID'] },
    ],
};

// --- Dummy Data Generation ---
const generateUniqueId = () => Math.random().toString(36).substr(2, 9).toUpperCase();
const getRandomStatus = (type) => {
    if (type === 'PR') {
        const statuses = ['DRAFT', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED'];
        return statuses[Math.floor(Math.random() * statuses.length)];
    }
    if (type === 'PO') {
        const statuses = ['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'COMPLETED'];
        return statuses[Math.floor(Math.random() * statuses.length)];
    }
    if (type === 'VENDOR') {
        const statuses = ['ACTIVE', 'INACTIVE', 'ONBOARDING', 'REJECTED']; // Using custom for vendor
        return statuses[Math.floor(Math.random() * statuses.length)];
    }
    return 'DRAFT';
};

const generateDummyPRs = (count) => {
    const prs = [];
    for (let i = 0; i < count; i++) {
        const status = getRandomStatus('PR');
        const slaBreach = status === 'PENDING' && Math.random() > 0.7; // Simulate SLA breach
        prs.push({
            id: generateUniqueId(),
            title: `Purchase Request for ${['Laptops', 'Office Supplies', 'Software Licenses', 'Consulting Services', 'Server Upgrade', 'Marketing Campaign', 'Conference Travel'][i % 7]}`,
            description: `Detailed request for ${['Q3 budget', 'urgent needs', 'annual renewal', 'new project launch'][i % 4]}.`,
            requestedBy: `User ${Math.floor(Math.random() * 5) + 1}`,
            department: ['IT', 'HR', 'Marketing', 'Finance', 'Operations'][i % 5],
            amount: (Math.random() * 10000 + 500).toFixed(2),
            currency: 'USD',
            status: status,
            submissionDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            approvalDate: status === 'APPROVED' ? new Date().toISOString().split('T')[0] : null,
            managerApproval: status === 'APPROVED' || status === 'IN_REVIEW' ? 'Approved' : 'Pending',
            procurementApproval: status === 'APPROVED' ? 'Approved' : 'Pending',
            relatedPoId: status === 'APPROVED' && Math.random() > 0.5 ? generateUniqueId() : null,
            slaBreach: slaBreach,
            currentStage: status === 'DRAFT' ? 'draft' : status === 'PENDING' ? 'submitted' : status === 'IN_REVIEW' ? 'manager_review' : 'approved',
            attachments: i % 2 === 0 ? [{ name: 'Quotation.pdf', url: '#' }] : [],
            auditLog: [
                { id: generateUniqueId(), timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), user: 'System', action: 'Created PR' },
                { id: generateUniqueId(), timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), user: 'Employee A', action: 'Submitted for Approval' },
                ...(status === 'APPROVED' || status === 'IN_REVIEW' ? [{ id: generateUniqueId(), timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), user: 'Manager X', action: 'Approved Manager Stage' }] : []),
                ...(status === 'APPROVED' ? [{ id: generateUniqueId(), timestamp: new Date().toISOString(), user: 'Procurement Y', action: 'Approved Final' }] : []),
                ...(status === 'REJECTED' ? [{ id: generateUniqueId(), timestamp: new Date().toISOString(), user: 'Manager Z', action: 'Rejected' }] : []),
            ]
        });
    }
    return prs;
};

const generateDummyPOs = (count) => {
    const pos = [];
    for (let i = 0; i < count; i++) {
        const status = getRandomStatus('PO');
        const slaBreach = status === 'PENDING' && Math.random() > 0.6; // Simulate SLA breach
        pos.push({
            id: generateUniqueId(),
            prId: generateUniqueId(),
            vendorId: generateUniqueId(),
            vendorName: `Vendor Inc. ${i + 1}`,
            item: `Item ${i + 1} for PO`,
            poNumber: `PO-${1000 + i}`,
            amount: (Math.random() * 50000 + 1000).toFixed(2),
            currency: 'USD',
            status: status,
            issueDate: new Date(Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            deliveryDate: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            paymentTerms: 'Net 30',
            slaBreach: slaBreach,
            currentStage: status === 'DRAFT' ? 'draft' : status === 'PENDING' ? 'issued' : status === 'PAID' ? 'paid' : 'goods_received',
            auditLog: [
                { id: generateUniqueId(), timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), user: 'Procurement A', action: 'Created PO' },
                { id: generateUniqueId(), timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), user: 'Procurement A', action: 'Issued to Vendor' },
                ...(status === 'PAID' || status === 'COMPLETED' ? [{ id: generateUniqueId(), timestamp: new Date().toISOString(), user: 'Finance B', action: 'Payment Processed' }] : []),
            ]
        });
    }
    return pos;
};

const generateDummyVendors = (count) => {
    const vendors = [];
    for (let i = 0; i < count; i++) {
        const status = getRandomStatus('VENDOR');
        vendors.push({
            id: generateUniqueId(),
            name: `Global Suppliers Ltd. ${i + 1}`,
            contactPerson: `John Doe ${i + 1}`,
            email: `contact${i + 1}@globalsuppliers.com`,
            phone: `+1-${555 + i}-${1000 + i}`,
            address: `${100 + i} Business St, City, Country`,
            status: status === 'ACTIVE' ? 'APPROVED' : status === 'ONBOARDING' ? 'IN_REVIEW' : status === 'INACTIVE' ? 'REJECTED' : 'DRAFT', // Map to standard statuses
            onboardingDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            category: ['IT Services', 'Office Supplies', 'Logistics', 'Marketing', 'Consulting'][i % 5],
            performanceScore: (Math.random() * 5).toFixed(1),
            contracts: Math.floor(Math.random() * 5),
            auditLog: [
                { id: generateUniqueId(), timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), user: 'Procurement Admin', action: 'Vendor created' },
                { id: generateUniqueId(), timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), user: 'Procurement Admin', action: 'Onboarding initiated' },
                ...(status === 'ACTIVE' ? [{ id: generateUniqueId(), timestamp: new Date().toISOString(), user: 'Procurement Admin', action: 'Approved & Activated' }] : []),
            ]
        });
    }
    return vendors;
};

const dummyData = {
    purchaseRequests: generateDummyPRs(7),
    purchaseOrders: generateDummyPOs(8),
    vendors: generateDummyVendors(6),
    users: [
        { id: 'usr-1', name: 'Alice Employee', role: 'EMPLOYEE' },
        { id: 'usr-2', name: 'Bob Manager', role: 'MANAGER' },
        { id: 'usr-3', name: 'Charlie Procurement', role: 'PROCUREMENT_OFFICER' },
        { id: 'usr-4', name: 'Diana Finance', role: 'FINANCE_TEAM' },
        { id: 'usr-5', name: 'Eve Admin', role: 'ADMIN' },
    ],
    activities: [
        { id: generateUniqueId(), type: 'Purchase Request', description: 'PR-1234 submitted by Alice Employee', date: '2023-10-26', status: 'PENDING', entityId: 'PR-1234' },
        { id: generateUniqueId(), type: 'Purchase Order', description: 'PO-5678 issued to Vendor X', date: '2023-10-25', status: 'DRAFT', entityId: 'PO-5678' },
        { id: generateUniqueId(), type: 'Vendor Onboarding', description: 'New vendor Global Suppliers Ltd. in review', date: '2023-10-24', status: 'IN_REVIEW', entityId: 'VEN-9012' },
        { id: generateUniqueId(), type: 'Purchase Request', description: 'PR-1235 approved by Bob Manager', date: '2023-10-23', status: 'APPROVED', entityId: 'PR-1235' },
        { id: generateUniqueId(), type: 'Purchase Order', description: 'PO-5679 payment due for Vendor Y', date: '2023-10-22', status: 'OVERDUE', entityId: 'PO-5679' },
    ]
};

// --- Auth Context (Simplified) ---
const AuthContext = createContext(null);

// --- Main App Component ---
const App = () => {
    const [view, setView] = useState({ screen: 'DASHBOARD', params: {} });
    const [user, setUser] = useState(dummyData.users[0]); // Default to Employee for demo
    const [purchaseRequests, setPurchaseRequests] = useState(dummyData.purchaseRequests);
    const [purchaseOrders, setPurchaseOrders] = useState(dummyData.purchaseOrders);
    const [vendors, setVendors] = useState(dummyData.vendors);

    const hasAccess = (screenName) => {
        return user?.role && ROLES[user.role]?.includes(screenName);
    };

    const navigate = (screenName, params = {}) => {
        if (!hasAccess(screenName)) {
            alert(`Access Denied: ${user?.role} does not have access to ${screenName}`);
            return;
        }
        setView({ screen: screenName, params: params });
    };

    const handleLogout = () => {
        setUser(null); // Simple logout
        navigate('LOGIN'); // Assuming a login screen
    };

    const handleSubmitPR = (formData) => {
        const newPR = {
            id: generateUniqueId(),
            ...formData,
            status: 'PENDING', // New PRs always start as PENDING
            submissionDate: new Date().toISOString().split('T')[0],
            requestedBy: user?.name,
            auditLog: [{ id: generateUniqueId(), timestamp: new Date().toISOString(), user: user?.name, action: 'Created PR' }],
            currentStage: 'submitted',
        };
        setPurchaseRequests((prev) => [...prev, newPR]);
        navigate('PR_LIST');
    };

    const handleUpdatePR = (id, updatedFields) => {
        setPurchaseRequests((prev) =>
            prev.map((pr) =>
                pr.id === id
                    ? {
                          ...pr,
                          ...updatedFields,
                          auditLog: [...(pr.auditLog || []), { id: generateUniqueId(), timestamp: new Date().toISOString(), user: user?.name, action: `Updated PR (Status: ${updatedFields?.status || pr.status})` }],
                      }
                    : pr
            )
        );
        navigate('PR_DETAIL', { id: id });
    };

    const handleApprovePR = (id) => {
        handleUpdatePR(id, { status: 'APPROVED', approvalDate: new Date().toISOString().split('T')[0], currentStage: 'approved' });
    };

    const handleRejectPR = (id) => {
        handleUpdatePR(id, { status: 'REJECTED', currentStage: 'approved' }); // Final stage regardless of approval/rejection for workflow path
    };

    const handleSubmitPO = (formData) => {
        const newPO = {
            id: generateUniqueId(),
            ...formData,
            status: 'DRAFT',
            issueDate: new Date().toISOString().split('T')[0],
            auditLog: [{ id: generateUniqueId(), timestamp: new Date().toISOString(), user: user?.name, action: 'Created PO' }],
            currentStage: 'draft',
        };
        setPurchaseOrders((prev) => [...prev, newPO]);
        navigate('PO_LIST');
    };

    const handleUpdatePO = (id, updatedFields) => {
        setPurchaseOrders((prev) =>
            prev.map((po) =>
                po.id === id
                    ? {
                          ...po,
                          ...updatedFields,
                          auditLog: [...(po.auditLog || []), { id: generateUniqueId(), timestamp: new Date().toISOString(), user: user?.name, action: `Updated PO (Status: ${updatedFields?.status || po.status})` }],
                      }
                    : po
            )
        );
        navigate('PO_DETAIL', { id: id });
    };

    const handleAddVendor = (formData) => {
        const newVendor = {
            id: generateUniqueId(),
            ...formData,
            status: 'DRAFT',
            onboardingDate: new Date().toISOString().split('T')[0],
            performanceScore: 'N/A',
            contracts: 0,
            auditLog: [{ id: generateUniqueId(), timestamp: new Date().toISOString(), user: user?.name, action: 'Created Vendor' }],
        };
        setVendors((prev) => [...prev, newVendor]);
        navigate('VENDOR_LIST');
    };

    const handleUpdateVendor = (id, updatedFields) => {
        setVendors((prev) =>
            prev.map((vendor) =>
                vendor.id === id
                    ? {
                          ...vendor,
                          ...updatedFields,
                          auditLog: [...(vendor.auditLog || []), { id: generateUniqueId(), timestamp: new Date().toISOString(), user: user?.name, action: `Updated Vendor (Status: ${updatedFields?.status || vendor.status})` }],
                      }
                    : vendor
            )
        );
        navigate('VENDOR_DETAIL', { id: id });
    };

    const getBreadcrumbs = () => {
        const breadcrumbs = [{ label: 'Home', screen: 'DASHBOARD' }];
        if (view.screen !== 'DASHBOARD') {
            const screenLabelMap = {
                PR_LIST: 'Purchase Requests',
                PR_DETAIL: 'PR Details',
                PR_FORM: view.params.id ? 'Edit PR' : 'New PR',
                PO_LIST: 'Purchase Orders',
                PO_DETAIL: 'PO Details',
                PO_FORM: view.params.id ? 'Edit PO' : 'New PO',
                VENDOR_LIST: 'Vendors',
                VENDOR_DETAIL: 'Vendor Details',
                VENDOR_FORM: view.params.id ? 'Edit Vendor' : 'New Vendor',
                APPROVALS_LIST: 'My Approvals',
                ADMIN_SETTINGS: 'Admin Settings',
                PAYMENT_TRACKING_LIST: 'Payment Tracking'
            };
            const currentLabel = screenLabelMap[view.screen] || view.screen.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            breadcrumbs.push({ label: currentLabel, screen: view.screen, params: view.params });

            if (view.screen.endsWith('_DETAIL') && view.params.id) {
                const entityName = view.screen === 'PR_DETAIL' ? 'PR' : view.screen === 'PO_DETAIL' ? 'PO' : 'Vendor';
                breadcrumbs.pop(); // Remove the generic 'Details' label
                breadcrumbs.push({ label: `${entityName} #${view.params.id}`, screen: view.screen, params: view.params });
            }
        }
        return breadcrumbs;
    };

    const Breadcrumbs = ({ crumbs }) => (
        <div className="breadcrumbs">
            {crumbs.map((crumb, index) => (
                <React.Fragment key={crumb.screen}>
                    <span
                        className="breadcrumb-item"
                        style={{ color: index === crumbs.length - 1 ? 'var(--color-primary-700)' : 'inherit' }}
                        onClick={() => (index < crumbs.length - 1) && navigate(crumb.screen, crumb.params)}
                    >
                        {crumb.label}
                    </span>
                    {(index < crumbs.length - 1) && <span className="breadcrumb-separator">/</span>}
                </React.Fragment>
            ))}
        </div>
    );

    const getCurrentWorkflow = (entityType, currentStatus) => {
        const stages = WorkflowStages[entityType];
        if (!stages) return [];

        let foundActive = false;
        return stages.map((stage, index) => {
            const isCurrent = stage.status.includes(currentStatus);
            if (isCurrent) foundActive = true;
            const isCompleted = !foundActive && index < stages.findIndex(s => s.status.includes(currentStatus));
            const slaBreach = (currentStatus === 'PENDING' || currentStatus === 'IN_REVIEW') && dummyData.purchaseRequests.find(pr => pr.id === view.params.id)?.slaBreach; // Placeholder logic

            return {
                ...stage,
                active: isCurrent,
                completed: isCompleted,
                slaBreach: slaBreach && isCurrent,
            };
        });
    };

    const renderScreen = () => {
        if (!user) {
            return (
                <div style={{ padding: 'var(--spacing-3xl)', textAlign: 'center' }}>
                    <h2 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--spacing-lg)' }}>Welcome to Procurement Platform</h2>
                    <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-xl)' }}>Please select your role to proceed:</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                        {Object.keys(ROLES).map((role) => (
                            <button
                                key={role}
                                className="button button-primary"
                                style={{ backgroundColor: 'var(--color-primary-500)' }}
                                onClick={() => setUser(dummyData.users.find(u => u.role === role))}
                            >
                                Login as {role.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        switch (view.screen) {
            case 'DASHBOARD':
                return <Dashboard navigate={navigate} user={user} purchaseRequests={purchaseRequests} purchaseOrders={purchaseOrders} activities={dummyData.activities} />;
            case 'PR_LIST':
                return <PurchaseRequestList navigate={navigate} user={user} purchaseRequests={purchaseRequests} />;
            case 'PR_DETAIL':
                return (
                    <PurchaseRequestDetail
                        navigate={navigate}
                        user={user}
                        pr={purchaseRequests.find((pr) => pr.id === view.params.id)}
                        onApprove={handleApprovePR}
                        onReject={handleRejectPR}
                        onEdit={() => navigate('PR_FORM', { id: view.params.id })}
                        getCurrentWorkflow={getCurrentWorkflow}
                    />
                );
            case 'PR_FORM':
                return (
                    <PurchaseRequestForm
                        navigate={navigate}
                        user={user}
                        pr={view.params.id ? purchaseRequests.find((pr) => pr.id === view.params.id) : null}
                        onSubmit={view.params.id ? handleUpdatePR : handleSubmitPR}
                    />
                );
            case 'PO_LIST':
                return <PurchaseOrderList navigate={navigate} user={user} purchaseOrders={purchaseOrders} />;
            case 'PO_DETAIL':
                return (
                    <PurchaseOrderDetail
                        navigate={navigate}
                        user={user}
                        po={purchaseOrders.find((po) => po.id === view.params.id)}
                        onEdit={() => navigate('PO_FORM', { id: view.params.id })}
                        getCurrentWorkflow={getCurrentWorkflow}
                    />
                );
            case 'PO_FORM':
                return (
                    <PurchaseOrderForm
                        navigate={navigate}
                        user={user}
                        po={view.params.id ? purchaseOrders.find((po) => po.id === view.params.id) : null}
                        onSubmit={handleUpdatePO}
                        purchaseRequests={purchaseRequests}
                        vendors={vendors}
                    />
                );
            case 'VENDOR_LIST':
                return <VendorList navigate={navigate} user={user} vendors={vendors} />;
            case 'VENDOR_DETAIL':
                return (
                    <VendorDetail
                        navigate={navigate}
                        user={user}
                        vendor={vendors.find((vendor) => vendor.id === view.params.id)}
                        onEdit={() => navigate('VENDOR_FORM', { id: view.params.id })}
                        purchaseOrders={purchaseOrders}
                    />
                );
            case 'VENDOR_FORM':
                return (
                    <VendorForm
                        navigate={navigate}
                        user={user}
                        vendor={view.params.id ? vendors.find((vendor) => vendor.id === view.params.id) : null}
                        onSubmit={view.params.id ? handleUpdateVendor : handleAddVendor}
                    />
                );
            case 'APPROVALS_LIST':
                const pendingApprovals = purchaseRequests.filter(pr => pr.status === 'PENDING' || pr.status === 'IN_REVIEW');
                return (
                    <ApprovalList
                        navigate={navigate}
                        user={user}
                        pendingApprovals={pendingApprovals}
                        onApprove={handleApprovePR}
                        onReject={handleRejectPR}
                    />
                );
            case 'ADMIN_SETTINGS':
                return <AdminSettings navigate={navigate} user={user} />;
            case 'PAYMENT_TRACKING_LIST':
                return <PaymentTrackingList navigate={navigate} user={user} purchaseOrders={purchaseOrders} />;
            default:
                return (
                    <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
                        <h2 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-red-600)' }}>404 - Screen Not Found</h2>
                        <button className="button button-primary" style={{ marginTop: 'var(--spacing-md)' }} onClick={() => navigate('DASHBOARD')}>Go to Dashboard</button>
                    </div>
                );
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, hasAccess }}>
            <div className="app-container">
                {user && (
                    <header className="header">
                        <div className="header-left">
                            <a href="#" className="app-logo" onClick={() => navigate('DASHBOARD')}>ProcureFlow</a>
                            <Breadcrumbs crumbs={getBreadcrumbs()} />
                        </div>
                        <div className="header-right">
                            <div className="global-search-container">
                                <input type="text" placeholder="Global Search..." className="global-search-input" />
                            </div>
                            <div className="user-menu">
                                <button onClick={() => navigate('PROFILE')}>
                                    {user?.name} ({user?.role})
                                </button>
                                <button className="button button-secondary" onClick={handleLogout} style={{ marginLeft: 'var(--spacing-sm)' }}>Logout</button>
                            </div>
                        </div>
                    </header>
                )}
                <main className="main-content">
                    {renderScreen()}
                </main>
            </div>
        </AuthContext.Provider>
    );
};

// --- Child Components (Simplified for brevity, focusing on structure) ---

const Dashboard = ({ navigate, user, purchaseRequests, purchaseOrders, activities }) => {
    const managerApprovals = purchaseRequests.filter(pr => pr.status === 'PENDING' || pr.status === 'IN_REVIEW');
    const myRequests = purchaseRequests.filter(pr => pr.requestedBy === user?.name);

    return (
        <div>
            <div className="screen-header">
                <h1 className="screen-title">Dashboard</h1>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button className="button button-primary" onClick={() => navigate('PR_FORM')}>New Request</button>
                    {user?.role === 'PROCUREMENT_OFFICER' && (
                        <button className="button button-secondary" onClick={() => navigate('PO_FORM')}>New PO</button>
                    )}
                </div>
            </div>

            <section className="dashboard-metrics">
                <div className="metric-card">
                    <span className="metric-title">Total Spend (YTD)</span>
                    <span className="metric-value">$1.2M</span>
                    <span className="metric-change positive">▲ 5% vs Last Year</span>
                </div>
                <div className="metric-card">
                    <span className="metric-title">Pending Approvals</span>
                    <span className="metric-value">{managerApprovals.length}</span>
                    <span className="metric-change negative">▼ 2 this week</span>
                </div>
                <div className="metric-card">
                    <span className="metric-title">Active Vendors</span>
                    <span className="metric-value">128</span>
                    <span className="metric-change positive">▲ 2 new</span>
                </div>
                <div className="metric-card">
                    <span className="metric-title">SLA Breach Rate</span>
                    <span className="metric-value" style={{ color: 'var(--color-red-600)' }}>8%</span>
                    <span className="metric-change negative">▲ 1%</span>
                </div>
            </section>

            <section className="dashboard-sections">
                <div className="dashboard-section">
                    <h2 className="dashboard-section-title">My Recent Purchase Requests</h2>
                    {myRequests.slice(0, 3).map((pr) => (
                        <Card
                            key={pr.id}
                            title={pr.title}
                            subtitle={`Amount: $${pr.amount}`}
                            meta={`Status: ${STATUS_MAP[pr.status]?.label || pr.status} | Submitted: ${pr.submissionDate}`}
                            status={pr.status}
                            onClick={() => navigate('PR_DETAIL', { id: pr.id })}
                        />
                    ))}
                    {myRequests.length === 0 && <p style={{ color: 'var(--color-gray-500)' }}>No requests found. <a href="#" onClick={() => navigate('PR_FORM')}>Submit a new one.</a></p>}
                    <button className="button button-secondary" style={{ marginTop: 'var(--spacing-md)', width: '100%' }} onClick={() => navigate('PR_LIST')}>
                        View All My Requests
                    </button>
                </div>

                {user?.role === 'MANAGER' && (
                    <div className="dashboard-section">
                        <h2 className="dashboard-section-title">Pending Approvals</h2>
                        {managerApprovals.slice(0, 3).map((pr) => (
                            <Card
                                key={pr.id}
                                title={pr.title}
                                subtitle={`Requested by: ${pr.requestedBy} | Amount: $${pr.amount}`}
                                meta={`Status: ${STATUS_MAP[pr.status]?.label || pr.status} | Submitted: ${pr.submissionDate}`}
                                status={pr.status}
                                onClick={() => navigate('PR_DETAIL', { id: pr.id })}
                            />
                        ))}
                        {managerApprovals.length === 0 && <p style={{ color: 'var(--color-gray-500)' }}>No pending approvals.</p>}
                        <button className="button button-secondary" style={{ marginTop: 'var(--spacing-md)', width: '100%' }} onClick={() => navigate('APPROVALS_LIST')}>
                            View All Approvals
                        </button>
                    </div>
                )}

                <div className="dashboard-section">
                    <h2 className="dashboard-section-title">Spend by Department</h2>
                    <div className="chart-placeholder">Bar Chart: Spend by Department</div>
                    <button className="button button-secondary" style={{ marginTop: 'var(--spacing-md)', width: '100%' }} onClick={() => alert('Exporting chart...')}>
                        Export Chart
                    </button>
                </div>

                <div className="dashboard-section">
                    <h2 className="dashboard-section-title">Recent Activities</h2>
                    <div className="activity-list">
                        {activities.slice(0, 5).map((activity) => (
                            <Card
                                key={activity.id}
                                title={activity.description}
                                subtitle={activity.type}
                                meta={`Date: ${activity.date}`}
                                status={activity.status}
                                onClick={() => navigate(activity.type === 'Purchase Request' ? 'PR_DETAIL' : activity.type === 'Purchase Order' ? 'PO_DETAIL' : 'VENDOR_DETAIL', { id: activity.entityId })}
                            />
                        ))}
                    </div>
                    {activities.length === 0 && <p style={{ color: 'var(--color-gray-500)' }}>No recent activity.</p>}
                </div>
            </section>
        </div>
    );
};

const Card = ({ title, subtitle, meta, status, onClick, children }) => (
    <div className={`card card-status-${status}`} onClick={onClick} style={{ position: 'relative' }}>
        <h3 className="card-title">{title}</h3>
        <p className="card-subtitle">{subtitle}</p>
        {children}
        <div className="card-meta">
            {meta}
            <span className={`status-badge ${STATUS_MAP[status]?.color || 'status-DRAFT'}`}>
                {STATUS_MAP[status]?.label || status}
            </span>
        </div>
    </div>
);

const PurchaseRequestList = ({ navigate, user, purchaseRequests }) => {
    const hasCreateAccess = user?.role === 'EMPLOYEE' || user?.role === 'MANAGER' || user?.role === 'PROCUREMENT_OFFICER';

    return (
        <div>
            <div className="screen-header">
                <h1 className="screen-title">Purchase Requests</h1>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button className="button button-secondary">Filter</button>
                    <button className="button button-secondary">Sort</button>
                    {hasCreateAccess && (
                        <button className="button button-primary" onClick={() => navigate('PR_FORM')}>New Request</button>
                    )}
                </div>
            </div>
            <div className="card-grid">
                {purchaseRequests.map((pr) => (
                    <Card
                        key={pr.id}
                        title={pr.title}
                        subtitle={`Amount: $${pr.amount} | Dept: ${pr.department}`}
                        meta={`Requested by: ${pr.requestedBy} | Submitted: ${pr.submissionDate}`}
                        status={pr.status}
                        onClick={() => navigate('PR_DETAIL', { id: pr.id })}
                    />
                ))}
            </div>
            {(purchaseRequests?.length || 0) === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', backgroundColor: 'var(--color-white)', borderRadius: 'var(--border-radius-md)', marginTop: 'var(--spacing-lg)' }}>
                    <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-md)' }}>No Purchase Requests found.</p>
                    {hasCreateAccess && (
                        <button className="button button-primary" onClick={() => navigate('PR_FORM')}>Create New Purchase Request</button>
                    )}
                </div>
            )}
        </div>
    );
};

const PurchaseRequestDetail = ({ navigate, user, pr, onApprove, onReject, onEdit, getCurrentWorkflow }) => {
    if (!pr) {
        return (
            <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
                <h2 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-red-600)' }}>Purchase Request Not Found</h2>
                <button className="button button-primary" style={{ marginTop: 'var(--spacing-md)' }} onClick={() => navigate('PR_LIST')}>Back to List</button>
            </div>
        );
    }

    const canApprove = (user?.role === 'MANAGER' && (pr.status === 'PENDING' || pr.status === 'IN_REVIEW')) || user?.role === 'ADMIN' || user?.role === 'PROCUREMENT_OFFICER';
    const canEdit = pr.status === 'DRAFT' || user?.role === 'ADMIN'; // Example: only draft or admin can edit
    const workflowStages = getCurrentWorkflow('PURCHASE_REQUEST', pr.status);

    const relatedPo = dummyData.purchaseOrders.find(po => po.prId === pr.id);

    const renderAuditLog = (logs) => (
        <div className="audit-log">
            <h3 className="detail-section-title">Audit Log</h3>
            {logs?.length > 0 ? (
                logs.map((log) => (
                    <div key={log.id} className="audit-log-entry">
                        <strong>{log.action}</strong> by {log.user}
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                ))
            ) : (
                <p style={{ color: 'var(--color-gray-500)' }}>No audit history available.</p>
            )}
        </div>
    );

    return (
        <div className="detail-view">
            <div className="detail-header">
                <div>
                    <h1 className="detail-title">{pr.title} <span className={`status-badge ${STATUS_MAP[pr.status]?.color}`}>{STATUS_MAP[pr.status]?.label}</span></h1>
                    <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-gray-600)' }}>PR ID: {pr.id}</p>
                </div>
                <div className="detail-actions">
                    {canEdit && <button className="button button-secondary" onClick={() => onEdit()}>Edit</button>}
                    {canApprove && (pr.status === 'PENDING' || pr.status === 'IN_REVIEW') && (
                        <>
                            <button className="button button-primary" onClick={() => onApprove(pr.id)}>Approve</button>
                            <button className="button button-secondary" style={{ backgroundColor: 'var(--color-red-50)', color: 'var(--color-red-700)', borderColor: 'var(--color-red-200)' }} onClick={() => onReject(pr.id)}>Reject</button>
                        </>
                    )}
                </div>
            </div>

            <div className="workflow-tracker" style={{ marginBottom: 'var(--spacing-xl)' }}>
                {workflowStages.map((stage, index) => (
                    <div key={stage.id} className={`workflow-stage ${stage.active ? 'active' : ''} ${stage.completed ? 'completed' : ''} ${stage.slaBreach ? 'sla-breach' : ''}`}>
                        <div className="workflow-stage-dot">
                            {stage.completed ? '✓' : index + 1}
                        </div>
                        <span className="workflow-stage-name">{stage.name}</span>
                    </div>
                ))}
            </div>

            <div className="detail-grid">
                <div className="detail-section">
                    <h2 className="detail-section-title">Request Details</h2>
                    <div className="detail-item">
                        <span className="detail-label">Requested By</span>
                        <span className="detail-value">{pr.requestedBy}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Department</span>
                        <span className="detail-value">{pr.department}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Amount</span>
                        <span className="detail-value">{pr.currency} {pr.amount}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Submission Date</span>
                        <span className="detail-value">{pr.submissionDate}</span>
                    </div>
                    {pr.approvalDate && (
                        <div className="detail-item">
                            <span className="detail-label">Approval Date</span>
                            <span className="detail-value">{pr.approvalDate}</span>
                        </div>
                    )}
                    <div className="detail-item">
                        <span className="detail-label">Description</span>
                        <span className="detail-value">{pr.description}</span>
                    </div>
                </div>

                <div className="detail-section">
                    <h2 className="detail-section-title">Approval Status</h2>
                    <div className="detail-item">
                        <span className="detail-label">Manager Approval</span>
                        <span className="detail-value">{pr.managerApproval}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Procurement Approval</span>
                        <span className="detail-value">{pr.procurementApproval}</span>
                    </div>
                    {pr.slaBreach && (
                        <div className="detail-item">
                            <span className="detail-label" style={{ color: 'var(--color-red-700)' }}>SLA Status</span>
                            <span className="detail-value" style={{ color: 'var(--color-red-700)', fontWeight: 'var(--font-weight-bold)' }}>BREACHED</span>
                        </div>
                    )}
                </div>

                <div className="detail-section">
                    <h2 className="detail-section-title">Attachments</h2>
                    {(pr.attachments?.length || 0) > 0 ? (
                        pr.attachments.map((file, index) => (
                            <div key={index} className="detail-item">
                                <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-700)', textDecoration: 'none' }}>
                                    {file.name} (Preview)
                                </a>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: 'var(--color-gray-500)' }}>No attachments.</p>
                    )}
                </div>

                <div className="detail-section">
                    <h2 className="detail-section-title">Related Records</h2>
                    {relatedPo ? (
                        <div className="related-records-list">
                            <div className="related-record-card" onClick={() => navigate('PO_DETAIL', { id: relatedPo.id })}>
                                <div className="related-record-card-title">Purchase Order: {relatedPo.poNumber}</div>
                                <div className="related-record-card-meta">
                                    <span>Vendor: {relatedPo.vendorName}</span>
                                    <span>Amount: {relatedPo.currency} {relatedPo.amount}</span>
                                    <span className={`status-badge ${STATUS_MAP[relatedPo.status]?.color || 'status-DRAFT'}`} style={{ marginLeft: 'var(--spacing-xs)' }}>
                                        {STATUS_MAP[relatedPo.status]?.label || relatedPo.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--color-gray-500)' }}>No related Purchase Orders.</p>
                    )}
                </div>

                {user?.role === 'ADMIN' && (
                    <div className="detail-section" style={{ gridColumn: '1 / -1' }}>
                        {renderAuditLog(pr.auditLog)}
                    </div>
                )}
            </div>
        </div>
    );
};

const PurchaseRequestForm = ({ navigate, user, pr, onSubmit }) => {
    const isEditing = !!pr;
    const [formData, setFormData] = useState({
        title: pr?.title || '',
        description: pr?.description || '',
        department: pr?.department || '',
        amount: pr?.amount || '',
        currency: pr?.currency || 'USD',
        attachments: pr?.attachments || [],
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' })); // Clear error on change
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files).map(file => ({ name: file.name, url: URL.createObjectURL(file) }));
        setFormData((prev) => ({ ...prev, attachments: [...prev.attachments, ...files] }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Title is mandatory.';
        if (!formData.description.trim()) newErrors.description = 'Description is mandatory.';
        if (!formData.department.trim()) newErrors.department = 'Department is mandatory.';
        if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Amount must be a positive number.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(pr?.id, formData);
        }
    };

    return (
        <div className="form-container">
            <h1 className="screen-title" style={{ marginBottom: 'var(--spacing-lg)' }}>{isEditing ? 'Edit Purchase Request' : 'New Purchase Request'}</h1>
            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="title" className="form-label">Title <span style={{ color: 'var(--color-red-600)' }}>*</span></label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="form-input"
                            aria-required="true"
                        />
                        {errors.title && <p className="form-error">{errors.title}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="department" className="form-label">Department <span style={{ color: 'var(--color-red-600)' }}>*</span></label>
                        <select
                            id="department"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className="form-select"
                            aria-required="true"
                        >
                            <option value="">Select Department</option>
                            <option value="IT">IT</option>
                            <option value="HR">HR</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Finance">Finance</option>
                            <option value="Operations">Operations</option>
                        </select>
                        {errors.department && <p className="form-error">{errors.department}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="amount" className="form-label">Amount <span style={{ color: 'var(--color-red-600)' }}>*</span></label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            className="form-input"
                            aria-required="true"
                        />
                        {errors.amount && <p className="form-error">{errors.amount}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="currency" className="form-label">Currency</label>
                        <select
                            id="currency"
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            className="form-select"
                        >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="description" className="form-label">Description <span style={{ color: 'var(--color-red-600)' }}>*</span></label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="form-textarea"
                            aria-required="true"
                        ></textarea>
                        {errors.description && <p className="form-error">{errors.description}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="attachments" className="form-label">Attachments</label>
                        <input
                            type="file"
                            id="attachments"
                            name="attachments"
                            multiple
                            onChange={handleFileChange}
                            className="form-input"
                            style={{ padding: 'var(--spacing-sm)' }}
                        />
                        <div style={{ marginTop: 'var(--spacing-xs)' }}>
                            {formData.attachments.map((file, index) => (
                                <span key={index} style={{ display: 'inline-block', backgroundColor: 'var(--color-gray-100)', padding: 'var(--spacing-xs)', borderRadius: 'var(--border-radius-sm)', marginRight: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)' }}>
                                    {file.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="form-actions">
                    <button type="button" className="button button-secondary" onClick={() => navigate('PR_LIST')}>Cancel</button>
                    <button type="submit" className="button button-primary">{isEditing ? 'Update Request' : 'Submit Request'}</button>
                </div>
            </form>
        </div>
    );
};

const PurchaseOrderList = ({ navigate, user, purchaseOrders }) => {
    const { hasAccess } = useContext(AuthContext);
    const canCreate = hasAccess('PO_FORM');
    return (
        <div>
            <div className="screen-header">
                <h1 className="screen-title">Purchase Orders</h1>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button className="button button-secondary">Filter</button>
                    <button className="button button-secondary">Sort</button>
                    {canCreate && (
                        <button className="button button-primary" onClick={() => navigate('PO_FORM')}>New PO</button>
                    )}
                </div>
            </div>
            <div className="card-grid">
                {purchaseOrders.map((po) => (
                    <Card
                        key={po.id}
                        title={`PO-${po.poNumber} for ${po.item}`}
                        subtitle={`Vendor: ${po.vendorName} | Amount: ${po.currency} ${po.amount}`}
                        meta={`Issue Date: ${po.issueDate} | Delivery: ${po.deliveryDate}`}
                        status={po.status}
                        onClick={() => navigate('PO_DETAIL', { id: po.id })}
                    />
                ))}
            </div>
            {(purchaseOrders?.length || 0) === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', backgroundColor: 'var(--color-white)', borderRadius: 'var(--border-radius-md)', marginTop: 'var(--spacing-lg)' }}>
                    <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-md)' }}>No Purchase Orders found.</p>
                    {canCreate && (
                        <button className="button button-primary" onClick={() => navigate('PO_FORM')}>Create New Purchase Order</button>
                    )}
                </div>
            )}
        </div>
    );
};

const PurchaseOrderDetail = ({ navigate, user, po, onEdit, getCurrentWorkflow }) => {
    if (!po) {
        return (
            <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
                <h2 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-red-600)' }}>Purchase Order Not Found</h2>
                <button className="button button-primary" style={{ marginTop: 'var(--spacing-md)' }} onClick={() => navigate('PO_LIST')}>Back to List</button>
            </div>
        );
    }

    const canEdit = po.status === 'DRAFT' || user?.role === 'ADMIN' || user?.role === 'PROCUREMENT_OFFICER';
    const workflowStages = getCurrentWorkflow('PURCHASE_ORDER', po.status);
    const relatedPr = dummyData.purchaseRequests.find(pr => pr.relatedPoId === po.id);
    const relatedVendor = dummyData.vendors.find(vendor => vendor.id === po.vendorId);

    const renderAuditLog = (logs) => (
        <div className="audit-log">
            <h3 className="detail-section-title">Audit Log</h3>
            {logs?.length > 0 ? (
                logs.map((log) => (
                    <div key={log.id} className="audit-log-entry">
                        <strong>{log.action}</strong> by {log.user}
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                ))
            ) : (
                <p style={{ color: 'var(--color-gray-500)' }}>No audit history available.</p>
            )}
        </div>
    );

    return (
        <div className="detail-view">
            <div className="detail-header">
                <div>
                    <h1 className="detail-title">PO-{po.poNumber} <span className={`status-badge ${STATUS_MAP[po.status]?.color}`}>{STATUS_MAP[po.status]?.label}</span></h1>
                    <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-gray-600)' }}>PO ID: {po.id}</p>
                </div>
                <div className="detail-actions">
                    {canEdit && <button className="button button-secondary" onClick={() => onEdit()}>Edit</button>}
                    {/* Add more PO specific actions like 'Mark as Received', 'Process Payment' */}
                    {user?.role === 'FINANCE_TEAM' && po.status !== 'PAID' && (
                        <button className="button button-primary" onClick={() => alert('Process Payment for PO: ' + po.poNumber)}>Process Payment</button>
                    )}
                </div>
            </div>

            <div className="workflow-tracker" style={{ marginBottom: 'var(--spacing-xl)' }}>
                {workflowStages.map((stage, index) => (
                    <div key={stage.id} className={`workflow-stage ${stage.active ? 'active' : ''} ${stage.completed ? 'completed' : ''} ${stage.slaBreach ? 'sla-breach' : ''}`}>
                        <div className="workflow-stage-dot">
                            {stage.completed ? '✓' : index + 1}
                        </div>
                        <span className="workflow-stage-name">{stage.name}</span>
                    </div>
                ))}
            </div>

            <div className="detail-grid">
                <div className="detail-section">
                    <h2 className="detail-section-title">Order Details</h2>
                    <div className="detail-item">
                        <span className="detail-label">Item</span>
                        <span className="detail-value">{po.item}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Vendor</span>
                        <span className="detail-value">{po.vendorName}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Amount</span>
                        <span className="detail-value">{po.currency} {po.amount}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Issue Date</span>
                        <span className="detail-value">{po.issueDate}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Delivery Date</span>
                        <span className="detail-value">{po.deliveryDate}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Payment Terms</span>
                        <span className="detail-value">{po.paymentTerms}</span>
                    </div>
                    {po.slaBreach && (
                        <div className="detail-item">
                            <span className="detail-label" style={{ color: 'var(--color-red-700)' }}>SLA Status</span>
                            <span className="detail-value" style={{ color: 'var(--color-red-700)', fontWeight: 'var(--font-weight-bold)' }}>BREACHED</span>
                        </div>
                    )}
                </div>

                <div className="detail-section">
                    <h2 className="detail-section-title">Related Records</h2>
                    {relatedPr && (
                        <div className="related-records-list">
                            <div className="related-record-card" onClick={() => navigate('PR_DETAIL', { id: relatedPr.id })}>
                                <div className="related-record-card-title">Purchase Request: {relatedPr.title}</div>
                                <div className="related-record-card-meta">
                                    <span>Requested by: {relatedPr.requestedBy}</span>
                                    <span>Amount: {relatedPr.currency} {relatedPr.amount}</span>
                                    <span className={`status-badge ${STATUS_MAP[relatedPr.status]?.color || 'status-DRAFT'}`} style={{ marginLeft: 'var(--spacing-xs)' }}>
                                        {STATUS_MAP[relatedPr.status]?.label || relatedPr.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    {relatedVendor && (
                        <div className="related-records-list" style={{ marginTop: relatedPr ? 'var(--spacing-md)' : '0' }}>
                             <div className="related-record-card" onClick={() => navigate('VENDOR_DETAIL', { id: relatedVendor.id })}>
                                <div className="related-record-card-title">Vendor: {relatedVendor.name}</div>
                                <div className="related-record-card-meta">
                                    <span>Contact: {relatedVendor.contactPerson}</span>
                                    <span>Category: {relatedVendor.category}</span>
                                    <span className={`status-badge ${STATUS_MAP[relatedVendor.status]?.color || 'status-DRAFT'}`} style={{ marginLeft: 'var(--spacing-xs)' }}>
                                        {STATUS_MAP[relatedVendor.status]?.label || relatedVendor.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    {(!relatedPr && !relatedVendor) && <p style={{ color: 'var(--color-gray-500)' }}>No related records.</p>}
                </div>

                {user?.role === 'ADMIN' && (
                    <div className="detail-section" style={{ gridColumn: '1 / -1' }}>
                        {renderAuditLog(po.auditLog)}
                    </div>
                )}
            </div>
        </div>
    );
};

const PurchaseOrderForm = ({ navigate, user, po, onSubmit, purchaseRequests, vendors }) => {
    const isEditing = !!po;
    const [formData, setFormData] = useState({
        prId: po?.prId || '',
        vendorId: po?.vendorId || '',
        item: po?.item || '',
        poNumber: po?.poNumber || '',
        amount: po?.amount || '',
        currency: po?.currency || 'USD',
        issueDate: po?.issueDate || new Date().toISOString().split('T')[0],
        deliveryDate: po?.deliveryDate || '',
        paymentTerms: po?.paymentTerms || 'Net 30',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (formData.prId) {
            const selectedPr = purchaseRequests.find(pr => pr.id === formData.prId);
            if (selectedPr) {
                // Auto-populate fields from PR
                setFormData(prev => ({
                    ...prev,
                    amount: selectedPr.amount,
                    currency: selectedPr.currency,
                    item: selectedPr.title, // Use PR title as PO item
                }));
            }
        }
    }, [formData.prId, purchaseRequests]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.prId.trim()) newErrors.prId = 'Related Purchase Request is mandatory.';
        if (!formData.vendorId.trim()) newErrors.vendorId = 'Vendor is mandatory.';
        if (!formData.item.trim()) newErrors.item = 'Item is mandatory.';
        if (!formData.poNumber.trim()) newErrors.poNumber = 'PO Number is mandatory.';
        if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Amount must be a positive number.';
        if (!formData.deliveryDate.trim()) newErrors.deliveryDate = 'Delivery Date is mandatory.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            // Auto-populate vendorName from vendorId
            const selectedVendor = vendors.find(v => v.id === formData.vendorId);
            const finalFormData = {
                ...formData,
                vendorName: selectedVendor?.name || 'Unknown Vendor',
            };
            onSubmit(po?.id, finalFormData);
        }
    };

    return (
        <div className="form-container">
            <h1 className="screen-title" style={{ marginBottom: 'var(--spacing-lg)' }}>{isEditing ? 'Edit Purchase Order' : 'New Purchase Order'}</h1>
            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="prId" className="form-label">Related Purchase Request <span style={{ color: 'var(--color-red-600)' }}>*</span></label>
                        <select
                            id="prId"
                            name="prId"
                            value={formData.prId}
                            onChange={handleChange}
                            className="form-select"
                            aria-required="true"
                        >
                            <option value="">Select PR</option>
                            {purchaseRequests.map(pr => (
                                <option key={pr.id} value={pr.id}>PR-{pr.id} - {pr.title}</option>
                            ))}
                        </select>
                        {errors.prId && <p className="form-error">{errors.prId}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="vendorId" className="form-label">Vendor <span style={{ color: 'var(--color-red-600)' }}>*</span></label>
                        <select
                            id="vendorId"
                            name="vendorId"
                            value={formData.vendorId}
                            onChange={handleChange}
                            className="form-select"
                            aria-required="true"
                        >
                            <option value="">Select Vendor</option>
                            {vendors.map(vendor => (
                                <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                            ))}
                        </select>
                        {errors.vendorId && <p className="form-error">{errors.vendorId}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="poNumber" className="form-label">PO Number <span style={{ color: 'var(--color-red-600)' }}>*</span></label>
                        <input
                            type="text"
                            id="poNumber"
                            name="poNumber"
                            value={formData.poNumber}
                            onChange={handleChange}
                            className="form-input"
                            aria-required="true"
                        />
                        {errors.poNumber && <p className="form-error">{errors.poNumber}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="item" className="form-label">Item <span style={{ color: 'var(--color-red-600)' }}>*</span></label>
                        <input
                            type="text"
                            id="item"
                            name="item"
                            value={formData.item}
                            onChange={handleChange}
                            className="form-input"
                            aria-required="true"
                        />
                        {errors.item && <p className="form-error">{errors.item}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="amount" className="form-label">Amount <span style={{ color: 'var(--color-red-600)' }}>*</span></label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            className="form-input"
                            aria-required="true"
                        />
                        {errors.amount && <p className="form-error">{errors.amount}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="currency" className="form-label">Currency</label>
                        <select
                            id="currency"
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            className="form-select"
                        >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="issueDate" className="form-label">Issue Date</label>
                        <input
                            type="date"
                            id="issueDate"
                            name="issueDate"
                            value={formData.issueDate}
                            onChange={handleChange}
                            className="form-input"
                            aria-required="true"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="deliveryDate" className="form-label">Delivery Date <span style={{ color: 'var(--color-red-600)' }}>*</span></label>
                        <input
                            type="date"
                            id="deliveryDate"
                            name="deliveryDate"
                            value={formData.deliveryDate}
                            onChange={handleChange}
                            className="form-input"
                            aria-required="true"
                        />
                        {errors.deliveryDate && <p className="form-error">{errors.deliveryDate}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="paymentTerms" className="form-label">Payment Terms</label>
                        <input
                            type="text"
                            id="paymentTerms"
                            name="paymentTerms"
                            value={formData.paymentTerms}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                </div>
                <div className="form-actions">
                    <button type="button" className="button button-secondary" onClick={() => navigate('PO_LIST')}>Cancel</button>
                    <button type="submit" className="button button-primary">{isEditing ? 'Update Order' : 'Create Order'}</button>
                </div>
            </form>
        </div>
    );
};


const VendorList = ({ navigate, user, vendors }) => {
    const { hasAccess } = useContext(AuthContext);
    const canCreate = hasAccess('VENDOR_FORM');
    return (
        <div>
            <div className="screen-header">
                <h1 className="screen-title">Vendors</h1>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button className="button button-secondary">Filter</button>
                    <button className="button button-secondary">Sort</button>
                    {canCreate && (
                        <button className="button button-primary" onClick={() => navigate('VENDOR_FORM')}>New Vendor</button>
                    )}
                </div>
            </div>
            <div className="card-grid">
                {vendors.map((vendor) => (
                    <Card
                        key={vendor.id}
                        title={vendor.name}
                        subtitle={`Contact: ${vendor.contactPerson} | Category: ${vendor.category}`}
                        meta={`Status: ${STATUS_MAP[vendor.status]?.label || vendor.status} | Onboarded: ${vendor.onboardingDate}`}
                        status={vendor.status}
                        onClick={() => navigate('VENDOR_DETAIL', { id: vendor.id })}
                    />
                ))}
            </div>
            {(vendors?.length || 0) === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', backgroundColor: 'var(--color-white)', borderRadius: 'var(--border-radius-md)', marginTop: 'var(--spacing-lg)' }}>
                    <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-md)' }}>No Vendors found.</p>
                    {canCreate && (
                        <button className="button button-primary" onClick={() => navigate('VENDOR_FORM')}>Add New Vendor</button>
                    )}
                </div>
            )}
        </div>
    );
};

const VendorDetail = ({ navigate, user, vendor, onEdit, purchaseOrders }) => {
    if (!vendor) {
        return (
            <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
                <h2 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-red-600)' }}>Vendor Not Found</h2>
                <button className="button button-primary" style={{ marginTop: 'var(--spacing-md)' }} onClick={() => navigate('VENDOR_LIST')}>Back to List</button>
            </div>
        );
    }

    const canEdit = user?.role === 'ADMIN' || user?.role === 'PROCUREMENT_OFFICER';
    const vendorPOs = purchaseOrders.filter(po => po.vendorId === vendor.id);

    const renderAuditLog = (logs) => (
        <div className="audit-log">
            <h3 className="detail-section-title">Audit Log</h3>
            {logs?.length > 0 ? (
                logs.map((log) => (
                    <div key={log.id} className="audit-log-entry">
                        <strong>{log.action}</strong> by {log.user}
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                ))
            ) : (
                <p style={{ color: 'var(--color-gray-500)' }}>No audit history available.</p>
            )}
        </div>
    );

    return (
        <div className="detail-view">
            <div className="detail-header">
                <div>
                    <h1 className="detail-title">{vendor.name} <span className={`status-badge ${STATUS_MAP[vendor.status]?.color}`}>{STATUS_MAP[vendor.status]?.label}</span></h1>
                    <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-gray-600)' }}>Vendor ID: {vendor.id}</p>
                </div>
                <div className="detail-actions">
                    {canEdit && <button className="button button-secondary" onClick={() => onEdit()}>Edit</button>}
                </div>
            </div>

            <div className="detail-grid">
                <div className="detail-section">
                    <h2 className="detail-section-title">Vendor Information</h2>
                    <div className="detail-item">
                        <span className="detail-label">Contact Person</span>
                        <span className="detail-value">{vendor.contactPerson}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Email</span>
                        <span className="detail-value">{vendor.email}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Phone</span>
                        <span className="detail-value">{vendor.phone}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Address</span>
                        <span className="detail-value">{vendor.address}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Category</span>
                        <span className="detail-value">{vendor.category}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Onboarding Date</span>
                        <span className="detail-value">{vendor.onboardingDate}</span>
                    </div>
                </div>

                <div className="detail-section">
                    <h2 className="detail-section-title">Performance & Contracts</h2>
                    <div className="detail-item">
                        <span className="detail-label">Performance Score</span>
                        <span className="detail-value">{vendor.performanceScore} / 5.0</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Active Contracts</span>
                        <span className="detail-value">{vendor.contracts}</span>
                    </div>
                </div>

                <div className="detail-section">
                    <h2 className="detail-section-title">Related Purchase Orders</h2>
                    {(vendorPOs?.length || 0) > 0 ? (
                        <div className="related-records-list">
                            {vendorPOs.map(po => (
                                <div key={po.id} className="related-record-card" onClick={() => navigate('PO_DETAIL', { id: po.id })}>
                                    <div className="related-record-card-title">PO-{po.poNumber} for {po.item}</div>
                                    <div className="related-record-card-meta">
                                        <span>Amount: {po.currency} {po.amount}</span>
                                        <span>Issue Date: {po.issueDate}</span>
                                        <span className={`status-badge ${STATUS_MAP[po.status]?.color || 'status-DRAFT'}`} style={{ marginLeft: 'var(--spacing-xs)' }}>
                                            {STATUS_MAP[po.status]?.label || po.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--color-gray-500)' }}>No Purchase Orders with this vendor.</p>
                    )}
                </div>

                {user?.role === 'ADMIN' && (
                    <div className="detail-section" style={{ gridColumn: '1 / -1' }}>
                        {renderAuditLog(vendor.auditLog)}
                    </div>
                )}
            </div>
        </div>
    );
};

const VendorForm = ({ navigate, user, vendor, onSubmit }) => {
    const isEditing = !!vendor;
    const [formData, setFormData] = useState({
        name: vendor?.name || '',
        contactPerson: vendor?.contactPerson || '',
        email: vendor?.email || '',
        phone: vendor?.phone || '',
        address: vendor?.address || '',
        category: vendor?.category || '',
        status: vendor?.status || 'NEW',
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Vendor Name is mandatory.';
        if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact Person is mandatory.';
        if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid Email is mandatory.';
        if (!formData.phone.trim()) newErrors.phone = 'Phone Number is mandatory.';
        if (!formData.address.trim()) newErrors.address = 'Address is mandatory.';
        if (!formData.category.trim()) newErrors.category = 'Category is mandatory.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(vendor?.id, formData);
        }
    };

    return (
        <div className="form-container">
            <h1 className="screen-title" style={{ marginBottom: 'var(--spacing-lg)' }}>{isEditing ? 'Edit Vendor' : 'New Vendor'}</h1>
            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="name" className="form-label">Vendor Name <span style={{ color: 'var(--color-red-600)' }}>*</span></label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="form-input"
                            aria-required="true"
                        />
                        {errors.name && <p className="form-error">{errors.name}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="contactPerson" className="form-label">Contact Person <span style={{ color: 'var(--color-red-600)' }}>*</span></label>
                        <input
                            type="text"
                            id="contactPerson"
                            name="contactPerson"
                            value={formData.contactPerson}
                            onChange={handleChange}
                            className="form-input"
                            aria-required="true"
                        />
                        {errors.contactPerson && <p className="form-error">{errors.contactPerson}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email <span style={{ color: 'var(--color-red-600)' }}>*</span></label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="form-input"
                            aria-required="true"
                        />
                        {errors.email && <p className="form-error">{errors.email}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="phone" className="form-label">Phone <span style={{ color: 'var(--color-red-600)' }}>*</span></label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="form-input"
                            aria-required="true"
                        />
                        {errors.phone && <p className="form-error">{errors.phone}</p>}
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="address" className="form-label">Address <span style={{ color: 'var(--color-red-600)' }}>*</span></label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="form-textarea"
                            aria-required="true"
                        ></textarea>
                        {errors.address && <p className="form-error">{errors.address}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="category" className="form-label">Category <span style={{ color: 'var(--color-red-600)' }}>*</span></label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="form-select"
                            aria-required="true"
                        >
                            <option value="">Select Category</option>
                            <option value="IT Services">IT Services</option>
                            <option value="Office Supplies">Office Supplies</option>
                            <option value="Logistics">Logistics</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Consulting">Consulting</option>
                            <option value="Other">Other</option>
                        </select>
                        {errors.category && <p className="form-error">{errors.category}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="status" className="form-label">Status</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="form-select"
                            disabled={!isEditing}
                        >
                            <option value="NEW">New (Draft)</option>
                            <option value="IN_REVIEW">In Review</option>
                            <option value="APPROVED">Approved (Active)</option>
                            <option value="REJECTED">Rejected (Inactive)</option>
                        </select>
                    </div>
                </div>
                <div className="form-actions">
                    <button type="button" className="button button-secondary" onClick={() => navigate('VENDOR_LIST')}>Cancel</button>
                    <button type="submit" className="button button-primary">{isEditing ? 'Update Vendor' : 'Add Vendor'}</button>
                </div>
            </form>
        </div>
    );
};

const ApprovalList = ({ navigate, user, pendingApprovals, onApprove, onReject }) => {
    return (
        <div>
            <div className="screen-header">
                <h1 className="screen-title">My Approvals</h1>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button className="button button-secondary">Filter</button>
                    <button className="button button-secondary">Sort</button>
                </div>
            </div>
            <div className="card-grid">
                {(pendingApprovals?.length || 0) > 0 ? (
                    pendingApprovals.map((pr) => (
                        <Card
                            key={pr.id}
                            title={pr.title}
                            subtitle={`Requested by: ${pr.requestedBy} | Amount: $${pr.amount}`}
                            meta={`Status: ${STATUS_MAP[pr.status]?.label || pr.status} | Submitted: ${pr.submissionDate}`}
                            status={pr.status}
                            onClick={() => navigate('PR_DETAIL', { id: pr.id })}
                        >
                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)' }}>
                                <button className="button button-primary" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onApprove(pr.id); }}>Approve</button>
                                <button className="button button-secondary" style={{ flex: 1, backgroundColor: 'var(--color-red-50)', color: 'var(--color-red-700)', borderColor: 'var(--color-red-200)' }} onClick={(e) => { e.stopPropagation(); onReject(pr.id); }}>Reject</button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', backgroundColor: 'var(--color-white)', borderRadius: 'var(--border-radius-md)', marginTop: 'var(--spacing-lg)', gridColumn: '1 / -1' }}>
                        <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-md)' }}>No pending approvals found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const AdminSettings = ({ navigate, user }) => (
    <div>
        <div className="screen-header">
            <h1 className="screen-title">Admin Settings</h1>
        </div>
        <div className="detail-view">
            <h2 className="dashboard-section-title">User Management</h2>
            <p style={{ marginBottom: 'var(--spacing-md)' }}>Manage user roles and permissions.</p>
            <button className="button button-primary" onClick={() => alert('Navigating to user list (not implemented)')}>View Users</button>

            <h2 className="dashboard-section-title" style={{ marginTop: 'var(--spacing-xl)' }}>System Configuration</h2>
            <p style={{ marginBottom: 'var(--spacing-md)' }}>Configure system-wide parameters and integrations.</p>
            <button className="button button-primary" onClick={() => alert('Navigating to system config (not implemented)')}>Configure System</button>
        </div>
    </div>
);

const PaymentTrackingList = ({ navigate, user, purchaseOrders }) => {
    const paymentsDue = purchaseOrders.filter(po => po.status === 'PENDING' || po.status === 'OVERDUE');

    return (
        <div>
            <div className="screen-header">
                <h1 className="screen-title">Payment Tracking</h1>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button className="button button-secondary">Filter</button>
                    <button className="button button-secondary">Sort</button>
                    <button className="button button-secondary" onClick={() => alert('Exporting to Excel/PDF...')}>Export</button>
                </div>
            </div>
            <div className="card-grid">
                {(paymentsDue?.length || 0) > 0 ? (
                    paymentsDue.map((po) => (
                        <Card
                            key={po.id}
                            title={`PO-${po.poNumber} - ${po.item}`}
                            subtitle={`Vendor: ${po.vendorName} | Amount: ${po.currency} ${po.amount}`}
                            meta={`Due Date: ${po.deliveryDate} | Terms: ${po.paymentTerms}`}
                            status={po.status}
                            onClick={() => navigate('PO_DETAIL', { id: po.id })}
                        >
                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)' }}>
                                {po.status !== 'PAID' && (
                                    <button className="button button-primary" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); alert(`Marking PO-${po.poNumber} as paid!`); }}>Mark as Paid</button>
                                )}
                                <button className="button button-secondary" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); alert(`Send reminder for PO-${po.poNumber}`); }}>Send Reminder</button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', backgroundColor: 'var(--color-white)', borderRadius: 'var(--border-radius-md)', marginTop: 'var(--spacing-lg)', gridColumn: '1 / -1' }}>
                        <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-md)' }}>No payments currently due or overdue.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


export default App;
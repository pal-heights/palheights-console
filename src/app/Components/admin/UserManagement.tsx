"use client";
import { useState } from "react";
import styles from "./UserManagement.module.css";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  status: "active" | "inactive" | "blocked";
  accountType: "premium" | "basic";
  joinDate: string;
}

interface PayAccount {
  id: string;
  name: string;
  status: "active" | "inactive" | "blocked";
  type: "premium" | "basic";
}

interface Bill {
  id: string;
  service: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "Sam Rahman",
    email: "sam.rahman2000@gmail.com",
    phone: "+1 636 589 996 1210",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    status: "active",
    accountType: "premium",
    joinDate: "2024-01-15"
  },
  {
    id: "2",
    name: "Emily Johnson",
    email: "emily.johnson@example.com",
    phone: "+1 555 123 4567",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    status: "inactive",
    accountType: "basic",
    joinDate: "2024-02-20"
  },
  {
    id: "3",
    name: "Michael Chen",
    email: "michael.chen@example.com",
    phone: "+1 555 987 6543",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    status: "blocked",
    accountType: "premium",
    joinDate: "2024-03-10"
  }
];

const mockPayAccounts: PayAccount[] = [
  { id: "1", name: "Active account", status: "active", type: "premium" },
  { id: "2", name: "Inactive account", status: "inactive", type: "basic" },
  { id: "3", name: "Blocked account", status: "blocked", type: "basic" }
];

const mockBills: Bill[] = [
  { id: "1", service: "Phone bill", amount: 45.99, status: "paid", dueDate: "2024-01-15" },
  { id: "2", service: "Internet bill", amount: 89.99, status: "pending", dueDate: "2024-01-20" },
  { id: "3", service: "Mobile rent", amount: 25.00, status: "overdue", dueDate: "2024-01-10" },
  { id: "4", service: "Income tax", amount: 150.00, status: "paid", dueDate: "2024-01-25" }
];

export default function UserManagement() {
  const [selectedUser, setSelectedUser] = useState<User>(mockUsers[0]);
  const [users, setUsers] = useState<User[]>(mockUsers);

  const handleStatusChange = (userId: string, newStatus: "active" | "inactive" | "blocked") => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
    if (selectedUser.id === userId) {
      setSelectedUser(prev => ({ ...prev, status: newStatus }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "#22c55e";
      case "paid": return "#22c55e";
      case "inactive": return "#f59e0b";
      case "pending": return "#f59e0b";
      case "blocked": return "#ef4444";
      case "overdue": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "active": return "#dcfce7";
      case "paid": return "#dcfce7";
      case "inactive": return "#fef3c7";
      case "pending": return "#fef3c7";
      case "blocked": return "#fee2e2";
      case "overdue": return "#fee2e2";
      default: return "#f3f4f6";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        {/* User Profile Card */}
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <img 
              src={selectedUser.avatar} 
              alt={selectedUser.name}
              className={styles.avatar}
            />
            <h3 className={styles.profileTitle}>My profile</h3>
            <p className={styles.profileSubtitle}>
              The page of {selectedUser.name.split(' ')[0]} {selectedUser.name.split(' ')[1]} 
              where you can see his info
            </p>
          </div>
          
          <div className={styles.profileInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{selectedUser.name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoValue}>{selectedUser.phone}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoValue}>{selectedUser.email}</span>
            </div>
          </div>

          <div className={styles.activationSection}>
            <div className={styles.activationRow}>
              <span className={styles.activationLabel}>Start clients activation</span>
              <div className={styles.toggle}>
                <input 
                  type="checkbox" 
                  id="activation-toggle"
                  defaultChecked={selectedUser.status === "active"}
                />
                <label htmlFor="activation-toggle" className={styles.toggleLabel}></label>
              </div>
            </div>
          </div>

          <button className={styles.saveButton}>Save</button>
        </div>

        {/* User List */}
        <div className={styles.userList}>
          <h4 className={styles.sectionTitle}>All Users</h4>
          {users.map(user => (
            <div 
              key={user.id}
              className={`${styles.userItem} ${selectedUser.id === user.id ? styles.userItemActive : ''}`}
              onClick={() => setSelectedUser(user)}
            >
              <img src={user.avatar} alt={user.name} className={styles.userAvatar} />
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.userEmail}>{user.email}</span>
              </div>
              <span 
                className={styles.userStatus}
                style={{ 
                  color: getStatusColor(user.status),
                  backgroundColor: getStatusBgColor(user.status)
                }}
              >
                {user.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.rightPanel}>
        {/* Pay Accounts Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>My ePay accounts</h3>
            <button className={styles.editButton}>Edit</button>
          </div>
          
          <div className={styles.accountsList}>
            {mockPayAccounts.map(account => (
              <div key={account.id} className={styles.accountItem}>
                <div className={styles.accountInfo}>
                  <div className={styles.accountDot}></div>
                  <span className={styles.accountName}>{account.name}</span>
                </div>
                <button 
                  className={styles.actionButton}
                  style={{
                    backgroundColor: getStatusColor(account.status),
                    color: 'white'
                  }}
                  onClick={() => {
                    const newStatus = account.status === "active" ? "inactive" : "active";
                    // Update account status logic here
                  }}
                >
                  {account.status === "active" ? "Block Account" : 
                   account.status === "inactive" ? "Activate Account" : "Unblock Account"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bills Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>My bills</h3>
            <span className={styles.filterText}>Filter by</span>
          </div>
          
          <div className={styles.billsList}>
            {mockBills.map(bill => (
              <div key={bill.id} className={styles.billItem}>
                <div className={styles.billInfo}>
                  <div 
                    className={styles.billDot}
                    style={{ backgroundColor: getStatusColor(bill.status) }}
                  ></div>
                  <span className={styles.billName}>{bill.service}</span>
                </div>
                <div className={styles.billAmount}>
                  <span className={styles.amount}>${bill.amount}</span>
                  <button 
                    className={styles.payButton}
                    style={{
                      backgroundColor: getStatusColor(bill.status),
                      color: 'white'
                    }}
                  >
                    {bill.status === "paid" ? "Paid" : 
                     bill.status === "pending" ? "Pay now" : "Overdue"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}